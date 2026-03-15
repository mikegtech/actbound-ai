import { z } from "../openapi/extend-zod";

export const TimestampSchema = z.string().datetime().openapi({
  example: "2026-03-15T13:00:00.000Z",
});

export const HealthStatusSchema = z
  .object({
    service: z.string(),
    status: z.literal("ok"),
    timestamp: TimestampSchema,
  })
  .openapi("HealthStatus");

export type HealthStatus = import("zod").infer<typeof HealthStatusSchema>;
