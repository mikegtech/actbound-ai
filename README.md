# ActBound AI

ActBound AI is scaffolded as a `pnpm` monorepo with a React frontend, two NestJS services, shared zod contracts, and a centralized authorization package.

## Workspace Layout

```text
/apps
  /web
/services
  /orchestrator-api
  /agent-service
/packages
  /authorization
  /sdk
  /ui
  /config
/docs
/infra
/.github
/scripts
```

## Architecture Notes

- `packages/authorization` is the single permission catalog and policy engine.
- `packages/sdk` owns shared zod schemas, TypeScript DTOs, route contracts, typed clients, and OpenAPI document generation. It is entirely framework-agnostic (zero NestJS/Drizzle/persistence imports).
- `services/orchestrator-api` is the external-facing API. It assembles authorization context from request metadata, exposes permission decisions for the UI, and contains TODO markers for Auth0 Token Vault integration.
- `services/orchestrator-api` also hosts a cache-first token broker foundation for safe broker preview, token metadata retrieval, and cache inspection flows.
- `services/agent-service` re-checks protected operations using the shared authorization package before returning placeholder domain responses.
- `apps/web` consumes permission decisions returned by the backend and does not contain raw policy rules.
- **Strict Service Boundaries**: Both backend services enforce Hexagonal Architecture (`domain`, `application`, `infrastructure`, `presentation`). All database access, migrations, and caching occur exclusively within the `infrastructure` layers. Refer to `docs/decisions/ADR-004-service-architecture-and-boundaries.md` and `docs/decisions/ADR-005-data-access-and-migrations.md`.

## Permission System

Phase 2 centers authorization in `packages/authorization`.

- The package defines typed actors, subjects, resources, actions, scopes, permission context, decisions, and decision reasons.
- `orchestrator-api` evaluates user-facing permission decisions and returns them to the web app.
- `agent-service` re-enforces protected placeholder operations with the same shared engine instead of trusting upstream assumptions.
- Auth0 delegated-consent and Token Vault exchange points remain explicit `TODO` integration seams rather than placeholder policy logic in the UI.

## Token Broker Foundation

Phase 3 adds a broker foundation in `services/orchestrator-api`.

- Token requests are normalized into safe broker intent objects before any cache or issuance path is selected.
- The broker computes a stable cache key from non-secret request characteristics, checks Redis first when configured, and falls back to an in-memory cache for local development.
- Responses return safe metadata only: cache hit or miss, source, source type, audience, scopes, expiration, actor summary, and subject summary.
- Real Auth0 client credentials exchange and Auth0 Token Vault delegated retrieval remain explicit TODO seams.

## Delegated Access Foundation

Phase 4 adds a delegated-access foundation in `services/orchestrator-api`.

- Shared models now cover provider connections, delegated grants, consent summaries, vault sessions, revocation intent, and sensitive-action classification.
- The orchestrator exposes safe placeholder endpoints for `GET /connections`, `POST /connections/connect`, `POST /connections/:id/revoke`, `GET /consents`, `POST /consents/preview`, and `GET /vault/sessions`.
- The token broker routes delegated requests through that delegated-access model before selecting the placeholder issuance path.
- Sensitive delegated actions can return structured `step_up_required` decisions without exposing secrets or raw token material.

## Getting Started

```bash
pnpm install
docker compose up -d redis
pnpm dev:orchestrator
pnpm dev:agent
pnpm dev:web
```

Run tests and coverage checks:

```bash
pnpm test
pnpm test:coverage
```

OpenAPI JSON is exposed at:

- `http://localhost:3001/docs/openapi.json`
- `http://localhost:3002/docs/openapi.json`

Generate static OpenAPI artifacts:

```bash
pnpm openapi:generate
```

Additional architecture notes:

- Redis is optional for local work. If `REDIS_URL` is not configured or Redis is unavailable, the broker uses an in-memory fallback.
- Broker design notes live in `docs/token-broker.md`.
- Delegated-access design notes live in `docs/delegated-access.md`.

## Dependency Consistency

Syncpack is used as a workspace guard to keep shared dependency versions aligned and to catch version drift in pull requests before it leaks into multiple packages.

- `pnpm syncpack:lint` validates the repo against the root Syncpack policy and should run in CI.
- `pnpm syncpack:fix` rewrites package manifests when duplicated dependency versions drift out of alignment.
- External npm dependencies intentionally use caret ranges in this repo. That keeps controlled minor and patch upgrades available while Syncpack prevents packages from silently diverging.
- Local `@actbound/*` links intentionally stay on `workspace:*` and are excluded from semver-range enforcement.
