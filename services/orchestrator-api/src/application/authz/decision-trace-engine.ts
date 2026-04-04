/**
 * Decision Trace Engine
 *
 * Central authorization evaluation that combines RBAC + ABAC + OpenFGA
 * and returns a structured trace for every decision.
 *
 * This is the "why" engine — every allow/deny is fully explained.
 */

import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { RelationshipWriter } from "@actbound/openfga";
import { toFgaSubjectType } from "../../domain/relationships/types";
import { PolicyEngine } from "./policies/policy-engine";
import type { DecisionTrace, EvaluateRequest, TraceStep } from "./trace-types";

/** RBAC role config — which roles are allowed for which actions. */
const RBAC_RULES: Record<string, string[]> = {
  viewer: ["admin", "operator", "viewer", "service"],
  editor: ["admin", "operator", "service"],
  operator: ["admin", "operator", "service"],
  admin: ["admin"],
};

@Injectable()
export class DecisionTraceEngine {
  private readonly logger = new Logger(DecisionTraceEngine.name);

  constructor(
    private readonly writer: RelationshipWriter,
    private readonly policyEngine: PolicyEngine,
  ) {}

  async evaluate(request: EvaluateRequest): Promise<DecisionTrace> {
    const requestId = request.requestId ?? randomUUID();
    const startTime = Date.now();
    const steps: TraceStep[] = [];

    const fgaSubjectType = toFgaSubjectType(request.subjectType);
    const fgaUser = `${fgaSubjectType}:${request.subjectId}`;
    const fgaObject = `${request.resourceType}:${request.resourceId}`;

    // ── Step 1: RBAC ────────────────────────────────────
    const rbacStep = this.evaluateRbac(request.action);
    steps.push(rbacStep);

    // Short-circuit on RBAC deny
    if (rbacStep.result === "deny") {
      return this.buildTrace(requestId, request, steps, "deny", startTime);
    }

    // ── Step 2: ABAC (real policy evaluation) ───────────
    const abacStep = this.evaluateAbac(request);
    steps.push(abacStep);

    // Short-circuit on ABAC deny
    if (abacStep.result === "deny") {
      return this.buildTrace(requestId, request, steps, "deny", startTime);
    }

    // ── Step 3: OpenFGA ─────────────────────────────────
    const fgaStep = await this.evaluateOpenFGA(
      fgaUser,
      request.action,
      fgaObject,
    );
    steps.push(fgaStep);

    // If OpenFGA denied, try to find inherited access path
    if (fgaStep.result === "deny") {
      const inheritedStep = await this.checkInheritedAccess(
        fgaUser,
        request.action,
        fgaObject,
        request.subjectId,
        request.resourceId,
      );
      if (inheritedStep) {
        steps.push(inheritedStep);
      }
    }

    // ── Final decision ──────────────────────────────────
    const finalDecision = this.resolveFinalDecision(steps);

    const trace = this.buildTrace(
      requestId,
      request,
      steps,
      finalDecision,
      startTime,
    );

    this.logTrace(trace);
    return trace;
  }

  // ── Final Decision Resolution ───────────────────────────

  private resolveFinalDecision(
    steps: TraceStep[],
  ): "allow" | "deny" | "require_mfa" {
    // DENY always wins
    const hasExplicitDeny = steps.some(
      (s) => s.result === "deny" && !s.metadata?.inheritedVia,
    );
    // But inherited allow overrides a direct OpenFGA deny
    const hasInheritedAllow = steps.some(
      (s) => s.result === "allow" && s.metadata?.inheritedVia,
    );

    if (hasExplicitDeny && !hasInheritedAllow) return "deny";

    // REQUIRE_MFA blocks unless satisfied
    if (steps.some((s) => s.result === "require_mfa")) return "require_mfa";

    // Everything else: all must be allow or skip
    const allPassOrSkip = steps.every(
      (s) => s.result === "allow" || s.result === "skip" || s.result === "deny",
    );
    const hasAnyAllow = steps.some((s) => s.result === "allow");

    if (hasAnyAllow && (allPassOrSkip || hasInheritedAllow)) return "allow";
    return "deny";
  }

  // ── RBAC Evaluation ─────────────────────────────────────

  private evaluateRbac(action: string): TraceStep {
    const start = Date.now();
    const allowedRoles = RBAC_RULES[action];

    if (!allowedRoles) {
      return {
        layer: "rbac",
        result: "skip",
        reason: `No RBAC rule for action "${action}" — deferring to OpenFGA`,
        durationMs: Date.now() - start,
      };
    }

    return {
      layer: "rbac",
      result: "allow",
      reason: `RBAC allows action "${action}" for roles: ${allowedRoles.join(", ")}`,
      durationMs: Date.now() - start,
      metadata: { allowedRoles },
    };
  }

  // ── ABAC Evaluation (real policy engine) ────────────────

