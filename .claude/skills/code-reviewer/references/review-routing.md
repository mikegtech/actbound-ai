# Review Routing

## Purpose

ActBound AI is a layered monorepo. The reviewer must route changed files to the correct package/app review rules instead of applying one flat review standard to every path.

Always load:

- `repo-review-profile.md`
- `monorepo-topology.md`
- `protected-paths.md`

Then load package-specific and cross-cutting rules based on changed paths and change type.

## Core path routing

### Frontend SPA

If a PR changes:

- `apps/web/**`

Load:

- `package-rules/apps-web.md`

Also load cross-cutting files when relevant:

- `cross-cutting/api-contracts.md`
- `cross-cutting/auth-and-permissions.md`
- `cross-cutting/testing-expectations.md`
- `cross-cutting/dependency-boundaries.md`

Notes:

- `apps/web` is a standalone SPA that communicates only with `services/orchestrator-api`
- UI consumes backend-issued decisions only
- CASL is advisory UX only
- no imports from `packages/authorization` or `packages/openfga`
- no direct calls to internal microservices

### External-facing gateway and token broker

If a PR changes:

- `services/orchestrator-api/**`

Load:

- `package-rules/services-orchestrator-api.md`

Also load cross-cutting files when relevant:

- `cross-cutting/api-contracts.md`
- `cross-cutting/auth-and-permissions.md`
- `cross-cutting/observability.md`
- `cross-cutting/testing-expectations.md`
- `cross-cutting/dependency-boundaries.md`

Notes:

- this is the public entry point
- broker and delegated access behavior require elevated scrutiny
- fail-closed behavior is mandatory

### Internal agent runtime and backend enforcement

If a PR changes:

- `services/agent-service/**`

Load:

- `package-rules/services-agent-service.md`

Also load cross-cutting files when relevant:

- `cross-cutting/api-contracts.md`
- `cross-cutting/auth-and-permissions.md`
- `cross-cutting/observability.md`
- `cross-cutting/testing-expectations.md`
- `cross-cutting/dependency-boundaries.md`

Notes:

- agent-service must independently re-check authorization
- delegated and independent execution paths must remain distinct
- attribution, audit, and kill-switch semantics are high-scrutiny areas

### Background sync, projections, and reconciliation

If a PR changes:

- `services/sync-service/**`

Load:

- `package-rules/services-sync-service.md`

Also load cross-cutting files when relevant:

- `cross-cutting/api-contracts.md`
- `cross-cutting/auth-and-permissions.md`
- `cross-cutting/observability.md`
- `cross-cutting/testing-expectations.md`
- `cross-cutting/dependency-boundaries.md`

Notes:

- projection and reconciliation logic must be idempotent and replay-safe
- relationship sync must remain separate from identity profile concerns
- DLQ and failure visibility matter

### Centralized authorization engine

If a PR changes:

- `packages/authorization/**`

Load:

- `package-rules/packages-authorization.md`

Also load cross-cutting files when relevant:

- `cross-cutting/auth-and-permissions.md`
- `cross-cutting/testing-expectations.md`
- `cross-cutting/dependency-boundaries.md`

Notes:

- preserve RBAC, ABAC, and OpenFGA separation
- fail-closed behavior is mandatory
- permission widening without explicit intent is a blocker

### OpenFGA model and tuple abstractions

If a PR changes:

- `packages/openfga/**`

Load:

- `package-rules/packages-openfga.md`

Also load cross-cutting files when relevant:

- `cross-cutting/auth-and-permissions.md`
- `cross-cutting/testing-expectations.md`
- `cross-cutting/dependency-boundaries.md`
- `cross-cutting/observability.md`

Notes:

- OpenFGA owns relationships, not full identity or policy ownership
- internal subject normalization must remain stable
- tuple write/delete semantics require elevated scrutiny

### Shared schemas, typed clients, and OpenAPI contracts

If a PR changes:

- `packages/sdk/**`

Load:

- `package-rules/packages-sdk.md`

Also load cross-cutting files when relevant:

- `cross-cutting/api-contracts.md`
- `cross-cutting/testing-expectations.md`
- `cross-cutting/dependency-boundaries.md`

Notes:

- `packages/sdk` must remain pure shared contract code
- zero NestJS
- zero Drizzle
- zero persistence
- schema and client drift are high-risk

### Shared UI primitives

If a PR changes:

- `packages/ui/**`

Load:

- `package-rules/packages-ui.md`

Also load cross-cutting files when relevant:

- `cross-cutting/api-contracts.md`
- `cross-cutting/testing-expectations.md`
- `cross-cutting/dependency-boundaries.md`
- `cross-cutting/auth-and-permissions.md`

Notes:

- presentational and reusable only
- no backend-authoritative authz logic
- no direct coupling to service internals

### Shared repo configuration and standards

