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
  severity: "low" | "medium" | "high";
  description: string;
  detectedAt: number;
}

export interface DeniedPolicySnapshot {
  id: string;
  policyId: string;
  policyName: string;
  assistantName: string;
  resourceType: string;
  actionAttempted: string;
  deniedAt: number;
}
