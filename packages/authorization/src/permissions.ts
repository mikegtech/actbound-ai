import { z } from "zod";

export const PermissionResourceSchema = z.enum([
  "permissions",
  "consent_grant",
  "vault_connection",
  "provider_connection",
  "delegated_grant",
  "vault_session",
  "consent_record",
  "sensitive_action",
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
  "connect",
  "revoke",
  "broker",
  "inspect",
]);

export type PermissionAction = z.infer<typeof PermissionActionSchema>;

export const PermissionScopeSchema = z.enum([
  "connections.read",
  "connections.connect",
  "connections.revoke",
  "consents.read",
  "consents.preview",
  "agent.preview",
  "agent.execute",
  "tokens.delegated",
  "vault.sessions.read",
  "sensitive.execute",
  "valuations.execute",
  "audit.read",
]);

export type PermissionScope = z.infer<typeof PermissionScopeSchema>;

export const PermissionSchema = z.enum([
  "permissions:read",
  "consent_grants:use",
  "vault_connections:use",
  "connections:read",
  "provider_connections:read",
  "provider_connections:connect",
  "provider_connections:revoke",
  "delegated_grants:read",
  "delegated_grants:preview",
  "vault_sessions:read",
  "agent_actions:preview",
  "agent_actions:execute",
  "sensitive_actions:execute",
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
