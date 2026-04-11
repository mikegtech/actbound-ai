// TODO(sdk-consolidation): Move these robust domain types to @actbound/sdk

export type AssistantStatus = "active" | "restricted" | "pending" | "disabled";
export type AssistantType = "automation" | "conversational" | "background";

export interface AssistantCapability {
  id: string;
  name: string;
  status: "allowed" | "denied" | "pending";
  category: "github" | "aws" | "internal" | "slack" | string;
}

export interface Assistant {
  id: string;
  name: string;
  internalCode: string;
  type: AssistantType;
  status: AssistantStatus;
  description: string;
  organizationId: string;
  capabilities: AssistantCapability[];
  createdAt: string;
  lastActiveAt: string;
}

export interface AssistantBoundaryLink {
  id: string;
  name: string;
  route: string;
  meta?: string;
}

export interface AssistantConnectedAccountLink {
  id: string;
  provider: string;
  accountName: string;
  connectionState: "HEALTHY" | "DISCONNECTED" | "NEEDS_ATTENTION" | "PENDING";
}

export interface AssistantTrustSignal {
  id: string;
  label: string;
  severity: "info" | "warning" | "high";
  route: string;
}

export interface AssistantTrustBoundarySummary {
  assistantId: string;
  organization: AssistantBoundaryLink;
  reachableResources: AssistantBoundaryLink[];
  delegatedAccounts: AssistantConnectedAccountLink[];
  delegations: AssistantBoundaryLink[];
  governingPolicies: AssistantBoundaryLink[];
  auditSignals: AssistantTrustSignal[];
  securitySignals: AssistantTrustSignal[];
}
