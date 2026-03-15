import { Injectable, Logger } from "@nestjs/common";
import { createClient, type RedisClientType } from "redis";

import {
  TokenBrokerCacheStore,
  type TokenBrokerCacheBackend,
  type TokenCacheRecord,
} from "../../domain/token-broker/token-broker-cache.store";

@Injectable()
export class RedisTokenBrokerCacheStore extends TokenBrokerCacheStore {
  private readonly logger = new Logger(RedisTokenBrokerCacheStore.name);
  private readonly cachePrefix = "actbound:token-broker:";
  private readonly memoryCache = new Map<string, TokenCacheRecord>();
  private redisClient?: RedisClientType;
  private redisState: "uninitialized" | "connected" | "memory" =
    "uninitialized";

  async peek(cacheKey: string): Promise<TokenCacheRecord | undefined> {
    const client = await this.getRedisClient();

    if (client) {
      const raw = await client.get(`${this.cachePrefix}${cacheKey}`);

      if (!raw) {
        return undefined;
      }

      const parsed = JSON.parse(raw) as TokenCacheRecord;

      if (this.isExpired(parsed.metadata.expiresAt)) {
        await client.del(`${this.cachePrefix}${cacheKey}`);
        return undefined;
      }

      return parsed;
    }

    this.pruneMemoryCache();
    return this.memoryCache.get(cacheKey);
  }

  async upsert(record: TokenCacheRecord): Promise<void> {
    const client = await this.getRedisClient();
    const ttlSeconds = Math.max(
      1,
      Math.ceil(
        (new Date(record.metadata.expiresAt).getTime() - Date.now()) / 1000,
      ),
    );

    if (client) {
      await client.set(
        `${this.cachePrefix}${record.cacheKey}`,
        JSON.stringify(record),
        {
          EX: ttlSeconds,
        },
      );
      return;
    }

    this.memoryCache.set(record.cacheKey, record);
  }

  async list(): Promise<TokenCacheRecord[]> {
    const client = await this.getRedisClient();

    if (client) {
      const keys = await client.keys(`${this.cachePrefix}*`);
      const records: TokenCacheRecord[] = [];

      for (const key of keys) {
        const raw = await client.get(key);

        if (!raw) {
          continue;
        }

        const parsed = JSON.parse(raw) as TokenCacheRecord;

        if (this.isExpired(parsed.metadata.expiresAt)) {
          await client.del(key);
          continue;
        }

        records.push(parsed);
      }

      return records;
    }

    this.pruneMemoryCache();
    return [...this.memoryCache.values()];
  }

  async getBackend(): Promise<TokenBrokerCacheBackend> {
    const client = await this.getRedisClient();

    if (client) {
      return {
        backend: "redis",
        connected: true,
        fallbackInUse: false,
      };
    }

    return {
      backend: "memory",
      connected: true,
      fallbackInUse: true,
    };
  }

  private isExpired(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() <= Date.now();
  }

  private pruneMemoryCache() {
    for (const [cacheKey, record] of this.memoryCache.entries()) {
      if (this.isExpired(record.metadata.expiresAt)) {
        this.memoryCache.delete(cacheKey);
      }
    }
  }

  private async getRedisClient(): Promise<RedisClientType | undefined> {
    if (!process.env.REDIS_URL) {
      this.redisState = "memory";
      return undefined;
    }

    if (this.redisState === "connected" && this.redisClient?.isOpen) {
      return this.redisClient;
    }

    if (this.redisState === "memory") {
      return undefined;
    }

    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL,
      });
      this.redisClient.on("error", (error) => {
        this.logger.warn(`token-broker redis error: ${error.message}`);
      });
      await this.redisClient.connect();
      this.redisState = "connected";
      return this.redisClient;
    } catch (error) {
      this.redisState = "memory";
      this.logger.warn(
        `token-broker falling back to memory cache: ${error instanceof Error ? error.message : "unknown error"}`,
      );
      return undefined;
    }
  }
}
