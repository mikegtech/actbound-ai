# Auth0 Dev Setup for ActBound AI

## Environment Strategy

ActBound AI uses an **isolated non-production Auth0 setup** within the existing dev tenant. All ActBound resources are prefixed with `actbound-` to distinguish them from other projects (Trupryce, MoveAround) that share the same tenant.

| Principle | Rule                                                                                                       |
| --------- | ---------------------------------------------------------------------------------------------------------- |
| Isolation | ActBound resources are prefixed `actbound-`. No modification of existing Trupryce or MoveAround resources. |
| Secrets   | Never committed to the repo. Stored in `.env` files (gitignored) or AWS Secrets Manager.                   |
| Naming    | All Auth0 objects follow `actbound-<type>-<purpose>` naming.                                               |
| Tenant    | `dev-6az71xw7wqwtmp0q.us.auth0.com` (shared dev tenant)                                                    |

**Rule: trupryce-prod must never be modified for ActBound work.**

---

## Required Auth0 Objects

### 1. Web Application (SPA)

| Property                   | Value                            |
| -------------------------- | -------------------------------- |
| Name                       | `actbound-web`                   |
| Type                       | Single Page Application          |
| Allowed Callback URLs      | `http://localhost:5173/callback` |
| Allowed Logout URLs        | `http://localhost:5173`          |
| Allowed Web Origins        | `http://localhost:5173`          |
| Token endpoint auth method | None (PKCE)                      |

Used by `apps/web` for user authentication via Auth0 Universal Login.

### 2. API / Resource Server

| Property                    | Value                                |
| --------------------------- | ------------------------------------ |
| Name                        | `actbound-api`                       |
| Identifier (audience)       | `https://api.actbound.dev`           |
| Signing Algorithm           | RS256                                |
| Token Expiration            | 900 seconds (15 min) for user tokens |
| Allow Skipping User Consent | Enabled (first-party app)            |

This is the audience for all ActBound JWTs. Both user and M2M tokens target this audience.

### 3. Machine-to-Machine Application

| Property       | Value                                       |
| -------------- | ------------------------------------------- |
| Name           | `actbound-m2m`                              |
| Type           | Machine to Machine                          |
| Authorized API | `actbound-api` (`https://api.actbound.dev`) |

Used by `services/orchestrator-api` and `services/agent-service` for service-to-service authentication. In production, each service and agent instance gets its own M2M app (ADR-007, ADR-008). For dev, a single shared M2M app is acceptable.

### 4. Connections

| Connection                       | Type     | Purpose                                |
| -------------------------------- | -------- | -------------------------------------- |
| Username-Password-Authentication | Database | Default, already exists in tenant      |
| Google (optional)                | Social   | Demo social login + Token Vault source |

### 5. Demo/Test Users

Create via Auth0 Dashboard or Management API:

| Email                | Password                      | Purpose                           |
| -------------------- | ----------------------------- | --------------------------------- |
| `alice@actbound.dev` | (set in Auth0, not committed) | Primary demo user (operator role) |
| `bob@actbound.dev`   | (set in Auth0, not committed) | Secondary demo user (viewer role) |

---

## Initial Scopes and Permissions

The `actbound-api` resource server should define scopes that align with the repo's permission model (`packages/authorization/src/permissions.ts`).

### API Scopes

| Scope                 | Description                 |
| --------------------- | --------------------------- |
| `connections:read`    | Read provider connections   |
| `connections:connect` | Connect new providers       |
| `connections:revoke`  | Revoke provider connections |
| `consents:read`       | Read consent grants         |
| `consents:preview`    | Preview consent state       |
| `agent:preview`       | Preview agent actions       |
| `agent:execute`       | Execute agent actions       |
| `tokens:delegated`    | Use delegated tokens        |
| `vault.sessions:read` | Read vault sessions         |
| `sensitive:execute`   | Execute sensitive actions   |
| `audit:read`          | Read audit events           |
| `broker:read`         | Read broker status          |
| `broker:access`       | Request brokered tokens     |
| `cache:inspect`       | Inspect token cache         |

