/**
 * Condition evaluator — safe, deterministic comparison engine.
 *
 * No eval(), no dynamic code execution. Each operator is an explicit comparison.
 * Supports dot-notation field paths for nested context values.
 */

import type { PolicyCondition } from "./policy-types";

/**
 * Resolve a dot-notation field path from a context object.
 * e.g., "metadata.ip" → context.metadata.ip
 */
function resolveField(
  context: Record<string, unknown>,
  field: string,
): unknown {
  const parts = field.split(".");
  let current: unknown = context;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Evaluate a single condition against a context.
 * Returns true if the condition matches.
 */
export function evaluateCondition(
  condition: PolicyCondition,
  context: Record<string, unknown>,
): boolean {
  const fieldValue = resolveField(context, condition.field);

  switch (condition.operator) {
    case "eq":
      return fieldValue === condition.value;

    case "neq":
      return fieldValue !== condition.value;

    case "gt":
      return (
        typeof fieldValue === "number" &&
        typeof condition.value === "number" &&
        fieldValue > condition.value
      );

    case "lt":
      return (
        typeof fieldValue === "number" &&
        typeof condition.value === "number" &&
        fieldValue < condition.value
      );

    case "in":
      if (!Array.isArray(condition.value)) return false;
      return (condition.value as unknown[]).includes(fieldValue);

    case "not_in":
      if (!Array.isArray(condition.value)) return true;
      return !(condition.value as unknown[]).includes(fieldValue);

    default:
      return false;
  }
}

/**
 * Evaluate all conditions (AND logic — all must match).
 * Returns the list of matched condition descriptions.
 */
export function evaluateAllConditions(
  conditions: PolicyCondition[],
  context: Record<string, unknown>,
): { allMatch: boolean; matched: string[] } {
  const matched: string[] = [];

  for (const condition of conditions) {
    if (evaluateCondition(condition, context)) {
      matched.push(
        `${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`,
      );
    } else {
      return { allMatch: false, matched };
    }
  }

  return { allMatch: true, matched };
}
