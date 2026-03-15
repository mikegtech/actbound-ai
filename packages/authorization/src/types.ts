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

export const ConsentGrantStatusSchema = z.enum([
  "missing",
  "granted",
  "revoked",
]);

export type ConsentGrantStatus = z.infer<typeof ConsentGrantStatusSchema>;

export const VaultConnectionStatusSchema = z.enum([
  "missing",
  "connected",
  "disconnected",
  "error",
]);

export type VaultConnectionStatus = z.infer<typeof VaultConnectionStatusSchema>;

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

export const PermissionResourceContextSchema = z.object({
  type: PermissionResourceSchema,
  id: z.string().optional(),
  ownerSubjectId: z.string().optional(),
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
  attributes: PermissionContextAttributesSchema.default({
    tenantId: "default",
    internalServiceCall: false,
    previewMode: false,
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
  "consent_grant_revoked",
  "consent_scope_missing",
  "vault_connection_missing",
  "vault_connection_unavailable",
  "vault_scope_missing",
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
