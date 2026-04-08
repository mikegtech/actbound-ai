/**
 * Resilience Service
 *
 * Aggregates dependency health, manages degraded-mode decisions,
 * provides break-glass and recovery validation seams.
 */

import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import type { AuditWriter } from "@actbound/sdk";
import { ObservabilityService } from "../observability/observability.service";
import {
  BREAK_GLASS_FOLLOW_UP,
  COMPROMISE_CONTAINMENT,
  RECOVERY_ORDER,
  type CompromiseType,
  type DependencyState,
  type PlatformHealth,
} from "../../domain/resilience/types";

@Injectable()
export class ResilienceService {
  private readonly logger = new Logger(ResilienceService.name);
  private breakGlassActive = false;

  constructor(
    @Optional()
    @Inject("OBSERVABILITY")
    private readonly obs?: ObservabilityService,
    @Optional()
    @Inject("AUDIT_WRITER")
    private readonly auditWriter?: AuditWriter,
  ) {}

  // ── Platform Health ─────────────────────────────────────

  getPlatformHealth(): PlatformHealth {
    const deps = this.obs?.getDependencyHealth() ?? {};
    const dependencyStates: Record<string, DependencyState> = {};
    const degraded: string[] = [];

    for (const [name, state] of Object.entries(deps)) {
      dependencyStates[name] = {
        name,
        status: state.status === "healthy" ? "healthy" : "degraded",
        recentFailures: state.recentFailures,
        lastChecked: new Date().toISOString(),
      };

      if (state.status !== "healthy") {
        degraded.push(name);
      }
    }

    // Determine overall status
    let overall: PlatformHealth["overall"] = "operational";
    if (degraded.length > 0) overall = "degraded";
    if (degraded.includes("openfga") && degraded.includes("database"))
      overall = "critical";

    const degradedCapabilities: string[] = [];
    if (degraded.includes("openfga")) {
      degradedCapabilities.push(
        "Resource-level authorization (OpenFGA-backed checks will fail closed)",
      );
    }
    if (degraded.includes("database")) {
      degradedCapabilities.push(
        "Durable audit writes, entity metadata queries",
      );
    }

    return {
      overall,
      dependencies: dependencyStates,
      degradedCapabilities,
    };
  }

  isOpenFGAHealthy(): boolean {
    const health = this.obs?.getDependencyHealth();
    return health?.openfga?.status === "healthy";
  }

  // ── Break-Glass ─────────────────────────────────────────

  async invokeBreakGlass(
    initiatedBy: string,
    reason: string,
    scope: { tenantId?: string; assistantId?: string } = {},
  ): Promise<{ active: boolean; followUp: readonly string[] }> {
    this.breakGlassActive = true;

    this.logger.warn(
      JSON.stringify({
        alert: "break_glass_invoked",
        initiatedBy,
        reason,
        scope,
      }),
    );

    // Emit audit event
    await this.auditWriter?.record(
      "break-glass",
      scope.tenantId ?? "system",
      "orchestrator-api",
      {
        eventType: "break_glass.invoked",
        actor: { sub: initiatedBy, principalType: "user" },
        action: "break-glass",
        metadata: { reason, scope },
      },
    );

    // Emit observability signal
    this.obs?.emit({
      category: "security",
      eventType: "break_glass.invoked",
      severity: "critical",
      tenantId: scope.tenantId,
      assistantId: scope.assistantId,
      metadata: { reason },
    });

    return {
      active: true,
      followUp: BREAK_GLASS_FOLLOW_UP,
    };
  }

  async revokeBreakGlass(revokedBy: string): Promise<void> {
    this.breakGlassActive = false;

    await this.auditWriter?.record(
      "break-glass",
      "system",
      "orchestrator-api",
      {
        eventType: "break_glass.revoked",
        actor: { sub: revokedBy, principalType: "user" },
        action: "break-glass-revoke",
      },
    );
  }

  isBreakGlassActive(): boolean {
    return this.breakGlassActive;
  }

  // ── Secret Compromise ───────────────────────────────────

  getCompromiseResponse(type: CompromiseType) {
    return {
      compromiseType: type,
      containmentActions: COMPROMISE_CONTAINMENT[type],
      rotationRequired: true,
      auditRequired: true,
    };
  }

  async recordCompromiseDetection(
    type: CompromiseType,
    affectedScope: string,
    detectedBy: string,
  ): Promise<void> {
    await this.auditWriter?.record("compromise", "system", "orchestrator-api", {
      eventType: "secret.compromise.detected",
      actor: { sub: detectedBy, principalType: "user" },
      action: "compromise-detection",
      metadata: {
        compromiseType: type,
        affectedScope,
        containmentActions: COMPROMISE_CONTAINMENT[type],
      },
    });

    this.obs?.emit({
      category: "security",
      eventType: "secret.compromise.detected",
      severity: "critical",
      metadata: { compromiseType: type, affectedScope },
    });
  }

  // ── Recovery Validation ─────────────────────────────────

  getRecoveryOrder() {
    return RECOVERY_ORDER;
  }

  async validateRecoveryStep(stepName: string): Promise<{
    step: string;
    valid: boolean;
    details: string;
  }> {
    const health = this.getPlatformHealth();

    switch (stepName) {
      case "Database":
        return {
          step: stepName,
          valid:
            !health.dependencies.database ||
            health.dependencies.database.status === "healthy",
          details: health.dependencies.database?.status ?? "not monitored",
        };

      case "OpenFGA":
        return {
          step: stepName,
          valid:
            !health.dependencies.openfga ||
            health.dependencies.openfga.status === "healthy",
          details: health.dependencies.openfga?.status ?? "not monitored",
        };

      default:
        return {
          step: stepName,
          valid: true,
          details: "manual verification required",
        };
    }
  }
}
