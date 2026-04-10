---
name: multi-issuer-oidc
description: >
  Stack-agnostic architecture pattern for
  trusted-issuer, claim-normalized authentication.
  Use when building or reviewing any feature that
  involves OIDC token validation, identity provider
  registration, claim mapping profiles, or normalized
  principal models. Covers Auth0, Okta, Keycloak,
  and custom OIDC issuers through a single trusted
  issuer registry pattern.
license: Proprietary
metadata:
  author: actbound
  version: "1.0"
---

# Multi-Issuer OIDC Authentication

Stack-agnostic architecture pattern for trusted-issuer, claim-normalized authentication. Applies to any project that needs to accept tokens from multiple OIDC identity providers and resolve them to a single internal principal model.

## Architecture Model

### Trusted Issuer Registry

The system maintains a registry of trusted OIDC issuers. Only tokens from registered issuers are accepted. The registry is the single source of truth for which identity providers are authorized, how their claims map to the internal model, and which tenants they serve.

Each registry entry contains:

```
TrustedIssuerEntry {
  id:                  string          // internal registry ID
  issuerUrl:           string          // OIDC issuer URL (iss claim value)
  jwksEndpoint:        string          // JWKS URI for key fetching
  claimMappingProfile: string          // which mapping profile to apply
  tenantId:            string          // tenant this issuer is bound to
  audiences:           string[]        // valid aud claim values
  enabled:             boolean         // can be disabled without removal
  metadata: {
    providerType:      'auth0' | 'okta' | 'keycloak' | 'custom'
    displayName:       string          // human-readable label
    registeredAt:      string          // ISO timestamp
    lastSyncAt:        string | null   // last successful token validation
  }
}
```

### Token Validation Flow

1. Extract `iss` claim from incoming token (without full validation).
2. Look up `iss` against the trusted issuer registry. Reject if not found or disabled.
3. Fetch JWKS from the registered `jwksEndpoint` for that issuer (cached with rotation).
4. Validate token signature, expiration, `aud` claim against the registry entry's `audiences`.
5. Load the `claimMappingProfile` for this issuer.
6. Run raw JWT claims through the mapping profile to produce a normalized principal.
7. Bind the principal to the `tenantId` from the registry entry.
8. Return the normalized principal to the application layer.

### Claim Normalization

Every issuer structures claims differently. The claim mapping profile transforms issuer-specific claims into the internal principal model. This normalization happens once, at token validation time. All downstream application code works exclusively with the normalized principal — never with raw JWT claims.

## Supported Issuers

### Primary (fully productized)

**Auth0**

- Claim source: `sub`, `email`, `https://[domain]/roles` (namespaced custom claim)
- Role mapping: `https://[domain]/roles` array → internal `roles[]`
- Consistent claim structure across all Auth0 tenants
- Day-one setup path with guided configuration

**Okta**

- Claim source: `sub`, `email`, `groups`
- Role mapping: `groups` array → internal `roles[]`
- Groups claim requires explicit scope and claim configuration in Okta admin
- Profile claims (`name`, `email`) in standard OIDC locations
- Day-one setup path with guided configuration

### Supported (architecture-compatible, manual setup)

**Keycloak**

- Claim source: `sub`, `email`, `realm_access.roles`, `resource_access.[client].roles`
- Role mapping: `realm_access.roles` for realm-level roles, `resource_access.[client].roles` for client-level roles
- Realm structure is deployment-specific — claim paths vary
- Self-hosted or privately hosted deployments
- More claim variance than managed issuers
- Architecture-compatible but not a day-one productized setup path
- Claim mapping profile handles per-deployment variance

### Extensible

**Custom OIDC**

- Any OIDC-compliant issuer with a valid discovery document
- Claim mapping fully configurable per tenant
- Requires manual issuer registration and mapping profile creation
- No assumptions about claim structure — admin defines all mappings

## Normalized Principal Model

Every issuer resolves to this shape. All application code downstream of authentication works with this model only.

```
NormalizedPrincipal {
  internalId:       string        // app-local unique identifier
  externalSubject:  string        // original sub claim from the issuer
  issuer:           string        // iss claim URL
  email:            string        // normalized email address
  displayName:      string        // human-readable name
  roles:            string[]      // normalized internal role identifiers
  tenantId:         string        // tenant this principal belongs to
  issuerProfile:    string        // which claim mapping profile was applied
}
```

Rules:

- `internalId` is generated or looked up by the application — never from the JWT.
- `externalSubject` is stored as-is from the `sub` claim for correlation back to the issuer.
- `roles` are internal role identifiers, not issuer-specific group or role names. The mapping profile translates issuer roles to internal roles.
- `tenantId` comes from the trusted issuer registry entry, not from the JWT claims.
- `issuerProfile` records which mapping was applied, for audit and debugging.

