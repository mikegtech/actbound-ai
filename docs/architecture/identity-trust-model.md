# Identity and Trust Model

## Overview

This document defines the complete identity, authentication, token, and trust model for the ActBound AI platform. It covers human users, backend services, and AI agents as first-class principals in a Zero Trust architecture.

**Stack alignment:**

| Concern                         | System                        |
| ------------------------------- | ----------------------------- |
| Identity + Authentication       | Auth0 (Pro)                   |
| Delegated external API access   | Auth0 Token Vault             |
| Platform secrets + rotation     | AWS Secrets Manager           |
| Authorization decisions         | OpenFGA (RBAC + ABAC + ReBAC) |
| Frontend enforcement (advisory) | CASL                          |
| Infrastructure                  | AWS + VPS + Tailscale         |

---

## 1. Identity Model

Three principal types exist in the system. Each authenticates differently and receives a distinct identity shape.

### 1.1 Human Users

| Property                  | Value                                 |
| ------------------------- | ------------------------------------- |
| Authentication            | Auth0 Universal Login (PKCE SPA flow) |
| Token type                | User JWT (access + refresh)           |
| Identity (`sub`)          | `auth0\|<user_id>`                    |
| Principal type claim      | `user`                                |
| Represented in OpenFGA as | `user:<auth0_user_id>`                |

Users authenticate via the React SPA (`apps/web`) using Auth0's Universal Login with PKCE. The orchestrator validates the resulting JWT on every request.

### 1.2 Services

| Property                  | Value                                |
| ------------------------- | ------------------------------------ |
| Authentication            | Auth0 Client Credentials Grant (M2M) |
| Token type                | M2M JWT (access only, no refresh)    |
| Identity (`sub`)          | `<client_id>@clients`                |
| Principal type claim      | `service`                            |
| Represented in OpenFGA as | `service:<client_id>`                |

Each backend service (orchestrator-api, agent-service) has its own Auth0 M2M application. Services authenticate to each other using client credentials. AWS-level access uses IAM roles, not Auth0.

### 1.3 AI Agents

| Property                  | Value                                          |
| ------------------------- | ---------------------------------------------- |
| Authentication            | Auth0 Client Credentials Grant (per-agent M2M) |
| Token type                | Agent JWT (access only, no refresh)            |
| Identity (`sub`)          | `<agent_client_id>@clients`                    |
| Principal type claim      | `agent`                                        |
| Represented in OpenFGA as | `agent:<agent_instance_id>`                    |

**Agents are first-class principals.** Each agent instance gets its own Auth0 M2M application. Agents are never shared identities — every agent has a unique, attributable `sub`.

When an agent acts on behalf of a user, the token includes an `on_behalf_of` claim linking the action back to the delegating user. The agent's own identity remains the `sub` — the user is the context, not the actor.

### Identity Decision Table

| Principal  | Auth method            | `sub` format          | Has refresh token | Can act on behalf of user |
| ---------- | ---------------------- | --------------------- | ----------------- | ------------------------- |
| Human user | PKCE (Universal Login) | `auth0\|<id>`         | Yes               | N/A (is the user)         |
| Service    | Client Credentials     | `<client_id>@clients` | No                | No                        |
| Agent      | Client Credentials     | `<client_id>@clients` | No                | Yes (via `on_behalf_of`)  |

---

## 2. Token Strategy

### 2.1 Claim Namespace

All custom claims use the `https://actbound.ai/` namespace prefix to avoid collisions with standard OIDC claims.

### 2.2 Access Token Structure

**User access token:**

```json
{
  "iss": "https://dev-6az71xw7wqwtmp0q.us.auth0.com/",
  "sub": "auth0|abc123",
  "aud": "https://api.actbound.ai",
  "iat": 1720000000,
  "exp": 1720000900,
  "scope": "openid profile email",
  "https://actbound.ai/principal_type": "user",
  "https://actbound.ai/tenant_id": "tenant_default",
  "https://actbound.ai/roles": ["operator"]
}
```

**Service M2M access token:**

