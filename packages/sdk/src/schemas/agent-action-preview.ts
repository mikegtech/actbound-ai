import { z } from "../openapi/extend-zod";
import {
  PermissionContextSummarySchema,
  PermissionDecisionSchema,
} from "./permission-decision";
import { ScopedTokenRequestSchema } from "./scoped-token-request";

export const AgentActionPreviewRequestSchema = z
  .object({
    action: z.string(),
    connectionId: z.string(),
    consentGrantId: z.string().optional(),
    payload: z.record(z.string(), z.unknown()).default({}),
  })
  .openapi("AgentActionPreviewRequest");

export const AgentActionPreviewResultSchema = z
  .object({
    previewId: z.string(),
    action: z.string(),
    summary: z.string(),
    context: PermissionContextSummarySchema,
    permissionDecision: PermissionDecisionSchema,
    scopedTokenRequest: ScopedTokenRequestSchema.optional(),
  })
  .openapi("AgentActionPreviewResult");

export type AgentActionPreviewRequest = import("zod").infer<
  typeof AgentActionPreviewRequestSchema
>;
export type AgentActionPreviewResult = import("zod").infer<
  typeof AgentActionPreviewResultSchema
>;
