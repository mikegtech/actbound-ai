import { z } from "../openapi/extend-zod";

export const AgentActionExecuteRequestSchema = z
  .object({
    action: z.string(),
    connectionId: z.string(),
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
  })
  .openapi("AgentActionExecuteResult");

export type AgentActionExecuteRequest = import("zod").infer<
  typeof AgentActionExecuteRequestSchema
>;
export type AgentActionExecuteResult = import("zod").infer<
  typeof AgentActionExecuteResultSchema
>;
