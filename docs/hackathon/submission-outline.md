# Hackathon Submission Outline

## Judging Criteria Mapping

### Security Model

| What we built                                                                                                                                      | How it scores                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Centralized policy engine (`packages/authorization`) with 21 typed permissions, 18 decision reason codes, and structured `allow/deny` with reasons | Authorization is explicit, auditable, and centralized — not scattered across services |
| Token broker with cache-first pattern, safe metadata responses, and separate M2M vs delegated paths                                                | Token Vault tokens never leak to the frontend; broker mitigates Auth0 rate limits     |
| Hexagonal architecture with strict layer boundaries (ADR-004)                                                                                      | Domain logic is isolated from infrastructure; no persistence in business logic        |
| Secret scanning (gitleaks), SAST (CodeQL, Semgrep), dependency review, SHA-pinned actions                                                          | CI/CD pipeline enforces security at every layer                                       |
| Agent per-instance identity model (ADR-007) with kill-switch capability                                                                            | Compromised agents can be surgically revoked without affecting others                 |

### User Control

| What we built                                                                                                    | How it scores                                                          |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `GET /me/permissions` — backend-evaluated permission decisions returned to the UI                                | Users see exactly what they can and cannot do, computed by the backend |
| `GET /me/activity` — user-scoped activity timeline with allowed/denied/step-up indicators                        | Users see what happened, who acted, and whether it was authorized      |
| `GET /me/control-summary` — aggregated dashboard with permission counts, connected accounts, grants, revocations | Single view of the user's access posture                               |
| Provider connection and revocation flow (`POST /connections/connect`, `POST /connections/:id/revoke`)            | Users can connect and revoke third-party access                        |
| Consent preview with step-up requirements (`POST /consents/preview`)                                             | Users understand what sensitive actions require before they happen     |

### Technical Execution

| What we built                                                                            | How it scores                                                 |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| pnpm monorepo with 7 workspace packages, shared Zod contracts, OpenAPI generation        | Clean architecture with typed contracts across all boundaries |
| NestJS hexagonal services with domain/application/infrastructure/presentation separation | Professional service architecture                             |
| Vitest test suite with 54 tests covering authorization engine and token broker           | Policy engine has 100% line coverage                          |
| Pre-commit hooks (gitleaks, prettier, eslint, syncpack), CI with 4 workflow files        | Quality enforced at every commit and PR                       |
| Auth0 dev tenant provisioned with SPA, API, M2M, token enrichment actions                | Real Auth0 integration scaffolded with explicit TODO seams    |

### Design

| What we built                                                                                                                              | How it scores                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| React dashboard with 7 interactive panels showing permissions, context, delegated access, broker, actions, user control, activity timeline | Clear, demo-friendly UI that tells the security story            |
| Backend-driven UI — no policy logic in React, all decisions from API responses                                                             | Clean separation of concerns visible in the code                 |
| Structured decision explanations with reason codes                                                                                         | Users and developers can understand every authorization decision |

### Potential Impact

| What we built                                               | How it scores                                                              |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| Token broker pattern that reduces Auth0 M2M quota usage     | Directly applicable to any Auth0 Pro customer's cost management            |
| Agent authorization model with delegation intersection rule | Reusable pattern for any platform with AI agents acting on behalf of users |
| Observable authorization with structured audit trail        | Any regulated industry needs this for compliance                           |

### Insight Value

| What we built                                                                          | How it scores                                                                           |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Token Vault positioned as delegated-access sidecar, not general secret store (ADR-009) | Clear thinking about the boundary between user-delegated and platform-owned credentials |
| Token broker as M2M rate-limit mitigation pattern                                      | Practical insight for Auth0 Pro customers                                               |
| Per-agent-instance identity with kill-switch (ADR-007)                                 | Insight into how AI agent identity should work at scale                                 |
| 43 ADRs documenting every architectural decision                                       | Shows depth of thought behind the implementation                                        |

## Implementation Status

| Feature                                                              | Status      | Notes                                                   |
| -------------------------------------------------------------------- | ----------- | ------------------------------------------------------- |
| Authorization engine (21 permissions, 18 reason codes)               | Implemented | 100% line coverage on engine                            |
| Token broker (M2M + delegated, cache-first, Redis fallback)          | Implemented | Placeholder token issuance, real Auth0 exchange is TODO |
| Delegated access (connections, consents, vault sessions, revocation) | Implemented | Placeholder data, real Token Vault API is TODO          |
| User control dashboard (permissions, activity, control summary)      | Implemented | Demo-seeded activity events                             |
| Auth0 dev tenant                                                     | Provisioned | SPA, API, M2M, actions deployed; flow binding is manual |
| Auth0 Universal Login integration                                    | TODO        | Header-based auth context for demo                      |
| Real Token Vault API calls                                           | TODO        | Explicit seams in orchestrator                          |
| Real M2M client credentials exchange                                 | TODO        | Explicit seams in token broker                          |
| Step-up authentication                                               | TODO        | Decision model implemented, real Auth0 MFA is TODO      |
