# ActBound AI

**Authorized to Act: AI Agents with Auth0**

ActBound AI is a Zero Trust agent platform that lets users safely authorize AI agents to act on their behalf. Built on Auth0 Token Vault, it combines delegated consent, scoped permissions, token brokerage, and full auditability to turn agents into secure, observable API operators.

## Key Features

- **Centralized Authorization Engine** — 21 typed permissions with structured `allowed/denied` decisions and reason codes
- **Token Broker** — cache-first M2M and delegated token issuance that reduces Auth0 API calls
- **Delegated Access** — provider connections, consent grants, vault sessions, and revocation through Auth0 Token Vault
- **User Control Dashboard** — real-time view of permissions, connected accounts, grants, and activity
- **Activity Timeline** — structured audit trail with authorization decisions, step-up indicators, and agent attribution
- **Observable Security** — every decision is traceable, every agent action is attributable

## Architecture at a Glance

```
apps/web (React)           → Consumes backend-issued decisions only
    │
    ▼
services/orchestrator-api  → External-facing API, token broker, delegated access
    │
    ▼
services/agent-service     → Internal service, re-checks authorization independently
    │
    ▼
packages/authorization     → Centralized policy engine (RBAC + ABAC)
packages/sdk               → Shared Zod schemas, typed clients, OpenAPI generation
```

| Layer              | System             | Role                                                  |
| ------------------ | ------------------ | ----------------------------------------------------- |
| Identity           | Auth0 (Pro)        | Authentication, JWT issuance                          |
| Delegated Access   | Auth0 Token Vault  | User-authorized third-party OAuth tokens              |
| Token Optimization | Token Broker       | Cache-first M2M and delegated token issuance          |
| Authorization      | Centralized Engine | 21 permissions, 18 reason codes, structured decisions |
| Enforcement        | Backend services   | Guard-level enforcement, fail-closed policy           |
| Frontend           | React + CASL       | Advisory UX only — backend is authoritative           |

## Local Setup

```bash
# Install dependencies
pnpm install

# Start Redis (optional — broker falls back to in-memory)
docker compose up -d redis

# Start services
pnpm dev:orchestrator    # port 3001
pnpm dev:agent           # port 3002
pnpm dev:web             # port 5173
```

Open `http://localhost:5173` to see the dashboard.

## Auth0 Setup

The project uses a dedicated Auth0 dev tenant with:

- **actbound-web** — SPA application (PKCE)
- **actbound-api** — Resource server (`https://api.actbound.dev`, 14 scopes, RS256)
- **actbound-m2m** — Machine-to-machine application
- Token enrichment actions for custom claims (`https://actbound.ai/` namespace)

See [docs/auth0-setup.md](docs/auth0-setup.md) for full setup details.

## Token Broker Pattern

All M2M token issuance goes through the orchestrator's token broker:

1. **Cache-first** — check Redis/memory before calling Auth0
2. **Safe metadata only** — the frontend never sees raw JWTs
3. **Delegated routing** — Token Vault requests are separated from M2M flows
4. **Authorization before issuance** — every request is evaluated by the policy engine

This pattern mitigates Auth0 Pro M2M token rate limits while keeping the security model intact.

## User Control and Auditability

Users see:

- **Permission decisions** with structured reason codes (not just allowed/denied)
- **Connected accounts** with consent status and granted scopes
- **Activity timeline** showing all actions, authorization outcomes, and step-up requirements
- **Control summary** with aggregate metrics for their access posture

## Tests and Quality

```bash
pnpm test              # 54 tests
pnpm test:coverage     # Coverage with per-package summary
pnpm lint              # ESLint
pnpm typecheck         # TypeScript strict mode
```

CI runs: lint, format, typecheck, build, test + coverage, secret scanning (gitleaks), SAST (CodeQL + Semgrep), dependency review, workflow linting (actionlint).

## OpenAPI

```bash
pnpm openapi:generate
```

OpenAPI JSON at `http://localhost:3001/docs/openapi.json` and `http://localhost:3002/docs/openapi.json`.

## Architecture Decisions

43 ADRs document every security and architectural decision: [docs/decisions/](docs/decisions/)

Key decisions:

- [ADR-004: Service Architecture](docs/decisions/ADR-004-service-architecture-and-boundaries.md) — Hexagonal architecture
- [ADR-006: Token Strategy](docs/decisions/ADR-006-token-strategy.md) — JWT design, claims, lifetimes
- [ADR-007: Agent Identity](docs/decisions/ADR-007-agent-identity-model.md) — Per-instance identity
- [ADR-009: Token Vault Policy](docs/decisions/ADR-009-token-vault-usage-policy.md) — Delegated access boundary
- [ADR-021: Fail-Closed](docs/decisions/ADR-021-fail-closed-policy.md) — No fail-open authorization path

## Implementation Status

| Phase                                  | Status      |
| -------------------------------------- | ----------- |
| Foundation (monorepo, CI/CD, security) | Complete    |
| Central Permission System              | Complete    |
| Token Broker and M2M Optimization      | Complete    |
| Auth0 Token Vault Delegated Access     | Complete    |
| Auditability and User Control          | Complete    |
| Hackathon Submission Readiness         | In Progress |

**Implemented:** Authorization engine, token broker, delegated access, user control dashboard, activity timeline, Auth0 dev tenant.

**Explicit TODO seams:** Real Auth0 Universal Login, real Token Vault API calls, real M2M client credentials exchange, production step-up authentication. These are clearly marked in the codebase and documented in [docs/auth0-setup.md](docs/auth0-setup.md).

## License

See repository for license details.
