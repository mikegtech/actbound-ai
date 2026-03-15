import {
  evaluateBrokeredTokenRead,
  evaluateDelegatedTokenUse,
  evaluateTokenBrokerAccess,
  evaluateTokenCacheInspection,
  evaluateTokenReuse,
  type AuthorizationContext,
  type AuthorizationDecision,
  type PermissionResourceContext,
} from "@actbound/authorization";
import {
  BrokeredTokenResponseSchema,
  SafeTokenMetadataSchema,
  TokenBrokerPreviewResultSchema,
  TokenBrokerStatusSchema,
  TokenCacheSummarySchema,
  type BrokeredTokenResponse,
  type SafeTokenMetadata,
  type ScopedTokenRequest,
  type TokenBrokerPreviewResult,
  type TokenBrokerStatus,
  type TokenCacheStatus,
  type TokenCacheSummary,
} from "@actbound/sdk";
import { Injectable, Logger } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { createClient, type RedisClientType } from "redis";

type NormalizedTokenRequest = ScopedTokenRequest & {
  actorId: string;
  subjectId: string;
};

type TokenCacheRecord = {
  cacheKey: string;
  metadata: SafeTokenMetadata;
  createdAt: string;
  lastAccessedAt: string;
  hitCount: number;
};

export type TokenBrokerRetrievalResult = {
  decision: AuthorizationDecision;
  response?: BrokeredTokenResponse;
};

@Injectable()
export class TokenBrokerService {
  private readonly logger = new Logger(TokenBrokerService.name);
  private readonly cachePrefix = "actbound:token-broker:";
  private readonly tokenLifetimeSeconds = 15 * 60;
  private readonly memoryCache = new Map<string, TokenCacheRecord>();
  private hits = 0;
  private misses = 0;
  private redisClient?: RedisClientType;
  private redisState: "uninitialized" | "connected" | "memory" =
    "uninitialized";

  evaluateStatusAccess(context: AuthorizationContext): AuthorizationDecision {
    return evaluateBrokeredTokenRead(context, {
      type: "brokered_token",
      ownerSubjectId: context.subject.id,
    });
  }

  evaluateCacheInspectionAccess(
    context: AuthorizationContext,
  ): AuthorizationDecision {
    return evaluateTokenCacheInspection(context, {
      type: "token_cache",
      id: "token-broker",
    });
  }

  async getBrokerStatus(): Promise<TokenBrokerStatus> {
    return TokenBrokerStatusSchema.parse({
      status: "ok",
      cache: await this.getCacheStatus(),
      supportedIntents: ["m2m", "delegated"],
      integrations: {
        m2m: "todo-auth0-client-credentials",
        delegated: "todo-auth0-token-vault",
        throttling: "todo-lightweight-guardrails",
      },
    });
  }

  async previewTokenRequest(
    context: AuthorizationContext,
    request: ScopedTokenRequest,
  ): Promise<TokenBrokerPreviewResult> {
    const normalizedRequest = this.normalizeRequest(request, context);
    const cacheKey = this.computeCacheKey(normalizedRequest);
    const cachedRecord = await this.peekCachedRecord(cacheKey);
    const decision = this.evaluateRequestDecision(
      context,
      normalizedRequest,
      cacheKey,
      Boolean(cachedRecord),
    );
    const cache = await this.getCacheStatus();

    this.logger.log(
      `token-broker preview ${cachedRecord ? "cache-hit" : "cache-miss"} intent=${normalizedRequest.intent} cacheKey=${cacheKey} audience=${normalizedRequest.audience}`,
    );

    return TokenBrokerPreviewResultSchema.parse({
      requestId: randomUUID(),
      summary: cachedRecord
        ? `Cache hit expected for ${normalizedRequest.intent} token intent; broker would reuse cached metadata.`
        : normalizedRequest.intent === "delegated"
          ? "Cache miss; broker would follow the delegated placeholder path after authorization."
          : "Cache miss; broker would issue a placeholder M2M token response after authorization.",
      request: normalizedRequest,
      cacheKey,
      cache,
      cacheHit: Boolean(cachedRecord),
      permissionDecision: decision,
    });
  }

