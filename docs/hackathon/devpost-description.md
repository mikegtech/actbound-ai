# Devpost Project Description

## Short Description (300 characters max)

ActBound AI is a Zero Trust agent platform that lets users safely authorize AI agents to act on their behalf. Built on Auth0 Token Vault, it combines delegated consent, scoped permissions, token brokerage, and full auditability to turn agents into secure, observable API operators.

## Inspiration

AI agents are increasingly given access to user accounts — email, calendars, CRMs, financial tools. But most implementations treat agent credentials as shared secrets with little visibility into what agents do or why they were allowed to do it.

We asked: what if every agent action was authorized, attributed, and auditable? What if users could see exactly what their agents can do, what they did, and revoke access at any time?

Auth0 Token Vault gave us the missing piece: delegated OAuth token management that keeps user credentials out of our database entirely.

## What It Does

ActBound AI demonstrates a secure agent platform where:

- **Users connect third-party providers** through Auth0 Token Vault — OAuth tokens are stored and managed by Auth0, not by the application
- **A centralized policy engine** evaluates 21 typed permissions with structured reason codes for every request
- **A cache-first token broker** reduces Auth0 M2M API calls while keeping delegated and machine token flows distinct
- **Every authorization decision is observable** — users see what happened, who acted, whether it was allowed or denied, and why
- **Step-up authentication** is modeled for sensitive actions — the system knows when to ask for more verification before proceeding
- **Users control their access posture** through a dashboard showing permissions, connected accounts, active grants, and revocation history

## How We Built It

**Architecture:**

- **Monorepo** (pnpm workspaces): React frontend, NestJS orchestrator API, NestJS agent service, shared authorization package, shared SDK with Zod contracts and OpenAPI generation
- **Auth0 Token Vault**: delegated third-party OAuth token storage (Google, Slack, GitHub connections)
- **Token Broker**: cache-first M2M and delegated token issuance through the orchestrator, reducing direct Auth0 API calls
- **Centralized Authorization**: typed policy engine with RBAC + ABAC evaluation, designed for future OpenFGA integration
- **Hexagonal Architecture**: strict domain/application/infrastructure/presentation layer boundaries in backend services

**Security:**

- Pre-commit secret scanning (gitleaks), SAST (CodeQL + Semgrep), dependency review, SHA-pinned GitHub Actions
- 43 architecture decision records documenting security boundaries
- Per-agent-instance identity model with kill-switch capability
- Fail-closed authorization policy — no fail-open path

**Tech Stack:**

- TypeScript, React, NestJS, Zod, zod-to-openapi
- Auth0 (Pro), Auth0 Token Vault
- Redis (optional, with in-memory fallback)
- Vitest (54 tests, 100% engine line coverage)
- pnpm, ESLint, Prettier, Syncpack

## Challenges

- **Token limit management**: Auth0 Pro has M2M token rate limits. We solved this with a cache-first broker that reuses tokens until expiry, handling both M2M and delegated flows through a single brokerage layer.
- **Delegation intersection**: When an agent acts on behalf of a user, authorization must check the intersection of agent capability, user consent, and user authorization. Getting this right required modeling three independent scopes and evaluating their intersection at every request.
- **Observable authorization**: Returning structured `allowed/denied + reason code` decisions instead of bare booleans required rethinking the entire authorization pipeline. Every evaluation now produces a decision object with full context.

## What We Learned

- **Token Vault is best positioned as a delegated-access sidecar**, not a general secret store. The boundary between "user-delegated external tokens" and "platform-owned secrets" is fundamental and should be established early.
- **Auditability is a feature, not an afterthought**. When users can see every authorization decision with reason codes, trust in the system increases dramatically.
- **ADRs compound**. Recording 43 architectural decisions made the implementation coherent across 7 workspace packages without drift.

## Built With

Auth0, Auth0 Token Vault, TypeScript, React, NestJS, Zod, Redis, pnpm, Vitest, GitHub Actions, CodeQL, Semgrep, gitleaks

## Try It Out

- **Repository**: [GitHub link — to be added]
- **Live Demo**: [App URL — to be added]
- **Demo Video**: [Video link — to be added]
