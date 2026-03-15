# Architecture

## Authorization Flow

1. `orchestrator-api` derives a request authorization context from headers and placeholder consent/token values.
2. `packages/authorization` evaluates typed permissions against roles and scope requirements.
3. `apps/web` reads the resolved permission decisions from `GET /me/permissions`.
4. `agent-service` independently re-checks sensitive operations with the same policy engine before returning a result.

## Contract Strategy

- zod schemas in `packages/sdk/src/schemas` define runtime validation and exported TypeScript DTOs.
- route contracts in `packages/sdk/src/contracts` provide a shared API surface for controllers, clients, and OpenAPI generation.
- OpenAPI documents are generated with `@asteasolutions/zod-to-openapi`, not duplicated Nest Swagger DTO classes.

## Current Placeholder Boundaries

- Auth context assembly is header-driven for now.
- Auth0 Token Vault integration is intentionally marked as TODO in the orchestrator middleware and execution path.
- Redis is provisioned in `docker-compose.yml` for future queue/session/cache work.
