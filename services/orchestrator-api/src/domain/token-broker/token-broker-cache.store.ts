import type { SafeTokenMetadata, TokenCacheStatus } from "@actbound/sdk";

export type TokenCacheRecord = {
  cacheKey: string;
  metadata: SafeTokenMetadata;
  createdAt: string;
  lastAccessedAt: string;
  hitCount: number;
};

export type TokenBrokerCacheBackend = Pick<
  TokenCacheStatus,
  "backend" | "connected" | "fallbackInUse"
>;

export abstract class TokenBrokerCacheStore {
  abstract peek(cacheKey: string): Promise<TokenCacheRecord | undefined>;
  abstract upsert(record: TokenCacheRecord): Promise<void>;
  abstract list(): Promise<TokenCacheRecord[]>;
  abstract getBackend(): Promise<TokenBrokerCacheBackend>;
}