```json
{
  "iss": "https://dev-6az71xw7wqwtmp0q.us.auth0.com/",
  "sub": "svc_orchestrator_client_id@clients",
  "aud": "https://api.actbound.ai",
  "iat": 1720000000,
  "exp": 1720003600,
  "https://actbound.ai/principal_type": "service",
  "https://actbound.ai/service_name": "orchestrator-api",
  "https://actbound.ai/tenant_id": "tenant_default"
}
```

**Agent access token:**

```json
{
  "iss": "https://dev-6az71xw7wqwtmp0q.us.auth0.com/",
  "sub": "agent_research_001_client_id@clients",
  "aud": "https://api.actbound.ai",
  "iat": 1720000000,
  "exp": 1720003600,
  "https://actbound.ai/principal_type": "agent",
  "https://actbound.ai/agent_type": "research",
  "https://actbound.ai/agent_instance_id": "agent_research_001",
  "https://actbound.ai/on_behalf_of": "auth0|abc123",
  "https://actbound.ai/tenant_id": "tenant_default"
}
```

### 2.3 Token Lifetimes

| Token type         | Lifetime              | Refresh                                       |
| ------------------ | --------------------- | --------------------------------------------- |
| User access token  | 15 minutes            | Rotating refresh token, 7-day absolute expiry |
| User refresh token | 24h idle, 7d absolute | Rotation on use, revoke on reuse detection    |
| Service M2M token  | 1 hour                | Re-request on expiry (no refresh token)       |
| Agent M2M token    | 1 hour                | Re-request on expiry (no refresh token)       |

### 2.4 Token Design Rules

1. **Access tokens are JWTs.** Validated locally by each service (no introspection round-trip).
2. **Refresh tokens are opaque.** Only the SPA and Auth0 handle them. Backend services never see refresh tokens.
3. **Custom claims are enriched via Auth0 Actions** (post-login for users, client-credentials for M2M).
4. **Tokens carry identity and role, not permissions.** Fine-grained permissions are resolved at runtime by OpenFGA, not embedded in tokens.
5. **`aud` is always the API identifier** (`https://api.actbound.ai`), not a service-specific audience.
6. **No sensitive data in tokens.** No email, no PII beyond `sub`. Use userinfo endpoint if needed.

---

## 3. Service-to-Service Trust Model

### 3.1 Trust Boundaries

```
┌─────────────────────────────────────────────────┐
│                  EXTERNAL BOUNDARY               │
│  (Auth0 JWT validation at orchestrator edge)     │
│                                                  │
│  ┌───────────────┐       ┌───────────────────┐  │
│  │  apps/web     │──JWT──│ orchestrator-api   │  │
│  │  (SPA)        │       │ (external edge)    │  │
│  └───────────────┘       └────────┬──────────┘  │
│                                   │              │
│                          M2M JWT  │              │
│                                   ▼              │
│                          ┌────────────────────┐  │
│                          │  agent-service     │  │
│                          │  (internal only)   │  │
│                          └────────────────────┘  │
│                                                  │
│              INTERNAL BOUNDARY                   │
│  (M2M JWT between services, Tailscale network)  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│                  AWS BOUNDARY                    │
│  (IAM roles, not Auth0)                         │
│                                                  │
│  Services → AWS Secrets Manager (IAM role)      │
│  Services → Redis/DB (IAM or Secrets Manager)   │
│  Services → S3/SQS/etc (IAM role)              │
└─────────────────────────────────────────────────┘
```

### 3.2 Authentication Method by Boundary

| Boundary                         | Auth method          | Token/credential                       |
| -------------------------------- | -------------------- | -------------------------------------- |
| SPA → orchestrator-api           | Auth0 user JWT       | Bearer token in Authorization header   |
| orchestrator-api → agent-service | Auth0 M2M JWT        | Client credentials grant, bearer token |
| Any service → AWS                | IAM roles            | Instance profile or task role          |
| Any service → Redis              | Connection string    | From AWS Secrets Manager               |
| Any service → Token Vault        | Auth0 Management API | M2M token with Token Vault scopes      |

