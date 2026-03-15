import {
  ActorRoleSchema,
  createAuthorizationContext,
  type ActorRole,
} from "@actbound/authorization";
import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Response } from "express";

import type { RequestWithAuthContext } from "./request-context";

function parseListHeader(value?: string): string[] {
  return (
    value
      ?.split(",")
      .map((entry) => entry.trim())
      .filter(Boolean) ?? []
  );
}

function parseRoles(fallback: ActorRole[], value?: string): ActorRole[] {
  const parsed: ActorRole[] = [];

  for (const candidate of parseListHeader(value)) {
    const result = ActorRoleSchema.safeParse(candidate);

    if (result.success) {
      parsed.push(result.data);
    }
  }

  return parsed.length > 0 ? parsed : fallback;
}

@Injectable()
export class AuthorizationContextMiddleware implements NestMiddleware {
  use(
    request: RequestWithAuthContext,
    _response: Response,
    next: NextFunction,
  ) {
    const consentScopes = parseListHeader(request.header("x-consent-scopes"));
    const tokenScopes = parseListHeader(request.header("x-token-scopes"));

    request.authContext = createAuthorizationContext({
      actorId: request.header("x-user-id") ?? "demo-user",
      tenantId: request.header("x-tenant-id") ?? "demo-tenant",
      subjectId: request.header("x-subject-id") ?? "subject-demo",
      roles: parseRoles(["operator"], request.header("x-user-roles")),
      consentScopes:
        consentScopes.length > 0
          ? consentScopes
          : ["connections.read", "agent.preview", "agent.execute"],
      tokenScopes:
        tokenScopes.length > 0
          ? tokenScopes
          : ["connections.read", "agent.preview", "agent.execute"],
    });

    // TODO: Replace header-derived consent scopes with Auth0 Token Vault grant lookup.
    // TODO: Replace header-derived token scopes with an Auth0 Token Vault scoped token exchange.
    next();
  }
}
