import {
  createAuthorizationContext,
  evaluateDelegatedGrantPreview,
  evaluateDelegatedGrantRead,
  evaluateProviderConnectionConnect,
  evaluateProviderConnectionRead,
  evaluateProviderConnectionRevoke,
  evaluateSensitiveActionExecution,
  evaluateVaultSessionRead,
  type AuthorizationContext,
  type AuthorizationDecision,
} from "@actbound/authorization";
import {
  ConnectProviderResultSchema,
  ConsentPreviewResultSchema,
  ConsentSummaryListSchema,
  ProviderConnectionListSchema,
  RevokeConnectionResultSchema,
  VaultSessionListSchema,
  toPermissionDecisionRecord,
  type ConnectProviderRequest,
  type ConnectProviderResult,
  type ConsentPreviewRequest,
  type ConsentPreviewResult,
  type ConsentSummary,
  type ProviderConnection,
  type RevocationIntent,
  type RevokeConnectionResult,
  type ScopedTokenRequest,
  type VaultSession,
} from "@actbound/sdk";
import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { DelegatedAccessSnapshotStore } from "../../domain/delegated-access/delegated-access-snapshot.store";

export type DelegatedTokenFoundation = {
  connection?: ProviderConnection;
  consent?: ConsentSummary;
  vaultSession?: VaultSession;
  authorizationContext: AuthorizationContext;
  stepUpRequired: boolean;
};

type ConnectProviderOutcome = {
  decision: AuthorizationDecision;
  result?: ConnectProviderResult;
};

type RevokeConnectionOutcome = {
  decision: AuthorizationDecision;
  result?: RevokeConnectionResult;
};

@Injectable()
export class DelegatedAccessService {
  private readonly logger = new Logger(DelegatedAccessService.name);

  constructor(private readonly snapshotStore: DelegatedAccessSnapshotStore) {}

  getConnections(context: AuthorizationContext) {
    const decision = this.evaluateConnectionRead(context);
    return {
      decision,
      data: ProviderConnectionListSchema.parse({
        connections: this.ensureSnapshot(context).connections,
      }),
    };
  }

  connectProvider(
    context: AuthorizationContext,
    request: ConnectProviderRequest,
  ): ConnectProviderOutcome {
    const decision = evaluateProviderConnectionConnect(context, {
      type: "provider_connection",
      ownerSubjectId: context.subject.id,
    });

    if (!decision.allowed) {
      return {
        decision,
      };
    }

    const snapshot = this.ensureSnapshot(context);
    const timestamp = new Date().toISOString();
    const connectionId = `conn_${request.provider}_${context.subject.id}`;
    const connection: ProviderConnection = {
      id: connectionId,
      provider: request.provider,
      accountId: `acct_${request.provider}_${context.subject.id}`,
      accountLabel: request.accountLabel,
      status: "connected",
      grantedScopes: request.requestedScopes,
      grantLifecycleState: "granted",
      connectedAt: timestamp,
      lastSyncedAt: timestamp,
      stepUpRequired:
        request.sensitiveActionClassification !== "routine" &&
        !context.attributes.stepUpSatisfied,
    };
    const consent = this.buildConsentSummary({
      id: `consent_${request.provider}_${context.subject.id}`,
      provider: request.provider,
      subjectId: context.subject.id,
      connectionId,
      status: "granted",
      scopes: request.requestedScopes,
      updatedAt: timestamp,
      stepUpRequired: connection.stepUpRequired,
      sensitiveActionClassification: request.sensitiveActionClassification,
      summary:
        "Delegated access is connected in placeholder mode until Auth0 delegated OAuth completion is wired.",
    });
    const session = this.buildVaultSession({
      id: `vault_session_${request.provider}_${context.subject.id}`,
      provider: request.provider,
      connectionId,
      tokenReference: `vault_ref_${request.provider}_${context.subject.id}`,
      status: "active",
      audience: context.attributes.tokenAudience ?? "agent-service",
      scopes: request.requestedScopes,
      source: "delegated-placeholder",
      issuedAt: timestamp,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      stepUpRequired: connection.stepUpRequired,
    });

    snapshot.connections = [
      connection,
      ...snapshot.connections.filter(
        (candidate) => candidate.id !== connection.id,
      ),
    ];
    snapshot.consents = [
      consent,
      ...snapshot.consents.filter((candidate) => candidate.id !== consent.id),
    ];
    snapshot.sessions = [
      session,
      ...snapshot.sessions.filter((candidate) => candidate.id !== session.id),
    ];
    this.snapshotStore.set(context.subject.id, snapshot);

    this.logger.log(
      `delegated-access connect provider=${request.provider} subject=${context.subject.id}`,
    );

    return {
      decision,
      result: ConnectProviderResultSchema.parse({
        connection,
        consent,
        permissionDecision: toPermissionDecisionRecord(
          decision,
          "orchestrator",
        ),
        summary:
          "Provider connection placeholder created. Replace this path with Auth0 delegated OAuth completion and Token Vault APIs later.",
        todos: [
          "TODO: Complete delegated OAuth via Auth0 before persisting a real connection.",
          "TODO: Store the resulting delegated account in Auth0 Token Vault.",
        ],
      }),
    };
  }

