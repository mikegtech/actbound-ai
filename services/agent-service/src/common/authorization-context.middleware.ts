import {
  ActorTypeSchema,
  ActorRoleSchema,
  ConsentGrantStatusSchema,
  PermissionScopeSchema,
  VaultConnectionStatusSchema,
  createAuthorizationContext,
  type ConsentGrantStatus,
  type ActorType,
  type ActorRole,
  type PermissionScope,
  type VaultConnectionStatus,
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

function parseScopes(
  fallback: PermissionScope[],
  value?: string,
): PermissionScope[] {
  const parsed: PermissionScope[] = [];

  for (const candidate of parseListHeader(value)) {
    const result = PermissionScopeSchema.safeParse(candidate);

    if (result.success) {
      parsed.push(result.data);
    }
  }

  return parsed.length > 0 ? parsed : fallback;
}

function parseActorType(fallback: ActorType, value?: string): ActorType {
  const result = ActorTypeSchema.safeParse(value);
  return result.success ? result.data : fallback;
}

function parseConsentStatus(
  fallback: ConsentGrantStatus,
  value?: string,
): ConsentGrantStatus {
  const result = ConsentGrantStatusSchema.safeParse(value);
  return result.success ? result.data : fallback;
}

function parseVaultConnectionStatus(
  fallback: VaultConnectionStatus,
  value?: string,
): VaultConnectionStatus {
  const result = VaultConnectionStatusSchema.safeParse(value);
  return result.success ? result.data : fallback;
}

@Injectable()
export class AuthorizationContextMiddleware implements NestMiddleware {
  use(
    request: RequestWithAuthContext,
    _response: Response,
    next: NextFunction,
  ) {
    const subjectId = request.header("x-subject-id") ?? "subject-demo";
    const consentStatus = parseConsentStatus(
      "granted",
      request.header("x-consent-status"),
    );
    const vaultConnectionStatus = parseVaultConnectionStatus(
      "connected",
      request.header("x-vault-connection-status"),
    );

    request.authContext = createAuthorizationContext({
      actor: {
        id: request.header("x-user-id") ?? "orchestrator-service",
        type: parseActorType("system", request.header("x-actor-type")),
        roles: parseRoles(["service"], request.header("x-user-roles")),
      },
      subject: {
        id: subjectId,
        type: "user",
      },
      consent: {
        grantId: request.header("x-consent-grant-id") ?? undefined,
        status: consentStatus,
        scopes: parseScopes(
          ["agent.execute"],
          request.header("x-consent-scopes"),
        ),
        ownerSubjectId: subjectId,
      },
      tokenVaultConnection: {
        connectionId:
          request.header("x-vault-connection-id") ?? "svc_scoped_token",
        provider: "auth0-token-vault",
        status: vaultConnectionStatus,
        scopes: parseScopes(
          ["valuations.execute"],
          request.header("x-vault-scopes") ?? request.header("x-token-scopes"),
        ),
        ownerSubjectId: subjectId,
      },
      attributes: {
        tenantId: request.header("x-tenant-id") ?? "demo-tenant",
        requestId: request.header("x-request-id") ?? undefined,
        tokenAudience: request.header("x-token-audience") ?? "agent-service",
        internalServiceCall: true,
        previewMode: false,
        stepUpSatisfied: true,
      },
    });

    next();
  }
}