### 3.3 Trust Rules

1. **orchestrator-api is the only external-facing service.** It validates user JWTs and acts as the gateway.
2. **agent-service trusts only M2M JWTs from known service client IDs.** It is never directly accessible from the internet.
3. **AWS access never flows through Auth0.** IAM roles are the AWS trust mechanism.
4. **Tailscale provides network-level zero trust** between services. JWT validation is defense-in-depth on top of network isolation.
5. **No service trusts another service's authorization decisions.** Each service independently evaluates permissions via OpenFGA using the identity from the JWT.

---

## 4. Agent Identity Model

### 4.1 Design Decision: Per-Agent-Instance Identity

Each deployed agent instance receives its own Auth0 M2M application. This is deliberately more granular than per-agent-type identity.

| Approach                    | Traceability | Revocability                | Blast radius          | Chosen  |
| --------------------------- | ------------ | --------------------------- | --------------------- | ------- |
| Shared service identity     | Low          | Revoke breaks all agents    | All agents            | No      |
| Per-agent-type identity     | Medium       | Revoke breaks one type      | All instances of type | No      |
| Per-agent-instance identity | High         | Revoke affects one instance | Single instance       | **Yes** |

### 4.2 Agent Lifecycle

```
1. Agent provisioned → Auth0 M2M app created with agent metadata
2. Agent authenticates → Client credentials grant → JWT with agent claims
3. Agent acts → JWT includes on_behalf_of (if delegated) or acts autonomously
4. Agent audited → sub + agent_instance_id + on_behalf_of = full attribution
5. Agent decommissioned → Auth0 M2M app disabled/deleted → instant revocation
```

### 4.3 Agent Attribution

Every agent action is attributable via three dimensions:

| Dimension          | Claim                              | Example                                   |
| ------------------ | ---------------------------------- | ----------------------------------------- |
| Who is the agent   | `sub`                              | `agent_research_001@clients`              |
| What kind of agent | `https://actbound.ai/agent_type`   | `research`                                |
| On whose behalf    | `https://actbound.ai/on_behalf_of` | `auth0\|abc123` (or absent if autonomous) |

### 4.4 Agent Scoping

Agents are scoped by:

1. **Auth0 M2M scopes** — what the agent's client credentials grant allows
2. **OpenFGA relations** — what the agent is authorized to do at the resource level
3. **Delegation scope** — what the delegating user consented to (stored in the authorization model, not in the token)

---

## 5. Token Vault Integration

### 5.1 Scope Definition

Auth0 Token Vault is used **exclusively** for:

- User-delegated third-party API access (Google, Slack, GitHub, etc.)
- Agents retrieving delegated tokens to act on behalf of users with external APIs

Token Vault is **never** used for:

| Use case                                | Correct system        |
| --------------------------------------- | --------------------- |
| Database credentials                    | AWS Secrets Manager   |
| API keys for internal services          | AWS Secrets Manager   |
| Service-to-service auth                 | Auth0 M2M             |
| Redis connection strings                | AWS Secrets Manager   |
| Encryption keys                         | AWS KMS               |
| Third-party API keys (platform-owned)   | AWS Secrets Manager   |
| Third-party API tokens (user-delegated) | **Auth0 Token Vault** |

### 5.2 Token Vault Flow

```
User → Auth0 Universal Login → Connects Google account
                                      │
                                      ▼
                              Auth0 Token Vault
                              (stores delegated OAuth tokens)
                                      │
                                      │ (Backend retrieves when needed)
                                      ▼
                              orchestrator-api
                              (validates authorization first)
                                      │
                                      ▼
                              agent-service
                              (uses delegated token to call Google API)
                                      │
                                      ▼
                              Google API (on behalf of user)
```

### 5.3 Token Vault Retrieval Rules