  revokeConnection(
    context: AuthorizationContext,
    connectionId: string,
    intent: RevocationIntent,
  ): RevokeConnectionOutcome {
    const decision = evaluateProviderConnectionRevoke(context, {
      type: "provider_connection",
      id: connectionId,
      ownerSubjectId: context.subject.id,
    });

    if (!decision.allowed) {
      return {
        decision,
      };
    }

    const snapshot = this.ensureSnapshot(context);
    const revokedAt = new Date().toISOString();

    snapshot.connections = snapshot.connections.map((connection) =>
      connection.id === connectionId
        ? {
            ...connection,
            status: "revoked",
            grantLifecycleState: "revoked",
            lastSyncedAt: revokedAt,
          }
        : connection,
    );
    snapshot.consents = snapshot.consents.map((consent) =>
      consent.connectionId === connectionId && intent.revokeGrants
        ? {
            ...consent,
            status: "revoked",
            updatedAt: revokedAt,
            summary: `Revoked in placeholder mode: ${intent.reason}`,
          }
        : consent,
    );
    snapshot.sessions = snapshot.sessions.map((session) =>
      session.connectionId === connectionId
        ? {
            ...session,
            status: "revoked",
            expiresAt: revokedAt,
          }
        : session,
    );
    this.snapshotStore.set(context.subject.id, snapshot);

    this.logger.log(
      `delegated-access revoke connection=${connectionId} subject=${context.subject.id}`,
    );

    return {
      decision,
      result: RevokeConnectionResultSchema.parse({
        connectionId,
        status: "revoked",
        permissionDecision: toPermissionDecisionRecord(
          decision,
          "orchestrator",
        ),
        summary:
          "Connection revocation placeholder recorded. Replace this path with Auth0 Token Vault revocation APIs later.",
        revokedAt,
        todos: [
          "TODO: Revoke delegated grants through Auth0 and the upstream provider.",
          "TODO: Expire cached delegated vault sessions after revocation.",
        ],
      }),
    };
  }

  getConsents(context: AuthorizationContext) {
    const decision = evaluateDelegatedGrantRead(context, {
      type: "delegated_grant",
      id: context.consent.grantId,
      ownerSubjectId: context.subject.id,
    });

    return {
      decision,
      data: ConsentSummaryListSchema.parse({
        consents: this.ensureSnapshot(context).consents,
      }),
    };
  }

