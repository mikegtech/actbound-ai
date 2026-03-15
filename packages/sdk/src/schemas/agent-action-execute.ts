import { z } from "../openapi/extend-zod";
import { PermissionDecisionSchema } from "./permission-decision";

export const AgentActionExecuteRequestSchema = z
  .object({
    action: z.string(),
    connectionId: z.string(),
    consentGrantId: z.string().optional(),
    previewId: z.string().optional(),
    payload: z.record(z.string(), z.unknown()).default({}),
  })
  .openapi("AgentActionExecuteRequest");

export const AgentActionExecuteResultSchema = z
  .object({
    executionId: z.string(),
    action: z.string(),
    status: z.enum(["accepted", "denied", "completed"]),
    reasons: z.array(z.string()),
    auditEventId: z.string().optional(),
    permissionDecision: PermissionDecisionSchema,
  })
  .openapi("AgentActionExecuteResult");

export type AgentActionExecuteRequest = import("zod").infer<
  typeof AgentActionExecuteRequestSchema
>;
export type AgentActionExecuteResult = import("zod").infer<
  typeof AgentActionExecuteResultSchema
>;
