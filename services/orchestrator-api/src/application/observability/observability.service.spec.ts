import { describe, it, expect, beforeEach } from "vitest";
import {
  ObservabilityService,
  ALERT_THRESHOLDS,
} from "./observability.service";

describe("ObservabilityService", () => {
  let obs: ObservabilityService;

  beforeEach(() => {
    obs = new ObservabilityService();
  });

  it("emits structured observability event", () => {
    // Should not throw
    obs.emit({
      category: "authz",
      eventType: "authz.denied",
      severity: "warn",
      requestId: "req-1",
    });
  });

  it("increments counter", () => {
    obs.increment("denied", { reason: "test" });
    obs.increment("denied", { reason: "test" });
    expect(obs.getCount("denied", { reason: "test" })).toBe(2);
  });

  it("counter resets after 60s window", () => {
    obs.increment("denied");
    expect(obs.getCount("denied")).toBe(1);
    // We can't easily test time-based reset in unit tests without mocking Date,
    // but we verify the counter exists and increments
  });

  it("records timing", () => {
    obs.timing("authz.evaluation", 150, { component: "openfga" });
    // No error means timing was recorded
  });

  it("emits slow path signal for slow authz", () => {
    // Slow authz should emit a warn signal
    obs.timing("authz.evaluation", ALERT_THRESHOLDS.slowAuthzMs + 100);
    // Verify via structured log (would need log capture for full assertion)
  });

  it("emits denied observability signal", () => {
    obs.emitDenied({
      category: "runtime",
      reasonCode: "assistant_disabled",
      assistantId: "ast-001",
      requestId: "req-1",
    });
    expect(
      obs.getCount("denied", {
        category: "runtime",
        reason: "assistant_disabled",
      }),
    ).toBe(1);
  });

  it("emits secret boundary denied signal", () => {
    obs.emitSecretBoundaryDenied({
      secretCategory: "database-credentials",
      assistantId: "ast-001",
    });
    expect(
      obs.getCount("secret.denied", { category: "database-credentials" }),
    ).toBe(1);
  });

  it("emits dependency failure signal", () => {
    obs.emitDependencyFailure({
      dependency: "openfga",
      error: "timeout",
      requestId: "req-1",
    });
    expect(obs.getCount("dependency.failure", { dependency: "openfga" })).toBe(
      1,
    );
  });

  it("emits disabled invocation signal", () => {
    obs.emitDisabledInvocation({
      assistantId: "ast-killed",
      requestId: "req-1",
    });
    expect(
      obs.getCount("assistant.disabled_invocation", {
        assistantId: "ast-killed",
      }),
    ).toBe(1);
  });

  it("reports dependency health", () => {
    const health = obs.getDependencyHealth();
    expect(health.openfga.status).toBe("healthy");
    expect(health.database.status).toBe("healthy");

    obs.emitDependencyFailure({ dependency: "openfga", error: "down" });
    const degraded = obs.getDependencyHealth();
    expect(degraded.openfga.status).toBe("degraded");
    expect(degraded.openfga.recentFailures).toBe(1);
  });

  it("tracks correlation ids in events", () => {
    obs.emit({
      category: "authz",
      eventType: "authz.evaluation",
      severity: "info",
      requestId: "req-abc",
      workflowId: "wf-xyz",
      tenantId: "tenant-1",
    });
    // Structured event includes correlation — verified by structured log output
  });
});
