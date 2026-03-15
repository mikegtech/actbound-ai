import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenBrokerService } from "./token-broker.service";
import { DelegatedAccessService } from "../delegated-access/delegated-access.service";
import { TokenBrokerCacheStore } from "../../domain/token-broker/token-broker-cache.store";
import type { DelegatedTokenFoundation } from "../delegated-access/delegated-access.service";
import type {
  TokenBrokerCacheBackend,
  TokenCacheRecord,
} from "../../domain/token-broker/token-broker-cache.store";

describe("TokenBrokerService", () => {
  let service: TokenBrokerService;
  let mockDelegatedAccessService: DelegatedAccessService;
  let mockCacheStore: TokenBrokerCacheStore;

  beforeEach(() => {
    mockDelegatedAccessService = Object.assign(
      Object.create(DelegatedAccessService.prototype) as DelegatedAccessService,
      {
        resolveDelegatedTokenFoundation: vi.fn(
          (
            _context: Parameters<
              DelegatedAccessService["resolveDelegatedTokenFoundation"]
            >[0],
            _request: Parameters<
              DelegatedAccessService["resolveDelegatedTokenFoundation"]
            >[1],
          ): DelegatedTokenFoundation => {
            throw new Error("resolveDelegatedTokenFoundation was not expected");
          },
        ),
      },
    );

    mockCacheStore = Object.assign(
      Object.create(TokenBrokerCacheStore.prototype) as TokenBrokerCacheStore,
      {
        peek: vi.fn(
          async (_cacheKey: string): Promise<TokenCacheRecord | undefined> =>
            undefined,
        ),
        list: vi.fn(async (): Promise<TokenCacheRecord[]> => []),
        getBackend: vi.fn(
          async (): Promise<TokenBrokerCacheBackend> => ({
            backend: "memory",
            connected: true,
            fallbackInUse: true,
          }),
        ),
        upsert: vi.fn(async (_record: TokenCacheRecord): Promise<void> => {}),
      },
    );

    service = new TokenBrokerService(
      mockDelegatedAccessService,
      mockCacheStore,
    );
  });

  it("should return ok status and fallback cache status", async () => {
    const status = await service.getBrokerStatus();

    expect(status.status).toBe("ok");
    expect(status.cache.fallbackInUse).toBe(true);
    expect(status.cache.backend).toBe("memory");
  });

  it("should return a cache summary", async () => {
    const summary = await service.getCacheSummary();

    expect(summary.entries).toEqual([]);
    expect(summary.cache.connected).toBe(true);
  });
});
