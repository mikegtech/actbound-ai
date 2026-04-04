import { z } from "../openapi/extend-zod";

export const PolicyRuleConditionSchema = z
  .object({
    field: z.string(),
    operator: z.string(),
    value: z.string(),
  })
  .openapi("PolicyRuleCondition");

export const PolicyViewSchema = z
  .object({
    permission: z.string(),
    resource: z.string(),
    action: z.string(),
    description: z.string(),
    target: z.string(),
    roles: z.array(z.string()),
    actorTypes: z.array(z.string()),
    conditions: z.array(PolicyRuleConditionSchema),
    flags: z.array(z.string()),
    status: z.enum(["active"]),
  })
  .openapi("PolicyView");

export const PolicyViewListSchema = z
  .object({
    policies: z.array(PolicyViewSchema),
    total: z.number(),
  })
  .openapi("PolicyViewList");

export type PolicyView = z.infer<typeof PolicyViewSchema>;
export type PolicyViewList = z.infer<typeof PolicyViewListSchema>;
