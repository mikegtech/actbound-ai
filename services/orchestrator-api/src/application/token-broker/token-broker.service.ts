import {
  evaluateBrokeredTokenRead,
  evaluateDelegatedTokenUse,
  evaluateSensitiveActionExecution,
  evaluateTokenBrokerAccess,
  evaluateTokenCacheInspection,
  evaluateTokenReuse,
  type AuthorizationContext,
  type AuthorizationDecision,
  type PermissionResourceContext,
} from "@actbound/authorization";
import {
  BrokeredTokenResponseSchema,
  SafeTokenMetadataSchema,
  TokenBrokerPreviewResultSchema,
  TokenBrokerStatusSchema,
  TokenCacheSummarySchema,
  type BrokeredTokenResponse,
  type SafeTokenMetadata,
  type ScopedTokenRequest,
  type TokenBrokerPreviewResult,
  type TokenBrokerStatus,
  type TokenCacheStatus,
  type TokenCacheSummary,
} from "@actbound/sdk";
import { Injectable, Logger } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";

import {
  DelegatedAccessService,
  type DelegatedTokenFoundation,
} from "../delegated-access/delegated-access.service";
import {
  TokenBrokerCacheStore,
  type TokenCacheRecord,
} from "../../domain/token-broker/token-broker-cache.store";

type NormalizedTokenRequest = ScopedTokenRequest & {
  actorId: string;
  subjectId: string;
};

export type TokenBrokerRetrievalResult = {
  decision: AuthorizationDecision;
  response?: BrokeredTokenResponse;
};

@Injectable()
export class TokenBrokerService {
  private readonly logger = new Logger(TokenBrokerService.name);
  private readonly tokenLifetimeSeconds = 15 * 60;
  private hits = 0;
  private misses = 0;

  constructor(
    private readonly delegatedAccessService: DelegatedAccessService,
    private readonly tokenBrokerCacheStore: TokenBrokerCacheStore,
  ) {}

  evaluateStatusAccess(context: AuthorizationContext): AuthorizationDecision {
    return evaluateBrokeredTokenRead(context, {
      type: "brokered_token",
      ownerSubjectId: context.subject.id,
    });
  }

  evaluateCacheInspectionAccess(
    context: AuthorizationContext,
  ): AuthorizationDecision {
    return evaluateTokenCacheInspection(context, {
      type: "token_cache",
      id: "token-broker",
    });
  }

  async getBrokerStatus(): Promise<TokenBrokerStatus> {
    return TokenBrokerStatusSchema.parse({
      status: "ok",
      cache: await this.getCacheStatus(),
      supportedIntents: ["m2m", "delegated"],
      integrations: {
        m2m: "todo-auth0-client-credentials",
        delegated: "todo-auth0-token-vault",
        throttling: "todo-lightweight-guardrails",
      },
    });
  }

  async previewTokenRequest(
    context: AuthorizationContext,
    request: ScopedTokenRequest,
  ): Promise<TokenBrokerPreviewResult> {
    const normalizedRequest = this.normalizeRequest(request, context);
    const cacheKey = this.computeCacheKey(normalizedRequest);
    const cachedRecord = await this.tokenBrokerCacheStore.peek(cacheKey);
    const delegatedFoundation =
      normalizedRequest.intent === "delegated"
        ? this.delegatedAccessService.resolveDelegatedTokenFoundation(
            context,
            normalizedRequest,
          )
        : undefined;
    const decision = this.evaluateRequestDecision(
      delegatedFoundation?.authorizationContext ?? context,
      normalizedRequest,
      cacheKey,
      Boolean(cachedRecord),
    );
    const cache = await this.getCacheStatus();
    const stepUpRequired =
      delegatedFoundation?.stepUpRequired ??
      decision.reasons.some((reason) => reason.code === "step_up_required");

    this.logger.log(
      `token-broker preview ${cachedRecord ? "cache-hit" : "cache-miss"} intent=${normalizedRequest.intent} cacheKey=${cacheKey} audience=${normalizedRequest.audience}`,
    );

    return TokenBrokerPreviewResultSchema.parse({
      requestId: randomUUID(),
      summary: this.buildPreviewSummary(
        normalizedRequest,
        Boolean(cachedRecord),
        stepUpRequired,
      ),
      request: normalizedRequest,
      cacheKey,
      cache,
      cacheHit: Boolean(cachedRecord),
      permissionDecision: decision,
      stepUpRequired,
    });
  }

