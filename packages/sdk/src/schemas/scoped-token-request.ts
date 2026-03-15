import { z } from "../openapi/extend-zod";

export const ScopedTokenRequestSchema = z
  .object({
    audience: z.string(),
    scopes: z.array(z.string()),
    purpose: z.string(),
    consentGrantId: z.string().optional(),
  })
  .openapi("ScopedTokenRequest");

export type ScopedTokenRequest = import("zod").infer<
  typeof ScopedTokenRequestSchema
>;
