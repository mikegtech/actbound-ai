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
  "audit_events:read": {
    permission: "audit_events:read",
    resource: "audit_event",
    action: "read",
    roles: ["admin", "operator"],
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
