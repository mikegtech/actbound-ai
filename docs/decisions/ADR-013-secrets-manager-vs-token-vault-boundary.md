# ADR-013: Secrets Manager vs Token Vault Boundary

## Status

Accepted

## Context

The platform has two credential storage systems: AWS Secrets Manager and Auth0 Token Vault. Without a strict boundary, developers may store platform secrets in Token Vault or user-delegated tokens in Secrets Manager, creating security gaps and operational confusion.

ADR-009 established the Token Vault usage policy. This ADR completes the picture by defining the Secrets Manager side and the explicit boundary between the two systems.

## Decision

### The Rule

```
Who owns the credential?
  Platform → AWS Secrets Manager
  User (delegated via OAuth) → Auth0 Token Vault
```

There are no exceptions.

### System Comparison

| Property            | AWS Secrets Manager      | Auth0 Token Vault                |
| ------------------- | ------------------------ | -------------------------------- |
| Purpose             | Platform-owned secrets   | User-delegated OAuth tokens      |
| Credential owner    | The platform             | The user                         |
| Lifecycle control   | DevOps / automation      | User (connect/revoke in UI)      |
| Rotation            | AWS Lambda (automated)   | Auth0 (OAuth refresh)            |
| Access mechanism    | AWS SDK + IAM role       | Auth0 Management API + M2M token |
| Visibility to users | Never                    | Users see connected accounts     |
| Audit               | CloudTrail               | Auth0 logs                       |
| Revocation          | Admin / rotation process | User-initiated or admin override |

### Code Path Separation

Platform secrets and delegated tokens use completely separate code paths:

- **Secrets Manager path:** `infrastructure/secrets/SecretProvider` → AWS SDK → IAM role
- **Token Vault path:** `infrastructure/auth0/TokenVaultClient` → Auth0 Management API → M2M token

These paths share no code, no abstractions, and no interfaces. A developer writing code that retrieves a credential should always know which system they are calling.

### Enforcement

| Mechanism          | What it catches                                                                        |
| ------------------ | -------------------------------------------------------------------------------------- |
| Code review        | Wrong system used for a credential type                                                |
| Agent instructions | `.github/agents/` documents the boundary                                               |
| ADR-009 + ADR-013  | Authoritative reference for decisions                                                  |
| IAM policies       | Services cannot access Token Vault via AWS; cannot access Secrets Manager via Auth0    |
| Naming convention  | `actbound/` prefix in Secrets Manager; no prefix in Token Vault (user/provider scoped) |

## Consequences

- Zero ambiguity: every new credential has exactly one correct storage location.
- Two systems to understand, but the boundary is simple and permanent.
- No migration path between systems — credentials do not move from one to the other.
- Onboarding documentation must cover this boundary explicitly.
- Reinforces ADR-009 while adding the Secrets Manager perspective.
