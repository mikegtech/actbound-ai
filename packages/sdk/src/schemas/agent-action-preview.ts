import { z } from "../openapi/extend-zod";
import { ScopedTokenRequestSchema } from "./scoped-token-request";

export const AgentActionPreviewRequestSchema = z
  .object({
    action: z.string(),
    connectionId: z.string(),
    payload: z.record(z.string(), z.unknown()).default({}),
  })
  .openapi("AgentActionPreviewRequest");

export const AgentActionPreviewResultSchema = z
  .object({
    previewId: z.string(),
    action: z.string(),
    allowed: z.boolean(),
    reasons: z.array(z.string()),
    summary: z.string(),
    scopedTokenRequest: ScopedTokenRequestSchema.optional(),
  })
  .openapi("AgentActionPreviewResult");

export type AgentActionPreviewRequest = import("zod").infer<
  typeof AgentActionPreviewRequestSchema
>;
export type AgentActionPreviewResult = import("zod").infer<
  typeof AgentActionPreviewResultSchema
>;
