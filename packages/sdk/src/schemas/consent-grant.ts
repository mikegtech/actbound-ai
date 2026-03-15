import { z } from "../openapi/extend-zod";
import { TimestampSchema } from "./common";

export const ConsentGrantSchema = z
  .object({
    id: z.string(),
    provider: z.string(),
    subjectId: z.string(),
    scopes: z.array(z.string()),
    status: z.enum(["active", "pending", "revoked"]),
    grantedAt: TimestampSchema,
    expiresAt: TimestampSchema.optional(),
  })
  .openapi("ConsentGrant");

export type ConsentGrant = import("zod").infer<typeof ConsentGrantSchema>;
