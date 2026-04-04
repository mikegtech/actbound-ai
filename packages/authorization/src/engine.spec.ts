import { describe, it, expect } from "vitest";
import { DefaultAuthorizationPolicyEngine } from "./engine";
import type { AuthorizationContext, PermissionResourceContext } from "./types";
import { ALL_PERMISSIONS } from "./permissions";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function baseContext(
  overrides: Partial<AuthorizationContext> = {},
): AuthorizationContext {
  return {
    subject: { id: "sub_1", type: "user" },
    actor: { id: "actor_1", type: "user", roles: ["operator"] },
    consent: { status: "granted", scopes: [], ownerSubjectId: "sub_1" },
    tokenVaultConnection: {
      status: "connected",
      scopes: [],
      ownerSubjectId: "sub_1",
    },
    providerConnection: {
      status: "connected",
      scopes: [],
      ownerSubjectId: "sub_1",
    },
    vaultSession: {
      status: "active",
      scopes: [],
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

function hasReason(
  decision: ReturnType<DefaultAuthorizationPolicyEngine["evaluate"]>,
  code: string,
): boolean {
  return decision.reasons.some((r) => r.code === code);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DefaultAuthorizationPolicyEngine", () => {
  const engine = new DefaultAuthorizationPolicyEngine();

  // ── Base policy checks ─────────────────────────────────────────────

  describe("base policy – roles, actor type, ownership", () => {
    it("allows when role and actor type match", () => {
      const ctx = baseContext();
      const decision = engine.evaluatePermission(ctx, "brokered_tokens:read");
      expect(decision.allowed).toBe(true);
      expect(hasReason(decision, "policy_allow")).toBe(true);
    });

    it("denies when no roles are supplied", () => {
      const ctx = baseContext({
        actor: { id: "a", type: "user", roles: [] },
      });
      const decision = engine.evaluatePermission(ctx, "brokered_tokens:read");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "actor_roles_missing")).toBe(true);
    });

    it("denies when actor type is not allowed", () => {
      // consent_grants:use only allows actorType "user"
      const ctx = baseContext({
        actor: { id: "a", type: "agent", roles: ["operator"] },
      });
      const decision = engine.evaluatePermission(ctx, "consent_grants:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "actor_type_not_allowed")).toBe(true);
    });

    it("denies when role does not grant permission", () => {
      // sensitive_actions:execute requires admin or operator – viewer is not enough
      const ctx = baseContext({
        actor: { id: "a", type: "user", roles: ["viewer"] },
      });
      const decision = engine.evaluatePermission(
        ctx,
        "sensitive_actions:execute",
      );
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "role_grant_missing")).toBe(true);
    });

    it("denies when resource owner does not match subject", () => {
      const ctx = baseContext();
      const resource: PermissionResourceContext = {
        type: "consent_grant",
        ownerSubjectId: "other_subject",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "consent_grants:use",
        resource,
      );
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "resource_owner_mismatch")).toBe(true);
    });
  });

  // ── Consent reason collection ──────────────────────────────────────

  describe("consent requirements", () => {
    // consent_grants:use requires consent
    it("denies when consent is missing", () => {
      const ctx = baseContext({
        consent: { status: "missing", scopes: [] },
      });
      const decision = engine.evaluatePermission(ctx, "consent_grants:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "consent_grant_missing")).toBe(true);
    });

    it("denies when consent is pending", () => {
      const ctx = baseContext({
        consent: { status: "pending", scopes: [], ownerSubjectId: "sub_1" },
      });
      const decision = engine.evaluatePermission(ctx, "consent_grants:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "delegated_grant_pending")).toBe(true);
    });

    it("denies when consent is revoked", () => {
      const ctx = baseContext({
        consent: { status: "revoked", scopes: [], ownerSubjectId: "sub_1" },
      });
      const decision = engine.evaluatePermission(ctx, "consent_grants:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "consent_grant_revoked")).toBe(true);
    });

    it("denies when consent is expired", () => {
      const ctx = baseContext({
        consent: { status: "expired", scopes: [], ownerSubjectId: "sub_1" },
      });
      const decision = engine.evaluatePermission(ctx, "consent_grants:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "delegated_grant_expired")).toBe(true);
    });

    it("denies when consent owner does not match subject", () => {
      const ctx = baseContext({
        consent: {
          status: "granted",
          scopes: [],
          ownerSubjectId: "other_owner",
        },
      });
      const decision = engine.evaluatePermission(ctx, "consent_grants:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "resource_owner_mismatch")).toBe(true);
    });

    it("denies when required consent scopes are missing", () => {
      // agent_actions:preview requires consent scope "agent.preview"
      const ctx = baseContext({
        consent: {
          status: "granted",
          scopes: [],
          ownerSubjectId: "sub_1",
        },
      });
      const decision = engine.evaluatePermission(ctx, "agent_actions:preview");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "consent_scope_missing")).toBe(true);
    });

    it("allows when consent is granted with matching scopes", () => {
      const ctx = baseContext({
        consent: {
          status: "granted",
          scopes: ["agent.preview"],
          ownerSubjectId: "sub_1",
        },
        tokenVaultConnection: {
          status: "connected",
          scopes: ["agent.preview"],
          ownerSubjectId: "sub_1",
        },
      });
      const resource: PermissionResourceContext = {
        type: "agent_action",
        ownerSubjectId: "sub_1",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "agent_actions:preview",
        resource,
      );
      expect(decision.allowed).toBe(true);
    });
  });

  // ── Vault connection reason collection ─────────────────────────────

  describe("vault connection requirements", () => {
    it("denies when vault connection is missing", () => {
      const ctx = baseContext({
        tokenVaultConnection: { status: "missing", scopes: [] },
      });
      const decision = engine.evaluatePermission(ctx, "vault_connections:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "vault_connection_missing")).toBe(true);
    });

    it("denies when vault connection is disconnected", () => {
      const ctx = baseContext({
        tokenVaultConnection: {
          status: "disconnected",
          scopes: [],
          ownerSubjectId: "sub_1",
        },
      });
      const decision = engine.evaluatePermission(ctx, "vault_connections:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "vault_connection_unavailable")).toBe(true);
    });

    it("denies when vault connection is in error state", () => {
      const ctx = baseContext({
        tokenVaultConnection: {
          status: "error",
          scopes: [],
          ownerSubjectId: "sub_1",
        },
      });
      const decision = engine.evaluatePermission(ctx, "vault_connections:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "vault_connection_unavailable")).toBe(true);
    });

    it("denies when vault scopes are missing", () => {
      // valuations:execute requires vault scope "valuations.execute"
      const ctx = baseContext({
        tokenVaultConnection: {
          status: "connected",
          scopes: [],
          ownerSubjectId: "sub_1",
        },
      });
      const decision = engine.evaluatePermission(ctx, "valuations:execute");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "vault_scope_missing")).toBe(true);
    });

    it("denies when vault owner does not match subject", () => {
      const ctx = baseContext({
        tokenVaultConnection: {
          status: "connected",
          scopes: [],
          ownerSubjectId: "other_owner",
        },
      });
      const resource: PermissionResourceContext = {
        type: "vault_connection",
        ownerSubjectId: "other_owner",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "vault_connections:use",
        resource,
      );
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "resource_owner_mismatch")).toBe(true);
    });
  });

  // ── Provider connection reason collection ──────────────────────────

  describe("provider connection requirements", () => {
    it("denies when provider connection is missing", () => {
      const ctx = baseContext({
        providerConnection: { status: "missing", scopes: [] },
      });
      const resource: PermissionResourceContext = {
        type: "provider_connection",
        ownerSubjectId: "sub_1",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "provider_connections:revoke",
        resource,
      );
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "provider_connection_missing")).toBe(true);
    });

    it("denies when provider connection is pending", () => {
      const ctx = baseContext({
        providerConnection: {
          status: "pending",
          scopes: [],
          ownerSubjectId: "sub_1",
        },
      });
      const resource: PermissionResourceContext = {
        type: "provider_connection",
        ownerSubjectId: "sub_1",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "provider_connections:revoke",
        resource,
      );
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "provider_connection_inactive")).toBe(true);
    });

    it("denies when provider connection is revoked", () => {
      const ctx = baseContext({
        providerConnection: {
          status: "revoked",
          scopes: [],
          ownerSubjectId: "sub_1",
        },
      });
      const resource: PermissionResourceContext = {
        type: "provider_connection",
        ownerSubjectId: "sub_1",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "provider_connections:revoke",
        resource,
      );
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "provider_connection_inactive")).toBe(true);
    });
  });

  // ── Vault session reason collection ────────────────────────────────

  describe("vault session requirements", () => {
    it("denies when vault session is missing", () => {
      const ctx = baseContext({
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
          status: "connected",
          scopes: ["tokens.delegated"],
          ownerSubjectId: "sub_1",
        },
        vaultSession: { status: "missing", scopes: [] },
      });
      const decision = engine.evaluatePermission(ctx, "delegated_tokens:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "vault_session_missing")).toBe(true);
    });

    it("denies when vault session is expired", () => {
      const ctx = baseContext({
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
          status: "connected",
          scopes: ["tokens.delegated"],
          ownerSubjectId: "sub_1",
        },
        vaultSession: {
          status: "expired",
          scopes: ["tokens.delegated"],
          ownerSubjectId: "sub_1",
        },
      });
      const decision = engine.evaluatePermission(ctx, "delegated_tokens:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "vault_session_inactive")).toBe(true);
    });

    it("denies when vault session is revoked", () => {
      const ctx = baseContext({
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
          status: "connected",
          scopes: ["tokens.delegated"],
          ownerSubjectId: "sub_1",
        },
        vaultSession: {
          status: "revoked",
          scopes: ["tokens.delegated"],
          ownerSubjectId: "sub_1",
        },
      });
      const decision = engine.evaluatePermission(ctx, "delegated_tokens:use");
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "vault_session_inactive")).toBe(true);
    });
  });

  // ── Sensitive action / step-up ─────────────────────────────────────

  describe("step-up authentication for sensitive actions", () => {
    const fullScopes = [
      "agent.execute",
      "tokens.delegated",
      "sensitive.execute",
    ] as const;

    function sensitiveContext(stepUpSatisfied: boolean): AuthorizationContext {
      return baseContext({
        consent: {
          status: "granted",
          scopes: [...fullScopes],
          ownerSubjectId: "sub_1",
        },
        tokenVaultConnection: {
          status: "connected",
          scopes: [...fullScopes],
          ownerSubjectId: "sub_1",
        },
        providerConnection: {
          status: "connected",
          scopes: [...fullScopes],
          ownerSubjectId: "sub_1",
        },
        vaultSession: {
          status: "active",
          scopes: ["tokens.delegated", "sensitive.execute"],
          ownerSubjectId: "sub_1",
        },
        attributes: {
          tenantId: "default",
          internalServiceCall: false,
          previewMode: false,
          stepUpSatisfied,
        },
      });
    }

    it("allows routine actions without step-up", () => {
      const ctx = sensitiveContext(false);
      const resource: PermissionResourceContext = {
        type: "sensitive_action",
        ownerSubjectId: "sub_1",
        classification: "routine",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "sensitive_actions:execute",
        resource,
      );
      expect(decision.allowed).toBe(true);
    });

    it("denies sensitive actions without step-up", () => {
      const ctx = sensitiveContext(false);
      const resource: PermissionResourceContext = {
        type: "sensitive_action",
        ownerSubjectId: "sub_1",
        classification: "sensitive",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "sensitive_actions:execute",
        resource,
      );
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "step_up_required")).toBe(true);
    });

    it("denies high_impact actions without step-up", () => {
      const ctx = sensitiveContext(false);
      const resource: PermissionResourceContext = {
        type: "sensitive_action",
        ownerSubjectId: "sub_1",
        classification: "high_impact",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "sensitive_actions:execute",
        resource,
      );
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "step_up_required")).toBe(true);
    });

    it("allows sensitive actions when step-up is satisfied", () => {
      const ctx = sensitiveContext(true);
      const resource: PermissionResourceContext = {
        type: "sensitive_action",
        ownerSubjectId: "sub_1",
        classification: "sensitive",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "sensitive_actions:execute",
        resource,
      );
      expect(decision.allowed).toBe(true);
    });
  });

  // ── Full delegated token flow ──────────────────────────────────────

  describe("delegated_tokens:use – full requirement chain", () => {
    const delegatedScopes = ["tokens.delegated"] as const;

    function delegatedContext(
      overrides: Partial<AuthorizationContext> = {},
    ): AuthorizationContext {
      return baseContext({
        consent: {
          status: "granted",
          scopes: [...delegatedScopes],
          ownerSubjectId: "sub_1",
        },
        tokenVaultConnection: {
          status: "connected",
          scopes: [...delegatedScopes],
          ownerSubjectId: "sub_1",
        },
        providerConnection: {
          status: "connected",
          scopes: [...delegatedScopes],
          ownerSubjectId: "sub_1",
        },
        vaultSession: {
          status: "active",
          scopes: [...delegatedScopes],
          ownerSubjectId: "sub_1",
        },
        ...overrides,
      });
    }

    it("allows when all requirements are met", () => {
      const decision = engine.evaluateDelegatedTokenUse(delegatedContext());
      expect(decision.allowed).toBe(true);
      expect(decision.permission).toBe("delegated_tokens:use");
    });

    it("denies and reports consent_grant_missing when consent is missing", () => {
      const ctx = delegatedContext({
        consent: { status: "missing", scopes: [] },
      });
      const decision = engine.evaluateDelegatedTokenUse(ctx);
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "consent_grant_missing")).toBe(true);
    });

    it("denies and reports vault_session_missing when vault session is missing", () => {
      const ctx = delegatedContext({
        vaultSession: { status: "missing", scopes: [] },
      });
      const decision = engine.evaluateDelegatedTokenUse(ctx);
      expect(decision.allowed).toBe(false);
      expect(hasReason(decision, "vault_session_missing")).toBe(true);
    });

    it("collects multiple denial reasons when several requirements fail", () => {
      const ctx = delegatedContext({
        consent: { status: "missing", scopes: [] },
        tokenVaultConnection: { status: "missing", scopes: [] },
        providerConnection: { status: "missing", scopes: [] },
        vaultSession: { status: "missing", scopes: [] },
      });
      const decision = engine.evaluateDelegatedTokenUse(ctx);
      expect(decision.allowed).toBe(false);
      expect(decision.reasons.length).toBeGreaterThanOrEqual(4);
      expect(hasReason(decision, "consent_grant_missing")).toBe(true);
      expect(hasReason(decision, "vault_connection_missing")).toBe(true);
      expect(hasReason(decision, "provider_connection_missing")).toBe(true);
      expect(hasReason(decision, "vault_session_missing")).toBe(true);
    });
  });

  // ── Bulk evaluation ────────────────────────────────────────────────

  describe("evaluateAllPermissions", () => {
    it("returns a decision for every registered permission", () => {
      const ctx = baseContext();
      const decisions = engine.evaluateAllPermissions(ctx);
      expect(decisions.length).toBe(ALL_PERMISSIONS.length);
    });

    it("each decision has the correct shape", () => {
      const ctx = baseContext();
      const decisions = engine.evaluateAllPermissions(ctx);
      for (const d of decisions) {
        expect(d).toHaveProperty("permission");
        expect(d).toHaveProperty("resource");
        expect(d).toHaveProperty("action");
        expect(d).toHaveProperty("allowed");
        expect(d).toHaveProperty("reasons");
        expect(Array.isArray(d.reasons)).toBe(true);
        expect(d.reasons.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Named evaluator methods ────────────────────────────────────────

  describe("named evaluator methods", () => {
    const ctx = baseContext();

    it("evaluateBrokeredTokenRead targets brokered_tokens:read", () => {
      const d = engine.evaluateBrokeredTokenRead(ctx);
      expect(d.permission).toBe("brokered_tokens:read");
    });

    it("evaluateTokenBrokerAccess targets brokered_tokens:broker", () => {
      const d = engine.evaluateTokenBrokerAccess(ctx);
      expect(d.permission).toBe("brokered_tokens:broker");
    });

    it("evaluateTokenReuse targets brokered_tokens:reuse", () => {
      const d = engine.evaluateTokenReuse(ctx);
      expect(d.permission).toBe("brokered_tokens:reuse");
    });

    it("evaluateTokenCacheInspection targets token_cache:inspect", () => {
      const d = engine.evaluateTokenCacheInspection(ctx);
      expect(d.permission).toBe("token_cache:inspect");
    });

    it("evaluateAuditViewing targets audit_events:read", () => {
      const d = engine.evaluateAuditViewing(ctx);
      expect(d.permission).toBe("audit_events:read");
    });
  });

  // ── Reason deduplication ───────────────────────────────────────────

  describe("reason deduplication", () => {
    it("does not produce duplicate reason codes in a single decision", () => {
      // Create a context that triggers resource_owner_mismatch from
      // multiple collectors (consent + vault connection + provider + session)
      const ctx = baseContext({
        consent: {
          status: "granted",
          scopes: ["agent.execute", "tokens.delegated", "sensitive.execute"],
          ownerSubjectId: "other",
        },
        tokenVaultConnection: {
          status: "connected",
          scopes: ["agent.execute", "tokens.delegated", "sensitive.execute"],
          ownerSubjectId: "other",
        },
        providerConnection: {
          status: "connected",
          scopes: ["agent.execute", "tokens.delegated", "sensitive.execute"],
          ownerSubjectId: "other",
        },
        vaultSession: {
          status: "active",
          scopes: ["tokens.delegated", "sensitive.execute"],
          ownerSubjectId: "other",
        },
      });
      const resource: PermissionResourceContext = {
        type: "sensitive_action",
        ownerSubjectId: "sub_1",
        classification: "routine",
      };
      const decision = engine.evaluatePermission(
        ctx,
        "sensitive_actions:execute",
        resource,
      );

      // Collect reason codes that appear more than once with the same message
      const seen = new Set<string>();
      for (const r of decision.reasons) {
        const key = `${r.code}:${r.message}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });
  });
});