  async retrieveTokenRequest(
    context: AuthorizationContext,
    request: ScopedTokenRequest,
  ): Promise<TokenBrokerRetrievalResult> {
    const normalizedRequest = this.normalizeRequest(request, context);
    const cacheKey = this.computeCacheKey(normalizedRequest);
    const cachedRecord = await this.tokenBrokerCacheStore.peek(cacheKey);
    const delegatedFoundation =
      normalizedRequest.intent === "delegated"
        ? this.delegatedAccessService.resolveDelegatedTokenFoundation(
            context,
            normalizedRequest,
          )
        : undefined;
    const decisionContext =
      delegatedFoundation?.authorizationContext ?? context;
    const decision = this.evaluateRequestDecision(
      decisionContext,
      normalizedRequest,
      cacheKey,
      Boolean(cachedRecord),
    );

    if (!decision.allowed) {
      this.logger.warn(
        `token-broker denied intent=${normalizedRequest.intent} cacheKey=${cacheKey} actor=${context.actor.id}`,
      );

      return {
        decision,
      };
    }

    if (!cachedRecord) {
      this.misses += 1;
      this.logger.log(
        `token-broker cache-miss cacheKey=${cacheKey} path=${normalizedRequest.intent}`,
      );
    }

    const record = cachedRecord
      ? await this.consumeCachedRecord(cacheKey, cachedRecord)
      : await this.issueAndCachePlaceholderToken(
          normalizedRequest,
          decisionContext,
          delegatedFoundation,
        );
    const cache = await this.getCacheStatus();
    const warnings = this.buildWarnings(
      normalizedRequest,
      Boolean(cachedRecord),
      record,
    );

    if (cache.fallbackInUse) {
      warnings.push(
        "Redis is not active for the broker, so the in-memory fallback cache is handling this request.",
      );
    }

    return {
      decision,
      response: BrokeredTokenResponseSchema.parse({
        requestId: randomUUID(),
        cacheKey,
        cache,
        metadata: this.shapeResponseMetadata(record, Boolean(cachedRecord)),
        permissionDecision: decision,
        warnings,
      }),
    };
  }

  async getCacheSummary(): Promise<TokenCacheSummary> {
    const entries = (await this.tokenBrokerCacheStore.list())
      .sort((left, right) =>
        right.lastAccessedAt.localeCompare(left.lastAccessedAt),
      )
      .slice(0, 8)
      .map((record) => ({
        cacheKey: record.cacheKey,
        source: record.metadata.source,
        sourceType: record.metadata.sourceType,
        intent: record.metadata.intent,
        audience: record.metadata.audience,
        scopes: record.metadata.scopes,
        provider: record.metadata.provider,
        expiresAt: record.metadata.expiresAt,
        lastAccessedAt: record.lastAccessedAt,
        hitCount: record.hitCount,
        stepUpRequired: record.metadata.stepUpRequired,
        sensitiveActionClassification:
          record.metadata.sensitiveActionClassification,
      }));

    return TokenCacheSummarySchema.parse({
      cache: await this.getCacheStatus(),
      entries,
    });
  }

  private normalizeRequest(
    request: ScopedTokenRequest,
    context: AuthorizationContext,
  ): NormalizedTokenRequest {
    return {
      ...request,
      actorId: request.actorId ?? context.actor.id,
      subjectId: request.subjectId ?? context.subject.id,
      connectionId:
        request.connectionId ??
        context.providerConnection.connectionId ??
        context.tokenVaultConnection.connectionId,
      consentGrantId: request.consentGrantId ?? context.consent.grantId,
    };
  }

  private computeCacheKey(request: NormalizedTokenRequest): string {
    return createHash("sha256")
      .update(
        JSON.stringify({
          actorId: request.actorId,
          audience: request.audience,
          connectionId: request.connectionId,
          consentGrantId: request.consentGrantId,
          intent: request.intent,
          scopes: [...request.scopes].sort(),
          sensitiveActionClassification: request.sensitiveActionClassification,
          subjectId: request.subjectId,
        }),
      )
      .digest("hex")
      .slice(0, 24);
  }

  private buildResourceContext(
    request: NormalizedTokenRequest,
    cacheKey: string,
  ): PermissionResourceContext {
    if (
      request.intent === "delegated" &&
      request.sensitiveActionClassification &&
      request.sensitiveActionClassification !== "routine"
    ) {
      return {
        type: "sensitive_action",
        id: cacheKey,
        ownerSubjectId: request.subjectId,
        classification: request.sensitiveActionClassification,
      };
    }

    if (request.intent === "delegated") {
      return {
        type: "delegated_token",
        id: cacheKey,
        ownerSubjectId: request.subjectId,
      };
    }

    return {
      type: "brokered_token",
      id: cacheKey,
      ownerSubjectId: request.subjectId,
    };
  }

  private evaluateRequestDecision(
    context: AuthorizationContext,
    request: NormalizedTokenRequest,
    cacheKey: string,
    cacheHit: boolean,
  ): AuthorizationDecision {
    if (
      request.intent === "delegated" &&
      request.sensitiveActionClassification &&
      request.sensitiveActionClassification !== "routine"
    ) {
      return evaluateSensitiveActionExecution(
        context,
        this.buildResourceContext(request, cacheKey),
      );
    }

    if (request.intent === "delegated") {
      return evaluateDelegatedTokenUse(
        context,
        this.buildResourceContext(request, cacheKey),
      );
    }

    if (cacheHit) {
      return evaluateTokenReuse(
        context,
        this.buildResourceContext(request, cacheKey),
      );
    }

    return evaluateTokenBrokerAccess(
      context,
      this.buildResourceContext(request, cacheKey),
    );
  }

