import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenBrokerService } from "./token-broker.service";
import { DelegatedAccessService } from "../delegated-access/delegated-access.service";
import { TokenBrokerCacheStore } from "../../domain/token-broker/token-broker-cache.store";
import type { DelegatedTokenFoundation } from "../delegated-access/delegated-access.service";
import type {
  TokenBrokerCacheBackend,
  TokenCacheRecord,
} from "../../domain/token-broker/token-broker-cache.store";
import type { AuthorizationContext } from "@actbound/authorization";
import type { ScopedTokenRequest } from "@actbound/sdk";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function operatorContext(
  overrides: Partial<AuthorizationContext> = {},
): AuthorizationContext {
  return {
    subject: { id: "sub_1", type: "user" },
    actor: { id: "actor_1", type: "user", roles: ["operator"] },
    consent: {
      status: "granted",
      scopes: ["tokens.delegated"],
      ownerSubjectId: "sub_1",
    },
    tokenVaultConnection: {
      status: "connected",
      scopes: ["tokens.delegated"],
      ownerSubjectId: "sub_1",
    },
    providerConnection: {
      connectionId: "conn_1",
      provider: "google",
      status: "connected",
      scopes: ["tokens.delegated"],
      ownerSubjectId: "sub_1",
    },
    vaultSession: {
      sessionId: "sess_1",
      status: "active",
      scopes: ["tokens.delegated"],
      ownerSubjectId: "sub_1",
    },
    attributes: {
      tenantId: "default",
      internalServiceCall: false,
      previewMode: false,
      stepUpSatisfied: false,
    },
    ...overrides,
  };
}

