import {
  permissionPolicies,
  type PermissionPolicy,
} from "@actbound/authorization";
import { Controller, Get } from "@nestjs/common";
import type { PolicyView } from "@actbound/sdk";

function describePolicy(policy: PermissionPolicy): string {
  const parts: string[] = [];

  parts.push(
    `${policy.action} ${policy.resource.replace(/_/g, " ")} for ${policy.roles.join(", ")} roles`,
  );

  if (policy.requiresConsent) parts.push("with delegated consent");
  if (policy.requiresTokenVaultConnection)
    parts.push("with Token Vault connection");
  if (policy.requiresProviderConnection) parts.push("with provider connection");
  if (policy.requiresVaultSession) parts.push("with active vault session");
  if (policy.requiresStepUpForSensitiveActions)
    parts.push("requiring step-up for sensitive actions");
  if (policy.requireSubjectOwnership) parts.push("scoped to resource owner");

  return parts.join(", ");
}

function buildConditions(policy: PermissionPolicy): PolicyView["conditions"] {
  const conditions: PolicyView["conditions"] = [];

  conditions.push({
    field: "Role",
    operator: "IN",
    value: policy.roles.join(", "),
  });

  conditions.push({
    field: "Actor Type",
    operator: "IN",
    value: policy.actorTypes.join(", "),
  });

  if (policy.requiresConsent) {
    conditions.push({
      field: "Consent",
      operator: "==",
      value: "granted",
    });
  }

  if (policy.requiredConsentScopes && policy.requiredConsentScopes.length > 0) {
    conditions.push({
      field: "Consent Scopes",
      operator: "INCLUDE",
      value: policy.requiredConsentScopes.join(", "),
    });
  }

  if (policy.requiresTokenVaultConnection) {
    conditions.push({
      field: "Token Vault",
      operator: "==",
      value: "connected",
    });
  }

  if (policy.requiredVaultScopes && policy.requiredVaultScopes.length > 0) {
    conditions.push({
      field: "Vault Scopes",
      operator: "INCLUDE",
      value: policy.requiredVaultScopes.join(", "),
    });
  }

  if (policy.requiresProviderConnection) {
    conditions.push({
      field: "Provider",
      operator: "==",
      value: "connected",
    });
  }

  if (policy.requiresVaultSession) {
    conditions.push({
      field: "Vault Session",
      operator: "==",
      value: "active",
    });
  }

  if (policy.requiresStepUpForSensitiveActions) {
    conditions.push({
      field: "Step-Up",
      operator: "==",
      value: "satisfied (for sensitive/high_impact)",
    });
  }

  return conditions;
}

function buildFlags(policy: PermissionPolicy): string[] {
  const flags: string[] = [];
  if (policy.requiresConsent) flags.push("Requires Consent");
  if (policy.requiresTokenVaultConnection) flags.push("Requires Token Vault");
  if (policy.requiresProviderConnection)
    flags.push("Requires Provider Connection");
  if (policy.requiresVaultSession) flags.push("Requires Vault Session");
  if (policy.requiresStepUpForSensitiveActions) flags.push("Requires Step-Up");
  if (policy.requireSubjectOwnership) flags.push("Owner-Scoped");
  return flags;
}

@Controller("policies")
export class PoliciesController {
  @Get()
  listPolicies() {
    const policies = Object.values(permissionPolicies).map(
      (policy): PolicyView => ({
        permission: policy.permission,
        resource: policy.resource,
        action: policy.action,
        description: describePolicy(policy),
        target: policy.actorTypes.join(", "),
        roles: [...policy.roles],
        actorTypes: [...policy.actorTypes],
        conditions: buildConditions(policy),
        flags: buildFlags(policy),
        status: "active",
      }),
    );

    return { policies, total: policies.length };
  }
}