1. **Only backend services retrieve from Token Vault.** The SPA never touches Token Vault directly.
2. **Authorization is checked before retrieval.** The orchestrator evaluates the agent's permission to use the delegated token (via OpenFGA) before calling Token Vault.
3. **Tokens are never cached outside Token Vault** except in the token broker's short-lived in-memory/Redis cache with strict TTLs.
4. **Token Vault tokens are never logged.** Only safe metadata (provider, scopes, expiry) appears in logs.
5. **Revocation propagates immediately.** When a user revokes a provider connection, the Token Vault entry is removed and all cached references are invalidated.

### 5.4 Token Vault vs AWS Secrets Manager

| Property       | Auth0 Token Vault                  | AWS Secrets Manager                |
| -------------- | ---------------------------------- | ---------------------------------- |
| Purpose        | User-delegated external API tokens | Platform secrets and credentials   |
| Owner          | The user (delegated)               | The platform (operational)         |
| Lifecycle      | User-controlled (connect/revoke)   | Ops-controlled (rotate/deploy)     |
| Rotation       | Handled by Auth0 (OAuth refresh)   | Handled by AWS (Lambda rotation)   |
| Access pattern | Backend retrieves per-request      | Backend reads at startup or cached |
| Scope          | Per-user, per-provider             | Per-service, per-environment       |
| Visibility     | User sees connected accounts in UI | Users never see platform secrets   |

---

## 6. Identity to Authorization Contract

### 6.1 What Tokens Provide to Authorization

Tokens carry **identity context** that authorization systems use as inputs, not as decisions.

| Claim                                | Used by       | Purpose                                  |
| ------------------------------------ | ------------- | ---------------------------------------- |
| `sub`                                | OpenFGA       | Principal identifier for relation checks |
| `https://actbound.ai/principal_type` | RBAC routing  | Determines which policy path to evaluate |
| `https://actbound.ai/roles`          | RBAC          | Initial role-based access check          |
| `https://actbound.ai/tenant_id`      | Multi-tenancy | Scopes all queries to tenant boundary    |
| `https://actbound.ai/agent_type`     | ABAC          | Agent-type-specific policy evaluation    |
| `https://actbound.ai/on_behalf_of`   | Delegation    | Links agent actions to delegating user   |

### 6.2 What Tokens Must NOT Contain

| Data                     | Why not in token                      | Where it lives                    |
| ------------------------ | ------------------------------------- | --------------------------------- |
| Fine-grained permissions | Too large, too dynamic, stale quickly | OpenFGA (queried at runtime)      |
| Resource ownership       | Changes per request                   | Backend state + OpenFGA relations |
| Consent grant details    | User-mutable, per-provider            | Backend database + Token Vault    |
| Email/PII                | Unnecessary exposure in every request | Auth0 userinfo endpoint           |
| Secrets or API keys      | Never in JWTs                         | AWS Secrets Manager / Token Vault |

### 6.3 Authorization Resolution Flow

```
Request arrives with JWT
        │
        ▼
1. Validate JWT (signature, expiry, audience)
        │
        ▼
2. Extract identity context (sub, principal_type, roles, tenant_id)
        │
        ▼
3. Build authorization query:
   - subject: principal_type:sub
   - relation: action being performed
   - object: resource being accessed
        │
        ▼
4. Query OpenFGA: Check(subject, relation, object)
        │
        ├── allowed → proceed
        └── denied → 403 with reason
```

### 6.4 CASL (Frontend Advisory)

CASL in the React SPA mirrors OpenFGA decisions for UX purposes only:

1. Backend returns permission decisions via `GET /me/permissions`
2. Frontend builds CASL ability from the response
3. CASL hides/disables UI elements the user cannot use
4. **Backend re-checks every action regardless of CASL state**

CASL is never authoritative. It is a UX optimization.

---

## 7. Failure and Security Considerations

### 7.1 Token Leakage

| Risk                 | Mitigation                                                                          |
| -------------------- | ----------------------------------------------------------------------------------- |
| Access token stolen  | Short lifetime (15 min user, 1h M2M). Audience-restricted.                          |
| Refresh token stolen | Rotating refresh tokens. Reuse detection revokes token family.                      |
| Token in logs        | Structured logging excludes Authorization headers. Token Vault tokens never logged. |
| Token in URL         | Tokens only in Authorization header, never query params.                            |

