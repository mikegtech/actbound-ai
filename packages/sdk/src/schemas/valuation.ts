import { z } from "../openapi/extend-zod";
import { PermissionDecisionSchema } from "./permission-decision";

export const ValuationExecuteRequestSchema = z
  .object({
    listingId: z.string(),
    connectionId: z.string(),
    valuationMethod: z.enum(["comparable-sales", "cash-flow", "placeholder"]),
  })
  .openapi("ValuationExecuteRequest");

export const ValuationExecuteResultSchema = z
  .object({
    jobId: z.string(),
    status: z.enum(["accepted", "denied"]),
    reasons: z.array(z.string()),
    permissionDecision: PermissionDecisionSchema,
  })
  .openapi("ValuationExecuteResult");

export type ValuationExecuteRequest = import("zod").infer<
  typeof ValuationExecuteRequestSchema
>;
export type ValuationExecuteResult = import("zod").infer<
  typeof ValuationExecuteResultSchema
>;
