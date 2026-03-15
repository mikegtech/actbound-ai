# Service Layout and Architecture

This document defines the recommended folder structure, architectural boundaries, and import constraints for NestJS services in this repository (e.g., `services/orchestrator-api`, `services/agent-service`).

## Hexagonal Architecture

We use a Hexagonal Architecture (Ports and Adapters) to keep business logic independent of external frameworks, databases, and UI concerns.

### Recommended Folder Structure

```text
src/
  presentation/       # Controllers, Resolvers, HTTP routes, DTO mappers
  application/        # Use cases, Application services, Orchestration logic
  domain/             # Core business models, Entities, Value objects, Repository interfaces
  infrastructure/     # Drizzle ORM setup, Repository implementations, Redis integrations, 3rd party API clients
  main.ts             # Entry point
  app.module.ts       # Root module wiring
```

### Layer Responsibilities

- **`domain`**: Contains pure business logic. Defines entities, value objects, domain events, and interfaces (ports) for repositories or external services.
- **`application`**: Coordinates business use cases. It fetches domain entities via repository interfaces, executes domain logic, and saves the results. It does not know about HTTP or databases.
- **`infrastructure`**: Contains technical implementations for interfaces defined in the domain or application layer. This is where Drizzle ORM queries, Redis caching, Auth0 clients, and NestJS database modules live.
- **`presentation`**: Handles incoming requests (HTTP APIs, GraphQL, Event Subscriptions). It validates input, routes it to the application layer, and maps outgoing domain data back to external DTOs.

## Allowed and Disallowed Imports

To maintain these boundaries, specific layers are restricted from importing others:

| Layer                | Allowed to Import                                     | Disallowed to Import                                                 |
| -------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| **`domain`**         | (Pure TS), `packages/sdk` schemas (if pure)           | `infrastructure`, `presentation`, `application`, NestJS, Drizzle     |
| **`application`**    | `domain`, `packages/sdk`                              | `infrastructure` (implementations), `presentation`, Drizzle, Express |
| **`infrastructure`** | `domain`, `application`, NestJS, Drizzle, Redis, etc. | `presentation`                                                       |
| **`presentation`**   | `application`, `domain`, NestJS                       | `infrastructure`                                                     |

## Specific Component Locations

- **Zod Schemas**: Shared APIs and payloads live in `packages/sdk/src/schemas`. Service-specific internal payloads can live in the `presentation` layer if not exposed externally.
- **OpenAPI Generation**: Managed inside `packages/sdk` utilizing the shared zod contracts (`zod-to-openapi`).
- **Repository Interfaces**: MUST be defined in the `domain` (or `application`) layer.
- **Repository Implementations**: MUST be defined in the `infrastructure` layer.
- **Redis Integration**: MUST be isolated inside the `infrastructure` layer.
- **Database Migrations**: Added per-service, usually tracked in `services/<service-name>/migrations`, owned by the service and not a shared package.

## Shared Packages Constraints

- **`packages/sdk`**:
  - **Forbidden**: NestJS imports, Drizzle imports, Persistence logic, Database drivers.
  - **Allowed**: Pure TypeScript, Zod, OpenAPI generation logic, fetch API clients.
