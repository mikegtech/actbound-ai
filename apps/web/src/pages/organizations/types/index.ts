// TODO(sdk-consolidation): Move these robust domain types to @actbound/sdk

export interface Organization {
  id: string;
  name: string;
  internalCode: string;
  healthScore: number;
  assistantCount: number;
  resourceCount: number;
  status: "active" | "suspended" | "archived";
  description: string;
  createdAt: string;
}