These scopes are requested by M2M clients and validated by the backend. They align with the `PermissionScope` type in the authorization package.

---

## Auth0 Actions (Token Enrichment)

### Post-Login Action: `actbound-post-login-enrich`

Enriches user access tokens with custom claims:

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://actbound.ai/";
  const roles = event.user.app_metadata?.roles || ["viewer"];

  api.accessToken.setCustomClaim(`${namespace}principal_type`, "user");
  api.accessToken.setCustomClaim(`${namespace}roles`, roles);
  api.accessToken.setCustomClaim(`${namespace}tenant_id`, "tenant_default");
};
```

### Client Credentials Action: `actbound-m2m-enrich`

Enriches M2M access tokens:

```javascript
exports.onExecuteCredentialsExchange = async (event, api) => {
  const namespace = "https://actbound.ai/";
  const metadata = event.client.metadata || {};

  api.accessToken.setCustomClaim(
    `${namespace}principal_type`,
    metadata.principal_type || "service",
  );
  api.accessToken.setCustomClaim(`${namespace}roles`, [
    metadata.role || "service",
  ]);
  api.accessToken.setCustomClaim(
    `${namespace}tenant_id`,
    metadata.tenant_id || "tenant_default",
  );

  if (metadata.service_name) {
    api.accessToken.setCustomClaim(
      `${namespace}service_name`,
      metadata.service_name,
    );
  }
  if (metadata.agent_type) {
    api.accessToken.setCustomClaim(
      `${namespace}agent_type`,
      metadata.agent_type,
    );
  }
  if (metadata.agent_instance_id) {
    api.accessToken.setCustomClaim(
      `${namespace}agent_instance_id`,
      metadata.agent_instance_id,
    );
  }
};
```

---

## Token Broker Pattern (Required)

The token broker in `services/orchestrator-api` is the **required pattern** for all machine token issuance. This applies to the dev setup and future production deployment.

### Why

Auth0 Pro has M2M token rate limits. Direct M2M minting from every service/agent on every request will exhaust the quota. The broker pattern mitigates this.

### How It Works

```
Service needs M2M token
    │
    ▼
orchestrator-api token broker
    │
    ├── Check cache (Redis or in-memory)
    │   ├── Cache hit → return cached token metadata
    │   └── Cache miss → mint new token from Auth0
    │                     → cache with TTL
    │
    ▼