  previewConsent(
    context: AuthorizationContext,
    request: ConsentPreviewRequest,
  ): ConsentPreviewResult {
    const resolved = this.resolveDelegatedTokenFoundation(context, {
      audience: context.attributes.tokenAudience ?? "agent-service",
      scopes: request.requestedScopes,
      connectionId: request.connectionId,
      consentGrantId: context.consent.grantId,
      sensitiveActionClassification: request.sensitiveActionClassification,
    });
    const previewDecision = evaluateDelegatedGrantPreview(
      resolved.authorizationContext,
      {
        type: "consent_record",
        id:
          resolved.consent?.id ??
          request.connectionId ??
          resolved.authorizationContext.consent.grantId,
        ownerSubjectId: context.subject.id,
      },
    );
    const sensitiveActionDecision = evaluateSensitiveActionExecution(
      resolved.authorizationContext,
      {
        type: "sensitive_action",
        id: request.actionLabel,
        ownerSubjectId: context.subject.id,
        classification: request.sensitiveActionClassification,
      },
    );
    const stepUpRequired = sensitiveActionDecision.reasons.some(
      (reason) => reason.code === "step_up_required",
    );
    const consent = this.buildConsentSummary({
      id:
        resolved.consent?.id ??
        resolved.authorizationContext.consent.grantId ??
        `consent_preview_${context.subject.id}`,
      provider: request.provider,
      subjectId: context.subject.id,
      connectionId:
        request.connectionId ??
        resolved.connection?.id ??
        "connection-pending-preview",
      status: resolved.authorizationContext.consent.status,
      scopes: request.requestedScopes,
      updatedAt: new Date().toISOString(),
      stepUpRequired,
      sensitiveActionClassification: request.sensitiveActionClassification,
      summary: stepUpRequired
        ? `${request.actionLabel} would require step-up before delegated execution can proceed.`
        : `${request.actionLabel} can use delegated access once the connection and grant remain active.`,
    });

    return ConsentPreviewResultSchema.parse({
      previewId: `consent_preview_${randomUUID()}`,
      summary: stepUpRequired
        ? "Delegated consent preview completed. Step-up would be required for this sensitive action."
        : "Delegated consent preview completed. No additional step-up is required for the current context.",
      consent,
      permissionDecision: toPermissionDecisionRecord(
        previewDecision,
        "orchestrator",
      ),
      sensitiveActionDecision: toPermissionDecisionRecord(
        sensitiveActionDecision,
        "orchestrator",
      ),
      stepUpRequired,
      todos: [
        "TODO: Replace preview-only lifecycle data with Auth0 Token Vault delegated grant state.",
        "TODO: Trigger real step-up authentication when sensitive actions move past placeholder mode.",
      ],
    });
  }

  getVaultSessions(context: AuthorizationContext) {
    const decision = evaluateVaultSessionRead(context, {
      type: "vault_session",
      id: context.vaultSession.sessionId,
      ownerSubjectId: context.subject.id,
    });

    return {
      decision,
      data: VaultSessionListSchema.parse({
        sessions: this.ensureSnapshot(context).sessions,
      }),
    };
  }

  resolveDelegatedTokenFoundation(
    context: AuthorizationContext,
    request: Pick<
      ScopedTokenRequest,
      | "audience"
      | "connectionId"
      | "consentGrantId"
      | "scopes"
      | "sensitiveActionClassification"
    >,
  ): DelegatedTokenFoundation {
    const snapshot = this.ensureSnapshot(context);
    const connection =
      snapshot.connections.find(
        (candidate) => candidate.id === request.connectionId,
      ) ?? snapshot.connections[0];
    const consent =
      snapshot.consents.find(
        (candidate) =>
          candidate.id === request.consentGrantId ||
          candidate.connectionId === connection?.id,
      ) ?? snapshot.consents[0];
    const vaultSession =
      snapshot.sessions.find(
        (candidate) => candidate.connectionId === connection?.id,
      ) ?? snapshot.sessions[0];
    const authorizationContext = createAuthorizationContext({
      actor: context.actor,
      subject: context.subject,
      consent: {
        grantId: consent?.id,
        status: consent?.status ?? "missing",
        scopes: consent?.scopes ?? context.consent.scopes,
        ownerSubjectId: context.subject.id,
      },
      tokenVaultConnection: {
        connectionId:
          context.tokenVaultConnection.connectionId ?? "conn_demo_vault",
        provider: context.tokenVaultConnection.provider ?? "auth0-token-vault",
        status:
          vaultSession?.status === "active"
            ? "connected"
            : context.tokenVaultConnection.status,
        scopes: vaultSession?.scopes ?? context.tokenVaultConnection.scopes,
        ownerSubjectId: context.subject.id,
      },
      providerConnection: {
        connectionId: connection?.id,
        provider: connection?.provider,
        accountLabel: connection?.accountLabel,
        status: connection?.status ?? "missing",
        scopes: connection?.grantedScopes ?? [],
        ownerSubjectId: context.subject.id,
      },
      vaultSession: {
        sessionId: vaultSession?.id,
        provider: vaultSession?.provider,
        tokenReference: vaultSession?.tokenReference,
        status: vaultSession?.status ?? "missing",
        audience: request.audience,
        scopes: vaultSession?.scopes ?? context.vaultSession.scopes,
        ownerSubjectId: context.subject.id,
      },
      attributes: context.attributes,
    });
    const stepUpRequired =
      request.sensitiveActionClassification !== undefined &&
      request.sensitiveActionClassification !== "routine" &&
      !authorizationContext.attributes.stepUpSatisfied;

    // TODO: Replace placeholder provider connection selection with Auth0 Token Vault account lookup.
    // TODO: Replace placeholder vault session references with Auth0 Token Vault delegated token handles.
    return {
      connection,
      consent,
      vaultSession,
      authorizationContext,
      stepUpRequired,
    };
  }

