import { z } from "../openapi/extend-zod";
import { TimestampSchema } from "./common";

export const ListingParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("ListingParams");

export const ListingSchema = z
  .object({
    id: z.string(),
    address: z.string(),
    status: z.enum(["active", "pending", "archived"]),
    lastValuationAmount: z.number().nullable(),
    updatedAt: TimestampSchema,
  })
  .openapi("Listing");

export type Listing = import("zod").infer<typeof ListingSchema>;