### 7.2 Token Replay

| Risk                               | Mitigation                                                                       |
| ---------------------------------- | -------------------------------------------------------------------------------- |
| Stolen JWT replayed                | Short expiry + audience validation + `iat` checking.                             |
| M2M token replayed across services | Each service validates `aud`. Tailscale network boundary limits exposure.        |
| Cross-tenant replay                | `tenant_id` claim validated on every request. Token bound to tenant at issuance. |

### 7.3 Over-Privileged Service Accounts

| Risk                          | Mitigation                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------- |
| M2M app with excessive scopes | Each M2M app scoped to minimum required API permissions. Reviewed on provisioning.  |
| Agent with broad delegation   | Agent scopes constrained by both M2M grant and user's consent scope (intersection). |
| AWS role with broad access    | IAM policies scoped per-service. No shared roles.                                   |

### 7.4 Identity Spoofing

| Risk                              | Mitigation                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------- |
| Forged JWT                        | RS256 signature validation against Auth0 JWKS. No shared secrets.                 |
| Agent impersonating another agent | Per-instance `sub`. No way to forge another agent's client credentials.           |
| Service impersonating a user      | `principal_type` claim set by Auth0 Action, not by the caller. Backend validates. |

### 7.5 Delegated OAuth Token Misuse

| Risk                                         | Mitigation                                                                       |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| Agent uses Token Vault without authorization | OpenFGA check required before Token Vault retrieval.                             |
| Agent exceeds delegated scope                | Token Vault tokens are scope-limited. Orchestrator validates scope intersection. |
| Revoked connection still used                | Token Vault revocation is immediate. Broker cache invalidation on revoke.        |
| Token Vault tokens stored outside vault      | Prohibited by architecture. Only short-lived broker cache allowed.               |

### 7.6 Secrets Manager vs Token Vault Confusion

| Risk                                  | Mitigation                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| Platform secret stored in Token Vault | Enforced by code review + ADR. Token Vault only called for user-delegated flows. |
| User token stored in Secrets Manager  | Enforced by architecture. Delegated tokens route through Token Vault only.       |
| Credentials hardcoded                 | Pre-commit gitleaks + CI scanning. .env files gitignored.                        |

---

## 8. Auth0 Tenant Configuration (Required)

### 8.1 Applications to Create

| Application               | Type | Purpose                                      |
| ------------------------- | ---- | -------------------------------------------- |
| ActBound Web              | SPA  | React app authentication via Universal Login |
| ActBound Orchestrator API | M2M  | orchestrator-api service identity            |
| ActBound Agent Service    | M2M  | agent-service identity                       |

Agent M2M applications are created dynamically as agents are provisioned.

### 8.2 Resource Server (API) to Create

| Name         | Identifier                | Signing | Token expiry              |
| ------------ | ------------------------- | ------- | ------------------------- |
| ActBound API | `https://api.actbound.ai` | RS256   | 900s (users), 3600s (M2M) |

### 8.3 Auth0 Actions Required

| Trigger            | Action            | Purpose                                                             |
| ------------------ | ----------------- | ------------------------------------------------------------------- |
| Post-Login         | Enrich user token | Add `principal_type`, `roles`, `tenant_id` to access token          |
| Client Credentials | Enrich M2M token  | Add `principal_type`, `service_name` or agent metadata to M2M token |

### 8.4 Connections

| Connection                       | Type     | Purpose                                    |
| -------------------------------- | -------- | ------------------------------------------ |
| Username-Password-Authentication | Database | Default user authentication                |
| Google                           | Social   | Optional social login + Token Vault source |

---

## Related ADRs

- [ADR-006: Token Strategy](../decisions/ADR-006-token-strategy.md)
- [ADR-007: Agent Identity Model](../decisions/ADR-007-agent-identity-model.md)
- [ADR-008: Service Trust Model](../decisions/ADR-008-service-trust-model.md)
- [ADR-009: Token Vault Usage Policy](../decisions/ADR-009-token-vault-usage-policy.md)
