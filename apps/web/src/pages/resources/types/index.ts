// TODO(sdk-consolidation): Move these robust domain types to @actbound/sdk

export type ResourceSensitivity = "critical" | "high" | "normal" | "low";

export interface Resource {
  id: string;
  name: string;
  category: "document" | "api" | "infrastructure" | "database";
  sensitivity: ResourceSensitivity;
  organizationId: string;
  organizationName: string;
  description: string;
  assistantAccessCount: number;
  lastAuditedAt: string;
}