Return safe token metadata only (never raw JWT to UI)
```

### Rules

1. **No direct client-to-Auth0 M2M minting as the normal pattern.** All normal M2M token issuance goes through the orchestrator token broker.
2. **Broker is cache-first until expiry.** Tokens are reused until their TTL expires, reducing Auth0 API calls.
3. **UI receives safe token metadata only.** The frontend never sees raw M2M JWTs. It sees: source, audience, scopes, expiry, cache status.
4. **Delegated tokens (Token Vault) follow the same broker path** but are routed through the delegated-access module before issuance.
5. **This dev pattern is the future production migration pattern.** Services that adopt the broker now will not need re-architecture for production.

### Token Lifetime

| Token type             | Lifetime   | Refresh strategy                           |
| ---------------------- | ---------- | ------------------------------------------ |
| User access token      | 15 minutes | Rotating refresh token (handled by SPA)    |
| M2M token (via broker) | 1 hour     | Broker re-mints on cache miss after expiry |

---

## Local/Dev Environment Variables

These are documented in `.env.example`. Copy to your service-specific `.env` file and fill in real values.

### services/orchestrator-api/.env

```
# Auth0
AUTH0_DOMAIN=dev-6az71xw7wqwtmp0q.us.auth0.com
AUTH0_ISSUER_BASE_URL=https://dev-6az71xw7wqwtmp0q.us.auth0.com/
AUTH0_AUDIENCE=https://api.actbound.dev
AUTH0_M2M_CLIENT_ID=<from actbound-m2m app>
AUTH0_M2M_CLIENT_SECRET=<from actbound-m2m app>
```

### services/agent-service/.env

```
# Auth0 (JWT validation only — no M2M minting)
AUTH0_DOMAIN=dev-6az71xw7wqwtmp0q.us.auth0.com
AUTH0_ISSUER_BASE_URL=https://dev-6az71xw7wqwtmp0q.us.auth0.com/
AUTH0_AUDIENCE=https://api.actbound.dev
```

### apps/web/.env.local

```
VITE_AUTH0_DOMAIN=dev-6az71xw7wqwtmp0q.us.auth0.com
VITE_AUTH0_CLIENT_ID=<from actbound-web app>
VITE_AUTH0_AUDIENCE=https://api.actbound.dev
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/callback
VITE_ORCHESTRATOR_API_URL=http://localhost:3001
```

---

## Future Trupryce-Prod Rollout Pattern

This section documents the migration pattern only. **None of this is applied to trupryce-prod.**

### Checklist (apply only when ready)

- [ ] Inventory current Trupryce M2M clients and their direct Auth0 minting patterns
- [ ] Deploy token broker in the Trupryce orchestrator service
- [ ] Route normal M2M issuance through the broker (cache-first)
- [ ] Reduce direct Auth0 M2M minting to broker-only
- [ ] Keep delegated (Token Vault) and M2M flows distinct in the broker
- [ ] Review and scope-limit M2M client permissions before rollout
- [ ] Monitor Auth0 M2M token usage dashboard for quota relief
- [ ] Document per-service migration status

### Why This Pattern Transfers

The ActBound broker is designed to be the same pattern Trupryce services will adopt:

- Same cache-first architecture
- Same safe metadata response shape
- Same delegated vs M2M routing
- Same Redis + in-memory fallback
- Same authorization check before token issuance

Building it now for ActBound means the pattern is proven and tested before Trupryce production adoption.

---

## Provisioning Status

### Created via Auth0 MCP (2026-04-03)

| Resource                  | Name                            | Auth0 ID                                      | Status                   |
| ------------------------- | ------------------------------- | --------------------------------------------- | ------------------------ |
| Resource Server (API)     | `actbound-api`                  | `69d050f9994b959308631940`                    | Created with 14 scopes   |
| SPA Application           | `actbound-web`                  | Client ID: `VKm1ClfzHqI0VSKtjtzAtBDbgeBXAVLp` | Created                  |
| M2M Application           | `actbound-m2m`                  | Client ID: `ljGntsIp3TqZrXxvvdjNzH9MONSX68OQ` | Created                  |
| Client Grant              | `actbound-m2m` → `actbound-api` | Grant ID: `cgr_MY5TQLVlroRC90QH`              | All 14 scopes authorized |
| Post-Login Action         | `actbound-post-login-enrich`    | `17783d8a-6bca-4790-a320-1f20b9e2ac15`        | Built and deployed       |
| Client Credentials Action | `actbound-m2m-enrich`           | `e56b8036-1506-470d-b729-13dbe28c4a82`        | Built and deployed       |

### Remaining Manual Steps

| Step                                       | Status | How                                                                                           |
| ------------------------------------------ | ------ | --------------------------------------------------------------------------------------------- |
| Bind Post-Login Action to Login flow       | Manual | Auth0 Dashboard → Actions → Flows → Login → Drag `actbound-post-login-enrich` into flow       |
| Bind M2M Action to Client Credentials flow | Manual | Auth0 Dashboard → Actions → Flows → Machine to Machine → Drag `actbound-m2m-enrich` into flow |
| Create demo users                          | Manual | Auth0 Dashboard → User Management → Users → Create User                                       |
| Set user `app_metadata.roles`              | Manual | Auth0 Dashboard → Users → user → app_metadata → `{"roles": ["operator"]}`                     |

**Note:** Actions are deployed but must be manually bound to their respective flows in the Auth0 Dashboard. The MCP API can create and deploy actions but cannot bind them to flows.