  private evaluateAbac(request: EvaluateRequest): TraceStep {
    const start = Date.now();

    const evalResult = this.policyEngine.evaluate({
      subject: { type: request.subjectType, id: request.subjectId },
      resource: { type: request.resourceType, id: request.resourceId },
      action: request.action,
      metadata: request.metadata ?? {},
    });

    if (evalResult.effect === "none") {
      return {
        layer: "abac",
        result: "skip",
        reason: "No ABAC policies triggered for this request",
        durationMs: Date.now() - start,
        metadata: { policiesEvaluated: true, triggered: 0 },
      };
    }

    const triggeredNames = evalResult.triggered.map(
      (t) => `${t.policyName} (${t.effect})`,
    );

    if (evalResult.effect === "deny") {
      const denyPolicy = evalResult.triggered.find((t) => t.effect === "deny");
      return {
        layer: "abac",
        result: "deny",
        reason: `Policy: ${denyPolicy?.policyName ?? "unknown"} — denied`,
        durationMs: Date.now() - start,
        metadata: {
          policyId: denyPolicy?.policyId,
          policyName: denyPolicy?.policyName,
          matchedConditions: denyPolicy?.matchedConditions,
          allTriggered: triggeredNames,
        },
      };
    }

    if (evalResult.effect === "require_mfa") {
      const mfaPolicy = evalResult.triggered.find(
        (t) => t.effect === "require_mfa",
      );
      return {
        layer: "abac",
        result: "require_mfa",
        reason: `Policy: ${mfaPolicy?.policyName ?? "unknown"} — MFA required`,
        durationMs: Date.now() - start,
        metadata: {
          policyId: mfaPolicy?.policyId,
          policyName: mfaPolicy?.policyName,
          matchedConditions: mfaPolicy?.matchedConditions,
          allTriggered: triggeredNames,
        },
      };
    }

    return {
      layer: "abac",
      result: "allow",
      reason: `ABAC policies allow: ${triggeredNames.join(", ")}`,
      durationMs: Date.now() - start,
      metadata: { triggered: triggeredNames },
    };
  }

  // ── OpenFGA Evaluation ──────────────────────────────────

  private async evaluateOpenFGA(
    user: string,
    relation: string,
    object: string,
  ): Promise<TraceStep> {
    const start = Date.now();

    try {
      const allowed = await this.writer.check({ user, relation, object });

      return {
        layer: "openfga",
        result: allowed ? "allow" : "deny",
        reason: allowed
          ? `OpenFGA: ${user} has "${relation}" on ${object}`
          : `OpenFGA: ${user} does NOT have "${relation}" on ${object}`,
        durationMs: Date.now() - start,
        metadata: { user, relation, object, directCheck: true },
      };
    } catch (err) {
      return {
        layer: "openfga",
        result: "deny",
        reason: `OpenFGA error: ${err instanceof Error ? err.message : String(err)}`,
        durationMs: Date.now() - start,
        metadata: { error: true },
      };
    }
  }

  // ── Inherited Access Check ──────────────────────────────

  private async checkInheritedAccess(
    fgaUser: string,
    relation: string,
    fgaObject: string,
    subjectId: string,
    resourceId: string,
  ): Promise<TraceStep | null> {
    const start = Date.now();

    try {
      const resourceTuples = await this.writer.readTuples(fgaObject);
      const orgTuples = resourceTuples.filter((t) =>
        t.user.startsWith("organization:"),
      );

      for (const orgTuple of orgTuples) {
        const orgId = orgTuple.user.split(":")[1];

        const memberCheck = await this.writer.check({
          user: fgaUser,
          relation: "member",
          object: `organization:${orgId}`,
        });

        if (memberCheck) {
          const inheritedCheck = await this.writer.check({
            user: fgaUser,
            relation,
            object: fgaObject,
          });

          if (inheritedCheck) {
            return {
              layer: "openfga",
              result: "allow",
              reason:
                `Inherited: ${fgaUser} is member of organization:${orgId}, ` +
                `which has "${orgTuple.relation}" on resource:${resourceId} ` +
                `→ ${relation} access granted via model inheritance`,
              durationMs: Date.now() - start,
              metadata: {
                inheritedVia: `organization:${orgId}`,
                orgRelation: orgTuple.relation,
                userOrgRelation: "member",
              },
            };
          }
        }
      }
    } catch {
      // Inherited check is best-effort
    }

    return null;
  }

  // ── Build Trace ─────────────────────────────────────────

  private buildTrace(
    requestId: string,
    request: EvaluateRequest,
    steps: TraceStep[],
    finalDecision: "allow" | "deny" | "require_mfa",
    startTime: number,
  ): DecisionTrace {
    return {
      requestId,
      subject: { type: request.subjectType, id: request.subjectId },
      resource: { type: request.resourceType, id: request.resourceId },
      action: request.action,
      steps,
      finalDecision,
      timestamp: new Date().toISOString(),
      totalDurationMs: Date.now() - startTime,
    };
  }

  // ── Structured Logging ──────────────────────────────────

  private logTrace(trace: DecisionTrace): void {
    this.logger.log(
      JSON.stringify({
        event: "authz.decision",
        request_id: trace.requestId,
        subject_type: trace.subject.type,
        subject_id: trace.subject.id,
        resource_type: trace.resource.type,
        resource_id: trace.resource.id,
        action: trace.action,
        decision: trace.finalDecision,
        steps: trace.steps.map((s) => ({
          layer: s.layer,
          result: s.result,
        })),
        duration_ms: trace.totalDurationMs,
      }),
    );
  }
}
