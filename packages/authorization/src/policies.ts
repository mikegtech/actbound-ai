import type {
  Permission,
  PermissionAction,
  PermissionResource,
  PermissionScope,
} from "./permissions";
import { ActorRoleSchema, type ActorRole, type ActorType } from "./types";

export type PermissionPolicy = {
  permission: Permission;
  resource: PermissionResource;
  action: PermissionAction;
  roles: ActorRole[];
  actorTypes: ActorType[];
  requiresConsent?: boolean;
  requiredConsentScopes?: PermissionScope[];
  requiresTokenVaultConnection?: boolean;
  requiredVaultScopes?: PermissionScope[];
  requiresProviderConnection?: boolean;
  requiredProviderScopes?: PermissionScope[];
  requiresVaultSession?: boolean;
  requiredVaultSessionScopes?: PermissionScope[];
  requiresStepUpForSensitiveActions?: boolean;
  requireSubjectOwnership?: boolean;
};

export const permissionPolicies: Record<Permission, PermissionPolicy> = {
  "permissions:read": {
    permission: "permissions:read",
    resource: "permissions",
    action: "read",
    roles: ["admin", "operator", "viewer", "service"],
    actorTypes: ["user", "agent", "system"],
  },
  "consent_grants:use": {
    permission: "consent_grants:use",
    resource: "consent_grant",
    action: "use",
    roles: ["admin", "operator"],
    actorTypes: ["user"],
    requiresConsent: true,
    requireSubjectOwnership: true,
  },
  "vault_connections:use": {
    permission: "vault_connections:use",
    resource: "vault_connection",
    action: "use",
    roles: ["admin", "operator"],
    actorTypes: ["user"],
    requiresTokenVaultConnection: true,
    requireSubjectOwnership: true,
  },
  "connections:read": {
    permission: "connections:read",
    resource: "vault_connection",
    action: "read",
    roles: ["admin", "operator", "viewer"],
    actorTypes: ["user"],
  },
  "provider_connections:read": {
    permission: "provider_connections:read",
    resource: "provider_connection",
    action: "read",
    roles: ["admin", "operator", "viewer"],
    actorTypes: ["user"],
  },
  "provider_connections:connect": {
    permission: "provider_connections:connect",
    resource: "provider_connection",
    action: "connect",
    roles: ["admin", "operator"],
    actorTypes: ["user"],
    requireSubjectOwnership: true,
  },
  "provider_connections:revoke": {
    permission: "provider_connections:revoke",
    resource: "provider_connection",
    action: "revoke",
    roles: ["admin", "operator"],
    actorTypes: ["user"],
    requiresProviderConnection: true,
    requireSubjectOwnership: true,
  },
  "delegated_grants:read": {
    permission: "delegated_grants:read",
    resource: "delegated_grant",
    action: "read",
    roles: ["admin", "operator", "viewer"],
    actorTypes: ["user"],
    requireSubjectOwnership: true,
  },
  "delegated_grants:preview": {
    permission: "delegated_grants:preview",
    resource: "consent_record",
    action: "preview",
    roles: ["admin", "operator"],
    actorTypes: ["user"],
    requireSubjectOwnership: true,
  },
  "vault_sessions:read": {
    permission: "vault_sessions:read",
    resource: "vault_session",
    action: "read",
    roles: ["admin", "operator", "viewer"],
    actorTypes: ["user"],
    requireSubjectOwnership: true,
  },
  "agent_actions:preview": {
    permission: "agent_actions:preview",
    resource: "agent_action",
    action: "preview",
    roles: ["admin", "operator"],
    actorTypes: ["user"],
    requiresConsent: true,
    requiredConsentScopes: ["agent.preview"],
    requiresTokenVaultConnection: true,
    requiredVaultScopes: ["agent.preview"],
    requireSubjectOwnership: true,
  },
  "agent_actions:execute": {
    permission: "agent_actions:execute",
    resource: "agent_action",
    action: "execute",
    roles: ["admin", "operator"],
    actorTypes: ["user"],
    requiresConsent: true,
    requiredConsentScopes: ["agent.execute"],
    requiresTokenVaultConnection: true,
    requiredVaultScopes: ["agent.execute"],
    requireSubjectOwnership: true,
  },
  "sensitive_actions:execute": {
    permission: "sensitive_actions:execute",
    resource: "sensitive_action",
    action: "execute",
    roles: ["admin", "operator"],
    actorTypes: ["user"],
    requiresConsent: true,
    requiredConsentScopes: [
      "agent.execute",
      "tokens.delegated",
      "sensitive.execute",
    ],
    requiresTokenVaultConnection: true,
    requiredVaultScopes: [
      "agent.execute",
      "tokens.delegated",
      "sensitive.execute",
    ],
    requiresProviderConnection: true,
    requiredProviderScopes: [
      "agent.execute",
      "tokens.delegated",
      "sensitive.execute",
    ],
    requiresVaultSession: true,
    requiredVaultSessionScopes: ["tokens.delegated", "sensitive.execute"],
    requiresStepUpForSensitiveActions: true,
    requireSubjectOwnership: true,
  },
  "audit_events:read": {
    permission: "audit_events:read",
    resource: "audit_event",
    action: "read",
    roles: ["admin", "operator"],
    actorTypes: ["user", "system"],
  },
  "brokered_tokens:read": {
    permission: "brokered_tokens:read",
    resource: "brokered_token",
    action: "read",
    roles: ["admin", "operator", "viewer", "service"],
    actorTypes: ["user", "system"],
  },
  "brokered_tokens:broker": {
    permission: "brokered_tokens:broker",
    resource: "brokered_token",
    action: "broker",
    roles: ["admin", "operator", "service"],
    actorTypes: ["user", "system"],
  },
  "brokered_tokens:reuse": {
    permission: "brokered_tokens:reuse",
    resource: "brokered_token",
    action: "use",
    roles: ["admin", "operator", "service"],
    actorTypes: ["user", "system"],
  },
  "delegated_tokens:use": {
    permission: "delegated_tokens:use",
    resource: "delegated_token",
    action: "use",
    roles: ["admin", "operator"],
    actorTypes: ["user"],
    requiresConsent: true,
    requiredConsentScopes: ["tokens.delegated"],
    requiresTokenVaultConnection: true,
    requiredVaultScopes: ["tokens.delegated"],
    requiresProviderConnection: true,
    requiredProviderScopes: ["tokens.delegated"],
    requiresVaultSession: true,
    requiredVaultSessionScopes: ["tokens.delegated"],
    requireSubjectOwnership: true,
  },
  "token_cache:inspect": {
    permission: "token_cache:inspect",
    resource: "token_cache",
    action: "inspect",
    roles: ["admin", "operator", "service"],
    actorTypes: ["user", "system"],
  },
  "valuations:execute": {
    permission: "valuations:execute",
    resource: "valuation",
    action: "execute",
    roles: ["admin", "operator", "service"],
    actorTypes: ["user", "agent", "system"],
    requiresTokenVaultConnection: true,
    requiredVaultScopes: ["valuations.execute"],
  },
  "listings:read": {
    permission: "listings:read",
    resource: "listing",
    action: "read",
    roles: ["admin", "operator", "viewer", "service"],
    actorTypes: ["user", "agent", "system"],
  },
};

export const rolePermissions = ActorRoleSchema.options.reduce<
  Record<ActorRole, Permission[]>
>(
  (result, role) => {
    result[role] = Object.values(permissionPolicies)
      .filter((policy) => policy.roles.includes(role))
      .map((policy) => policy.permission);
    return result;
  },
  {
    admin: [],
    operator: [],
    viewer: [],
    service: [],
  },
);
