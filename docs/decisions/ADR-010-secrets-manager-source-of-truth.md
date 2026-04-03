# ADR-010: AWS Secrets Manager as Source of Truth for Platform Secrets

## Status

Accepted

## Context

The platform needs a centralized, auditable secrets store for all platform-owned credentials (database passwords, API keys, M2M client secrets, Redis credentials). Options considered:

1. **Environment variables** — simple but no rotation, no audit trail, secrets baked into deployment config.
2. **AWS Secrets Manager** — managed, rotation-capable, IAM-scoped, CloudTrail-audited, KMS-encrypted.
3. **HashiCorp Vault** — powerful but self-hosted, operational overhead, not justified for current scale.
4. **AWS SSM Parameter Store** — cheaper but no native rotation, limited to 10K parameters, no dual-version staging.

## Decision

**AWS Secrets Manager is the single source of truth for all platform-owned secrets.**

### What goes in Secrets Manager

- Database credentials (Postgres, Redis)
- Auth0 M2M client IDs and secrets
- Third-party API keys owned by the platform (OpenAI, Stripe, etc.)
- Internal signing keys
- Any credential that a backend service needs at runtime

### What does NOT go in Secrets Manager

- User-delegated OAuth tokens (Auth0 Token Vault — see ADR-009)
- Encryption keys (AWS KMS)
- Infrastructure configuration that is not secret (SSM Parameter Store or config files)

### Retrieval Pattern

Services retrieve secrets via an `infrastructure`-layer abstraction (`SecretProvider`) using the AWS SDK. Secrets are cached in memory with a 5-minute TTL. Services never store secrets in environment variables at runtime, persistent storage, or logs.

### Environment variables

Environment variables may contain the secret **path** (e.g., `DB_SECRET_PATH=actbound/prod/orchestrator-api/db-credentials`) to tell the service which secret to fetch. They must never contain the secret **value**.

## Consequences

- Single system for all platform secrets with consistent access patterns.
- Native rotation support via Lambda.
- IAM-scoped access control per service.
- CloudTrail audit trail for all secret access.
- AWS dependency — acceptable given the broader AWS infrastructure commitment.
- Cost: $0.40/secret/month + $0.05 per 10K API calls. Negligible at current scale.
