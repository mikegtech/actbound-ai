import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResilienceService } from "./resilience.service";
import { ObservabilityService } from "../observability/observability.service";
import type { AuditWriter, AuditEventInput } from "@actbound/sdk";
import {
  RECOVERY_ORDER,
  BREAK_GLASS_FOLLOW_UP,
} from "../../domain/resilience/types";

function mockAuditWriter(): AuditWriter & {
  events: Array<{ eventType: string }>;
} {
  const events: Array<{ eventType: string }> = [];
  return {
    events,
    record: vi.fn(
      async (_r: string, _t: string, _s: string, e: AuditEventInput) => {
        events.push({ eventType: e.eventType });
      },
    ),
  };
}

describe("ResilienceService", () => {
  let service: ResilienceService;
  let obs: ObservabilityService;
  let writer: ReturnType<typeof mockAuditWriter>;

  beforeEach(() => {
    obs = new ObservabilityService();
    writer = mockAuditWriter();
    service = new ResilienceService(obs, writer);
  });

  // ── Platform Health ─────────────────────────────────────

  it("reports operational when all dependencies healthy", () => {
    const health = service.getPlatformHealth();
    expect(health.overall).toBe("operational");
    expect(health.degradedCapabilities).toHaveLength(0);
  });

  it("reports degraded when OpenFGA has failures", () => {
    obs.emitDependencyFailure({ dependency: "openfga", error: "timeout" });
    const health = service.getPlatformHealth();
    expect(health.overall).toBe("degraded");
    expect(health.degradedCapabilities.some((c) => c.includes("OpenFGA"))).toBe(
      true,
    );
  });

  it("reports OpenFGA health status", () => {
    expect(service.isOpenFGAHealthy()).toBe(true);
    obs.emitDependencyFailure({ dependency: "openfga", error: "down" });
    expect(service.isOpenFGAHealthy()).toBe(false);
  });

  // ── Break-Glass ─────────────────────────────────────────

  it("invokes break-glass and emits audit event", async () => {
    const result = await service.invokeBreakGlass("admin", "Security incident");
    expect(result.active).toBe(true);
    expect(result.followUp.length).toBe(BREAK_GLASS_FOLLOW_UP.length);
    expect(service.isBreakGlassActive()).toBe(true);
    expect(
      writer.events.some((e) => e.eventType === "break_glass.invoked"),
    ).toBe(true);
  });

  it("revokes break-glass and emits audit event", async () => {
    await service.invokeBreakGlass("admin", "test");
    await service.revokeBreakGlass("admin");
    expect(service.isBreakGlassActive()).toBe(false);
    expect(
      writer.events.some((e) => e.eventType === "break_glass.revoked"),
    ).toBe(true);
  });

  // ── Secret Compromise ───────────────────────────────────

  it("returns containment actions for platform secret compromise", () => {
    const response = service.getCompromiseResponse("platform_secret");
    expect(response.containmentActions.length).toBeGreaterThan(0);
    expect(response.rotationRequired).toBe(true);
  });

  it("returns containment actions for assistant credential compromise", () => {
    const response = service.getCompromiseResponse("assistant_credential");
    expect(
      response.containmentActions.some((a) => a.includes("kill-switch")),
    ).toBe(true);
  });

  it("records compromise detection without leaking secrets", async () => {
    await service.recordCompromiseDetection(
      "platform_secret",
      "actbound/prod/shared/openai-api-key",
      "security-scanner",
    );
    expect(
      writer.events.some((e) => e.eventType === "secret.compromise.detected"),
    ).toBe(true);
    // Verify no secret material in audit call args
    const auditCall = vi
      .mocked(writer.record)
      .mock.calls.find(
        (c) =>
          (c[3] as AuditEventInput).eventType === "secret.compromise.detected",
      );
    expect(JSON.stringify(auditCall)).not.toContain("sk-");
    expect(JSON.stringify(auditCall)).not.toContain("password");
  });

  // ── Recovery ────────────────────────────────────────────

  it("provides recovery order", () => {
    const order = service.getRecoveryOrder();
    expect(order.length).toBe(RECOVERY_ORDER.length);
    expect(order[0]!.name).toBe("Infrastructure");
    expect(order[order.length - 1]!.name).toBe("Assistant Runtime");
  });

  it("validates recovery step for healthy dependencies", async () => {
    const result = await service.validateRecoveryStep("Database");
    expect(result.valid).toBe(true);
  });

  it("validates recovery step for degraded dependencies", async () => {
    obs.emitDependencyFailure({ dependency: "openfga", error: "down" });
    const result = await service.validateRecoveryStep("OpenFGA");
    expect(result.valid).toBe(false);
    expect(result.details).toBe("degraded");
  });
});
