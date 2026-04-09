# ADR-047: Multi-Issuer Identity Architecture

## Status

Accepted

## Context

ActBound AI needs to support multiple OIDC identity providers per tenant. The initial implementation used a single Auth0 domain with hardcoded JWKS validation. This prevented multi-tenant deployments where different organizations use different identity providers (Auth0, Keycloak, Okta, or generic OIDC).

The platform must normalize identities from any trusted issuer into one internal model so that authorization (RBAC, ABAC, OpenFGA) remains provider-agnostic.

## Decision

### Trusted Issuer Registry

A per-tenant registry of trusted OIDC issuers stored in the `trusted_issuers` table. Each entry includes:

- Issuer type (`auth0`, `keycloak`, `okta`, `oidc`)
- Issuer URL and JWKS endpoint
- Audience
- Claim mapping profile ID
- Enabled flag

The JWT middleware resolves the issuer from the token's `iss` claim, looks it up in the registry, and validates using the issuer-specific JWKS.

### Claim Normalization Pipeline

Each issuer type has a `ClaimNormalizer` implementation that extracts claims from issuer-specific locations and produces a `NormalizedClaims` object. Auth0 uses `https://actbound.ai/*` namespace claims. Keycloak will use `realm_access.roles` and custom mappers. The normalizer is selected by issuer type.

### Internal Identity Binding

External identities (`issuer + sub`) are mapped to internal subject IDs (UUIDs) via the `identity_bindings` table. The internal subject ID is used in:

- OpenFGA subjects
- Audit event attribution
- Authorization context
- All downstream authorization checks

This ensures that the same user authenticated via different providers (or a provider migration) can be treated as one identity.

### Provider Support Tiers

- **Tier 1:** Auth0 (implemented), Keycloak (Phase 13)
- **Tier 2:** Okta, generic OIDC (future)

### NormalizedPrincipal

Replaces the previous `Principal` type throughout the authorization pipeline. Includes:

- `internalSubjectId` (UUID, used for authorization)
- `externalSub` (original `sub` from JWT)
- `issuer`, `issuerType`
- `identitySource` (provider label, URL — for UI display)
- All existing fields (principalType, roles, tenantId, etc.)

## Consequences

- All authorization is provider-agnostic after normalization
- Adding a new provider requires: a `ClaimNormalizer` implementation, a registry entry, and a claim mapping profile
- Demo/fallback principal is removed — fail-closed on all auth paths
- The `users` table gains `internal_id`, `issuer`, `issuer_type` columns for transition support
- OpenFGA subjects use internal UUIDs, not raw external claims like `auth0|abc123`
- UI receives `IdentitySource` metadata for display without exposure to raw issuer internals
