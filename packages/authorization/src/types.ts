import { z } from "zod";

import { PermissionSchema } from "./permissions";

export const ActorRoleSchema = z.enum([
  "admin",
  "operator",
  "viewer",
  "service",
]);

export type ActorRole = z.infer<typeof ActorRoleSchema>;

export const AuthorizationContextSchema = z.object({
  actorId: z.string(),
  tenantId: z.string().default("default"),
  roles: z.array(ActorRoleSchema).default(["viewer"]),
  consentScopes: z.array(z.string()).default([]),
  tokenScopes: z.array(z.string()).default([]),
  subjectId: z.string().optional(),
});

export type AuthorizationContext = z.infer<typeof AuthorizationContextSchema>;

export const AuthorizationDecisionSchema = z.object({
  permission: PermissionSchema,
  allowed: z.boolean(),
  reasons: z.array(z.string()),
});

export type AuthorizationDecision = z.infer<typeof AuthorizationDecisionSchema>;

export function createAuthorizationContext(
  context: Partial<AuthorizationContext> &
    Pick<AuthorizationContext, "actorId">,
): AuthorizationContext {
  return AuthorizationContextSchema.parse(context);
}