  private evaluateConnectionRead(context: AuthorizationContext) {
    return evaluateProviderConnectionRead(context, {
      type: "provider_connection",
      id: context.providerConnection.connectionId,
      ownerSubjectId: context.subject.id,
    });
  }

  private ensureSnapshot(context: AuthorizationContext) {
    const existing = this.snapshotStore.get(context.subject.id);

    if (existing) {
      return existing;
    }

    const snapshot = this.createDefaultSnapshot(context);
    this.snapshotStore.set(context.subject.id, snapshot);
    return snapshot;
  }

  private createDefaultSnapshot(context: AuthorizationContext) {
    const timestamp = new Date().toISOString();
    const connection =
      context.providerConnection.status === "missing"
        ? undefined
        : {
            id:
              context.providerConnection.connectionId ?? "conn_demo_salesforce",
            provider: context.providerConnection.provider ?? "salesforce",
            accountId: `acct_${context.subject.id}`,
            accountLabel:
              context.providerConnection.accountLabel ?? "Acme Realty CRM",
            status: context.providerConnection.status,
            grantedScopes: context.providerConnection.scopes,
            grantLifecycleState: context.consent.status,
            connectedAt: timestamp,
            lastSyncedAt: timestamp,
            stepUpRequired: false,
          };
    const consent =
      context.consent.status === "missing"
        ? undefined
        : this.buildConsentSummary({
            id: context.consent.grantId ?? "cg_demo_001",
            provider: context.providerConnection.provider ?? "salesforce",
            subjectId: context.subject.id,
            connectionId: connection?.id ?? "connection-pending-preview",
            status: context.consent.status,
            scopes: context.consent.scopes,
            updatedAt: timestamp,
            stepUpRequired: false,
            sensitiveActionClassification: "routine",
            summary: "Delegated consent is available for the current subject.",
          });
    const session =
      context.vaultSession.status === "missing"
        ? undefined
        : this.buildVaultSession({
            id: context.vaultSession.sessionId ?? "vault_session_demo_001",
            provider: context.vaultSession.provider ?? "salesforce",
            connectionId: connection?.id ?? "connection-pending-preview",
            tokenReference:
              context.vaultSession.tokenReference ?? "vault_ref_demo_001",
            status: context.vaultSession.status,
            audience:
              context.vaultSession.audience ??
              context.attributes.tokenAudience ??
              "agent-service",
            scopes: context.vaultSession.scopes,
            source: "delegated-placeholder",
            issuedAt: timestamp,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            stepUpRequired: false,
          });

    return {
      connections: connection ? [connection] : [],
      consents: consent ? [consent] : [],
      sessions: session ? [session] : [],
    };
  }

  private buildConsentSummary(input: ConsentSummary): ConsentSummary {
    return input;
  }

  private buildVaultSession(input: VaultSession): VaultSession {
    return input;
  }
}
