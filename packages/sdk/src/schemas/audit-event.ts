import { z } from "../openapi/extend-zod";
import { TimestampSchema } from "./common";

export const AuditEventSchema = z
  .object({
    id: z.string(),
    actorId: z.string(),
    action: z.string(),
    resourceId: z.string().optional(),
    status: z.enum(["success", "denied", "queued"]),
    occurredAt: TimestampSchema,
    metadata: z.record(z.string(), z.unknown()).default({}),
  })
  .openapi("AuditEvent");

export const AuditEventListSchema = z
  .object({
    events: z.array(AuditEventSchema),
  })
  .openapi("AuditEventList");

export type AuditEvent = import("zod").infer<typeof AuditEventSchema>;
