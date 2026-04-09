# Auth0 Setup for ActBound AI

## Tenant Strategy

ActBound AI uses a dedicated production Auth0 tenant with a custom domain.

| Property          | Value                                                                |
| ----------------- | -------------------------------------------------------------------- |
| Production tenant | `actbound-prod.us.auth0.com`                                         |
| Custom domain     | `auth.actbound.ai` (verified, Auth0-managed TLS)                     |
| Audience          | `https://api.actbound.ai`                                            |
| Legacy dev tenant | `dev-6az71xw7wqwtmp0q.us.auth0.com` (shared, retained for reference) |

---

## Auth0 Resources

### 1. Web Application (SPA)

| Property              | Value                                                                |
| --------------------- | -------------------------------------------------------------------- |
| Name                  | `actbound-web`                                                       |
| Client ID             | `eX0WCmvvBuTLIetTRqyTL0Nrkd1mozgV`                                   |
| Type                  | Single Page Application (PKCE)                                       |
| Allowed Callback URLs | `http://localhost:5173/callback`, `https://app.actbound.ai/callback` |
| Allowed Logout URLs   | `http://localhost:5173`, `https://app.actbound.ai`                   |
| Allowed Web Origins   | `http://localhost:5173`, `https://app.actbound.ai`                   |

### 2. API / Resource Server

| Property              | Value                                |
| --------------------- | ------------------------------------ |
| Name                  | `actbound-api`                       |
| ID                    | `69d8010bf763693f9e31d614`           |
| Identifier (audience) | `https://api.actbound.ai`            |
| Signing Algorithm     | RS256                                |
| Token Expiration      | 900 seconds (15 min) for user tokens |
| Skip Consent          | Enabled (first-party app)            |

### 3. Machine-to-Machine Application

| Property       | Value                                      |
| -------------- | ------------------------------------------ |
| Name           | `actbound-m2m`                             |
| Client ID      | `qaht9a6n66vvpz96jJhI72QP4gztQMx2`         |
| Type           | Machine to Machine                         |
| Grant ID       | `cgr_cjOKOUPgxYvOPm0r`                     |
| Authorized API | `actbound-api` (`https://api.actbound.ai`) |
| Scopes         | All 14 scopes                              |

### 4. API Scopes

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

---

## Auth0 Actions (Token Enrichment)

Both actions are deployed and bound to their respective flows.

### Post-Login Action: `actbound-post-login-enrich`

Bound to: **Login flow** (Post Login trigger)

```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = "https://actbound.ai/";
  const roles = event.user.app_metadata?.roles || ["viewer"];

  api.accessToken.setCustomClaim(`${namespace}principal_type`, "user");
  api.accessToken.setCustomClaim(`${namespace}roles`, roles);
  api.accessToken.setCustomClaim(
    `${namespace}tenant_id`,
    event.user.app_metadata?.tenant_id || "default",
  );
};
```

### Client Credentials Action: `actbound-m2m-enrich`

Bound to: **Machine to Machine flow** (Credentials Exchange trigger)

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
    metadata.tenant_id || "default",
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

The token broker in `services/orchestrator-api` is the **required pattern** for all machine token issuance.

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

### Token Lifetime

| Token type             | Lifetime   | Refresh strategy                           |
| ---------------------- | ---------- | ------------------------------------------ |
| User access token      | 15 minutes | Rotating refresh token (handled by SPA)    |
| M2M token (via broker) | 1 hour     | Broker re-mints on cache miss after expiry |

---

## User Management

Users self-register via Auth0 Universal Login (Sign Up on the login screen). The `actbound-post-login-enrich` action assigns default roles `["viewer"]` on first login.

To assign elevated roles, set `app_metadata.roles` in the Auth0 Dashboard:

- User Management → Users → select user → `app_metadata` → `{"roles": ["admin"]}`
- Or set `app_metadata.tenant_id` for multi-tenant assignment

---

## Environment Variables

### services/orchestrator-api/.env

```
AUTH0_DOMAIN=auth.actbound.ai
AUTH0_AUDIENCE=https://api.actbound.ai
AUTH0_M2M_CLIENT_ID=qaht9a6n66vvpz96jJhI72QP4gztQMx2
AUTH0_M2M_CLIENT_SECRET=<from Auth0 Dashboard>
```

### apps/web/.env.local

```
VITE_AUTH0_DOMAIN=auth.actbound.ai
VITE_AUTH0_CLIENT_ID=eX0WCmvvBuTLIetTRqyTL0Nrkd1mozgV
VITE_AUTH0_AUDIENCE=https://api.actbound.ai
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/callback
VITE_ORCHESTRATOR_API_URL=http://localhost:3001
```

---

## Multi-Issuer Architecture

The platform supports multiple trusted OIDC identity providers per tenant (ADR-047). Auth0 is the first provider (Tier 1). Keycloak is the next intended provider (Phase 13).

The JWT middleware validates tokens from any trusted issuer via the trusted issuer registry, normalizes claims via the claim normalization pipeline, and resolves identity bindings (`issuer|sub` → `internal_subject_id`). Authorization is provider-agnostic after normalization.

See: `services/orchestrator-api/src/domain/identity/` for the multi-issuer domain types.

---

## Provisioning via MCP

All Auth0 resources were provisioned via the Auth0 MCP server (`@auth0/auth0-mcp-server`). To re-provision in a new tenant:

1. Point MCP at the new tenant (update `.mcp.json`)
2. Create resource server with `https://api.actbound.ai` audience
3. Create SPA and M2M applications
4. Create M2M → API grant with all 14 scopes
5. Create and deploy both actions
6. Bind actions to flows (Dashboard: Actions → Triggers)
7. Configure custom domain + DNS CNAME
