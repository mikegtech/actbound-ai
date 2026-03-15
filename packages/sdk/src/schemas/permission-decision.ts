import type { AuthorizationDecision } from "@actbound/authorization";
import { PermissionSchema } from "@actbound/authorization";

import { z } from "../openapi/extend-zod";
import { TimestampSchema } from "./common";

export const PermissionDecisionSchema = z
  .object({
    permission: PermissionSchema,
    allowed: z.boolean(),
    reasons: z.array(z.string()),
    evaluatedAt: TimestampSchema,
    source: z.enum(["orchestrator", "agent-service", "authorization-package"]),
  })
  .openapi("PermissionDecision");

export const PermissionDecisionListSchema = z
  .object({
    decisions: z.array(PermissionDecisionSchema),
  })
  .openapi("PermissionDecisionList");

export type PermissionDecisionRecord = import("zod").infer<
  typeof PermissionDecisionSchema
>;

export function toPermissionDecisionRecord(
  decision: AuthorizationDecision,
  source: PermissionDecisionRecord["source"],
): PermissionDecisionRecord {
  return {
    ...decision,
    evaluatedAt: new Date().toISOString(),
    source,
  };
}