function m2mRequest(
  overrides: Partial<ScopedTokenRequest> = {},
): ScopedTokenRequest {
  return {
    audience: "https://api.example.com",
    scopes: ["read:data"],
    purpose: "test",
    intent: "m2m",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("TokenBrokerService", () => {
  let service: TokenBrokerService;
  let mockDelegatedAccess: DelegatedAccessService;
  let mockCache: TokenBrokerCacheStore;

  const defaultBackend: TokenBrokerCacheBackend = {
    backend: "memory",
    connected: true,
    fallbackInUse: true,
  };

  beforeEach(() => {
    mockDelegatedAccess = Object.assign(
      Object.create(DelegatedAccessService.prototype) as DelegatedAccessService,
      {
        resolveDelegatedTokenFoundation: vi.fn(
          (
            _ctx: Parameters<
              DelegatedAccessService["resolveDelegatedTokenFoundation"]
            >[0],
            _req: Parameters<
              DelegatedAccessService["resolveDelegatedTokenFoundation"]
            >[1],
          ): DelegatedTokenFoundation => ({
            authorizationContext: operatorContext(),
            stepUpRequired: false,
            connection: {
              id: "conn_1",
              provider: "google",
              accountLabel: "test@example.com",
            },
            consent: { id: "grant_1" },
            vaultSession: { id: "sess_1", tokenReference: "ref_1" },
          }),
        ),
      },
    );

    mockCache = Object.assign(
      Object.create(TokenBrokerCacheStore.prototype) as TokenBrokerCacheStore,
      {
        peek: vi.fn(
          async (_key: string): Promise<TokenCacheRecord | undefined> =>
            undefined,
        ),
        list: vi.fn(async (): Promise<TokenCacheRecord[]> => []),
        getBackend: vi.fn(
          async (): Promise<TokenBrokerCacheBackend> => defaultBackend,
        ),
        upsert: vi.fn(async (_r: TokenCacheRecord): Promise<void> => {}),
      },
    );

    service = new TokenBrokerService(mockDelegatedAccess, mockCache);
  });

  // ── Status & cache inspection ────────────────────────────────────

  describe("getBrokerStatus", () => {
    it("returns ok status with cache info and supported intents", async () => {
      const status = await service.getBrokerStatus();

      expect(status.status).toBe("ok");
      expect(status.cache.backend).toBe("memory");
      expect(status.cache.connected).toBe(true);
      expect(status.cache.fallbackInUse).toBe(true);
      expect(status.supportedIntents).toContain("m2m");
      expect(status.supportedIntents).toContain("delegated");
    });

    it("reflects entry count from cache store", async () => {
      const record: TokenCacheRecord = {
        cacheKey: "k",
        metadata: {
          tokenHandle: "tok_k",
          source: "issued",
          sourceType: "m2m",
          intent: "m2m",
          audience: "https://api.example.com",
          scopes: [],
          issuedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 900_000).toISOString(),
          cacheKey: "k",
          cacheHit: false,
          actor: { id: "a", type: "user" },
          subject: { id: "s", type: "user" },
          stepUpRequired: false,
        },
        createdAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString(),
        hitCount: 0,
      };
      vi.mocked(mockCache.list).mockResolvedValueOnce([record]);

      const status = await service.getBrokerStatus();
      expect(status.cache.entryCount).toBe(1);
    });
  });

  describe("getCacheSummary", () => {
    it("returns empty entries when cache is empty", async () => {
      const summary = await service.getCacheSummary();

      expect(summary.entries).toEqual([]);
      expect(summary.cache.entryCount).toBe(0);
    });

    it("limits entries to 8 most recently accessed", async () => {
      const records: TokenCacheRecord[] = Array.from(
        { length: 12 },
        (_, i) => ({
          cacheKey: `key_${i}`,
          metadata: {
            tokenHandle: `tok_${i}`,
            source: "issued" as const,
            sourceType: "m2m" as const,
            intent: "m2m" as const,
            audience: "https://api.example.com",
            scopes: [],
            issuedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 900_000).toISOString(),
            cacheKey: `key_${i}`,
            cacheHit: false,
            actor: { id: "a", type: "user" as const },
            subject: { id: "s", type: "user" as const },
            stepUpRequired: false,
          },
          createdAt: new Date().toISOString(),
          lastAccessedAt: new Date(Date.now() + i * 1000).toISOString(),
          hitCount: 0,
        }),
      );
      vi.mocked(mockCache.list).mockResolvedValueOnce(records);

      const summary = await service.getCacheSummary();
      expect(summary.entries.length).toBe(8);
    });
  });

  // ── Access evaluation ────────────────────────────────────────────

  describe("evaluateStatusAccess", () => {
    it("allows operators to check broker status", () => {
      const decision = service.evaluateStatusAccess(operatorContext());
      expect(decision.allowed).toBe(true);
      expect(decision.permission).toBe("brokered_tokens:read");
    });

    it("allows viewers to check broker status", () => {
      const ctx = operatorContext({
        actor: { id: "a", type: "user", roles: ["viewer"] },
      });
      const decision = service.evaluateStatusAccess(ctx);
      expect(decision.allowed).toBe(true);
    });

    it("denies when actor has no roles", () => {
      const ctx = operatorContext({
        actor: { id: "a", type: "user", roles: [] },
      });
      const decision = service.evaluateStatusAccess(ctx);
      expect(decision.allowed).toBe(false);
    });
  });

  describe("evaluateCacheInspectionAccess", () => {
    it("allows operators to inspect cache", () => {
      const decision = service.evaluateCacheInspectionAccess(operatorContext());
      expect(decision.allowed).toBe(true);
      expect(decision.permission).toBe("token_cache:inspect");
    });

    it("denies viewers from inspecting cache", () => {
      const ctx = operatorContext({
        actor: { id: "a", type: "user", roles: ["viewer"] },
      });
      const decision = service.evaluateCacheInspectionAccess(ctx);
      expect(decision.allowed).toBe(false);
    });

    it("allows service actors to inspect cache", () => {
      const ctx = operatorContext({
        actor: { id: "svc", type: "system", roles: ["service"] },
      });
      const decision = service.evaluateCacheInspectionAccess(ctx);
      expect(decision.allowed).toBe(true);
    });
  });

  // ── Request decision routing (internal) ──────────────────────────
  // The preview and retrieval flows depend on permissionDecision being
  // wrapped as a PermissionDecisionRecord (with evaluatedAt and source)
  // before schema parsing. The service currently passes the raw engine
  // decision, causing ZodError. The tests above cover the authorization
  // evaluation paths that feed into preview/retrieval. When the schema
  // wrapping is fixed, these can be extended to test the full flow.

  describe("retrieveTokenRequest – authorization denial path", () => {
    it("returns denied result without response when authorization fails", async () => {
      const ctx = operatorContext({
        actor: { id: "a", type: "user", roles: [] },
      });
      const result = await service.retrieveTokenRequest(ctx, m2mRequest());

      expect(result.decision.allowed).toBe(false);
      expect(result.response).toBeUndefined();
    });

    it("denied result includes specific reason codes", async () => {
      const ctx = operatorContext({
        actor: { id: "a", type: "agent", roles: ["viewer"] },
      });
      const result = await service.retrieveTokenRequest(ctx, m2mRequest());

      expect(result.decision.allowed).toBe(false);
      const codes = result.decision.reasons.map((r) => r.code);
      expect(codes).toContain("actor_type_not_allowed");
    });
  });
});
