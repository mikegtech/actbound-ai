import { ALL_PERMISSIONS, type Permission } from "./permissions";
import { permissionScopeRequirements, rolePermissions } from "./policies";
import type { AuthorizationContext, AuthorizationDecision } from "./types";

function hasRolePermission(
  context: AuthorizationContext,
  permission: Permission,
): boolean {
  return context.roles.some((role) =>
    rolePermissions[role]?.includes(permission),
  );
}

function hasRequiredScopes(
  context: AuthorizationContext,
  permission: Permission,
): boolean {
  const requiredScopes = permissionScopeRequirements[permission];
  if (!requiredScopes || requiredScopes.length === 0) {
    return true;
  }

  const effectiveScopes = new Set([
    ...context.consentScopes,
    ...context.tokenScopes,
  ]);
  return requiredScopes.every((scope) => effectiveScopes.has(scope));
}

export function evaluatePermission(
  context: AuthorizationContext,
  permission: Permission,
): AuthorizationDecision {
  const reasons: string[] = [];

  if (!hasRolePermission(context, permission)) {
    reasons.push("Role grant missing for requested permission.");
  }

  if (!hasRequiredScopes(context, permission)) {
    reasons.push("Consent or scoped token requirements are not satisfied.");
  }

  if (context.roles.length === 0) {
    reasons.push("No actor roles were provided.");
  }

  return {
    permission,
    allowed: reasons.length === 0,
    reasons:
      reasons.length > 0
        ? reasons
        : ["Permission granted by centralized policy engine."],
  };
}

export function evaluateAllPermissions(
  context: AuthorizationContext,
): AuthorizationDecision[] {
  return ALL_PERMISSIONS.map((permission) =>
    evaluatePermission(context, permission),
  );
}
