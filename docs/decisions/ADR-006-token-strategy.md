# ADR-006: Token Strategy

## Status

Accepted

## Context

The ActBound AI platform has three principal types (human users, services, AI agents) that all need JWT-based identity tokens issued by Auth0. We need a consistent token design that supports:

- Local validation (no introspection round-trips)
- Multi-tenant isolation
- Principal-type differentiation
- Role-based routing to authorization checks
- Agent-to-user delegation attribution
- Short-lived access with safe refresh patterns

The token design must be compatible with future OpenFGA integration where tokens provide identity inputs to authorization queries, not permission decisions themselves.

## Decision

### Token Format and Signing

- All access tokens are JWTs signed with RS256.
- All tokens target a single API audience: `https://api.actbound.ai`.
- Custom claims use the `https://actbound.ai/` namespace.

### Required Custom Claims (all tokens)

| Claim                                | Type                                 | Purpose                                  |
| ------------------------------------ | ------------------------------------ | ---------------------------------------- |
| `https://actbound.ai/principal_type` | `"user"` \| `"service"` \| `"agent"` | Determines authorization evaluation path |
| `https://actbound.ai/tenant_id`      | string                               | Multi-tenant boundary enforcement        |

### Additional Claims by Principal Type

**Users:** `https://actbound.ai/roles` (array of role strings)

**Services:** `https://actbound.ai/service_name` (e.g., `"orchestrator-api"`)

**Agents:** `https://actbound.ai/agent_type`, `https://actbound.ai/agent_instance_id`, `https://actbound.ai/on_behalf_of` (user sub, when delegated)

### Token Lifetimes

| Token                | Lifetime   | Refresh                                        |
| -------------------- | ---------- | ---------------------------------------------- |
| User access          | 15 minutes | Rotating refresh token, 24h idle / 7d absolute |
| M2M access (service) | 1 hour     | Re-request on expiry                           |
| M2M access (agent)   | 1 hour     | Re-request on expiry                           |

### Claims Enrichment

Auth0 Actions enrich tokens at issuance:

- **Post-Login Action** — enriches user access tokens with `principal_type`, `roles`, `tenant_id`
- **Client Credentials Action** — enriches M2M tokens with `principal_type`, `service_name` or agent metadata, `tenant_id`

### What Tokens Must NOT Contain

- Fine-grained permissions (resolved at runtime via OpenFGA)
- Resource ownership data
- PII beyond `sub`
- Secrets, API keys, or connection strings

## Consequences

- Every service can validate tokens locally using Auth0's JWKS endpoint.
- Principal type is always available in the token for routing decisions.
- Token size stays small and predictable.
- Authorization is decoupled from token issuance — OpenFGA can evolve independently.
- Auth0 Actions must be deployed and maintained as part of tenant configuration.
- Refresh token rotation adds complexity but prevents token family reuse attacks.
