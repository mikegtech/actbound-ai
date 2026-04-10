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
