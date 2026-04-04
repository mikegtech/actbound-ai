/**
 * Policy Engine — ABAC evaluation layer.
 *
 * Evaluates all active policies against the request context.
 * Precedence: DENY always wins > REQUIRE_MFA > ALLOW.
 *
 * Policies are stored in memory for v1. Replace with a database when needed.
 */

import { Injectable, Logger } from "@nestjs/common";
import { evaluateAllConditions } from "./condition-evaluator";
import type {
  Policy,
  PolicyContext,
  PolicyEvalResult,
  TriggeredPolicy,
} from "./policy-types";

@Injectable()
export class PolicyEngine {
  private readonly logger = new Logger(PolicyEngine.name);
  private policies: Policy[] = [];

  constructor() {
    this.seedDefaultPolicies();
  }

  // ── Evaluation ──────────────────────────────────────────

  evaluate(context: PolicyContext): PolicyEvalResult {
    const applicable = this.findApplicable(context);
    const triggered: TriggeredPolicy[] = [];

    for (const policy of applicable) {
      const flatContext = this.flattenContext(context);
      const { allMatch, matched } = evaluateAllConditions(
        policy.conditions,
        flatContext,
      );

      if (allMatch) {
        triggered.push({
          policyId: policy.id,
          policyName: policy.name,
          effect: policy.effect,
          matchedConditions: matched,
        });
      }
    }

    // Precedence: deny > require_mfa > allow > none
    const effect = this.resolveEffect(triggered);

    this.logger.log(
      JSON.stringify({
        event: "policy_engine.evaluate",
        applicable: applicable.length,
        triggered: triggered.length,
        effect,
        policies: triggered.map((t) => t.policyId),
      }),
    );

    return { triggered, effect };
  }

  // ── CRUD ────────────────────────────────────────────────

  listPolicies(): Policy[] {
    return [...this.policies];
  }

  getPolicy(id: string): Policy | undefined {
    return this.policies.find((p) => p.id === id);
  }

  createPolicy(policy: Omit<Policy, "id">): Policy {
    const newPolicy: Policy = {
      ...policy,
      id: `policy_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    };
    this.policies.push(newPolicy);
    return newPolicy;
  }

  updatePolicy(
    id: string,
    updates: Partial<Omit<Policy, "id">>,
  ): Policy | null {
    const index = this.policies.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.policies[index] = { ...this.policies[index]!, ...updates, id };
    return this.policies[index]!;
  }

  deletePolicy(id: string): boolean {
    const before = this.policies.length;
    this.policies = this.policies.filter((p) => p.id !== id);
    return this.policies.length < before;
  }

  // ── Internal ────────────────────────────────────────────

  private findApplicable(context: PolicyContext): Policy[] {
    return this.policies
      .filter((p) => p.active)
      .filter((p) => {
        if (
          p.target.subjectType &&
          p.target.subjectType !== context.subject.type
        )
          return false;
        if (
          p.target.resourceType &&
          p.target.resourceType !== context.resource.type
        )
          return false;
        if (p.target.action && p.target.action !== context.action) return false;
        return true;
      })
      .sort((a, b) => b.priority - a.priority);
  }

  private resolveEffect(
    triggered: TriggeredPolicy[],
  ): PolicyEvalResult["effect"] {
    if (triggered.length === 0) return "none";
    if (triggered.some((t) => t.effect === "deny")) return "deny";
    if (triggered.some((t) => t.effect === "require_mfa")) return "require_mfa";
    if (triggered.some((t) => t.effect === "allow")) return "allow";
    return "none";
  }

  private flattenContext(context: PolicyContext): Record<string, unknown> {
    return {
      subject: context.subject,
      resource: context.resource,
      action: context.action,
      metadata: context.metadata,
      // Also expose top-level metadata keys for simple conditions
      ...context.metadata,
    };
  }

  // ── Default Policies ────────────────────────────────────

  private seedDefaultPolicies(): void {
    this.policies = [
      {
        id: "policy_prevent_exfiltration",
        name: "Prevent Data Exfiltration",
        description:
          "Blocks outbound data access from non-whitelisted IP addresses",
        active: true,
        target: { resourceType: "resource" },
        conditions: [
          { field: "action", operator: "eq", value: "editor" },
          {
            field: "metadata.ip",
            operator: "not_in",
            value: ["10.0.0.0/8", "192.168.0.0/16", "127.0.0.1"],
          },
        ],
        effect: "deny",
        priority: 100,
      },
      {
        id: "policy_strict_assistant_access",
        name: "Strict Assistant Access",
        description:
          "Restricts assistants to read-only mode unless explicitly granted operator access",
        active: true,
        target: { subjectType: "assistant", resourceType: "resource" },
        conditions: [
          { field: "action", operator: "neq", value: "viewer" },
          { field: "metadata.mfaVerified", operator: "neq", value: true },
        ],
        effect: "require_mfa",
        priority: 90,
      },
      {
        id: "policy_high_value_transfers",
        name: "High Value Transfers",
        description: "Require MFA for any transaction over $1,000",
        active: true,
        target: {},
        conditions: [
          { field: "metadata.amount", operator: "gt", value: 1000 },
          { field: "metadata.mfaVerified", operator: "neq", value: true },
        ],
        effect: "require_mfa",
        priority: 95,
      },
      {
        id: "policy_off_hours_access",
        name: "Off-Hours Access Review",
        description:
          "Deny write access outside business hours (for demo — always allows)",
        active: false,
        target: { resourceType: "resource" },
        conditions: [
          { field: "metadata.hour", operator: "lt", value: 8 },
          { field: "action", operator: "neq", value: "viewer" },
        ],
        effect: "deny",
        priority: 80,
      },
    ];
  }
}