  async retrieveTokenRequest(
    context: AuthorizationContext,
    request: ScopedTokenRequest,
  ): Promise<TokenBrokerRetrievalResult> {
    const normalizedRequest = this.normalizeRequest(request, context);
    const cacheKey = this.computeCacheKey(normalizedRequest);
    const cachedRecord = await this.peekCachedRecord(cacheKey);
    const decision = this.evaluateRequestDecision(
      context,
      normalizedRequest,
      cacheKey,
      Boolean(cachedRecord),
    );

    if (!decision.allowed) {
      this.logger.warn(
        `token-broker denied intent=${normalizedRequest.intent} cacheKey=${cacheKey} actor=${context.actor.id}`,
      );

      return {
        decision,
      };
    }

    if (!cachedRecord) {
      this.misses += 1;
      this.logger.log(`token-broker cache-miss cacheKey=${cacheKey}`);
    }

    const record = cachedRecord
      ? await this.consumeCachedRecord(cacheKey, cachedRecord)
      : await this.issueAndCachePlaceholderToken(normalizedRequest, context);

    return {
      decision,
      response: BrokeredTokenResponseSchema.parse({
        requestId: randomUUID(),
        cacheKey,
        cache: await this.getCacheStatus(),
        metadata: this.shapeResponseMetadata(record, Boolean(cachedRecord)),
        permissionDecision: decision,
        warnings: this.buildWarnings(
          normalizedRequest.intent,
          Boolean(cachedRecord),
          record,
        ),
      }),
    };
  }

  async getCacheSummary(): Promise<TokenCacheSummary> {
    const entries = (await this.listRecords())
      .sort((left, right) =>
        right.lastAccessedAt.localeCompare(left.lastAccessedAt),
      )
      .slice(0, 8)
      .map((record) => ({
        cacheKey: record.cacheKey,
        source: record.metadata.source,
        sourceType: record.metadata.sourceType,
        intent: record.metadata.intent,
        audience: record.metadata.audience,
        scopes: record.metadata.scopes,
        expiresAt: record.metadata.expiresAt,
        lastAccessedAt: record.lastAccessedAt,
        hitCount: record.hitCount,
      }));

    return TokenCacheSummarySchema.parse({
      cache: await this.getCacheStatus(),
      entries,
    });
  }

  private normalizeRequest(
    request: ScopedTokenRequest,
    context: AuthorizationContext,
  ): NormalizedTokenRequest {
    return {
      ...request,
      actorId: request.actorId ?? context.actor.id,
      subjectId: request.subjectId ?? context.subject.id,
      connectionId:
        request.connectionId ?? context.tokenVaultConnection.connectionId,
      consentGrantId: request.consentGrantId ?? context.consent.grantId,
    };
  }

  private computeCacheKey(request: NormalizedTokenRequest): string {
    return createHash("sha256")
      .update(
        JSON.stringify({
          actorId: request.actorId,
          audience: request.audience,
          connectionId: request.connectionId,
          consentGrantId: request.consentGrantId,
          intent: request.intent,
          scopes: [...request.scopes].sort(),
          subjectId: request.subjectId,
        }),
      )
      .digest("hex")
      .slice(0, 24);
  }

  private buildResourceContext(
    request: NormalizedTokenRequest,
    cacheKey: string,
    cacheHit: boolean,
  ): PermissionResourceContext {
    return {
      type:
        request.intent === "delegated" && !cacheHit
          ? "delegated_token"
          : "brokered_token",
      id: cacheKey,
      ownerSubjectId: request.subjectId,
    };
  }

  private evaluateRequestDecision(
    context: AuthorizationContext,
    request: NormalizedTokenRequest,
    cacheKey: string,
    cacheHit: boolean,
  ): AuthorizationDecision {
    if (cacheHit) {
      return evaluateTokenReuse(
        context,
        this.buildResourceContext(request, cacheKey, true),
      );
    }

    if (request.intent === "delegated") {
      return evaluateDelegatedTokenUse(
        context,
        this.buildResourceContext(request, cacheKey, false),
      );
    }

    return evaluateTokenBrokerAccess(
      context,
      this.buildResourceContext(request, cacheKey, false),
    );
  }

