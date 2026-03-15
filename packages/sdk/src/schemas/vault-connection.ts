import { z } from "../openapi/extend-zod";
import { TimestampSchema } from "./common";

export const VaultConnectionSchema = z
  .object({
    id: z.string(),
    provider: z.string(),
    accountLabel: z.string(),
    status: z.enum(["connected", "disconnected", "error"]),
    scopes: z.array(z.string()),
    lastSyncedAt: TimestampSchema.optional(),
  })
  .openapi("VaultConnection");

export type VaultConnection = import("zod").infer<typeof VaultConnectionSchema>;
