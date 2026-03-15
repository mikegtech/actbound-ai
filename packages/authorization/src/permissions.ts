import { z } from "zod";

export const PermissionResourceSchema = z.enum([
  "permissions",
  "consent_grant",
  "vault_connection",
  "agent_action",
  "audit_event",
  "valuation",
  "listing",
]);

export type PermissionResource = z.infer<typeof PermissionResourceSchema>;

export const PermissionActionSchema = z.enum([
  "read",
  "use",
  "preview",
  "execute",
]);

export type PermissionAction = z.infer<typeof PermissionActionSchema>;

export const PermissionScopeSchema = z.enum([
  "connections.read",
  "agent.preview",
  "agent.execute",
  "valuations.execute",
  "audit.read",
]);

export type PermissionScope = z.infer<typeof PermissionScopeSchema>;

export const PermissionSchema = z.enum([
  "permissions:read",
  "consent_grants:use",
  "vault_connections:use",
  "connections:read",
  "agent_actions:preview",
  "agent_actions:execute",
  "audit_events:read",
  "valuations:execute",
  "listings:read",
]);

export type Permission = z.infer<typeof PermissionSchema>;

export const ALL_PERMISSIONS: Permission[] = [...PermissionSchema.options];
