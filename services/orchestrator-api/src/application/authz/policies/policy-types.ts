/**
 * ABAC Policy types.
 *
 * Policies are rule-based conditions that influence authorization decisions
 * beyond what RBAC roles and OpenFGA relationships cover.
 *
 * Examples: IP restrictions, amount limits, MFA requirements, time-based access.
 */

export type ConditionOperator = "eq" | "neq" | "gt" | "lt" | "in" | "not_in";
export type PolicyEffect = "allow" | "deny" | "require_mfa";

export interface PolicyCondition {
  /** The field in the evaluation context to check. Dot-notation supported. */
  field: string;
  /** Comparison operator. */
  operator: ConditionOperator;
  /** The value to compare against. */
  value: unknown;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  /** Whether this policy is actively evaluated. */
  active: boolean;
  /** Target scope — which requests this policy applies to. */
  target: {
    subjectType?: "user" | "assistant";
    resourceType?: string;
    action?: string;
  };
  /** All conditions must be true for the policy to trigger. */
  conditions: PolicyCondition[];
  /** What happens when conditions match. */
  effect: PolicyEffect;
  /** Higher priority policies win in conflicts. Deny always wins regardless. */
  priority: number;
}

/** Context passed into policy evaluation — runtime attributes. */
export interface PolicyContext {
  subject: {
    type: "user" | "assistant";
    id: string;
  };
  resource: {
    type: string;
    id: string;
  };
  action: string;
  metadata: Record<string, unknown>;
}

export interface PolicyEvalResult {
  triggered: TriggeredPolicy[];
  effect: PolicyEffect | "none";
}

export interface TriggeredPolicy {
  policyId: string;
  policyName: string;
  effect: PolicyEffect;
  matchedConditions: string[];
}
