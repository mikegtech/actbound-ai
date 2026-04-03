# Secrets Management and Rotation Architecture

## Overview

This document defines the complete secrets management, access control, retrieval, and rotation architecture for the ActBound AI platform using AWS Secrets Manager as the primary secrets system.

**Boundary rule:** AWS Secrets Manager holds all platform-owned secrets. Auth0 Token Vault holds only user-delegated third-party OAuth tokens. These systems never overlap.

---

## 1. Secret Classification Model

### 1.1 Classification Table

| Class                        | Examples                                        | Stored in           | Rotation               | Lifecycle owner   |
| ---------------------------- | ----------------------------------------------- | ------------------- | ---------------------- | ----------------- |
| Infrastructure               | DB credentials, Redis connection strings        | AWS Secrets Manager | Automated (Lambda)     | Platform / AWS    |
| Application                  | Auth0 M2M client secrets, internal signing keys | AWS Secrets Manager | Scheduled or manual    | Platform / DevOps |
| Third-party (platform-owned) | OpenAI API key, Stripe secret key, SendGrid key | AWS Secrets Manager | Manual (vendor-issued) | Platform / DevOps |
| Delegated OAuth (user-owned) | User's Google/Slack/GitHub tokens               | Auth0 Token Vault   | Auth0 (OAuth refresh)  | User              |

### 1.2 Classification Rules

1. **If the platform owns the credential** → AWS Secrets Manager.
2. **If a user delegated the credential** (OAuth) → Auth0 Token Vault.
3. **If the credential can be rotated automatically** → configure Lambda rotation.
4. **If the credential is vendor-issued and cannot be auto-rotated** → manual rotation with alerting on age.
5. **Encryption keys** → AWS KMS (not Secrets Manager). Secrets Manager uses KMS for envelope encryption.

---

## 2. Secrets Manager Structure

### 2.1 Naming Convention

```
actbound/<environment>/<owner>/<secret-name>
```

| Segment         | Values                   | Purpose                                                |
| --------------- | ------------------------ | ------------------------------------------------------ |
| `actbound`      | Fixed prefix             | Namespace isolation from other projects in the account |
| `<environment>` | `dev`, `staging`, `prod` | Environment separation                                 |
| `<owner>`       | Service name or `shared` | Scopes access and ownership                            |
| `<secret-name>` | Descriptive name         | Identifies the credential                              |

### 2.2 Naming Examples

| Secret                         | Path                                              |
| ------------------------------ | ------------------------------------------------- |
| Orchestrator DB credentials    | `actbound/prod/orchestrator-api/db-credentials`   |
| Agent service DB credentials   | `actbound/prod/agent-service/db-credentials`      |
| Shared Redis credentials       | `actbound/prod/shared/redis-credentials`          |
| Auth0 orchestrator M2M secret  | `actbound/prod/orchestrator-api/auth0-m2m-client` |
| Auth0 agent-service M2M secret | `actbound/prod/agent-service/auth0-m2m-client`    |
| Agent instance M2M secret      | `actbound/prod/agents/agent-research-001`         |
| OpenAI API key                 | `actbound/prod/shared/openai-api-key`             |
| Stripe secret key              | `actbound/prod/shared/stripe-secret-key`          |

### 2.3 Secret Value Structure

Secrets are stored as JSON objects, not plain strings. This supports multi-field credentials and rotation metadata.

**Database credential example:**

```json
{
  "host": "actbound-prod.cluster-xxxxx.us-east-1.rds.amazonaws.com",
  "port": 5432,
  "username": "orchestrator_svc",
  "password": "rotated-value-here",
  "dbname": "actbound_orchestrator",
  "engine": "postgres"
}
```

**Auth0 M2M client example:**

```json
{
  "client_id": "abc123",
  "client_secret": "rotated-value-here",
  "domain": "dev-6az71xw7wqwtmp0q.us.auth0.com",
  "audience": "https://api.actbound.ai"
}
```

**API key example:**

```json
{
  "api_key": "sk-xxxxx",
  "provider": "openai",
  "created_at": "2026-03-15T00:00:00Z"
}
```

### 2.4 Versioning

AWS Secrets Manager maintains version stages automatically:

| Stage         | Purpose                                               |
| ------------- | ----------------------------------------------------- |
| `AWSCURRENT`  | Active credential, used by all consumers              |
| `AWSPENDING`  | New credential being validated during rotation        |
| `AWSPREVIOUS` | Prior credential, kept for in-flight request drainage |

Services always request `AWSCURRENT`. The rotation Lambda manages stage transitions.

### 2.5 Multi-Tenant Considerations

For multi-tenant scaling, the naming convention extends naturally:

