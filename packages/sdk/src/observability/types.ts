/**
 * Observability types — framework-agnostic.
 *
 * DISTINCT from audit: audit is durable compliance/investigation history.
 * Observability is operational telemetry: metrics, counters, latency, alerts.
 */

export interface ObservabilityEvent {
  category: "authz" | "runtime" | "secret" | "dependency" | "security";
  eventType: string;
  severity: "info" | "warn" | "critical";
  requestId?: string;
  workflowId?: string;
  tenantId?: string;
  assistantId?: string;
  resourceId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface AlertCondition {
  name: string;
  description: string;
  threshold: number;
  windowSeconds: number;
  severity: "warn" | "critical";
}

export interface MetricCounter {
  name: string;
  labels: Record<string, string>;
  value: number;
}

export interface ObservabilityEmitter {
  emit(event: ObservabilityEvent): void;
  increment(counter: string, labels?: Record<string, string>): void;
  timing(
    name: string,
    durationMs: number,
    labels?: Record<string, string>,
  ): void;
}
