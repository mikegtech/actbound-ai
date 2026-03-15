# ADR 005: Data Access and Migrations

## Status

Accepted

## Context

Our backend services need to persist state, configure schemas, and run migrations. If data access patterns are not strictly controlled, database concerns (ORM models, connection strings, raw SQL) quickly seep into business logic or shared libraries, making the codebase brittle and hard to refactor.

## Decision

We will adhere to the following data access and migration rules:

1. **Drizzle ORM Localization**:
   - Drizzle is our official ORM, query builder, and migration tool.
   - Drizzle dependencies and code MUST **only** exist inside the `infrastructure` layers of our services.
   - `domain`, `application`, and `presentation` layers must never import Drizzle directly.

2. **Migration Ownership**:
   - Database migrations are owned strictly by individual services (e.g., `services/agent-service/migrations`).
   - Migrations must **never** be owned by or placed in shared packages.

3. **Adding Future Databases and Migrations**:
   - When a service requires new tables or schema changes, the developer must add the SQL definitions and Drizzle schema files within that specific service's `infrastructure` layer and generate migrations locally to that service.
   - This prevents a monolithic, highly coupled database schema.

4. **Repository Pattern Enforcement**:
   - **Interfaces**: Repository interfaces (ports) live in the `domain` (or `application`) layer. They use pure TypeScript types and domain entities, detached from any ORM.
   - **Implementations**: Repository implementations (adapters) live in the `infrastructure` layer. They implement the interface using Drizzle and handle mapping between ORM models and domain entities.

5. **Redis Integration**:
   - Similar to the database, Redis clients and caching logic belong exclusively in the `infrastructure` layer. Domain and application services interact with Redis via abstract cache or store interfaces defined in the domain layer.

## Consequences

- **Service Independence**: Services can be deployed with their own independent databases and migration lifecycles. We are prepared for microservices scaling if needed.
- **Pure Domain**: Business rules remain unaware of whether they are reading from Postgres, SQLite, or an in-memory test store.
- **Clear Abstractions**: Changing the database schema or transitioning away from Drizzle would only require rewriting specific infrastructure repository adapters, not the entire application.
