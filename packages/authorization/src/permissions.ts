import { z } from "zod";

export const PermissionResourceSchema = z.enum([
  "permissions",
  "consent_grant",
  "vault_connection",
  "agent_action",
  "audit_event",
  "brokered_token",
  "delegated_token",
  "token_cache",
  "valuation",
  "listing",
]);

export type PermissionResource = z.infer<typeof PermissionResourceSchema>;

export const PermissionActionSchema = z.enum([
  "read",
  "use",
  "preview",
  "execute",
  "broker",
  "inspect",
]);

export type PermissionAction = z.infer<typeof PermissionActionSchema>;

export const PermissionScopeSchema = z.enum([
  "connections.read",
  "agent.preview",
  "agent.execute",
  "tokens.delegated",
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
  "brokered_tokens:read",
  "brokered_tokens:broker",
  "brokered_tokens:reuse",
  "delegated_tokens:use",
  "token_cache:inspect",
  "valuations:execute",
  "listings:read",
]);

export type Permission = z.infer<typeof PermissionSchema>;

export const ALL_PERMISSIONS: Permission[] = [...PermissionSchema.options];
