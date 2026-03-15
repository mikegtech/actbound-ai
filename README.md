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
