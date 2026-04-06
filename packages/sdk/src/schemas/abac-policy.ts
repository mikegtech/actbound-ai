import { z } from "../openapi/extend-zod";

export const PolicyConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(["eq", "neq", "gt", "lt", "in", "not_in"]),
  value: z.unknown(),
});

export const AbacPolicySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    active: z.boolean(),
    target: z.object({
      subjectType: z.enum(["user", "assistant"]).optional(),
      resourceType: z.string().optional(),
      action: z.string().optional(),
    }),
    conditions: z.array(PolicyConditionSchema),
    effect: z.enum(["allow", "deny", "require_mfa"]),
    priority: z.number(),
  })
  .openapi("AbacPolicy");

export const AbacPolicyListSchema = z.array(AbacPolicySchema);

export const DecisionTraceResultSchema = z
  .object({
    requestId: z.string(),
    subject: z.object({
      type: z.enum(["user", "assistant"]),
      id: z.string(),
    }),
    resource: z.object({ type: z.string(), id: z.string() }),
    action: z.string(),
    steps: z.array(
      z.object({
        layer: z.string(),
        result: z.string(),
        reason: z.string(),
        durationMs: z.number(),
        metadata: z.record(z.unknown()).optional(),
      }),
    ),
    finalDecision: z.string(),
    timestamp: z.string(),
    totalDurationMs: z.number(),
  })
  .openapi("DecisionTraceResult");

export const DeleteResultSchema = z.object({ deleted: z.boolean() });

export type AbacPolicy = z.infer<typeof AbacPolicySchema>;
export type PolicyCondition = z.infer<typeof PolicyConditionSchema>;
export type DecisionTraceResult = z.infer<typeof DecisionTraceResultSchema>;