```
actbound/<environment>/<tenant-id>/<owner>/<secret-name>
```

This is deferred until multi-tenancy is implemented. The current single-tenant model uses the simpler three-segment path.

---

## 3. Access Control Model (IAM)

### 3.1 Principle: One IAM Role Per Service

Each service gets its own IAM role. No shared roles. Each role accesses only the secrets it needs.

### 3.2 IAM Role Structure

| Principal        | IAM Role                            | Secrets Access                                                 |
| ---------------- | ----------------------------------- | -------------------------------------------------------------- |
| orchestrator-api | `actbound-orchestrator-{env}-role`  | `actbound/{env}/orchestrator-api/*`, `actbound/{env}/shared/*` |
| agent-service    | `actbound-agent-service-{env}-role` | `actbound/{env}/agent-service/*`, `actbound/{env}/shared/*`    |
| Rotation Lambda  | `actbound-rotation-{env}-role`      | `actbound/{env}/**` (write access for rotation)                |
| Agent instances  | No direct AWS access                | Access secrets via orchestrator/agent-service API              |
| Admin/DevOps     | `actbound-admin-{env}-role`         | Full access, MFA required, CloudTrail audited                  |

### 3.3 IAM Policy Example (orchestrator-api)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOwnSecrets",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:actbound/prod/orchestrator-api/*",
        "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:actbound/prod/shared/*"
      ]
    },
    {
      "Sid": "DecryptWithKMS",
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "arn:aws:kms:us-east-1:ACCOUNT:key/KEY_ID",
      "Condition": {
        "StringEquals": {
          "kms:ViaService": "secretsmanager.us-east-1.amazonaws.com"
        }
      }
    }
  ]
}
```

### 3.4 Agent Access Pattern

Agents do **not** have direct AWS access. They retrieve credentials through the service layer:

```
Agent → (M2M JWT) → orchestrator-api → (IAM role) → Secrets Manager
```

The orchestrator validates the agent's authorization (via OpenFGA) before retrieving any secret on the agent's behalf.

### 3.5 Access Boundaries

| Forbidden                                    | Enforced by                         |
| -------------------------------------------- | ----------------------------------- |
| Service A reading Service B's secrets        | IAM resource-scoped policy          |
| Agent reading secrets directly from AWS      | No IAM role for agents              |
| Any service writing/deleting secrets         | IAM policy (read-only for services) |
| Rotation Lambda reading non-rotation secrets | Scoped Lambda execution role        |

---

## 4. Secret Retrieval Pattern (Runtime)

### 4.1 Retrieval Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐
│   Service    │────▶│  Secret Provider │────▶│  Secrets Manager  │
│  (startup)   │     │  (infra layer)   │     │  (AWS API)        │
└──────────────┘     └──────────────────┘     └───────────────────┘
                            │
                     ┌──────┴──────┐
                     │  In-memory  │
                     │  cache      │
                     │  (TTL: 5m)  │
                     └─────────────┘
```

### 4.2 Retrieval Rules

1. **Abstraction layer, not direct SDK calls.** Each service has a `SecretProvider` in its `infrastructure` layer that wraps the AWS SDK. Application and domain layers never import the AWS SDK.
2. **Cache in memory with TTL.** Secrets are cached for 5 minutes. After TTL expiry, the next access fetches fresh from Secrets Manager.
3. **Lazy initialization.** Secrets are fetched on first use, not at startup. This avoids blocking service startup on AWS availability.
4. **No secrets in environment variables at runtime.** Environment variables may contain the secret _path_ (e.g., `DB_SECRET_PATH=actbound/prod/orchestrator-api/db-credentials`), never the secret value.

### 4.3 Backend Service Pattern

```typescript
// infrastructure/secrets/secret-provider.ts
export class AwsSecretProvider {
  private cache = new Map<string, { value: unknown; expiresAt: number }>();
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes

  async getSecret<T>(secretPath: string): Promise<T> {
    const cached = this.cache.get(secretPath);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const result = await this.client.send(
      new GetSecretValueCommand({ SecretId: secretPath }),
    );
    const parsed = JSON.parse(result.SecretString!) as T;

    this.cache.set(secretPath, {
      value: parsed,
      expiresAt: Date.now() + this.ttlMs,
    });

    return parsed;
  }
}
```

### 4.4 Agent Pattern

Agents never call Secrets Manager directly. When an agent needs a credential (e.g., to call an external API on behalf of the platform):

1. Agent calls orchestrator-api with its M2M JWT
2. Orchestrator validates agent identity and authorization (OpenFGA)
3. Orchestrator retrieves secret from Secrets Manager via its own IAM role
4. Orchestrator uses the secret to make the external call (or returns safe metadata)

