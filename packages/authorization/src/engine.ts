import {
  ALL_PERMISSIONS,
  type Permission,
  type PermissionScope,
} from "./permissions";
import { permissionPolicies, type PermissionPolicy } from "./policies";
import {
  createDecisionReason,
  type AuthorizationContext,
  type AuthorizationDecision,
  type AuthorizationDecisionReason,
  type PermissionResourceContext,
} from "./types";

export type PolicyEvaluationInput = {
  context: AuthorizationContext;
  permission: Permission;
  resource?: PermissionResourceContext;
};

export interface PolicyEvaluator<TInput = PolicyEvaluationInput> {
  evaluate(input: TInput): AuthorizationDecision;
}

export interface AuthorizationPolicyEngine extends PolicyEvaluator {
  evaluateAllPermissions(
    context: AuthorizationContext,
  ): AuthorizationDecision[];
  evaluateBrokeredTokenRead(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision;
  evaluateTokenBrokerAccess(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision;
  evaluateTokenReuse(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision;
  evaluateDelegatedTokenUse(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision;
  evaluateTokenCacheInspection(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision;
  evaluateUserConsentPermission(
    context: AuthorizationContext,
    requiredScopes?: PermissionScope[],
  ): AuthorizationDecision;
  evaluateTokenVaultConnectionPermission(
    context: AuthorizationContext,
    requiredScopes?: PermissionScope[],
  ): AuthorizationDecision;
  evaluateAgentActionPreview(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision;
  evaluateAgentActionExecute(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision;
  evaluateAuditViewing(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision;
}

function uniqueReasons(
  reasons: AuthorizationDecisionReason[],
): AuthorizationDecisionReason[] {
  const seen = new Set<string>();
  return reasons.filter((reason) => {
    const key = `${reason.code}:${reason.message}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildAllowedDecision(
  permission: Permission,
  policy: PermissionPolicy,
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return {
    permission,
    resource: policy.resource,
    action: policy.action,
    resourceId: resource?.id,
    allowed: true,
    reasons: [
      createDecisionReason(
        "policy_allow",
        `Policy engine allows ${permission} for the current context.`,
      ),
    ],
  };
}

function buildDeniedDecision(
  permission: Permission,
  policy: PermissionPolicy,
  reasons: AuthorizationDecisionReason[],
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return {
    permission,
    resource: policy.resource,
    action: policy.action,
    resourceId: resource?.id,
    allowed: false,
    reasons: uniqueReasons(reasons),
  };
}

export class DefaultAuthorizationPolicyEngine implements AuthorizationPolicyEngine {
  private collectBasePolicyReasons(
    context: AuthorizationContext,
    permission: Permission,
    policy: PermissionPolicy,
    resource?: PermissionResourceContext,
  ): AuthorizationDecisionReason[] {
    const reasons: AuthorizationDecisionReason[] = [];

    if (context.actor.roles.length === 0) {
      reasons.push(
        createDecisionReason(
          "actor_roles_missing",
          "No actor roles were supplied in the permission context.",
        ),
      );
    }

    if (!policy.actorTypes.includes(context.actor.type)) {
      reasons.push(
        createDecisionReason(
          "actor_type_not_allowed",
          `${context.actor.type} actors cannot perform ${permission}.`,
        ),
      );
    }

    if (!context.actor.roles.some((role) => policy.roles.includes(role))) {
      reasons.push(
        createDecisionReason(
          "role_grant_missing",
          `Actor roles do not grant ${permission}.`,
        ),
      );
    }

    if (
      policy.requireSubjectOwnership &&
      resource?.ownerSubjectId &&
      resource.ownerSubjectId !== context.subject.id
    ) {
      reasons.push(
        createDecisionReason(
          "resource_owner_mismatch",
          "Requested resource belongs to a different subject.",
        ),
      );
    }

    return reasons;
  }

  private collectConsentReasons(
    context: AuthorizationContext,
    requiredScopes: PermissionScope[],
  ): AuthorizationDecisionReason[] {
    const reasons: AuthorizationDecisionReason[] = [];

    if (context.consent.status === "missing") {
      reasons.push(
        createDecisionReason(
          "consent_grant_missing",
          "No delegated consent grant is available for this subject.",
        ),
      );
    }

    if (context.consent.status === "revoked") {
      reasons.push(
        createDecisionReason(
          "consent_grant_revoked",
          "The delegated consent grant has been revoked.",
        ),
      );
    }

    if (
      context.consent.ownerSubjectId &&
      context.consent.ownerSubjectId !== context.subject.id
    ) {
      reasons.push(
        createDecisionReason(
          "resource_owner_mismatch",
          "The delegated consent grant belongs to a different subject.",
        ),
      );
    }

    const missingScopes = requiredScopes.filter(
      (scope) => !context.consent.scopes.includes(scope),
    );

    if (missingScopes.length > 0) {
      reasons.push(
        createDecisionReason(
          "consent_scope_missing",
          `Delegated consent is missing required scopes: ${missingScopes.join(", ")}.`,
        ),
      );
    }

    return reasons;
  }

  private collectVaultConnectionReasons(
    context: AuthorizationContext,
    requiredScopes: PermissionScope[],
  ): AuthorizationDecisionReason[] {
    const reasons: AuthorizationDecisionReason[] = [];

    if (context.tokenVaultConnection.status === "missing") {
      reasons.push(
        createDecisionReason(
          "vault_connection_missing",
          "No Token Vault connection is available for this subject.",
        ),
      );
    }

    if (
      context.tokenVaultConnection.status === "disconnected" ||
      context.tokenVaultConnection.status === "error"
    ) {
      reasons.push(
        createDecisionReason(
          "vault_connection_unavailable",
          "The Token Vault connection is not currently usable.",
        ),
      );
    }

    if (
      context.tokenVaultConnection.ownerSubjectId &&
      context.tokenVaultConnection.ownerSubjectId !== context.subject.id
    ) {
      reasons.push(
        createDecisionReason(
          "resource_owner_mismatch",
          "The Token Vault connection belongs to a different subject.",
        ),
      );
    }

    const missingScopes = requiredScopes.filter(
      (scope) => !context.tokenVaultConnection.scopes.includes(scope),
    );

    if (missingScopes.length > 0) {
      reasons.push(
        createDecisionReason(
          "vault_scope_missing",
          `The Token Vault connection is missing required scopes: ${missingScopes.join(", ")}.`,
        ),
      );
    }

    return reasons;
  }

  evaluate(input: PolicyEvaluationInput): AuthorizationDecision {
    return this.evaluatePermission(
      input.context,
      input.permission,
      input.resource,
    );
  }

  evaluatePermission(
    context: AuthorizationContext,
    permission: Permission,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision {
    const policy = permissionPolicies[permission];
    const reasons = this.collectBasePolicyReasons(
      context,
      permission,
      policy,
      resource,
    );

    if (policy.requiresConsent) {
      reasons.push(
        ...this.collectConsentReasons(
          context,
          policy.requiredConsentScopes ?? [],
        ),
      );
    }

    if (policy.requiresTokenVaultConnection) {
      reasons.push(
        ...this.collectVaultConnectionReasons(
          context,
          policy.requiredVaultScopes ?? [],
        ),
      );
    }

    return reasons.length === 0
      ? buildAllowedDecision(permission, policy, resource)
      : buildDeniedDecision(permission, policy, reasons, resource);
  }

  evaluateAllPermissions(
    context: AuthorizationContext,
  ): AuthorizationDecision[] {
    return ALL_PERMISSIONS.map((permission) =>
      this.evaluatePermission(context, permission),
    );
  }

  evaluateBrokeredTokenRead(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision {
    return this.evaluatePermission(
      context,
      "brokered_tokens:read",
      resource ?? {
        type: "brokered_token",
      },
    );
  }

  evaluateTokenBrokerAccess(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision {
    return this.evaluatePermission(
      context,
      "brokered_tokens:broker",
      resource ?? {
        type: "brokered_token",
      },
    );
  }

  evaluateTokenReuse(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision {
    return this.evaluatePermission(
      context,
      "brokered_tokens:reuse",
      resource ?? {
        type: "brokered_token",
      },
    );
  }

  evaluateDelegatedTokenUse(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision {
    return this.evaluatePermission(
      context,
      "delegated_tokens:use",
      resource ?? {
        type: "delegated_token",
      },
    );
  }

  evaluateTokenCacheInspection(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision {
    return this.evaluatePermission(
      context,
      "token_cache:inspect",
      resource ?? {
        type: "token_cache",
      },
    );
  }

  evaluateUserConsentPermission(
    context: AuthorizationContext,
    requiredScopes: PermissionScope[] = [],
  ): AuthorizationDecision {
    const policy = permissionPolicies["consent_grants:use"];
    const resource: PermissionResourceContext = {
      type: "consent_grant",
      id: context.consent.grantId,
      ownerSubjectId: context.consent.ownerSubjectId,
    };
    const reasons = this.collectBasePolicyReasons(
      context,
      "consent_grants:use",
      policy,
      resource,
    );

    reasons.push(...this.collectConsentReasons(context, requiredScopes));

    return reasons.length === 0
      ? buildAllowedDecision("consent_grants:use", policy, resource)
      : buildDeniedDecision("consent_grants:use", policy, reasons, resource);
  }

  evaluateTokenVaultConnectionPermission(
    context: AuthorizationContext,
    requiredScopes: PermissionScope[] = [],
  ): AuthorizationDecision {
    const policy = permissionPolicies["vault_connections:use"];
    const resource: PermissionResourceContext = {
      type: "vault_connection",
      id: context.tokenVaultConnection.connectionId,
      ownerSubjectId: context.tokenVaultConnection.ownerSubjectId,
    };
    const reasons = this.collectBasePolicyReasons(
      context,
      "vault_connections:use",
      policy,
      resource,
    );

    reasons.push(
      ...this.collectVaultConnectionReasons(context, requiredScopes),
    );

    return reasons.length === 0
      ? buildAllowedDecision("vault_connections:use", policy, resource)
      : buildDeniedDecision("vault_connections:use", policy, reasons, resource);
  }

  evaluateAgentActionPreview(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision {
    return this.evaluatePermission(
      context,
      "agent_actions:preview",
      resource ?? {
        type: "agent_action",
      },
    );
  }

  evaluateAgentActionExecute(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision {
    return this.evaluatePermission(
      context,
      "agent_actions:execute",
      resource ?? {
        type: "agent_action",
      },
    );
  }

  evaluateAuditViewing(
    context: AuthorizationContext,
    resource?: PermissionResourceContext,
  ): AuthorizationDecision {
    return this.evaluatePermission(
      context,
      "audit_events:read",
      resource ?? {
        type: "audit_event",
      },
    );
  }
}

export const policyEngine = new DefaultAuthorizationPolicyEngine();

export function evaluatePermission(
  context: AuthorizationContext,
  permission: Permission,
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return policyEngine.evaluatePermission(context, permission, resource);
}

export function evaluateAllPermissions(
  context: AuthorizationContext,
): AuthorizationDecision[] {
  return policyEngine.evaluateAllPermissions(context);
}

export function evaluateBrokeredTokenRead(
  context: AuthorizationContext,
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return policyEngine.evaluateBrokeredTokenRead(context, resource);
}

export function evaluateTokenBrokerAccess(
  context: AuthorizationContext,
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return policyEngine.evaluateTokenBrokerAccess(context, resource);
}

export function evaluateTokenReuse(
  context: AuthorizationContext,
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return policyEngine.evaluateTokenReuse(context, resource);
}

export function evaluateDelegatedTokenUse(
  context: AuthorizationContext,
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return policyEngine.evaluateDelegatedTokenUse(context, resource);
}

export function evaluateTokenCacheInspection(
  context: AuthorizationContext,
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return policyEngine.evaluateTokenCacheInspection(context, resource);
}

export function evaluateUserConsentPermission(
  context: AuthorizationContext,
  requiredScopes?: PermissionScope[],
): AuthorizationDecision {
  return policyEngine.evaluateUserConsentPermission(context, requiredScopes);
}

export function evaluateTokenVaultConnectionPermission(
  context: AuthorizationContext,
  requiredScopes?: PermissionScope[],
): AuthorizationDecision {
  return policyEngine.evaluateTokenVaultConnectionPermission(
    context,
    requiredScopes,
  );
}

export function evaluateAgentActionPreview(
  context: AuthorizationContext,
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return policyEngine.evaluateAgentActionPreview(context, resource);
}

export function evaluateAgentActionExecute(
  context: AuthorizationContext,
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return policyEngine.evaluateAgentActionExecute(context, resource);
}

export function evaluateAuditViewing(
  context: AuthorizationContext,
  resource?: PermissionResourceContext,
): AuthorizationDecision {
  return policyEngine.evaluateAuditViewing(context, resource);
}
