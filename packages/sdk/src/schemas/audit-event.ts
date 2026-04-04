import { z } from "../openapi/extend-zod";
import { TimestampSchema } from "./common";

export const AuditActorSummarySchema = z
  .object({
    id: z.string(),
    principalType: z.enum(["user", "service", "agent", "system"]),
    agentType: z.string().optional(),
    agentInstanceId: z.string().optional(),
  })
  .openapi("AuditActorSummary");

export const AuditResourceSummarySchema = z
  .object({
    type: z.string(),
    id: z.string().optional(),
    label: z.string().optional(),
  })
  .openapi("AuditResourceSummary");

export const AuditDecisionSummarySchema = z
  .object({
    allowed: z.boolean(),
    reasons: z.array(
      z.object({ code: z.string(), message: z.string().optional() }),
    ),
  })
  .openapi("AuditDecisionSummary");

export const AuditEventSchema = z
  .object({
    id: z.string(),
    eventType: z.string(),
    action: z.string(),
    actor: AuditActorSummarySchema,
    onBehalfOf: z.string().optional(),
    resource: AuditResourceSummarySchema.optional(),
    decision: AuditDecisionSummarySchema.optional(),
    status: z.enum(["success", "denied", "queued", "error"]),
    stepUpRequired: z.boolean().optional(),
    source: z
      .enum(["orchestrator", "agent-service", "authorization-package"])
      .optional(),
    occurredAt: TimestampSchema,
    requestId: z.string().optional(),
    workflowId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .openapi("AuditEvent");

export const AuditEventListSchema = z
  .object({
    events: z.array(AuditEventSchema),
    total: z.number().optional(),
  })
  .openapi("AuditEventList");

export const ActivityTimelineEntrySchema = z
  .object({
    id: z.string(),
    eventType: z.string(),
    summary: z.string(),
    actor: AuditActorSummarySchema,
    onBehalfOf: z.string().optional(),
    resource: AuditResourceSummarySchema.optional(),
    allowed: z.boolean().optional(),
    stepUpRequired: z.boolean().optional(),
    occurredAt: TimestampSchema,
  })
  .openapi("ActivityTimelineEntry");

export const ActivityTimelineSchema = z
  .object({
    entries: z.array(ActivityTimelineEntrySchema),
    total: z.number().optional(),
  })
  .openapi("ActivityTimeline");

export const UserControlSummarySchema = z
  .object({
    permissionsSummary: z.object({
      total: z.number(),
      allowed: z.number(),
      denied: z.number(),
    }),
    connectedAccounts: z.number(),
    activeGrants: z.number(),
    recentActivity: z.number(),
    revocations: z.number(),
  })
  .openapi("UserControlSummary");

export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AuditActorSummary = z.infer<typeof AuditActorSummarySchema>;
export type AuditResourceSummary = z.infer<typeof AuditResourceSummarySchema>;
export type AuditDecisionSummary = z.infer<typeof AuditDecisionSummarySchema>;
export type ActivityTimelineEntry = z.infer<typeof ActivityTimelineEntrySchema>;
export type ActivityTimeline = z.infer<typeof ActivityTimelineSchema>;
export type UserControlSummary = z.infer<typeof UserControlSummarySchema>;
