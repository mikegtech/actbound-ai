import { SensitiveActionClassificationSchema } from "@actbound/authorization";

import { z } from "../openapi/extend-zod";

export const TokenRequestIntentSchema = z
  .enum(["m2m", "delegated"])
  .openapi("TokenRequestIntent");

export const TokenSourceTypeSchema = z
  .enum(["m2m", "delegated", "cached"])
  .openapi("TokenSourceType");

export const ScopedTokenRequestSchema = z
  .object({
    audience: z.string(),
    scopes: z.array(z.string()),
    purpose: z.string(),
    intent: TokenRequestIntentSchema.default("m2m"),
    actorId: z.string().optional(),
    subjectId: z.string().optional(),
    connectionId: z.string().optional(),
    consentGrantId: z.string().optional(),
    sensitiveActionClassification:
      SensitiveActionClassificationSchema.optional(),
  })
  .openapi("ScopedTokenRequest");

export type TokenRequestIntent = import("zod").infer<
  typeof TokenRequestIntentSchema
>;
export type TokenSourceType = import("zod").infer<typeof TokenSourceTypeSchema>;
export type ScopedTokenRequest = import("zod").infer<
  typeof ScopedTokenRequestSchema
>;
