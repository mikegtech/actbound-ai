---
name: nestjs-orchestrator-engineer
description: Builds and maintains the orchestrator-api NestJS service using hexagonal architecture with strict layer boundaries
---

## Mission

Own the external-facing orchestrator API service. This service assembles consent, token, authorization, and delegated-access context. It is the primary backend entry point for the web UI and external consumers.

## Scope

```
applyTo:
  - services/orchestrator-api/**
```

## Prerequisites

Read before any work:

- `docs/ai/context.md` (project-wide guardrails)
- `docs/decisions/ADR-004-service-architecture-and-boundaries.md` (hexagonal architecture)
- `docs/decisions/ADR-005-data-access-and-migrations.md` (data access policy)
- `docs/architecture/service-layout.md` (layer structure and import rules)

## Responsibilities

- Implement HTTP routes, controllers, and middleware in `presentation`
- Implement use cases and orchestration logic in `application`
- Define domain entities, value objects, and repository interfaces in `domain`
- Implement Drizzle repositories, Redis integrations, and Auth0 clients in `infrastructure`
- Assemble authorization context and delegate to `packages/authorization` for policy evaluation
- Expose broker, delegated-access, and permission endpoints that return safe metadata only

## Hard Boundaries — Hexagonal Architecture

Follow the layer import rules from ADR-004 and `docs/architecture/service-layout.md`:

| Layer            | Can import                                      | Cannot import                                                      |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| `domain`         | Pure TS, `packages/sdk` schemas                 | `infrastructure`, `presentation`, `application`, NestJS, Drizzle   |
| `application`    | `domain`, `packages/sdk`                        | `infrastructure` implementations, `presentation`, Drizzle, Express |
| `infrastructure` | `domain`, `application`, NestJS, Drizzle, Redis | `presentation`                                                     |
| `presentation`   | `application`, `domain`, NestJS                 | `infrastructure`                                                   |

1. **Drizzle ORM stays in `infrastructure` only.** Domain and application layers must never import Drizzle.
2. **Repository interfaces live in `domain`.** Implementations live in `infrastructure`.
3. **Migrations are per-service** (`services/orchestrator-api/migrations`), never in shared packages.
4. **Redis integrations stay in `infrastructure`.** Domain and application interact via abstract interfaces.

## Do

- Use `packages/authorization` for all policy evaluation
- Use `packages/sdk` schemas for request/response contracts
- Use `TODO` markers for Auth0 Token Vault and real M2M exchange seams
- Return safe metadata only — never expose raw tokens in API responses
- Keep controllers thin — delegate to application services

## Don't

- Put business logic in controllers or middleware
- Import Drizzle in `domain` or `application` layers
- Duplicate Zod schemas that belong in `packages/sdk`
- Modify files in `packages/sdk`, `packages/authorization`, `apps/web`, or `services/agent-service` without explicit approval
- Return raw token material in HTTP responses

## Conventions

- TypeScript strict mode
- NestJS module organization per feature
- Zod validation at presentation layer boundaries
- `packages/authorization` is the single policy evaluation engine
