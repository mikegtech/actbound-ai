// TODO(sdk-consolidation): Move these robust domain types to @actbound/sdk

export type PolicyStatus = "active" | "draft" | "archived" | "warning";

export interface Policy {
  id: string;
  name: string;
  description: string;
  env: string;
  scope: string;
  author: string;
  status: PolicyStatus;
  updatedAt: string;
}

export type TraceDecision = "ALLOWED" | "DENIED" | "REQUIRES_REVIEW";

export interface SimulationTraceStep {
  id: string;
  name: string;
  detail: string;
  outcome: "success" | "failure" | "info";
}

export interface SimulationTrace {
  id: string;
  policyId: string;
  context: {
    sourceIp: string;
    shiftStatus: string;
    [key: string]: string;
  };
  decision: TraceDecision;
  steps: SimulationTraceStep[];
}
