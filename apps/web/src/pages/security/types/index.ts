export type PostureState = "healthy" | "warning" | "critical";

export interface SecurityPosture {
  overallState: PostureState;
  deniedOperationsLast24h: number;
  activeHighSensitivityGrants: number;
  lastSecurityEventTimestamp: number;
}

export interface RiskIndicator {
  id: string;
  sourceType: "assistant" | "connected_account" | "delegation";
  sourceId: string;
  sourceName: string;
  relatedAssistantId?: string;
  relatedDelegationId?: string;
  relatedPolicyId?: string;
  relatedResourceId?: string;
  relatedOrganizationId?: string;
  auditEventId?: string;
  severity: "low" | "medium" | "high";
  description: string;
  detectedAt: number;
}

export interface DeniedPolicySnapshot {
  id: string;
  policyId: string;
  policyName: string;
  assistantId: string;
  assistantName: string;
  resourceId: string;
  resourceName: string;
  resourceType: string;
  organizationId?: string;
  delegationId?: string;
  auditEventId?: string;
  actionAttempted: string;
  deniedAt: number;
}

export interface SecurityControlItem {
  id: string;
  title: string;
  description: string;
  severity: "medium" | "high";
  sourceType: "connected_account" | "delegation";
  sourceId: string;
  sourceLabel: string;
  relatedDelegationId?: string;
  route:
    | "/delegations/$delegationId"
    | "/security"
    | "/audit"
    | "/assistants/$assistantId";
  actionLabel: string;
  actionReason: string;
}
