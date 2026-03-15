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
- `packages/sdk` owns shared zod schemas, TypeScript DTOs, route contracts, typed clients, and OpenAPI document generation.
- `services/orchestrator-api` is the external-facing API. It assembles authorization context from request metadata, exposes permission decisions for the UI, and contains TODO markers for Auth0 Token Vault integration.
- `services/agent-service` re-checks protected operations using the shared authorization package before returning placeholder domain responses.
- `apps/web` consumes permission decisions returned by the backend and does not contain raw policy rules.

## Permission System

Phase 2 centers authorization in `packages/authorization`.

- The package defines typed actors, subjects, resources, actions, scopes, permission context, decisions, and decision reasons.
- `orchestrator-api` evaluates user-facing permission decisions and returns them to the web app.
- `agent-service` re-enforces protected placeholder operations with the same shared engine instead of trusting upstream assumptions.
- Auth0 delegated-consent and Token Vault exchange points remain explicit `TODO` integration seams rather than placeholder policy logic in the UI.

## Getting Started

```bash
pnpm install
pnpm dev:orchestrator
pnpm dev:agent
pnpm dev:web
```

OpenAPI JSON is exposed at:

- `http://localhost:3001/docs/openapi.json`
- `http://localhost:3002/docs/openapi.json`

Generate static OpenAPI artifacts:

```bash
pnpm openapi:generate
```

## Dependency Consistency

Syncpack is used as a workspace guard to keep shared dependency versions aligned and to catch version drift in pull requests before it leaks into multiple packages.

- `pnpm syncpack:lint` validates the repo against the root Syncpack policy and should run in CI.
- `pnpm syncpack:fix` rewrites package manifests when duplicated dependency versions drift out of alignment.
- External npm dependencies intentionally use caret ranges in this repo. That keeps controlled minor and patch upgrades available while Syncpack prevents packages from silently diverging.
- Local `@actbound/*` links intentionally stay on `workspace:*` and are excluded from semver-range enforcement.