## Claim Mapping Profile Pattern

A claim mapping profile defines how to extract and transform raw JWT claims into a normalized principal. Each issuer (or issuer variant) has its own profile registered in the trusted issuer registry.

```
ClaimMappingProfile {
  id:             string
  name:           string              // e.g. "auth0-default", "okta-groups", "keycloak-realm-v1"
  description:    string

  mappings: {
    externalSubject:  ClaimPath        // path to sub claim
    email:            ClaimPath        // path to email claim
    displayName:      ClaimPath        // path to name/display name claim
    roles:            ClaimPath        // path to roles/groups claim
  }

  roleTransform: {
    type:     'direct' | 'prefix-strip' | 'lookup'
    config:   Record<string, string>   // issuer role → internal role mapping
  }
}

// ClaimPath is a dot-notation path into the JWT claims object
// Examples:
//   "sub"
//   "email"
//   "name"
//   "https://myapp.com/roles"
//   "realm_access.roles"
//   "resource_access.my-client.roles"
```

### Example profiles

**Auth0 default profile**

```
mappings:
  externalSubject:  "sub"
  email:            "email"
  displayName:      "name"
  roles:            "https://myapp.com/roles"

roleTransform:
  type: "direct"
  config: {}
```

**Okta groups profile**

```
mappings:
  externalSubject:  "sub"
  email:            "email"
  displayName:      "name"
  roles:            "groups"

roleTransform:
  type: "prefix-strip"
  config:
    prefix: "app-"        // "app-admin" → "admin"
```

**Keycloak realm profile**

```
mappings:
  externalSubject:  "sub"
  email:            "email"
  displayName:      "preferred_username"
  roles:            "realm_access.roles"

roleTransform:
  type: "lookup"
  config:
    "realm-admin":    "admin"
    "realm-editor":   "editor"
    "realm-viewer":   "viewer"
```

## Issuer-Specific Notes

### Auth0

- Managed cloud issuer with consistent claim structure across tenants.
- Custom claims are namespaced under `https://[domain]/` per Auth0 convention.
- `sub` format: `auth0|[userId]` or `[connection]|[userId]`.
- Roles require a custom Auth0 Action or Rule to inject into the token.
- JWKS endpoint: `https://[domain]/.well-known/jwks.json`.
- Discovery document: `https://[domain]/.well-known/openid-configuration`.

### Okta

- Managed cloud issuer with consistent claim structure.
- Groups claim is not included by default — requires explicit scope configuration in the Okta Authorization Server.
- `sub` format varies by auth server configuration (can be email or opaque ID).
- Profile claims (`name`, `email`, `preferred_username`) are in standard OIDC locations.
- JWKS endpoint: `https://[domain]/oauth2/[authServerId]/v1/keys`.
- Discovery document: `https://[domain]/oauth2/[authServerId]/.well-known/openid-configuration`.

### Keycloak

- Self-hosted or privately hosted — no single canonical URL pattern.
- Realm structure is deployment-specific. Claim paths depend on realm and client configuration.
- `realm_access.roles` contains realm-level roles.
- `resource_access.[clientId].roles` contains client-specific roles.
- `preferred_username` is the typical display name claim (not `name`).
- More claim variance than managed issuers — the claim mapping profile absorbs this variance.
- Treat as architecture-compatible, not a day-one productized setup path.
- JWKS endpoint: `https://[host]/realms/[realm]/protocol/openid-connect/certs`.
- Discovery document: `https://[host]/realms/[realm]/.well-known/openid-configuration`.

### Custom OIDC

- Any OIDC-compliant issuer with a valid discovery document.
- No assumptions about claim structure — all mappings defined by the admin.
- Claim mapping profile is fully configurable per tenant.
- Requires manual registration: issuer URL, JWKS endpoint, audience, and full claim mapping.
- Discovery document must be reachable from the server at registration time.

## Security Rules

- Always validate `iss` claim against the trusted issuer registry whitelist. Reject tokens from unregistered issuers immediately.
- Always validate `aud` claim against the registered audiences for that issuer entry.
- Always fetch JWKS from the registered endpoint for the matched issuer — never from a URL embedded in the token itself.
- Never trust an unregistered issuer, even if the token is otherwise valid.
- Token validation happens server-side only. The UI never receives, decodes, stores, or inspects raw JWTs.
- JWKS keys are cached with automatic rotation detection (key ID mismatch triggers re-fetch).
- Clock skew tolerance for `exp`/`nbf` validation: configurable, default 30 seconds.
- All token validation failures are logged with issuer URL, failure reason, and timestamp — never with the token itself.
- Disabled issuers in the registry are treated as unregistered — tokens are rejected without further validation.