If a PR changes:

- `packages/config/**`

Load:

- `package-rules/packages-config.md`

Also load cross-cutting files when relevant:

- `cross-cutting/testing-expectations.md`
- `cross-cutting/dependency-boundaries.md`

Notes:

- config changes are governance changes
- broad blast radius should be assumed

## Repo-wide and platform-sensitive routing

### CI, automation, and repository control plane

If a PR changes:

- `.github/**`
- `.claude/**`
- `scripts/**`
- `Dockerfile*`
- `docker-compose*.yml`
- `docker-compose*.yaml`
- `package.json`
- `pnpm-workspace.yaml`
- `pnpm-lock.yaml`
- `infra/**`

Load:

- `cross-cutting/testing-expectations.md`
- `cross-cutting/dependency-boundaries.md`

Also consult:

- `protected-paths.md`
- `repo-review-profile.md`

Add these cross-cutting files when relevant:

- `cross-cutting/auth-and-permissions.md`
- `cross-cutting/observability.md`

Notes:

- treat repo-wide automation and config changes as high-scrutiny
- secure workflow behavior, secret hygiene, and blast radius matter more than style

### Documentation, ADRs, and architecture guidance

If a PR changes:

- `README.md`
- `docs/**`

Load:

- `repo-review-profile.md`
- `monorepo-topology.md`

Also load cross-cutting files when relevant:

- `cross-cutting/api-contracts.md`
- `cross-cutting/auth-and-permissions.md`
- `cross-cutting/observability.md`

Notes:

- review for architectural consistency
- review for implementation/documentation drift
- if behavior changes without matching doc changes where required, flag it

## Cross-cutting triggers

### Load `cross-cutting/api-contracts.md` when changes include

- DTOs
- request or response schemas
- Zod models
- OpenAPI generation
- typed clients
- route payload changes
- serialization or deserialization behavior
- frontend gateway adapters or contract-facing UI logic

### Load `cross-cutting/auth-and-permissions.md` when changes include

- Auth0 integration
- Keycloak or multi-issuer support
- issuer handling
- claim normalization
- JWT claim parsing
- token broker logic
- delegated access
- consent grants or revocations
- guards
- permission checks
- OpenFGA usage
- RBAC or ABAC logic
- principal typing
- tenant isolation
- session identity propagation

### Load `cross-cutting/observability.md` when changes include

- audit trail behavior
- activity timeline behavior
- structured logs
- tracing
- metrics
- requestId propagation
- workflowId propagation
- authorization decision logging
- security event visibility
- correlation or attribution fields

### Load `cross-cutting/testing-expectations.md` when changes include

- behavior changes without matching tests
- auth or authorization changes
- contract changes
- route changes
- projection or reconciliation logic
- orchestration or enforcement logic
- new dependencies with nontrivial blast radius
- CI/config changes
- mixed-path PRs that alter important boundaries

### Load `cross-cutting/dependency-boundaries.md` when changes include

- new imports across package/app boundaries
- new dependencies in package manifests
- shared package boundary shifts
- framework leakage into shared packages
- frontend imports of backend-only code
- duplicated policy or contract logic across layers
- structural refactors that change layering

## Mixed-path PR rules

If a PR changes multiple monorepo areas:

1. load all matching package rule files
2. load all relevant cross-cutting files
3. check for boundary violations between changed areas
4. check for contract drift between services, packages, and frontend consumers
5. check whether frontend changes improperly assume backend authority
6. check whether shared packages absorb service-local or framework-local concerns
7. require stronger verification than a single-area PR when security, contracts, or enforcement are involved

Mixed-path PRs deserve elevated scrutiny because they are more likely to introduce hidden coupling and partial updates.

## Fallback behavior

If a changed path does not yet have a specific package rule file:

- review using `repo-review-profile.md`
- use `monorepo-topology.md`
- apply `protected-paths.md` if relevant
- load any obviously relevant cross-cutting files
- explicitly note that path-specific review guidance is missing

## Severity guidance for routing-related issues

### Blocker

- changes bypassing centralized authorization or backend enforcement
- frontend becoming authoritative for permissions
- contract changes without required coordinated downstream updates
- boundary violations between apps, services, and shared packages
- fail-open behavior on auth or authorization paths
- sensitive repo-level automation changes that weaken safety or reviewability
- framework or persistence leakage into `packages/sdk`

### High

- missing path-specific tests for meaningful behavioral changes
- unclear ownership across packages
- mixed-path coupling likely to cause drift or maintenance issues
- documentation or generated artifact drift after contract or architecture changes
- incomplete auditability or observability updates for security-relevant behavior

### Advisory

- opportunities to move repeated review guidance into cross-cutting files
- opportunities to split or add package rule files for uncovered paths
- suggestions that improve clarity, maintainability, or reviewer consistency
