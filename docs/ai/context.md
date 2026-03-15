# ActBound AI - AI Context

## Project Summary

ActBound AI lets users safely authorize AI agents to act on their behalf using Auth0 Token Vault. By combining delegated consent, scoped permissions, token protection, and auditability, it turns AI agents into secure operators of real APIs instead of uncontrolled credential consumers.

## Hackathon

Authorized to Act: AI Agents with Auth0

## Hard Requirements

- Must use Auth0 Token Vault
- Public code repository required
- Public app/demo link required
- Demo video must be under 3 minutes
- Submission materials must be in English
- Judges score equally on:
  - Security Model
  - User Control
  - Technical Execution
  - Design
  - Potential Impact
  - Insight Value

## Architecture Direction

- apps/web = React UI
- services/orchestrator-api = external-facing orchestration service
- services/agent-service = protected internal service
- packages/authorization = central permission model and policy evaluation
- packages/sdk = shared Zod schemas, DTOs, typed clients, OpenAPI generation
- packages/ui = shared presentational components
- packages/config = shared tooling configuration

## Architecture Principles

1. Backend authorization enforcement is the source of truth
2. UI consumes permission decisions, not raw authorization rules
3. Permission logic must be centralized and typed
4. Orchestrator assembles consent, token, and authorization context
5. Agent service re-enforces protected operations
6. Shared Zod schemas are the contract source of truth
7. Use zod-to-openapi to reduce DTO/OpenAPI duplication
8. Keep the implementation lightweight and hackathon-friendly, but production-aware

## Architecture Decisions Summary & Boundaries

To ensure the codebase scales cleanly across services without circular dependencies and tight coupling, explicit architectural guardrails are established:

- **Service Architecture Policy (`ADR-004`)**: NestJS backend services follow Hexagonal Architecture (Ports and Adapters) with strictly defined `domain`, `application`, `infrastructure`, and `presentation` directories and boundaries. See `docs/architecture/service-layout.md`.
- **SDK Boundary Policy (`ADR-004`)**: `packages/sdk` is strictly framework-agnostic. It must have **zero** NestJS imports, **zero** Drizzle imports, and **zero** persistence logic. It acts as the pure host for shared Zod contracts and OpenAPI generation. `packages/authorization` has similar agnostic goals, minus minor NestJS integration seams.
- **Data Access Policy (`ADR-005`)**: Drizzle ORM and Redis integrations are confined strictly to the `infrastructure` layers of respective backend services. Migrations are owned per-service, not in shared packages.
- **Frontend Policy (`ADR-004`)**: `apps/web` is React-only and safely consumes typed contracts and clients from `packages/sdk`, avoiding leakage of backend logic.

## Current Branch

- Working branch: feat/actbound-foundation
- Planned public branch: hackathon-public

## Current Phase

### Phase 1 - Foundation and Permission-Centric Scaffold

Status: done

GitHub local and pipeline security hardening is complete. Local git hooks (pre-commit, pre-push), CI workflows (lint, build, typecheck, secret scanning, CodeQL, Semgrep, dependency review, actionlint), supply-chain pinning, CODEOWNERS, and security documentation are in place. Branch protection and GitHub-level settings remain manual post-deploy items.

### Phase 2 - Central Permission System

Status: done

The centralized permission system is complete. `packages/authorization` now owns the typed permission model and policy engine, `orchestrator-api` returns backend-issued permission decisions, `agent-service` re-checks protected operations, and the web UI consumes structured decision results without embedding policy rules.

### Phase 3 - Token Broker and M2M Optimization

Status: done

The token broker foundation is complete. `services/orchestrator-api` now exposes broker status, preview, retrieval, and cache-inspection flows, uses Redis with an in-memory fallback, and returns safe token metadata only. Real Auth0 M2M exchange, Token Vault retrieval, and stronger production guardrails remain explicit TODO seams for later phases.

### Phase 4 - Auth0 Token Vault Delegated Access

Status: in-progress

## Current Focus

- Add explicit delegated-access models for provider connections, delegated grants, vault sessions, and consent summaries in the shared packages
- Expose safe placeholder orchestrator endpoints for connections, consent preview, revocation, and vault session inspection without returning secrets
- Connect delegated-access state to the token broker so delegated requests route through the delegated-access model instead of generic placeholders
- Keep delegated-access and broker feature logic aligned with the documented service-layer boundaries while staying demo-ready
- Surface connected accounts, consent state, step-up requirements, and revocation placeholders in the web UI using backend responses only
- Keep Auth0 Token Vault APIs, delegated OAuth completion, and step-up authentication as explicit TODO seams

## Definition of Done - Phase 4

- `docs/ai/context.md` accurately marks Phase 3 complete and Phase 4 in progress
- Shared delegated-access models exist for provider connections, grants, consent summaries, vault sessions, revocation intent, and sensitive-action markers
- `services/orchestrator-api` exposes safe placeholder endpoints for connections, consent preview, revocation, and vault sessions
- `packages/authorization` centrally evaluates delegated access, delegated token usage, revocation, and step-up-sensitive actions
- The token broker understands delegated-access state and returns safe delegated metadata without exposing raw token material
- `apps/web` renders backend-issued delegated-access and broker metadata without embedding policy rules
- README and delegated-access documentation explain the architecture, Token Vault fit, and future Auth0 seams

## Out of Scope for Phase 4

- Real Auth0 Token Vault API calls and production delegated OAuth completion
- Production-grade step-up authentication flows
- Final provider-specific UX, revocation propagation, and long-lived session management
- Final audit UX, submission polish, and demo packaging

