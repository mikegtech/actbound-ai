import { z } from "zod";

export const PermissionSchema = z.enum([
  "permissions:read",
  "connections:read",
  "agent_actions:preview",
  "agent_actions:execute",
  "audit_events:read",
  "valuations:execute",
  "listings:read",
]);

export type Permission = z.infer<typeof PermissionSchema>;

export const ALL_PERMISSIONS = PermissionSchema.options;
