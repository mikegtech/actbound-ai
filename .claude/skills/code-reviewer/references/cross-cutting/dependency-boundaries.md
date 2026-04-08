# Cross-Cutting Rules — Dependency Boundaries

## Purpose

Use this file whenever a change introduces new imports, new package dependencies, cross-package coupling, shared abstractions, framework leakage, or architectural boundary shifts.

ActBound AI is a layered monorepo. Convenience imports that break boundaries are a real architectural risk.

## Reviewer priorities

1. preserve layering and ownership
2. prevent framework/runtime leakage into shared packages
3. keep frontend, services, and shared packages cleanly separated
4. avoid duplicated cross-cutting logic in the wrong layers
5. prevent hidden coupling that will slow the monorepo down over time

## Flag as blocker

- `packages/sdk` importing NestJS, Drizzle, persistence, or service-local runtime code
- frontend code importing backend-only implementation details
- shared packages importing app/service-local modules in ways that reverse intended dependencies
- bypassing centralized authorization or OpenFGA abstractions with ad hoc local logic
- public-facing service exposure assumptions leaking into internal-only packages
- dependency additions that materially weaken trust boundaries

## Flag as high severity

- new cross-package imports that create unclear ownership
- duplicated policy or contract logic across layers
- shared packages absorbing domain-specific service behavior
- configuration or utility packages turning into catch-all dumping grounds
- mixed-path PRs that introduce hidden coupling without clear need

## Review for

- allowed dependency direction remains intact
- shared packages stay reusable and focused
- services use shared abstractions instead of copying them
- frontend consumes approved contracts/clients rather than service internals
- cross-cutting concerns are placed in the correct layer
- new dependencies are justified by actual need and correct ownership
- path-specific rules remain aligned with monorepo topology

## Special watch areas

Be strict when reviewing imports or dependency changes touching:

- `packages/sdk`
- `packages/authorization`
- `packages/openfga`
- `services/orchestrator-api`
- `services/agent-service`
- `apps/web`

These are the easiest places to accidentally erode architecture.
