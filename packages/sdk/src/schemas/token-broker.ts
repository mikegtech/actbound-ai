import { ActorTypeSchema, SubjectTypeSchema } from "@actbound/authorization";

import { z } from "../openapi/extend-zod";
import { TimestampSchema } from "./common";
import { PermissionDecisionSchema } from "./permission-decision";
import {
  ScopedTokenRequestSchema,
  TokenRequestIntentSchema,
  TokenSourceTypeSchema,
} from "./scoped-token-request";

export const TokenCacheBackendSchema = z
  .enum(["redis", "memory"])
  .openapi("TokenCacheBackend");

export const BrokeredTokenResultSourceSchema = z
  .enum(["cached", "issued", "delegated-placeholder"])
  .openapi("BrokeredTokenResultSource");

export const SafeTokenActorSummarySchema = z
  .object({
    id: z.string(),
    type: ActorTypeSchema,
  })
  .openapi("SafeTokenActorSummary");

export const SafeTokenSubjectSummarySchema = z
  .object({
    id: z.string(),
    type: SubjectTypeSchema,
  })
  .openapi("SafeTokenSubjectSummary");

export const SafeTokenMetadataSchema = z
  .object({
    tokenHandle: z.string(),
    source: BrokeredTokenResultSourceSchema,
    sourceType: TokenSourceTypeSchema,
    intent: TokenRequestIntentSchema,
    audience: z.string(),
    scopes: z.array(z.string()),
    issuedAt: TimestampSchema,
    expiresAt: TimestampSchema,
    cacheKey: z.string(),
    cacheHit: z.boolean(),
    actor: SafeTokenActorSummarySchema,
    subject: SafeTokenSubjectSummarySchema,
    consentGrantId: z.string().optional(),
    connectionId: z.string().optional(),
  })
  .openapi("SafeTokenMetadata");

export const TokenCacheEntrySummarySchema = z
  .object({
    cacheKey: z.string(),
    source: BrokeredTokenResultSourceSchema,
    sourceType: TokenSourceTypeSchema,
    intent: TokenRequestIntentSchema,
    audience: z.string(),
    scopes: z.array(z.string()),
    expiresAt: TimestampSchema,
    lastAccessedAt: TimestampSchema,
    hitCount: z.number().int().nonnegative(),
  })
  .openapi("TokenCacheEntrySummary");

export const TokenCacheStatusSchema = z
  .object({
    backend: TokenCacheBackendSchema,
    connected: z.boolean(),
    fallbackInUse: z.boolean(),
    entryCount: z.number().int().nonnegative(),
    hits: z.number().int().nonnegative(),
    misses: z.number().int().nonnegative(),
  })
  .openapi("TokenCacheStatus");

export const TokenBrokerStatusSchema = z
  .object({
    status: z.literal("ok"),
    cache: TokenCacheStatusSchema,
    supportedIntents: z.array(TokenRequestIntentSchema),
    integrations: z.object({
      m2m: z.literal("todo-auth0-client-credentials"),
      delegated: z.literal("todo-auth0-token-vault"),
      throttling: z.literal("todo-lightweight-guardrails"),
    }),
  })
  .openapi("TokenBrokerStatus");

export const TokenBrokerPreviewResultSchema = z
  .object({
    requestId: z.string(),
    summary: z.string(),
    request: ScopedTokenRequestSchema,
    cacheKey: z.string(),
    cache: TokenCacheStatusSchema,
    cacheHit: z.boolean(),
    permissionDecision: PermissionDecisionSchema,
  })
  .openapi("TokenBrokerPreviewResult");

export const BrokeredTokenResponseSchema = z
  .object({
    requestId: z.string(),
    cacheKey: z.string(),
    cache: TokenCacheStatusSchema,
    metadata: SafeTokenMetadataSchema,
    permissionDecision: PermissionDecisionSchema,
    warnings: z.array(z.string()).default([]),
  })
  .openapi("BrokeredTokenResponse");

export const TokenCacheSummarySchema = z
  .object({
    cache: TokenCacheStatusSchema,
    entries: z.array(TokenCacheEntrySummarySchema),
  })
  .openapi("TokenCacheSummary");

export type TokenCacheBackend = import("zod").infer<
  typeof TokenCacheBackendSchema
>;
export type BrokeredTokenResultSource = import("zod").infer<
  typeof BrokeredTokenResultSourceSchema
>;
export type SafeTokenMetadata = import("zod").infer<
  typeof SafeTokenMetadataSchema
>;
export type TokenCacheEntrySummary = import("zod").infer<
  typeof TokenCacheEntrySummarySchema
>;
export type TokenCacheStatus = import("zod").infer<
  typeof TokenCacheStatusSchema
>;
export type TokenBrokerStatus = import("zod").infer<
  typeof TokenBrokerStatusSchema
>;
export type TokenBrokerPreviewResult = import("zod").infer<
  typeof TokenBrokerPreviewResultSchema
>;
export type BrokeredTokenResponse = import("zod").infer<
  typeof BrokeredTokenResponseSchema
>;
export type TokenCacheSummary = import("zod").infer<
  typeof TokenCacheSummarySchema
>;
