import { z } from "../openapi/extend-zod";
import { VaultConnectionSchema } from "./vault-connection";

export const VaultConnectionListSchema = z
  .object({
    connections: z.array(VaultConnectionSchema),
  })
  .openapi("VaultConnectionList");

export type VaultConnectionList = import("zod").infer<
  typeof VaultConnectionListSchema
>;