### Phase 1 Goals (Completed)

- Scaffold monorepo
- Create apps/web
- Create services/orchestrator-api
- Create services/agent-service
- Create packages/authorization
- Create packages/sdk
- Create packages/ui
- Add shared docs and README
- Add Zod + zod-to-openapi foundation

### Out of Scope

- Final Auth0 Token Vault integration
- Final demo media
- Final polish for submission
- Full production auth flows

## Epics

### EPIC-001 - Foundation Scaffold

Status: done
Goal: Establish the repo structure, tooling, docs, and baseline apps/services/packages.

### EPIC-002 - Central Permission System

Status: done
Goal: Create typed resources, actions, policy context, and permission decision evaluation.

### EPIC-003 - Token Broker and M2M Optimization

Status: done
Goal: Reduce Auth0 M2M token overuse through brokered issuance, caching, and reuse.

### EPIC-004 - Auth0 Token Vault Delegated Access

Status: in-progress
Goal: Implement delegated user authorization and vault-managed token access for agent actions.

### EPIC-005 - Auditability and User Control

Status: planned
Goal: Surface permissions, granted access, action history, and user-visible control points.

### EPIC-006 - Hackathon Submission Readiness

Status: planned
Goal: Finalize story, diagrams, README, public branch, demo flow, and Devpost assets.

## Progress Tracker

### Done

- Project name selected: ActBound AI
- Elevator pitch drafted
- Initial architecture direction decided
- Monorepo scaffold completed
- `apps/web`, `services/orchestrator-api`, and `services/agent-service` created
- `packages/authorization`, `packages/sdk`, `packages/ui`, and `packages/config` created
- Shared Zod + zod-to-openapi contract foundation implemented
- Syncpack guard added for workspace dependency consistency
- Local git hooks: pre-commit (secret scanning, lint, format, hygiene) and pre-push (typecheck)
- CI workflows: lint/build/typecheck, CodeQL, dependency review, gitleaks, actionlint, Semgrep
- Supply-chain hardening: third-party actions SHA-pinned, actionlint installer script SHA-pinned with fail-closed download, semgrep container version-pinned, persist-credentials disabled
- CODEOWNERS for security-sensitive paths
- Public-repo hygiene files present: `.github/CODEOWNERS`, `.env.example`
- Security documentation: local-hooks.md, ci-security.md
- AI guardrails documented in docs/ai/context.md
- Phase 2 central permission system completed across authorization, orchestrator-api, agent-service, sdk contracts, and web UI
- Phase 3 token broker foundation completed across authorization, orchestrator-api, sdk contracts, Redis fallback behavior, and web UI

### In Progress

- Phase 4 delegated-access foundation
- Shared models for connected accounts, delegated grants, vault sessions, and consent preview
- Token broker integration with delegated-access state and step-up-sensitive action checks

### Next

- Auth0 Token Vault delegated access production wiring
- Auditability and user control refinement
- Hackathon submission readiness

## Repo-Wide AI Guardrails

These rules apply to every AI agent and tool operating in this repo.

### 1. No repo-wide write commands without explicit approval

Never run `prettier --write .`, `eslint --fix .`, or any command that reformats or rewrites files across the entire repo. Only use these commands on explicitly named files within the current task scope.

Acceptable:

```bash
pnpm exec prettier --write apps/web/src/App.tsx
pnpm exec eslint --fix services/orchestrator-api/src/routes/health.ts
```

Not acceptable without explicit human approval:

```bash
pnpm exec prettier --write .
pnpm exec eslint --fix .
```

### 2. Only modify files in the current task scope

Do not touch files outside the scope of the task you were given. If a hook or tool reports issues in unrelated files, report the issue — do not fix it unless asked.

### 3. Hooks operate on staged or targeted files

Local git hooks (pre-commit, pre-push) must run against staged files or explicitly targeted files only. They must not trigger repo-wide scans or rewrites during normal development.

### 4. Local hooks are fast scoped checks; CI is the authority

Local hooks are the first line of defense. They catch obvious issues early and keep the developer workflow fast. CI is the authoritative full-repo enforcement layer. Do not add checks to local hooks that belong in CI.

### 5. No reformatting unrelated files to pass a commit

If committing your changes causes a hook failure in unrelated files (docs, config, lockfiles, agent files, etc.), do not reformat or rewrite those files to make the hook pass. Instead:

- Ensure the hook is scoped to staged files only
- If the hook is correctly scoped and the failure is in a file you changed, fix it
- If the failure is in a file you did not change, stop and report

### 6. Stop and report on broad failures

If a hook failure would require changing files outside your task scope, stop and report the issue to the developer. Do not apply broad fixes. Explain what failed, which files are affected, and what the developer should decide.

### 7. Public-branch hygiene and secret prevention are mandatory

This repo will become public. Every commit must be clean of:

- secrets, tokens, API keys, credentials
- .env files (except .env.example)
- private keys and certificates
- internal-only endpoints or references

These controls are non-negotiable and enforced at every layer (local hooks, CI, GitHub settings).

## Implementation Guidance for AI Coding Tools

- Prefer TypeScript
- Keep files small and explicit
- Do not place permission logic directly in React components
- Do not duplicate DTO definitions when shared Zod schemas can be reused
- Use TODO markers for Auth0 integration points
- Keep naming consistent with ActBound AI terminology
- Prefer placeholders with clean interfaces over fake complexity

## Public Repo Guidance

- No secrets
- No internal-only credentials or endpoints
- Keep docs clear and judge-friendly
- Public branch will be created later with no history
