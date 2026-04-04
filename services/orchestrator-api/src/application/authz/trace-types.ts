/**
 * Decision Trace types.
 *
 * Structured authorization trace for every evaluation.
 * Used for: debugging, audit logs, explainability UI, "why was this allowed/denied?"
 */

export interface TraceSubject {
  type: "user" | "assistant";
  id: string;
}

export interface TraceResource {
  type: string;
  id: string;
}

export interface TraceStep {
  /** Which authorization layer produced this step. */
  layer: "rbac" | "abac" | "openfga";
  /** Result of this step. */
  result: "allow" | "deny" | "skip" | "require_mfa";
  /** Human-readable reason. */
  reason: string;
  /** Duration of this step in milliseconds. */
  durationMs: number;
  /** Additional context for debugging. */
  metadata?: Record<string, unknown>;
}

export interface DecisionTrace {
  /** Unique trace ID for correlation. */
  requestId: string;
  /** Who is requesting access. */
  subject: TraceSubject;
  /** What is being accessed. */
  resource: TraceResource;
  /** What action/relation is being checked. */
  action: string;
  /** Ordered evaluation steps. */
  steps: TraceStep[];
  /** Final combined decision. */
  finalDecision: "allow" | "deny" | "require_mfa";
  /** When the evaluation happened. */
  timestamp: string;
  /** Total evaluation duration. */
  totalDurationMs: number;
}

export interface EvaluateRequest {
  subjectType: "user" | "assistant";
  subjectId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  /** Optional correlation ID. Generated if missing. */
  requestId?: string;
  /** Runtime context for ABAC evaluation (ip, amount, mfaVerified, etc.) */
  metadata?: Record<string, unknown>;
}
