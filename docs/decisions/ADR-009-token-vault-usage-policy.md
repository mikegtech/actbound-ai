# ADR-009: Token Vault Usage Policy

## Status

Accepted

## Context

Auth0 Token Vault and AWS Secrets Manager both store sensitive credentials, but they serve fundamentally different purposes. Without a clear boundary, teams risk using Token Vault for platform secrets or Secrets Manager for user-delegated tokens, creating confusion and security gaps.

We need an explicit policy that defines when each system is used.

## Decision

### Token Vault Scope

Auth0 Token Vault is used **exclusively** for user-delegated third-party API access:

- A user connects their Google, Slack, GitHub, or other external account via Auth0
- Auth0 stores and manages the resulting OAuth tokens in Token Vault
- Backend services retrieve these tokens when an agent or service needs to act on behalf of the user with that external provider

### AWS Secrets Manager Scope

AWS Secrets Manager is used for all platform-owned secrets:

- Database connection strings
- Redis credentials
- Internal API keys
- Auth0 M2M client secrets (for service and agent applications)
- Encryption keys (or delegated to AWS KMS)
- Third-party API keys owned by the platform (not delegated by a user)

### Decision Table

| Secret type               | Owner            | System              | Rotation              |
| ------------------------- | ---------------- | ------------------- | --------------------- |
| User's Google OAuth token | User (delegated) | Auth0 Token Vault   | Auth0 (OAuth refresh) |
| User's Slack OAuth token  | User (delegated) | Auth0 Token Vault   | Auth0 (OAuth refresh) |
| Database password         | Platform         | AWS Secrets Manager | AWS Lambda rotation   |
| Redis connection string   | Platform         | AWS Secrets Manager | AWS Lambda rotation   |
| Auth0 M2M client secret   | Platform         | AWS Secrets Manager | Manual or automated   |
| Stripe API key (platform) | Platform         | AWS Secrets Manager | Manual                |
| OpenAI API key (platform) | Platform         | AWS Secrets Manager | Manual                |

### Token Vault Retrieval Rules

1. **Backend-only access.** The SPA never calls Token Vault directly.
2. **Authorization before retrieval.** The orchestrator checks OpenFGA before calling Token Vault.
3. **No persistent caching.** Token broker may hold a short-lived reference (TTL-bounded), but never writes delegated tokens to a database.
4. **No logging of token values.** Only safe metadata (provider, scopes, expiry, token handle) appears in logs or audit records.
5. **Immediate revocation.** When a user revokes a provider connection, Token Vault entries are removed and cached references are invalidated.

### Enforcement

- Code review: any import of Token Vault APIs must be in the delegated-access path, never in platform configuration code.
- Agent instructions (`.github/agents/`) explicitly document this boundary.
- ADR referenced in onboarding documentation.

## Consequences

- Clear mental model: Token Vault = user-owned delegated tokens, Secrets Manager = platform-owned secrets.
- No ambiguity about where a new secret should go.
- Token Vault remains a controlled sidecar capability, not a general-purpose secret store.
- Developers must understand the distinction — this ADR serves as the authoritative reference.
- Two systems to manage (Token Vault + Secrets Manager), but the scope boundary eliminates confusion about which to use.