Agents never see raw secret values unless architecturally required and explicitly approved.

### 4.5 Failure Handling

| Failure                     | Behavior                                                           |
| --------------------------- | ------------------------------------------------------------------ |
| Secrets Manager API timeout | Retry with exponential backoff (3 attempts, 1s/2s/4s)              |
| Secrets Manager unavailable | Use cached value if within TTL. If no cache, fail closed (503).    |
| Secret not found            | Fail immediately with clear error. Do not fall back to env vars.   |
| Malformed secret JSON       | Fail immediately. Log error (without secret value). Alert.         |
| Cache stale beyond TTL      | Force refresh on next access. If refresh fails, use stale + alert. |

---

## 5. Rotation Architecture

### 5.1 Rotation Strategy Per Secret Type

| Secret type                   | Rotation method             | Frequency | Automation       |
| ----------------------------- | --------------------------- | --------- | ---------------- |
| Database credentials          | Lambda rotation (dual-user) | 30 days   | Fully automated  |
| Redis credentials             | Lambda rotation             | 30 days   | Fully automated  |
| Auth0 M2M client secrets      | Lambda rotation (Auth0 API) | 90 days   | Fully automated  |
| OpenAI / third-party API keys | Manual with age alerting    | On demand | Alert at 90 days |
| Internal signing keys         | Lambda rotation             | 90 days   | Fully automated  |

### 5.2 Lambda Rotation Design

Each rotatable secret type has a dedicated rotation Lambda. The Lambda implements the four-step AWS rotation protocol:

```
1. createSecret    → Generate new credential, store as AWSPENDING
2. setSecret       → Apply new credential to the target system
3. testSecret      → Validate AWSPENDING works
4. finishSecret    → Promote AWSPENDING to AWSCURRENT
```

### 5.3 Rotation Lambda Structure

```
infra/
  rotation/
    db-rotation/           → Database credential rotation Lambda
    redis-rotation/        → Redis credential rotation Lambda
    auth0-m2m-rotation/    → Auth0 M2M client secret rotation Lambda
```

### 5.4 Database Rotation: Dual-User Strategy

For zero-downtime database rotation, use the **alternating user** pattern:

```
Step 1: Secret has user_A (AWSCURRENT)
Step 2: Rotation creates user_B with new password (AWSPENDING)
Step 3: Rotation validates user_B can connect
Step 4: user_B becomes AWSCURRENT, user_A becomes AWSPREVIOUS
Step 5: Next rotation: user_A gets new password, cycle repeats
```

This ensures in-flight connections using the old user continue working until they naturally close.

### 5.5 Auth0 M2M Secret Rotation

```
Step 1: Lambda calls Auth0 Management API to rotate client secret
Step 2: Auth0 returns new client_secret
Step 3: Lambda stores new secret as AWSPENDING
Step 4: Lambda validates new credentials by requesting an M2M token
Step 5: AWSPENDING promoted to AWSCURRENT
```

The 5-minute cache TTL means services will pick up new credentials within 5 minutes of rotation without restart.

---

## 6. Zero-Downtime Rotation Pattern

### 6.1 Standard Flow

```
Time ─────────────────────────────────────────────────────▶

     │ AWSCURRENT = old_cred │                  │ AWSCURRENT = new_cred │
     │ AWSPREVIOUS = (none)  │                  │ AWSPREVIOUS = old_cred│
     │                       │                  │                       │
     ├─── Rotation Start ────┤                  ├─── Rotation End ──────┤
     │                       │                  │                       │
     │            ┌──────────┴──────────┐       │                       │
     │            │ AWSPENDING = new    │       │                       │
     │            │ (being validated)   │       │                       │
     │            └──────────┬──────────┘       │                       │
     │                       │                  │                       │
     │  Services use old_cred│  Stage swap      │  Services fetch new   │
     │  (from cache)         │  happens here    │  (on next cache miss) │
```

### 6.2 Consumer Contract

Services must follow these rules to support zero-downtime rotation:

1. **Never cache secrets beyond the TTL (5 minutes).** This is the maximum window for picking up new credentials.
2. **Handle authentication failures gracefully.** If a credential fails, evict the cache entry and retry with a fresh fetch. This handles the rare race where a cached credential is rotated and the target system has already switched.
3. **Never store secrets in persistent storage.** In-memory cache only. No database, no disk, no Redis (for secrets themselves).
4. **Do not restart to pick up new secrets.** The cache TTL handles refresh automatically.

### 6.3 Retry-on-Auth-Failure Pattern

