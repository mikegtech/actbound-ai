import {
  ActorRoleSchema,
  ActorTypeSchema,
  ConsentGrantStatusSchema,
  PermissionScopeSchema,
  ProviderConnectionStatusSchema,
  VaultConnectionStatusSchema,
  VaultSessionStatusSchema,
  createAuthorizationContext,
  type ActorRole,
  type ActorType,
  type ConsentGrantStatus,
  type PermissionScope,
  type ProviderConnectionStatus,
  type VaultConnectionStatus,
  type VaultSessionStatus,
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

function parseBooleanHeader(fallback: boolean, value?: string): boolean {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
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

function parseProviderConnectionStatus(
  fallback: ProviderConnectionStatus,
  value?: string,
): ProviderConnectionStatus {
  const result = ProviderConnectionStatusSchema.safeParse(value);
  return result.success ? result.data : fallback;
}

function parseVaultSessionStatus(
  fallback: VaultSessionStatus,
  value?: string,
): VaultSessionStatus {
  const result = VaultSessionStatusSchema.safeParse(value);
  return result.success ? result.data : fallback;
}

function deriveProviderConnectionStatus(
  consentStatus: ConsentGrantStatus,
): ProviderConnectionStatus {
  if (consentStatus === "granted") {
    return "connected";
  }

  if (consentStatus === "pending") {
    return "pending";
  }

  if (consentStatus === "revoked") {
    return "revoked";
  }

  return "missing";
}

function deriveVaultSessionStatus(
  providerConnectionStatus: ProviderConnectionStatus,
): VaultSessionStatus {
  return providerConnectionStatus === "connected" ? "active" : "missing";
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
    const providerConnectionStatus = parseProviderConnectionStatus(
      deriveProviderConnectionStatus(consentStatus),
      request.header("x-provider-connection-status"),
    );
    const vaultSessionStatus = parseVaultSessionStatus(
      deriveVaultSessionStatus(providerConnectionStatus),
      request.header("x-vault-session-status"),
    );
    const consentScopes = parseScopes(
      [
        "agent.preview",
        "agent.execute",
        "tokens.delegated",
        "sensitive.execute",
      ],
      request.header("x-consent-scopes"),
    );
    const vaultScopes = parseScopes(
      [
        "connections.read",
        "agent.preview",
        "agent.execute",
        "tokens.delegated",
        "sensitive.execute",
      ],
      request.header("x-vault-scopes") ?? request.header("x-token-scopes"),
    );
    const providerScopes = parseScopes(
      consentScopes,
      request.header("x-provider-scopes"),
    );
    const sessionScopes = parseScopes(
      consentScopes,
      request.header("x-vault-session-scopes"),
    );

    request.authContext = createAuthorizationContext({
      actor: {
        id: request.header("x-user-id") ?? "demo-user",
        type: parseActorType("user", request.header("x-actor-type")),
        roles: parseRoles(["operator"], request.header("x-user-roles")),
      },
      subject: {
        id: subjectId,
        type: "user",
      },
      consent: {
        grantId: request.header("x-consent-grant-id") ?? "cg_demo_001",
        status: consentStatus,
        scopes: consentScopes,
        ownerSubjectId: subjectId,
      },
      tokenVaultConnection: {
        connectionId:
          request.header("x-vault-connection-id") ?? "conn_demo_vault",
        provider: "auth0-token-vault",
        status: vaultConnectionStatus,
        scopes: vaultScopes,
        ownerSubjectId: subjectId,
      },
      providerConnection: {
        connectionId:
          request.header("x-provider-connection-id") ?? "conn_demo_salesforce",
        provider: request.header("x-provider-name") ?? "salesforce",
        accountLabel:
          request.header("x-provider-account-label") ?? "Acme Realty CRM",
        status: providerConnectionStatus,
        scopes: providerScopes,
        ownerSubjectId: subjectId,
      },
      vaultSession: {
        sessionId:
          request.header("x-vault-session-id") ?? "vault_session_demo_001",
        provider: request.header("x-provider-name") ?? "salesforce",
        tokenReference:
          request.header("x-vault-token-reference") ?? "vault_ref_demo_001",
        status: vaultSessionStatus,
        audience: request.header("x-token-audience") ?? "agent-service",
        scopes: sessionScopes,
        ownerSubjectId: subjectId,
      },
      attributes: {
        tenantId: request.header("x-tenant-id") ?? "demo-tenant",
        requestId: request.header("x-request-id") ?? undefined,
        tokenAudience: request.header("x-token-audience") ?? "agent-service",
        internalServiceCall: false,
        previewMode: false,
        stepUpSatisfied: parseBooleanHeader(
          false,
          request.header("x-step-up-satisfied"),
        ),
      },
    });

    // TODO: Replace header-derived delegated grant state with Auth0 delegated OAuth completion data.
    // TODO: Replace header-derived provider connection and vault session state with Auth0 Token Vault APIs.
    // TODO: Replace x-step-up-satisfied with a real step-up authentication assertion.
    next();
  }
}
