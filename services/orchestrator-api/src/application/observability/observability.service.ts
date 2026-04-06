/**
 * Observability Service
 *
 * Operational telemetry: counters, timing, structured signals, alert evaluation.
 * DISTINCT from audit: audit is durable history, observability is operational metrics.
 *
 * Designed to be replaceable with Prometheus/Datadog/CloudWatch later.
 * For now: in-memory counters + structured JSON logging.
 */

import { Injectable, Logger } from "@nestjs/common";
import type { ObservabilityEvent, ObservabilityEmitter } from "@actbound/sdk";

// ── Alert thresholds (configurable via env in production) ─

export const ALERT_THRESHOLDS = {
  deniedSpikePerMinute: 20,
  disabledInvocationPerMinute: 5,
  forbiddenSecretPerMinute: 10,
  openfgaFailurePerMinute: 3,
  slowAuthzMs: 500,
  slowRuntimeMs: 2000,
} as const;

interface CounterWindow {
  count: number;
  windowStart: number;
}

@Injectable()
export class ObservabilityService implements ObservabilityEmitter {
  private readonly logger = new Logger(ObservabilityService.name);
  private readonly counters = new Map<string, CounterWindow>();
  private readonly timings: Array<{
    name: string;
    durationMs: number;
    labels: Record<string, string>;
    ts: number;
  }> = [];

  // ── Emit structured event ───────────────────────────────

  emit(event: ObservabilityEvent): void {
    this.logger.log(
      JSON.stringify({
        signal: "observability",
        ...event,
        ts: Date.now(),
      }),
    );

    // Check for alertable conditions based on event type
    if (event.severity === "critical" || event.severity === "warn") {
      this.evaluateAlerts(event);
    }
  }

  // ── Counters ────────────────────────────────────────────

  increment(counter: string, labels: Record<string, string> = {}): void {
    const key = `${counter}:${JSON.stringify(labels)}`;
    const now = Date.now();
    const window = this.counters.get(key);

    if (window && now - window.windowStart < 60_000) {
      window.count++;
    } else {
      this.counters.set(key, { count: 1, windowStart: now });
    }
  }

  getCount(counter: string, labels: Record<string, string> = {}): number {
    const key = `${counter}:${JSON.stringify(labels)}`;
    const window = this.counters.get(key);
    if (!window) return 0;
    if (Date.now() - window.windowStart > 60_000) return 0;
    return window.count;
  }

  // ── Timing ──────────────────────────────────────────────

  timing(
    name: string,
    durationMs: number,
    labels: Record<string, string> = {},
  ): void {
    this.timings.push({ name, durationMs, labels, ts: Date.now() });

    // Keep only last 1000 entries
    if (this.timings.length > 1000)
      this.timings.splice(0, this.timings.length - 1000);

    // Emit slow-path signal
    if (
      name === "authz.evaluation" &&
      durationMs > ALERT_THRESHOLDS.slowAuthzMs
    ) {
      this.emit({
        category: "authz",
        eventType: "authz.slow_evaluation",
        severity: "warn",
        durationMs,
        metadata: labels,
      });
    }

    if (
      name === "runtime.execution" &&
      durationMs > ALERT_THRESHOLDS.slowRuntimeMs
    ) {
      this.emit({
        category: "runtime",
        eventType: "runtime.slow_execution",
        severity: "warn",
        durationMs,
        metadata: labels,
      });
    }
  }

  // ── Pre-built signal emitters for key paths ─────────────

  emitDenied(ctx: {
    category: ObservabilityEvent["category"];
    reasonCode: string;
    assistantId?: string;
    tenantId?: string;
    resourceId?: string;
    requestId?: string;
  }): void {
    this.increment("denied", {
      category: ctx.category,
      reason: ctx.reasonCode,
    });

    this.emit({
      category: ctx.category,
      eventType: `${ctx.category}.denied`,
      severity: "warn",
      requestId: ctx.requestId,
      tenantId: ctx.tenantId,
      assistantId: ctx.assistantId,
      resourceId: ctx.resourceId,
      metadata: { reasonCode: ctx.reasonCode },
    });
  }

  emitSecretBoundaryDenied(ctx: {
    secretCategory: string;
    assistantId?: string;
    requestId?: string;
  }): void {
    this.increment("secret.denied", { category: ctx.secretCategory });

    this.emit({
      category: "secret",
      eventType: "secret.boundary.denied",
      severity: "warn",
      assistantId: ctx.assistantId,
      requestId: ctx.requestId,
      metadata: { secretCategory: ctx.secretCategory },
    });
  }

  emitDependencyFailure(ctx: {
    dependency: string;
    error: string;
    requestId?: string;
  }): void {
    this.increment("dependency.failure", { dependency: ctx.dependency });

    this.emit({
      category: "dependency",
      eventType: `dependency.${ctx.dependency}.failure`,
      severity: "critical",
      requestId: ctx.requestId,
      metadata: { error: ctx.error },
    });
  }

  emitDisabledInvocation(ctx: {
    assistantId: string;
    requestId?: string;
    tenantId?: string;
  }): void {
    this.increment("assistant.disabled_invocation", {
      assistantId: ctx.assistantId,
    });

    this.emit({
      category: "security",
      eventType: "assistant.disabled_invocation_attempt",
      severity: "warn",
      assistantId: ctx.assistantId,
      requestId: ctx.requestId,
      tenantId: ctx.tenantId,
    });
  }

  // ── Alert evaluation ────────────────────────────────────

  private evaluateAlerts(event: ObservabilityEvent): void {
    const deniedCount = this.getCount("denied");
    if (deniedCount >= ALERT_THRESHOLDS.deniedSpikePerMinute) {
      this.logger.warn(
        JSON.stringify({
          alert: "denied_spike",
          count: deniedCount,
          threshold: ALERT_THRESHOLDS.deniedSpikePerMinute,
          window: "1m",
          severity: "critical",
        }),
      );
    }

    if (event.eventType === "assistant.disabled_invocation_attempt") {
      const count = this.getCount("assistant.disabled_invocation", {
        assistantId: event.assistantId ?? "",
      });
      if (count >= ALERT_THRESHOLDS.disabledInvocationPerMinute) {
        this.logger.warn(
          JSON.stringify({
            alert: "repeated_disabled_invocation",
            assistantId: event.assistantId,
            count,
            threshold: ALERT_THRESHOLDS.disabledInvocationPerMinute,
            severity: "critical",
          }),
        );
      }
    }

    const openfgaFailures = this.getCount("dependency.failure", {
      dependency: "openfga",
    });
    if (openfgaFailures >= ALERT_THRESHOLDS.openfgaFailurePerMinute) {
      this.logger.error(
        JSON.stringify({
          alert: "openfga_degraded",
          count: openfgaFailures,
          threshold: ALERT_THRESHOLDS.openfgaFailurePerMinute,
          severity: "critical",
        }),
      );
    }
  }

  // ── Health / diagnostics ────────────────────────────────

  getDependencyHealth(): Record<
    string,
    { status: string; recentFailures: number }
  > {
    return {
      openfga: {
        status:
          this.getCount("dependency.failure", { dependency: "openfga" }) > 0
            ? "degraded"
            : "healthy",
        recentFailures: this.getCount("dependency.failure", {
          dependency: "openfga",
        }),
      },
      database: {
        status:
          this.getCount("dependency.failure", { dependency: "database" }) > 0
            ? "degraded"
            : "healthy",
        recentFailures: this.getCount("dependency.failure", {
          dependency: "database",
        }),
      },
    };
  }
}