```typescript
async function callWithSecretRetry<T>(
  secretPath: string,
  operation: (secret: DbCredentials) => Promise<T>,
): Promise<T> {
  try {
    const creds = await secretProvider.getSecret<DbCredentials>(secretPath);
    return await operation(creds);
  } catch (error) {
    if (isAuthenticationError(error)) {
      // Evict cache, fetch fresh, retry once
      secretProvider.evict(secretPath);
      const freshCreds =
        await secretProvider.getSecret<DbCredentials>(secretPath);
      return await operation(freshCreds);
    }
    throw error;
  }
}
```

---

## 7. Token Vault vs Secrets Manager Boundary

This boundary is defined in [ADR-009](../decisions/ADR-009-token-vault-usage-policy.md) and reinforced here.

### 7.1 Decision Rule

```
Is the credential owned by a user and delegated via OAuth?
  YES → Auth0 Token Vault
  NO  → AWS Secrets Manager
```

### 7.2 Strict Rules

| Rule                                       | Enforcement                                                                |
| ------------------------------------------ | -------------------------------------------------------------------------- |
| Platform API keys never in Token Vault     | Code review + ADR-009                                                      |
| User OAuth tokens never in Secrets Manager | Code review + ADR-009                                                      |
| Services differentiate by call path        | Token Vault accessed via Auth0 Management API; Secrets Manager via AWS SDK |
| No credential migration between systems    | Each system owns its scope permanently                                     |

### 7.3 Service Differentiation Pattern

```typescript
// Retrieving a platform secret (e.g., OpenAI key)
const apiKey = await secretProvider.getSecret<ApiKey>(
  "actbound/prod/shared/openai-api-key",
);

// Retrieving a user-delegated token (e.g., Google access token)
const delegatedToken = await tokenVaultClient.getDelegatedToken(
  userId,
  "google",
);
```

These are different code paths, different infrastructure clients, and different IAM/Auth0 permissions. They should never be confused.

---

## 8. Failure and Recovery Model

### 8.1 Failure Scenarios

| Scenario                           | Impact                             | Response                                                                              |
| ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------- |
| Secrets Manager API outage         | Services cannot refresh secrets    | Use cached values. Alert. Fail closed if no cache.                                    |
| Rotation Lambda fails mid-rotation | AWSPENDING exists but not promoted | Lambda retries automatically. Manual intervention if stuck. Rollback via AWSPREVIOUS. |
| Secret value corrupted             | Service cannot parse credential    | Fail immediately. Alert. Restore from AWSPREVIOUS via AWS console.                    |
| Wrong secret deployed              | Service uses incorrect credentials | Rotation rollback: promote AWSPREVIOUS to AWSCURRENT.                                 |
| KMS key unavailable                | Secrets cannot be decrypted        | Fail closed. Alert. AWS KMS has 99.999% SLA.                                          |

### 8.2 Rollback Strategy

AWS Secrets Manager supports instant rollback:

```bash
# Promote AWSPREVIOUS back to AWSCURRENT
aws secretsmanager update-secret-version-stage \
  --secret-id actbound/prod/orchestrator-api/db-credentials \
  --version-stage AWSCURRENT \
  --move-to-version-id <previous-version-id> \
  --remove-from-version-id <current-version-id>
```

Services pick up the rollback within the 5-minute cache TTL.

### 8.3 Audit and Alerting

| Event                                         | Alert    | Channel                             |
| --------------------------------------------- | -------- | ----------------------------------- |
| Secret accessed by unexpected role            | Critical | CloudWatch alarm → SNS              |
| Rotation Lambda failure                       | High     | CloudWatch alarm → SNS              |
| Secret age exceeds threshold (manual secrets) | Medium   | CloudWatch metric → scheduled alert |
| Secret version stage change                   | Info     | CloudTrail log (audit trail)        |
| Cache miss rate spike                         | Medium   | Application metric → CloudWatch     |

### 8.4 CloudTrail Integration

All Secrets Manager API calls are automatically logged to CloudTrail:

- Who accessed which secret
- When the access occurred
- Which version stage was requested
- Whether the request succeeded or failed

This provides full auditability without additional instrumentation.

---

## Related ADRs

- [ADR-009: Token Vault Usage Policy](../decisions/ADR-009-token-vault-usage-policy.md) (existing, reinforced)
- [ADR-010: Secrets Manager as Source of Truth](../decisions/ADR-010-secrets-manager-source-of-truth.md)
- [ADR-011: Secret Naming Convention](../decisions/ADR-011-secret-naming-convention.md)
- [ADR-012: Rotation Strategy Model](../decisions/ADR-012-rotation-strategy-model.md)
- [ADR-013: Secrets Manager vs Token Vault Boundary](../decisions/ADR-013-secrets-manager-vs-token-vault-boundary.md)
