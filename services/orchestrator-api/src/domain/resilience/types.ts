/**
 * Resilience domain types — framework-agnostic.
 *
 * Break-glass, compromise response, degraded mode, and recovery validation.
 */

// ── Dependency Health ─────────────────────────────────────

export type DependencyStatus = "healthy" | "degraded" | "unavailable";

export interface DependencyState {
  name: string;
  status: DependencyStatus;
  recentFailures: number;
  lastChecked: string;
}

export interface PlatformHealth {
  overall: "operational" | "degraded" | "critical";
  dependencies: Record<string, DependencyState>;
  degradedCapabilities: string[];
}

// ── Break-Glass Model ─────────────────────────────────────

export type BreakGlassAction =
  | "break_glass.invoked"
  | "break_glass.revoked"
  | "break_glass.assistant_disabled"
  | "break_glass.access_frozen";

export interface BreakGlassEvent {
  action: BreakGlassAction;
  initiatedBy: string;
  reason: string;
  scope: {
    tenantId?: string;
    assistantId?: string;
    resourceId?: string;
  };
  requiresFollowUp: string[];
}

export const BREAK_GLASS_FOLLOW_UP = [
  "Audit log review within 48 hours",
  "Rotate any exposed credentials",
  "Reconcile OpenFGA state",
  "Review and update playbook",
  "Root cause analysis within 5 business days",
] as const;

// ── Secret Compromise ─────────────────────────────────────

export type CompromiseType =
  | "platform_secret"
  | "delegated_token"
  | "service_credential"
  | "assistant_credential";

export interface SecretCompromiseEvent {
  compromiseType: CompromiseType;
  affectedScope: string;
  detectedBy: string;
  containmentActions: string[];
  rotationRequired: boolean;
}

export const COMPROMISE_CONTAINMENT: Record<CompromiseType, string[]> = {
  platform_secret: [
    "Rotate affected secret immediately",
    "Services auto-recover via cache TTL (5 min)",
    "Audit CloudTrail for unauthorized access",
  ],
  delegated_token: [
    "Revoke Token Vault connection",
    "Invalidate broker cache",
    "Notify affected user",
  ],
  service_credential: [
    "Rotate Auth0 M2M client secret",
    "Update Secrets Manager",
    "Existing tokens expire within 1 hour",
  ],
  assistant_credential: [
    "Disable Auth0 M2M app (kill-switch)",
    "Purge OpenFGA tuples for assistant",
    "Remove Secrets Manager entry",
    "Audit all assistant actions during compromise window",
  ],
};

// ── Recovery Order ────────────────────────────────────────

export const RECOVERY_ORDER = [
  {
    step: 1,
    name: "Infrastructure",
    description: "VPC, compute, network, DNS",
  },
  {
    step: 2,
    name: "Database",
    description: "Postgres restore/verify for app DB + audit schema",
  },
  { step: 3, name: "Identity", description: "Auth0 config verification" },
  {
    step: 4,
    name: "Secrets",
    description: "Secrets Manager access, rotate if compromised",
  },
  {
    step: 5,
    name: "OpenFGA",
    description: "Model deployment, tuple restore, reconciliation",
  },
  {
    step: 6,
    name: "Services",
    description: "orchestrator-api, agent-service health",
  },
  { step: 7, name: "Sync", description: "sync-service processing, DLQ drain" },
  {
    step: 8,
    name: "Assistant Runtime",
    description: "Assistant invocation verification",
  },
] as const;