  private async issueAndCachePlaceholderToken(
    request: NormalizedTokenRequest,
    context: AuthorizationContext,
  ): Promise<TokenCacheRecord> {
    const issuedAt = new Date();
    const expiresAt = new Date(
      issuedAt.getTime() + this.tokenLifetimeSeconds * 1000,
    );
    const cacheKey = this.computeCacheKey(request);
    const record: TokenCacheRecord = {
      cacheKey,
      metadata: SafeTokenMetadataSchema.parse({
        tokenHandle: `tok_${cacheKey}_${issuedAt.getTime().toString(36)}`,
        source:
          request.intent === "delegated" ? "delegated-placeholder" : "issued",
        sourceType: request.intent === "delegated" ? "delegated" : "m2m",
        intent: request.intent,
        audience: request.audience,
        scopes: request.scopes,
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        cacheKey,
        cacheHit: false,
        actor: {
          id: context.actor.id,
          type: context.actor.type,
        },
        subject: {
          id: context.subject.id,
          type: context.subject.type,
        },
        consentGrantId: request.consentGrantId,
        connectionId: request.connectionId,
      }),
      createdAt: issuedAt.toISOString(),
      lastAccessedAt: issuedAt.toISOString(),
      hitCount: 0,
    };

    // TODO: Apply per-actor throttling and budget guardrails before the real issuer path.
    // TODO: Exchange Auth0 client credentials for real M2M tokens when the broker leaves placeholder mode.
    // TODO: Retrieve delegated tokens from Auth0 Token Vault for delegated requests when that integration is wired.
    this.logger.log(
      `token-broker issue-path intent=${request.intent} cacheKey=${cacheKey} audience=${request.audience}`,
    );

    await this.writeRecord(record);

    return record;
  }

  private shapeResponseMetadata(
    record: TokenCacheRecord,
    cacheHit: boolean,
  ): SafeTokenMetadata {
    if (!cacheHit) {
      return record.metadata;
    }

    return SafeTokenMetadataSchema.parse({
      ...record.metadata,
      source: "cached",
      sourceType: "cached",
      cacheHit: true,
    });
  }

  private buildWarnings(
    intent: NormalizedTokenRequest["intent"],
    cacheHit: boolean,
    record: TokenCacheRecord,
  ): string[] {
    const warnings: string[] = [];

    if (cacheHit) {
      warnings.push(
        `Cache reuse path returned the existing safe token handle ${record.metadata.tokenHandle}.`,
      );
    } else if (intent === "delegated") {
      warnings.push(
        "Delegated retrieval is still placeholder-only until Auth0 Token Vault wiring is added.",
      );
    } else {
      warnings.push(
        "M2M issuance is still placeholder-only until Auth0 client credentials exchange is added.",
      );
    }

    if (this.redisState !== "connected") {
      warnings.push(
        "Redis is not active for the broker, so the in-memory fallback cache is handling this request.",
      );
    }

    return warnings;
  }

  private isExpired(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() <= Date.now();
  }

  private async consumeCachedRecord(
    cacheKey: string,
    record: TokenCacheRecord,
  ): Promise<TokenCacheRecord> {
    const touchedRecord: TokenCacheRecord = {
      ...record,
      lastAccessedAt: new Date().toISOString(),
      hitCount: record.hitCount + 1,
    };

    this.hits += 1;
    this.logger.log(`token-broker cache-hit cacheKey=${cacheKey}`);
    await this.writeRecord(touchedRecord);

    return touchedRecord;
  }

  private async peekCachedRecord(
    cacheKey: string,
  ): Promise<TokenCacheRecord | undefined> {
    const record = await this.readRecord(cacheKey);

    if (!record) {
      return undefined;
    }

    return record;
  }

  private async readRecord(
    cacheKey: string,
  ): Promise<TokenCacheRecord | undefined> {
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

  private async writeRecord(record: TokenCacheRecord): Promise<void> {
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

  private async listRecords(): Promise<TokenCacheRecord[]> {
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

  private pruneMemoryCache() {
    for (const [cacheKey, record] of this.memoryCache.entries()) {
      if (this.isExpired(record.metadata.expiresAt)) {
        this.memoryCache.delete(cacheKey);
      }
    }
  }

  private async getCacheStatus(): Promise<TokenCacheStatus> {
    const backend = await this.getCacheBackend();

    return {
      backend: backend.backend,
      connected: backend.connected,
      fallbackInUse: backend.fallbackInUse,
      entryCount: (await this.listRecords()).length,
      hits: this.hits,
      misses: this.misses,
    };
  }

  private async getCacheBackend(): Promise<{
    backend: TokenCacheStatus["backend"];
    connected: boolean;
    fallbackInUse: boolean;
  }> {
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
