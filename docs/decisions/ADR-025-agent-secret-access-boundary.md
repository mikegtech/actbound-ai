# ADR-025: Agent Secret Access Boundary

## Status

Accepted

## Context

Agents need credentials to authenticate and may need access to platform secrets or user-delegated tokens to perform their work. Without strict boundaries, agents could accumulate secret access beyond what they need.

## Decision

### Three Tiers of Agent Secret Access

| Tier   | Access                            | How                                             | Authorization                   |
| ------ | --------------------------------- | ----------------------------------------------- | ------------------------------- |
| Tier 0 | Own M2M client secret             | Direct from Secrets Manager at startup          | Agent's own IAM-scoped path     |
| Tier 1 | Platform secrets (API keys, etc.) | Brokered through orchestrator-api               | Agent RBAC + OpenFGA per-secret |
| Tier 2 | User-delegated tokens (OAuth)     | Brokered through orchestrator-api + Token Vault | Delegation + consent + OpenFGA  |

### Agent Never Has

- Direct AWS IAM role (no Secrets Manager, S3, KMS, or database access)
- Direct Token Vault access (no Auth0 Management API calls)
- Raw secret values in API responses (unless architecturally required and explicitly approved)
- Blanket access to all secrets in any tier

### Brokered Access Pattern

The agent calls the orchestrator, which validates authorization, retrieves the secret via its own IAM role or Token Vault client, uses the secret on the agent's behalf, and returns only safe metadata.

### Tier 0 Exception

The agent's own M2M client secret is the sole exception — the agent process must hold this to authenticate. This secret is:

- Stored in Secrets Manager at `actbound/<env>/agents/<instance_id>`
- Loaded at agent startup
- Rotated on the Tier 2 schedule (90 days)
- Destroyed on agent decommission

## Consequences

- Agents have minimal direct secret exposure (only their own auth credentials).
- All other secret access is mediated and authorized per-request.
- Compromising an agent does not compromise platform secrets or user tokens.
- The orchestrator is the single point of secret brokering — simplifies audit and access control.
