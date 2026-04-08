# Protected Paths

These areas require elevated scrutiny because mistakes here can weaken the platform security model, break contracts, or reduce auditability.

## High-risk package and app paths

- `apps/web/src/auth/**`
- `services/orchestrator-api/**`
- `services/agent-service/**`
- `packages/authorization/**`
- `packages/sdk/**`

## Repository and delivery paths

- `.github/**`
- `Dockerfile*`
- `docker-compose*.yml`
- `docker-compose*.yaml`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`

## Docs and architecture paths with governance impact

- `README.md`
- `docs/auth0-setup.md`
- `docs/decisions/**`
- `docs/ai/context.md`

## Elevated reviewer expectations

For changes in protected paths, the reviewer must:

- inspect for behavioral and security impact, not just code quality
- verify that boundary assumptions remain valid
- verify contract or client updates where needed
- verify tests exist or clearly justify absence
- verify observability and audit consequences
- avoid suggesting risky autofixes on policy-sensitive logic

## Default severity guidance

Treat these as blockers unless clearly safe and intentional:

- auth bypass risk
- permission widening
- fail-open behavior
- contract-breaking changes without coordinated updates
- audit trail or attribution regressions
- unsafe automation or CI permission changes
