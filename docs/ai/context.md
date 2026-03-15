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

## Current Branch

- Working branch: feat/actbound-foundation
- Planned public branch: hackathon-public

## Current Phase

### Phase 1 - Foundation and Permission-Centric Scaffold

Status: in-progress

### Goals

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

Status: in-progress
Goal: Establish the repo structure, tooling, docs, and baseline apps/services/packages.

### EPIC-002 - Central Permission System

Status: planned
Goal: Create typed resources, actions, policy context, and permission decision evaluation.

### EPIC-003 - Token Broker and M2M Optimization

Status: planned
Goal: Reduce Auth0 M2M token overuse through brokered issuance, caching, and reuse.

### EPIC-004 - Auth0 Token Vault Delegated Access

Status: planned
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
- React chosen for web app
- Orchestrator + service split chosen
- zod-to-openapi selected for contract generation

### In Progress

- Monorepo scaffold
- Repo structure definition
- AI context setup

### Next

- Scaffold apps/web
- Scaffold services/orchestrator-api
- Scaffold services/agent-service
- Add packages/authorization and packages/sdk
- Generate initial shared schemas

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
