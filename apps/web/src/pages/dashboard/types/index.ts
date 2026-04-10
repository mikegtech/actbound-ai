// TODO(sdk-consolidation): Move these structural types to @actbound/sdk when API endpoints exist.

export interface MetricSnapshot {
  activeAssistants: number;
  protectedResources: number;
  activeDelegations: number;
  recentPolicyEvents: number;
}

export type EventSeverity = "info" | "warning" | "error" | "critical";

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  severity: EventSeverity;
  description: string;
}

export interface PolicyPosture {
  totalPolicies: number;
  activePolicies: number;
  violationsInLast24h: number;
  overallStatus: "secure" | "degraded" | "at-risk";
}

export interface ConnectedAccount {
  id: string;
  provider: string;
  accountName: string;
  status: "active" | "error" | "pending";
  lastSync: string;
}

export interface DashboardData {
  metrics: MetricSnapshot;
  recentAuditEvents: AuditEvent[];
  policyPosture: PolicyPosture;
  connectedAccounts: ConnectedAccount[];
}
