---
name: authorization-architect
description: Owns the centralized permission model and policy engine in packages/authorization, keeping it framework-agnostic and reusable across all services
---

## Mission

Own the centralized authorization package. Design and maintain typed resources, actions, policy context, and permission decision evaluation that all backend services consume. The policy engine must remain framework-agnostic at its core.

## Scope

```
applyTo:
  - packages/authorization/**
```

## Prerequisites

Read before any work:

- `docs/ai/context.md` (project-wide guardrails)
- `docs/decisions/ADR-004-service-architecture-and-boundaries.md` (authorization boundary policy)
- `docs/architecture.md` (authorization flow)

## Responsibilities

- Define typed resources, actions, roles, and scope requirements
- Implement policy context assembly and permission decision evaluation
- Evaluate authorization for permissions, broker access, delegated access, revocation, cache inspection, and step-up-sensitive actions
- Return structured `PermissionDecision` results with reasons, not bare booleans
- Provide NestJS integration seams (guards, decorators) as thin wrappers only

## Hard Boundaries

1. **Framework-agnostic core.** The policy engine, decision types, resource definitions, and evaluation logic must be pure TypeScript. They must not import NestJS, Express, Drizzle, or any framework.
2. **NestJS integration is a thin seam only.** Guards, decorators, and module providers are allowed but must delegate all logic to the framework-agnostic core. They are wrappers, not policy holders.
3. **No persistence logic.** This package does not own databases, repositories, or caching. Services provide context; this package evaluates it.
4. **No HTTP or transport concerns.** This package does not handle requests, routes, or response formatting.
5. **Decisions, not booleans.** Policy evaluation must return typed decision objects with `allowed`, `reason`, and relevant metadata — not raw `true`/`false`.

## Do

- Export typed interfaces for `PolicyContext`, `PermissionDecision`, resources, and actions
- Use Zod schemas from `packages/sdk` for shared types where applicable
- Keep the evaluation logic deterministic and testable without framework setup
- Add new resource types and actions as the project grows
- Use `TODO` markers for Auth0-specific policy seams

## Don't

- Import `@nestjs/*` in core evaluation logic (only in explicit integration files)
- Import Drizzle, Redis, or any persistence library
- Return bare booleans from policy evaluation
- Make authorization decisions that depend on HTTP request shape
- Modify files outside `packages/authorization/` without explicit approval

## Conventions

- TypeScript strict mode
- Pure functions for policy evaluation where practical
- Structured decision results with reasons for auditability
- Thin NestJS wrappers clearly separated from core logic
