import { z } from "zod";

import {
  PermissionActionSchema,
  PermissionResourceSchema,
  PermissionSchema,
  PermissionScopeSchema,
} from "./permissions";

export const ActorTypeSchema = z.enum(["user", "agent", "system"]);

export type ActorType = z.infer<typeof ActorTypeSchema>;

export const ActorRoleSchema = z.enum([
  "admin",
  "operator",
  "viewer",
  "service",
]);

export type ActorRole = z.infer<typeof ActorRoleSchema>;

export const SubjectTypeSchema = z.enum(["user", "workspace"]);

export type SubjectType = z.infer<typeof SubjectTypeSchema>;

export const GrantLifecycleStateSchema = z.enum([
  "missing",
  "pending",
  "granted",
  "revoked",
  "expired",
]);

export type GrantLifecycleState = z.infer<typeof GrantLifecycleStateSchema>;

export const ConsentGrantStatusSchema = GrantLifecycleStateSchema;

export type ConsentGrantStatus = z.infer<typeof ConsentGrantStatusSchema>;

export const VaultConnectionStatusSchema = z.enum([
  "missing",
  "connected",
  "disconnected",
  "error",
]);

export type VaultConnectionStatus = z.infer<typeof VaultConnectionStatusSchema>;

export const ProviderConnectionStatusSchema = z.enum([
  "missing",
  "pending",
  "connected",
  "revoked",
  "error",
]);

export type ProviderConnectionStatus = z.infer<
  typeof ProviderConnectionStatusSchema
>;

export const VaultSessionStatusSchema = z.enum([
  "missing",
  "active",
  "expired",
  "revoked",
]);

export type VaultSessionStatus = z.infer<typeof VaultSessionStatusSchema>;

export const SensitiveActionClassificationSchema = z.enum([
  "routine",
  "sensitive",
  "high_impact",
]);

export type SensitiveActionClassification = z.infer<
  typeof SensitiveActionClassificationSchema
>;

export const AuthorizationSubjectSchema = z.object({
  id: z.string(),
  type: SubjectTypeSchema.default("user"),
});

export type AuthorizationSubject = z.infer<typeof AuthorizationSubjectSchema>;

export const AuthorizationActorSchema = z.object({
  id: z.string(),
  type: ActorTypeSchema.default("user"),
  roles: z.array(ActorRoleSchema).default(["viewer"]),
});

export type AuthorizationActor = z.infer<typeof AuthorizationActorSchema>;

export const PermissionContextAttributesSchema = z.object({
  tenantId: z.string().default("default"),
  requestId: z.string().optional(),
  tokenAudience: z.string().optional(),
  internalServiceCall: z.boolean().default(false),
  previewMode: z.boolean().default(false),
  stepUpSatisfied: z.boolean().default(false),
});

export type PermissionContextAttributes = z.infer<
  typeof PermissionContextAttributesSchema
>;

export const ConsentGrantContextSchema = z.object({
  grantId: z.string().optional(),
  status: ConsentGrantStatusSchema.default("missing"),
  scopes: z.array(PermissionScopeSchema).default([]),
  ownerSubjectId: z.string().optional(),
});

export type ConsentGrantContext = z.infer<typeof ConsentGrantContextSchema>;

export const TokenVaultConnectionContextSchema = z.object({
  connectionId: z.string().optional(),
  provider: z.string().optional(),
  status: VaultConnectionStatusSchema.default("missing"),
  scopes: z.array(PermissionScopeSchema).default([]),
  ownerSubjectId: z.string().optional(),
});

export type TokenVaultConnectionContext = z.infer<
  typeof TokenVaultConnectionContextSchema
>;

export const ProviderConnectionContextSchema = z.object({
  connectionId: z.string().optional(),
  provider: z.string().optional(),
  accountLabel: z.string().optional(),
  status: ProviderConnectionStatusSchema.default("missing"),
  scopes: z.array(PermissionScopeSchema).default([]),
  ownerSubjectId: z.string().optional(),
});

export type ProviderConnectionContext = z.infer<
  typeof ProviderConnectionContextSchema
>;

export const VaultSessionContextSchema = z.object({
  sessionId: z.string().optional(),
  provider: z.string().optional(),
  tokenReference: z.string().optional(),
  status: VaultSessionStatusSchema.default("missing"),
  audience: z.string().optional(),
  scopes: z.array(PermissionScopeSchema).default([]),
  ownerSubjectId: z.string().optional(),
});

export type VaultSessionContext = z.infer<typeof VaultSessionContextSchema>;

export const PermissionResourceContextSchema = z.object({
  type: PermissionResourceSchema,
  id: z.string().optional(),
  ownerSubjectId: z.string().optional(),
  classification: SensitiveActionClassificationSchema.optional(),
});

export type PermissionResourceContext = z.infer<
  typeof PermissionResourceContextSchema
>;

export const AuthorizationContextSchema = z.object({
  actor: AuthorizationActorSchema,
  subject: AuthorizationSubjectSchema,
  consent: ConsentGrantContextSchema.default({
    status: "missing",
    scopes: [],
  }),
  tokenVaultConnection: TokenVaultConnectionContextSchema.default({
    status: "missing",
    scopes: [],
  }),
  providerConnection: ProviderConnectionContextSchema.default({
    status: "missing",
    scopes: [],
  }),
  vaultSession: VaultSessionContextSchema.default({
    status: "missing",
    scopes: [],
  }),
  attributes: PermissionContextAttributesSchema.default({
    tenantId: "default",
    internalServiceCall: false,
    previewMode: false,
    stepUpSatisfied: false,
  }),
});

export type AuthorizationContext = z.infer<typeof AuthorizationContextSchema>;

export const DecisionReasonCodeSchema = z.enum([
  "policy_allow",
  "authorization_context_missing",
  "actor_roles_missing",
  "actor_type_not_allowed",
  "role_grant_missing",
  "consent_grant_missing",
  "delegated_grant_pending",
  "consent_grant_revoked",
  "delegated_grant_expired",
  "consent_scope_missing",
  "vault_connection_missing",
  "vault_connection_unavailable",
  "vault_scope_missing",
  "provider_connection_missing",
  "provider_connection_inactive",
  "vault_session_missing",
  "vault_session_inactive",
  "step_up_required",
  "resource_owner_mismatch",
]);

export type DecisionReasonCode = z.infer<typeof DecisionReasonCodeSchema>;

export const AuthorizationDecisionReasonSchema = z.object({
  code: DecisionReasonCodeSchema,
  message: z.string(),
});

export type AuthorizationDecisionReason = z.infer<
  typeof AuthorizationDecisionReasonSchema
>;

export const AuthorizationDecisionSchema = z.object({
  permission: PermissionSchema,
  resource: PermissionResourceSchema,
  action: PermissionActionSchema,
  resourceId: z.string().optional(),
  allowed: z.boolean(),
  reasons: z.array(AuthorizationDecisionReasonSchema),
});

export type AuthorizationDecision = z.infer<typeof AuthorizationDecisionSchema>;

export function createAuthorizationContext(
  context: Partial<AuthorizationContext> & {
    actor: Pick<AuthorizationContext["actor"], "id">;
    subject: Pick<AuthorizationContext["subject"], "id">;
  },
): AuthorizationContext {
  return AuthorizationContextSchema.parse(context);
}

export function createDecisionReason(
  code: DecisionReasonCode,
  message: string,
): AuthorizationDecisionReason {
  return AuthorizationDecisionReasonSchema.parse({
    code,
    message,
  });
}
