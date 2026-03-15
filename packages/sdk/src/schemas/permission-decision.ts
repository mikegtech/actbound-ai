import type { AuthorizationDecision } from "@actbound/authorization";
import {
  ActorRoleSchema,
  ActorTypeSchema,
  ConsentGrantStatusSchema,
  DecisionReasonCodeSchema,
  PermissionActionSchema,
  PermissionResourceSchema,
  PermissionSchema,
  PermissionScopeSchema,
  SubjectTypeSchema,
  VaultConnectionStatusSchema,
  type AuthorizationContext,
} from "@actbound/authorization";

import { z } from "../openapi/extend-zod";
import { TimestampSchema } from "./common";

export const PermissionReasonSchema = z
  .object({
    code: DecisionReasonCodeSchema,
    message: z.string(),
  })
  .openapi("PermissionReason");

export const PermissionContextSummarySchema = z
  .object({
    actor: z.object({
      id: z.string(),
      type: ActorTypeSchema,
      roles: z.array(ActorRoleSchema),
    }),
    subject: z.object({
      id: z.string(),
      type: SubjectTypeSchema,
    }),
    consent: z.object({
      grantId: z.string().optional(),
      status: ConsentGrantStatusSchema,
      scopes: z.array(PermissionScopeSchema),
    }),
    tokenVaultConnection: z.object({
      connectionId: z.string().optional(),
      provider: z.string().optional(),
      status: VaultConnectionStatusSchema,
      scopes: z.array(PermissionScopeSchema),
    }),
    attributes: z.object({
      tenantId: z.string(),
      requestId: z.string().optional(),
      tokenAudience: z.string().optional(),
      internalServiceCall: z.boolean(),
      previewMode: z.boolean(),
    }),
  })
  .openapi("PermissionContextSummary");

export const PermissionDecisionSchema = z
  .object({
    permission: PermissionSchema,
    resource: PermissionResourceSchema,
    action: PermissionActionSchema,
    resourceId: z.string().optional(),
    allowed: z.boolean(),
    reasons: z.array(PermissionReasonSchema),
    evaluatedAt: TimestampSchema,
    source: z.enum(["orchestrator", "agent-service", "authorization-package"]),
  })
  .openapi("PermissionDecision");

export const PermissionDecisionListSchema = z
  .object({
    context: PermissionContextSummarySchema,
    decisions: z.array(PermissionDecisionSchema),
  })
  .openapi("PermissionDecisionList");

export type PermissionReason = import("zod").infer<
  typeof PermissionReasonSchema
>;
export type PermissionContextSummary = import("zod").infer<
  typeof PermissionContextSummarySchema
>;
export type PermissionDecisionRecord = import("zod").infer<
  typeof PermissionDecisionSchema
>;

export function toPermissionDecisionRecord(
  decision: AuthorizationDecision,
  source: PermissionDecisionRecord["source"],
): PermissionDecisionRecord {
  return {
    ...decision,
    evaluatedAt: new Date().toISOString(),
    source,
  };
}

export function toPermissionContextSummary(
  context: AuthorizationContext,
): PermissionContextSummary {
  return {
    actor: {
      id: context.actor.id,
      type: context.actor.type,
      roles: context.actor.roles,
    },
    subject: {
      id: context.subject.id,
      type: context.subject.type,
    },
    consent: {
      grantId: context.consent.grantId,
      status: context.consent.status,
      scopes: context.consent.scopes,
    },
    tokenVaultConnection: {
      connectionId: context.tokenVaultConnection.connectionId,
      provider: context.tokenVaultConnection.provider,
      status: context.tokenVaultConnection.status,
      scopes: context.tokenVaultConnection.scopes,
    },
    attributes: {
      tenantId: context.attributes.tenantId,
      requestId: context.attributes.requestId,
      tokenAudience: context.attributes.tokenAudience,
      internalServiceCall: context.attributes.internalServiceCall,
      previewMode: context.attributes.previewMode,
    },
  };
}
