import { z } from "../openapi/extend-zod";

export const StandardApiErrorSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
    requestId: z.string().optional(),
  })
  .openapi("StandardApiError");

export type StandardApiError = import("zod").infer<
  typeof StandardApiErrorSchema
>;
