import {
  GrantLifecycleStateSchema,
  PermissionScopeSchema,
  ProviderConnectionStatusSchema,
  SensitiveActionClassificationSchema,
  VaultSessionStatusSchema,
} from "@actbound/authorization";

import { z } from "../openapi/extend-zod";
import { TimestampSchema } from "./common";
import { PermissionDecisionSchema } from "./permission-decision";

export const GrantScopeSchema = z
  .enum(PermissionScopeSchema.options)
  .openapi("GrantScope");

export const ProviderConnectionSchema = z
  .object({
    id: z.string(),
    provider: z.string(),
    accountId: z.string(),
    accountLabel: z.string(),
    status: ProviderConnectionStatusSchema,
    grantedScopes: z.array(GrantScopeSchema),
    grantLifecycleState: GrantLifecycleStateSchema,
    connectedAt: TimestampSchema.optional(),
    lastSyncedAt: TimestampSchema.optional(),
    stepUpRequired: z.boolean().default(false),
  })
  .openapi("ProviderConnection");

export const ProviderConnectionListSchema = z
  .object({
    connections: z.array(ProviderConnectionSchema),
  })
  .openapi("ProviderConnectionList");

export const DelegatedGrantSchema = z
  .object({
    id: z.string(),
    provider: z.string(),
    subjectId: z.string(),
    connectionId: z.string(),
    scopes: z.array(GrantScopeSchema),
    lifecycleState: GrantLifecycleStateSchema,
    grantedAt: TimestampSchema.optional(),
    expiresAt: TimestampSchema.optional(),
    revokedAt: TimestampSchema.optional(),
    stepUpRequired: z.boolean().default(false),
    sensitiveActionClassification:
      SensitiveActionClassificationSchema.default("routine"),
  })
  .openapi("DelegatedGrant");

export const ConsentSummarySchema = z
  .object({
    id: z.string(),
    provider: z.string(),
    subjectId: z.string(),
    connectionId: z.string(),
    status: GrantLifecycleStateSchema,
    scopes: z.array(GrantScopeSchema),
    updatedAt: TimestampSchema,
    stepUpRequired: z.boolean().default(false),
    sensitiveActionClassification:
      SensitiveActionClassificationSchema.default("routine"),
    summary: z.string(),
  })
  .openapi("ConsentSummary");

export const ConsentSummaryListSchema = z
  .object({
    consents: z.array(ConsentSummarySchema),
  })
  .openapi("ConsentSummaryList");

export const VaultSessionSourceSchema = z
  .enum(["delegated-placeholder", "auth0-token-vault"])
  .openapi("VaultSessionSource");

export const VaultSessionSchema = z
  .object({
    id: z.string(),
    provider: z.string(),
    connectionId: z.string(),
    tokenReference: z.string(),
    status: VaultSessionStatusSchema,
    audience: z.string(),
    scopes: z.array(GrantScopeSchema),
    source: VaultSessionSourceSchema.default("delegated-placeholder"),
    issuedAt: TimestampSchema.optional(),
    expiresAt: TimestampSchema.optional(),
    stepUpRequired: z.boolean().default(false),
  })
  .openapi("VaultSession");

export const VaultSessionListSchema = z
  .object({
    sessions: z.array(VaultSessionSchema),
  })
  .openapi("VaultSessionList");

export const RevocationIntentSchema = z
  .object({
    reason: z.string().min(1),
    revokeGrants: z.boolean().default(true),
  })
  .openapi("RevocationIntent");

export const ConnectionIdParamsSchema = z
  .object({
    id: z.string(),
  })
  .openapi("ConnectionIdParams");

export const ConnectProviderRequestSchema = z
  .object({
    provider: z.string(),
    accountLabel: z.string(),
    requestedScopes: z.array(GrantScopeSchema),
    purpose: z
      .string()
      .default("Connect a delegated provider for ActBound AI."),
    sensitiveActionClassification:
      SensitiveActionClassificationSchema.default("routine"),
  })
  .openapi("ConnectProviderRequest");

export const ConnectProviderResultSchema = z
  .object({
    connection: ProviderConnectionSchema,
    consent: ConsentSummarySchema,
    permissionDecision: PermissionDecisionSchema,
    summary: z.string(),
    todos: z.array(z.string()).default([]),
  })
  .openapi("ConnectProviderResult");

export const RevokeConnectionResultSchema = z
  .object({
    connectionId: z.string(),
    status: z.literal("revoked"),
    permissionDecision: PermissionDecisionSchema,
    summary: z.string(),
    revokedAt: TimestampSchema,
    todos: z.array(z.string()).default([]),
  })
  .openapi("RevokeConnectionResult");

export const ConsentPreviewRequestSchema = z
  .object({
    provider: z.string(),
    connectionId: z.string().optional(),
    requestedScopes: z.array(GrantScopeSchema),
    actionLabel: z.string(),
    sensitiveActionClassification:
      SensitiveActionClassificationSchema.default("sensitive"),
  })
  .openapi("ConsentPreviewRequest");

export const ConsentPreviewResultSchema = z
  .object({
    previewId: z.string(),
    summary: z.string(),
    consent: ConsentSummarySchema,
    permissionDecision: PermissionDecisionSchema,
    sensitiveActionDecision: PermissionDecisionSchema.optional(),
    stepUpRequired: z.boolean(),
    todos: z.array(z.string()).default([]),
  })
  .openapi("ConsentPreviewResult");

export type GrantScope = import("zod").infer<typeof GrantScopeSchema>;
export type ProviderConnection = import("zod").infer<
  typeof ProviderConnectionSchema
>;
export type ProviderConnectionList = import("zod").infer<
  typeof ProviderConnectionListSchema
>;
export type DelegatedGrant = import("zod").infer<typeof DelegatedGrantSchema>;
export type ConsentSummary = import("zod").infer<typeof ConsentSummarySchema>;
export type ConsentSummaryList = import("zod").infer<
  typeof ConsentSummaryListSchema
>;
export type VaultSessionSource = import("zod").infer<
  typeof VaultSessionSourceSchema
>;
export type VaultSession = import("zod").infer<typeof VaultSessionSchema>;
export type VaultSessionList = import("zod").infer<
  typeof VaultSessionListSchema
>;
export type RevocationIntent = import("zod").infer<
  typeof RevocationIntentSchema
>;
export type ConnectionIdParams = import("zod").infer<
  typeof ConnectionIdParamsSchema
>;
export type ConnectProviderRequest = import("zod").infer<
  typeof ConnectProviderRequestSchema
>;
export type ConnectProviderResult = import("zod").infer<
  typeof ConnectProviderResultSchema
>;
export type RevokeConnectionResult = import("zod").infer<
  typeof RevokeConnectionResultSchema
>;
export type ConsentPreviewRequest = import("zod").infer<
  typeof ConsentPreviewRequestSchema
>;
export type ConsentPreviewResult = import("zod").infer<
  typeof ConsentPreviewResultSchema
>;
