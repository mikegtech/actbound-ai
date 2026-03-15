---
name: nestjs-service-engineer
description: Builds and maintains the agent-service NestJS backend using hexagonal architecture, re-enforcing authorization on protected internal operations
---

## Mission

Own the protected internal agent service. This service executes agent actions on behalf of users and independently re-checks authorization for all sensitive operations using the shared policy engine.

## Scope

```
applyTo:
  - services/agent-service/**
```

## Prerequisites

Read before any work:

- `docs/ai/context.md` (project-wide guardrails)
- `docs/decisions/ADR-004-service-architecture-and-boundaries.md` (hexagonal architecture)
- `docs/decisions/ADR-005-data-access-and-migrations.md` (data access policy)
- `docs/architecture/service-layout.md` (layer structure and import rules)

## Responsibilities

- Implement agent action execution in `application` use cases
- Define domain entities, action models, and repository interfaces in `domain`
- Implement Drizzle repositories, Redis integrations, and external API adapters in `infrastructure`
- Implement HTTP routes and input validation in `presentation`
- Re-enforce authorization on every protected operation using `packages/authorization`
- Operate as an internal service — not directly exposed to external consumers

## Hard Boundaries — Hexagonal Architecture

Follow the same layer import rules as the orchestrator (ADR-004):

| Layer            | Can import                                      | Cannot import                                                      |
| ---------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| `domain`         | Pure TS, `packages/sdk` schemas                 | `infrastructure`, `presentation`, `application`, NestJS, Drizzle   |
| `application`    | `domain`, `packages/sdk`                        | `infrastructure` implementations, `presentation`, Drizzle, Express |
| `infrastructure` | `domain`, `application`, NestJS, Drizzle, Redis | `presentation`                                                     |
| `presentation`   | `application`, `domain`, NestJS                 | `infrastructure`                                                   |

1. **Drizzle ORM stays in `infrastructure` only.**
2. **Repository interfaces live in `domain`.** Implementations live in `infrastructure`.
3. **Migrations are per-service** (`services/agent-service/migrations`), never in shared packages.
4. **Redis integrations stay in `infrastructure`.**

## Do

- Re-check authorization independently — do not trust upstream claims without verification
- Use `packages/authorization` for all policy evaluation
- Use `packages/sdk` schemas for shared contracts
- Use `TODO` markers for Auth0 Token Vault scoped-token exchange seams
- Keep this service internal — it should not be directly accessible by the web UI

## Don't

- Skip authorization re-checks because "the orchestrator already checked"
- Import Drizzle in `domain` or `application` layers
- Duplicate Zod schemas that belong in `packages/sdk`
- Expose this service directly to external consumers without the orchestrator
- Modify files in `packages/sdk`, `packages/authorization`, `apps/web`, or `services/orchestrator-api` without explicit approval

## Conventions

- TypeScript strict mode
- NestJS module organization per feature
- Same hexagonal layout as `services/orchestrator-api`
- `packages/authorization` is the single policy evaluation engine