  private async issueAndCachePlaceholderToken(
    request: NormalizedTokenRequest,
    context: AuthorizationContext,
    delegatedFoundation?: DelegatedTokenFoundation,
  ): Promise<TokenCacheRecord> {
    const issuedAt = new Date();
    const expiresAt = new Date(
      issuedAt.getTime() + this.tokenLifetimeSeconds * 1000,
    );
    const cacheKey = this.computeCacheKey(request);
    const record: TokenCacheRecord = {
      cacheKey,
      metadata: SafeTokenMetadataSchema.parse({
        tokenHandle: `tok_${cacheKey}_${issuedAt.getTime().toString(36)}`,
        source:
          request.intent === "delegated" ? "delegated-placeholder" : "issued",
        sourceType: request.intent === "delegated" ? "delegated" : "m2m",
        intent: request.intent,
        audience: request.audience,
        scopes: request.scopes,
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        cacheKey,
        cacheHit: false,
        actor: {
          id: context.actor.id,
          type: context.actor.type,
        },
        subject: {
          id: context.subject.id,
          type: context.subject.type,
        },
        provider:
          delegatedFoundation?.connection?.provider ??
          context.providerConnection.provider,
        consentGrantId:
          delegatedFoundation?.consent?.id ?? request.consentGrantId,
        connectionId:
          delegatedFoundation?.connection?.id ?? request.connectionId,
        vaultSessionId: delegatedFoundation?.vaultSession?.id,
        vaultTokenReference: delegatedFoundation?.vaultSession?.tokenReference,
        stepUpRequired:
          delegatedFoundation?.stepUpRequired ??
          Boolean(
            request.sensitiveActionClassification &&
            request.sensitiveActionClassification !== "routine" &&
            !context.attributes.stepUpSatisfied,
          ),
        sensitiveActionClassification: request.sensitiveActionClassification,
      }),
      createdAt: issuedAt.toISOString(),
      lastAccessedAt: issuedAt.toISOString(),
      hitCount: 0,
    };

    // TODO: Apply per-actor throttling and budget guardrails before the real issuer path.
    // TODO: Exchange Auth0 client credentials for real M2M tokens when the broker leaves placeholder mode.
    // TODO: Retrieve delegated tokens from Auth0 Token Vault for delegated requests when that integration is wired.
    this.logger.log(
      `token-broker issue-path intent=${request.intent} cacheKey=${cacheKey} audience=${request.audience}`,
    );

    await this.tokenBrokerCacheStore.upsert(record);

    return record;
  }

  private shapeResponseMetadata(
    record: TokenCacheRecord,
    cacheHit: boolean,
  ): SafeTokenMetadata {
    if (!cacheHit) {
      return record.metadata;
    }

    return SafeTokenMetadataSchema.parse({
      ...record.metadata,
      source: "cached",
      sourceType: "cached",
      cacheHit: true,
    });
  }

  private buildPreviewSummary(
    request: NormalizedTokenRequest,
    cacheHit: boolean,
    stepUpRequired: boolean,
  ): string {
    if (cacheHit && !stepUpRequired) {
      return `Cache hit expected for ${request.intent} token intent; broker would reuse cached metadata.`;
    }

    if (stepUpRequired) {
      return "Delegated preview completed, but the current request would require step-up before token use can proceed.";
    }

    if (request.intent === "delegated") {
      return "Cache miss; broker would follow the delegated placeholder path after authorization.";
    }

    return "Cache miss; broker would issue a placeholder M2M token response after authorization.";
  }

  private buildWarnings(
    request: NormalizedTokenRequest,
    cacheHit: boolean,
    record: TokenCacheRecord,
  ): string[] {
    const warnings: string[] = [];

    if (cacheHit) {
      warnings.push(
        `Cache reuse path returned the existing safe token handle ${record.metadata.tokenHandle}.`,
      );
    } else if (request.intent === "delegated") {
      warnings.push(
        "Delegated retrieval is still placeholder-only until Auth0 Token Vault wiring is added.",
      );
    } else {
      warnings.push(
        "M2M issuance is still placeholder-only until Auth0 client credentials exchange is added.",
      );
    }

    if (record.metadata.stepUpRequired) {
      warnings.push(
        "This delegated token request is tied to a sensitive action that will require step-up in the real integration.",
      );
    }

    return warnings;
  }

  private async consumeCachedRecord(
    cacheKey: string,
    record: TokenCacheRecord,
  ): Promise<TokenCacheRecord> {
    const touchedRecord: TokenCacheRecord = {
      ...record,
      lastAccessedAt: new Date().toISOString(),
      hitCount: record.hitCount + 1,
    };

    this.hits += 1;
    this.logger.log(`token-broker cache-hit cacheKey=${cacheKey}`);
    await this.tokenBrokerCacheStore.upsert(touchedRecord);

    return touchedRecord;
  }

  private async getCacheStatus(): Promise<TokenCacheStatus> {
    const backend = await this.tokenBrokerCacheStore.getBackend();

    return {
      backend: backend.backend,
      connected: backend.connected,
      fallbackInUse: backend.fallbackInUse,
      entryCount: (await this.tokenBrokerCacheStore.list()).length,
      hits: this.hits,
      misses: this.misses,
    };
  }
}
