# ActBound AI — Zero Trust Agent Platform — Program Index

This is the single source of truth for the platform's architecture, decisions, implementation state, and operating rules. All AI agents and human engineers must read this before any work.

---

## 1. Program Overview

**Name:** ActBound AI

**Purpose:** A secure Zero Trust platform that lets users safely authorize AI agents to act on their behalf. By combining delegated consent, scoped permissions, token protection, and auditability, it turns AI agents into secure operators of real APIs instead of uncontrolled credential consumers.

---

## 2. Core Architecture

| Layer            | System                    | Responsibility                                |
| ---------------- | ------------------------- | --------------------------------------------- |
| Identity         | Auth0 (Pro)               | Authentication, JWT issuance, org context     |
| Delegated Access | Auth0 Token Vault         | User-authorized third-party OAuth tokens only |
| Secrets          | AWS Secrets Manager       | Platform secrets + automated rotation         |
| Authorization    | OpenFGA + RBAC + ABAC     | Unified permission decisions                  |
| Enforcement      | Backend services + CASL   | Backend is authoritative; CASL is advisory UX |
| Agents           | Per-instance runtime      | Autonomous + delegated actions                |
| Infrastructure   | AWS + VPS + Tailscale     | Networking, compute, isolation                |
| Observability    | CloudWatch + CloudTrail   | Audit trails, debugging, detection            |
| Resilience       | Backup + DR + fail-closed | Recovery, containment, break-glass            |
| Enablement       | Shared SDKs + templates   | Consistency, reuse, guardrails                |

---

## 3. Repository Structure

```
actbound-ai/
├── apps/
│   └── web/                          # React UI (Vite)
├── services/
│   ├── orchestrator-api/             # External-facing NestJS service
│   ├── sync-service/                 # Background sync worker (queue, projections, DLQ)
│   └── agent-service/                # Internal NestJS service
├── packages/
│   ├── authorization/                # Policy engine (RBAC + ABAC + OpenFGA)
│   ├── openfga/                      # OpenFGA model, RelationshipWriter, TupleSyncService
│   ├── sdk/                          # Zod schemas, DTOs, typed clients, OpenAPI
│   ├── ui/                           # Shared presentational components
│   └── config/                       # Shared ESLint, Prettier, TSConfig
├── docs/
│   ├── ai/
│   │   └── context.md                # THIS FILE — program index
│   ├── architecture/                 # Architecture models
│   ├── decisions/                    # ADRs (004–046)
│   └── security/                     # Local hooks, CI security docs
├── .github/
│   ├── agents/                       # Copilot agent profiles
│   ├── workflows/                    # CI/CD workflows
│   └── CODEOWNERS                    # Security-sensitive path ownership
├── .claude/
│   └── claude.md                     # Claude Code multi-role config
├── infra/                            # Infrastructure (IaC, future)
└── scripts/                          # Setup and utility scripts
```

---

## 4. Architecture Documents

| Document                                                                                   | Scope                                                   |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| [identity-trust-model.md](../architecture/identity-trust-model.md)                         | Auth0, JWTs, principal types, trust boundaries          |
| [secrets-rotation-model.md](../architecture/secrets-rotation-model.md)                     | Secrets Manager, naming, retrieval, rotation            |
| [authorization-model.md](../architecture/authorization-model.md)                           | RBAC, ABAC, OpenFGA, decision flow                      |
| [enforcement-model.md](../architecture/enforcement-model.md)                               | Guards, CASL, agent enforcement, observability          |
| [agent-runtime-security.md](../architecture/agent-runtime-security.md)                     | Agent identity, delegation, tools, secrets, kill-switch |
| [infrastructure-security-topology.md](../architecture/infrastructure-security-topology.md) | VPCs, subnets, Tailscale, VPS, home network             |
| [security-observability.md](../architecture/security-observability.md)                     | Event taxonomy, correlation, alerting, retention        |
| [resilience-recovery.md](../architecture/resilience-recovery.md)                           | Backup, recovery ordering, playbooks, break-glass       |
| [security-enablement.md](../architecture/security-enablement.md)                           | SDKs, templates, standards, guardrails, workflow        |
| [service-layout.md](../architecture/service-layout.md)                                     | Hexagonal architecture layer rules                      |

---

## 5. ADR Index

### Foundation (004–005)

| ADR | Title                                                                                              |
| --- | -------------------------------------------------------------------------------------------------- |
| 004 | [Service Architecture and Boundaries](../decisions/ADR-004-service-architecture-and-boundaries.md) |
| 005 | [Data Access and Migrations](../decisions/ADR-005-data-access-and-migrations.md)                   |

### Identity (006–009)

| ADR | Title                                                                        |
| --- | ---------------------------------------------------------------------------- |
| 006 | [Token Strategy](../decisions/ADR-006-token-strategy.md)                     |
| 007 | [Agent Identity Model](../decisions/ADR-007-agent-identity-model.md)         |
| 008 | [Service Trust Model](../decisions/ADR-008-service-trust-model.md)           |
| 009 | [Token Vault Usage Policy](../decisions/ADR-009-token-vault-usage-policy.md) |

### Secrets (010–013)

| ADR | Title                                                                                                      |
| --- | ---------------------------------------------------------------------------------------------------------- |
| 010 | [Secrets Manager as Source of Truth](../decisions/ADR-010-secrets-manager-source-of-truth.md)              |
| 011 | [Secret Naming Convention](../decisions/ADR-011-secret-naming-convention.md)                               |
| 012 | [Rotation Strategy Model](../decisions/ADR-012-rotation-strategy-model.md)                                 |
| 013 | [Secrets Manager vs Token Vault Boundary](../decisions/ADR-013-secrets-manager-vs-token-vault-boundary.md) |

### Authorization (014–017)

| ADR | Title                                                                                      |
| --- | ------------------------------------------------------------------------------------------ |
| 014 | [RBAC vs ABAC vs OpenFGA Separation](../decisions/ADR-014-rbac-abac-openfga-separation.md) |
| 015 | [OpenFGA Model Design](../decisions/ADR-015-openfga-model-design.md)                       |
| 016 | [Authorization Decision Flow](../decisions/ADR-016-authorization-decision-flow.md)         |
| 017 | [IdP to OpenFGA Sync Strategy](../decisions/ADR-017-idp-openfga-sync-strategy.md)          |

### Enforcement (018–021)

| ADR | Title                                                                                          |
| --- | ---------------------------------------------------------------------------------------------- |
| 018 | [Centralized Authorization Service](../decisions/ADR-018-centralized-authorization-service.md) |
| 019 | [Backend Enforcement Strategy](../decisions/ADR-019-backend-enforcement-strategy.md)           |
| 020 | [CASL Integration Model](../decisions/ADR-020-casl-integration-model.md)                       |
| 021 | [Fail-Closed Authorization Policy](../decisions/ADR-021-fail-closed-policy.md)                 |

### Agent Security (022–026)

| ADR | Title                                                                                            |
| --- | ------------------------------------------------------------------------------------------------ |
| 022 | [Agent Identity Strategy](../decisions/ADR-022-agent-identity-strategy.md)                       |
| 023 | [Delegated vs Independent Execution](../decisions/ADR-023-delegated-vs-independent-execution.md) |
| 024 | [Tool Access Control Model](../decisions/ADR-024-tool-access-control-model.md)                   |
| 025 | [Agent Secret Access Boundary](../decisions/ADR-025-agent-secret-access-boundary.md)             |
| 026 | [Agent Audit and Attribution](../decisions/ADR-026-agent-audit-attribution.md)                   |

### Infrastructure (027–031)

| ADR | Title                                                                                    |
| --- | ---------------------------------------------------------------------------------------- |
| 027 | [Environment Isolation Strategy](../decisions/ADR-027-environment-isolation-strategy.md) |
| 028 | [VPS Role in Platform](../decisions/ADR-028-vps-role.md)                                 |
| 029 | [Tailscale Private Access Model](../decisions/ADR-029-tailscale-private-access.md)       |
| 030 | [Public vs Private Service Exposure](../decisions/ADR-030-service-exposure-policy.md)    |
| 031 | [Home Network Trust Boundary](../decisions/ADR-031-home-network-trust-boundary.md)       |

### Observability (032–036)

| ADR | Title                                                                                    |
| --- | ---------------------------------------------------------------------------------------- |
| 032 | [Observability Architecture](../decisions/ADR-032-observability-architecture.md)         |
| 033 | [Event Taxonomy Standard](../decisions/ADR-033-event-taxonomy-standard.md)               |
| 034 | [Authorization Decision Logging](../decisions/ADR-034-authorization-decision-logging.md) |
| 035 | [Agent Observability Model](../decisions/ADR-035-agent-observability-model.md)           |
| 036 | [Log Retention Strategy](../decisions/ADR-036-log-retention-strategy.md)                 |

### Resilience (037–041)

| ADR | Title                                                                            |
| --- | -------------------------------------------------------------------------------- |
| 037 | [Backup Strategy](../decisions/ADR-037-backup-strategy.md)                       |
| 038 | [Recovery Ordering Model](../decisions/ADR-038-recovery-ordering.md)             |
| 039 | [Secret Compromise Response](../decisions/ADR-039-secret-compromise-response.md) |
| 040 | [OpenFGA Failure Policy](../decisions/ADR-040-openfga-failure-policy.md)         |
| 041 | [Break-Glass Access Model](../decisions/ADR-041-break-glass-access.md)           |

### Enablement (042–046)

| ADR | Title                                                                                |
| --- | ------------------------------------------------------------------------------------ |
| 042 | [Shared SDK Strategy](../decisions/ADR-042-shared-sdk-strategy.md)                   |
| 043 | [Service Template Standard](../decisions/ADR-043-service-template-standard.md)       |
| 044 | [Agent Template Standard](../decisions/ADR-044-agent-template-standard.md)           |
| 045 | [Guardrail Enforcement Policy](../decisions/ADR-045-guardrail-enforcement-policy.md) |
| 046 | [Documentation and ADR Standard](../decisions/ADR-046-documentation-adr-standard.md) |

---

## 6. Epic Status Tracker

| #   | Epic                        | Status      |
| --- | --------------------------- | ----------- |
| 1   | Identity Foundation         | Complete    |
| 2   | Secrets Platform            | Complete    |
| 3   | Authorization Control Plane | Complete    |
| 4   | Application Enforcement     | Complete    |
| 5   | Agent Security              | Complete    |
| 6   | Secure Infrastructure       | Complete    |
| 7   | Security Observability      | Complete    |
| 8   | Security Resilience         | Complete    |
| 9   | Security Enablement         | Complete    |
| 10  | Auth0 Universal Login       | Not Started |
| 11  | Sync Service Projections    | Not Started |
| 12  | Token Vault Integration     | Not Started |
| 13  | Agent Service Runtime       | Not Started |
| 14  | Production Infrastructure   | Not Started |
| 15  | Hardening and Observability | Not Started |

---

## 7. Cross-Epic Design Principles

These must never be violated.

### Identity

- Every request has a principal. No anonymous internal access.
- Three principal types: `user`, `service`, `agent`. Each has its own Auth0 application.
- Custom claims use the `https://actbound.ai/` namespace.

### Secrets

- No hardcoded secrets. All secrets in AWS Secrets Manager.
- Token Vault is ONLY for user-delegated external OAuth tokens.
- All secrets rotate safely. Services use 5-minute cache TTL + retry-on-auth-failure.

### Authorization

- Backend is the source of truth. CASL is advisory UX only.
- RBAC (roles from JWT) ≠ ABAC (context attributes) ≠ OpenFGA (relationships). Strict separation.
- Every permission maps to exactly one layer. No overlap.
- Max 5 system roles. Use OpenFGA for granularity beyond roles.

### Agents

- Agents are first-class principals with per-instance identity.
- No shared or global agent credentials.
- Delegated actions require intersection of agent capability + user consent + user authorization.
- Kill-switch: disable Auth0 M2M app + purge OpenFGA tuples.

### Infrastructure

- Explicit trust boundaries. Only orchestrator-api is public.
- Environments isolated via separate VPCs, IAM, and data stores.
- Tailscale is admin overlay, not production runtime dependency.
- Home network is untrusted for production.

### Observability

- Every authorization decision is logged (allow and deny).
- Structured JSON events with `requestId` and `workflowId` correlation.
- Event taxonomy: `<domain>.<action>.<result>`.
- Never log secret values, tokens, or PII beyond `sub`.

### Resilience

- Fail closed. No fail-open path for authorization.
- Recovery order: Infrastructure → Identity → Secrets → AuthZ → App → Agents.
- Break-glass: offline credentials, dual approval, post-use rotation.

---

## 8. Authorization Model Summary

| Layer   | Purpose                      | Storage                 | Queried via                    |
| ------- | ---------------------------- | ----------------------- | ------------------------------ |
| RBAC    | Coarse role gating           | Auth0 JWT claims        | JWT parsing (no external call) |
| ABAC    | Context attributes           | Runtime (not persisted) | Request context assembly       |
| OpenFGA | Resource-level relationships | Tuple store             | OpenFGA Check API              |

### Enforcement Flow

```
1. Validate identity (Auth0 JWT)
2. RBAC check (from JWT claims — fast, no external call)
3. ABAC evaluation (from request context — no persistence)
4. OpenFGA check (relationship query — external call)
5. Final decision (allow or deny with reasons)
6. Log + trace (structured audit event)
```

---

## 9. Identity to Authorization Contract

### JWT must include

- `sub` — principal identifier
- `aud` — API audience (`https://api.actbound.ai`)
- `https://actbound.ai/principal_type` — `user`, `service`, or `agent`
- `https://actbound.ai/roles` — role array
- `https://actbound.ai/tenant_id` — tenant boundary

### JWT must NOT include

- Fine-grained permissions (resolved at runtime via OpenFGA)
- Resource ownership data
- PII beyond `sub`
- Secrets or API keys

---

## 10. Secrets Boundary Model

| System              | Purpose                                                      | Owner    |
| ------------------- | ------------------------------------------------------------ | -------- |
| Auth0 Token Vault   | User-delegated external OAuth tokens (Google, Slack, GitHub) | User     |
| AWS Secrets Manager | Platform secrets (DB creds, API keys, M2M secrets)           | Platform |

**Decision rule:** Who owns the credential? Platform → Secrets Manager. User (delegated via OAuth) → Token Vault. No exceptions.

---

## 11. Agent Execution Model

| Mode        | Description                         | `on_behalf_of` claim   |
| ----------- | ----------------------------------- | ---------------------- |
| Independent | Agent acts as itself (system tasks) | Absent                 |
| Delegated   | Agent acts on behalf of a user      | Present (user's `sub`) |

### Delegation intersection rule

An agent can only do what the intersection of these three allows:

1. Agent's own capability (OpenFGA `executor` tuples)
2. User's consent (delegation scopes)
3. User's own authorization (user's OpenFGA relations)

---

## 12. IdP to OpenFGA Sync Model

```
Auth0 → EventBridge → Sync Lambda → OpenFGA
                                       │
                                       ▼
                                 SQS Dead Letter Queue
```

**Sync rule:** Only sync relationships (org membership, delegation). Never sync identity profiles, roles, or PII.

**Reconciliation:** Daily Lambda compares Auth0 org membership to OpenFGA tuples and fixes drift.

---

## 13. Observability Model

All events must include:

| Field                   | Purpose                               |
| ----------------------- | ------------------------------------- |
| `requestId`             | Per-request correlation               |
| `workflowId`            | Multi-step agent workflow correlation |
| `subject.sub`           | Who made the request                  |
| `subject.principalType` | User, service, or agent               |
| `permission`            | What was requested                    |
| `resource`              | Which resource                        |
| `decision.allowed`      | Result                                |
| `decision.reasons`      | Why (always populated)                |

### Log retention

- Hot: 90 days (CloudWatch Logs)
- Warm: 1 year (S3 Standard, queryable via Athena)
- Cold: 3+ years (S3 Glacier)

---

## 14. Resilience Model

### Must support

- Secret compromise (immediate rotation, 5-min recovery)
- Identity compromise (revoke sessions/tokens, disable M2M app)
- OpenFGA outage (fail-closed, RBAC/ABAC still work)
- Infrastructure failure (redeploy from IaC + restore data)
- Agent compromise (kill-switch: disable + purge + remove)

### Recovery order

```
1. Infrastructure (Terraform apply)
2. Identity (verify Auth0 config)
3. Secrets (verify access, rotate if compromised)
4. Authorization (deploy model, restore tuples, reconcile)
5. Application (deploy services, verify health)
6. Agents (re-provision, restore delegation)
```

---

## 15. Skills Backlog

### Authorization

- `skill.authz.evaluate.request` — full RBAC + ABAC + OpenFGA evaluation
- `skill.authz.log.decision` — structured authorization decision logging
- `skill.authz.design.openfga-model` — design OpenFGA types and relations
- `skill.authz.sync.idp-to-openfga` — Auth0 → OpenFGA event sync

### Secrets

- `skill.secrets.retrieve.aws` — rotation-safe retrieval with caching
- `skill.secrets.rotate.emergency` — immediate rotation for compromised secrets
- `skill.secrets.audit.access` — log secret access events

### Agents

- `skill.agent.secure.runtime-pattern` — standard agent runtime security setup
- `skill.agent.delegate.user-action` — delegated execution with intersection validation
- `skill.agent.authorize.tool-call` — tool authorization with risk categories
- `skill.agent.kill-switch` — immediate agent shutdown procedure
- `skill.agent.audit.execution` — structured agent audit events
- `skill.agent.retrieve.secrets.scoped` — brokered secret access for agents

### Infrastructure

- `skill.aws.design.vpc-isolation` — VPC with public/private subnet separation
- `skill.aws.secure.egress-pattern` — controlled outbound access
- `skill.tailscale.design.private-admin-access` — Tailscale ACLs and subnet routers
- `skill.vps.define.trust-boundary` — VPS role and access restrictions
- `skill.infra.segment.environment` — per-environment isolation

### Observability

- `skill.observability.design.event-taxonomy` — structured event types
- `skill.observability.propagate.correlation-id` — requestId/workflowId propagation
- `skill.agent.trace.execution` — multi-step workflow tracing

### Resilience

- `skill.resilience.backup.strategy` — backup requirements for new components
- `skill.resilience.restore.system` — restore from backup with validation
- `skill.resilience.test.recovery` — recovery drill execution
- `skill.identity.revoke.compromise` — identity compromise response

### Enablement

- `skill.enablement.build.service-template` — scaffold secure NestJS service
- `skill.enablement.build.agent-template` — scaffold secure agent runtime
- `skill.enablement.apply.authz-sdk` — integrate authorization into a service
- `skill.enablement.apply.secrets-sdk` — integrate rotation-safe secret retrieval
- `skill.enablement.define.permission-standard` — define new permission per conventions
- `skill.enablement.write.adr` — write ADR per standard format

### CASL

- `skill.casl.build.ability-factory` — build CASL abilities from backend permissions

---

## 16. Implementation Phases

### Phase 1 — Foundation (Complete)

Monorepo scaffold, apps/web, services, packages, CI/CD, git hooks, supply-chain hardening, CODEOWNERS, security documentation.

### Phase 2 — Central Permission System (Complete)

Typed permission model, policy engine, backend-issued decisions, web UI consumption.

### Phase 3 — Token Broker and M2M Optimization (Complete)

Broker status/preview/retrieval, Redis with fallback, safe metadata only.

### Phase 4 — Auth0 Token Vault Delegated Access (Complete)

Delegated-access models, provider connections, consent preview, vault sessions, step-up markers, Token Vault TODO seams. Auth0 dev tenant provisioned (actbound-web, actbound-api, actbound-m2m, token enrichment actions).

### Phase 5 — Auditability and User Control (Complete)

Shared audit models (AuditEvent, ActivityTimeline, UserControlSummary), orchestrator endpoints (GET /me/activity, GET /me/control-summary, enriched GET /audit-events), authorization evaluation for audit visibility (viewer role added), web dashboard with User Control and Activity Timeline panels, demo-seeded activity events.

### Phase 6 — Documentation and Release Readiness (Complete)

README polish, architecture documentation, demo flow documentation.

### Phase 7 — Auth0 Universal Login Integration (Not Started)

Wire real Auth0 login/logout flows end-to-end. Bind `actbound-post-login-enrich` and `actbound-m2m-enrich` actions to Auth0 login and M2M credential exchange flows. Configure custom domain `auth.actbound.ai` on Auth0 tenant. Create demo users with assigned roles and org memberships. Remove demo principal fallback from JWT middleware (fail-closed). Wire `apps/web` Auth0Provider with real redirect callbacks and PKCE flow. Verify custom claims (`https://actbound.ai/` namespace) arrive correctly in access tokens. Update resource server audience to `https://api.actbound.ai`.

**Depends on:** Phase 4 (Auth0 tenant provisioned), DNS for `auth.actbound.ai`.

### Phase 8 — Sync Service Projections (Not Started)

Replace the 6 TODO projection handlers in sync-processor with real implementations. `org.membership.changed` → write OpenFGA tuples + upsert app DB org membership. `user.projected` → upsert user in app DB. `invitation.accepted` → create OpenFGA tuple + update invitation record. `access.revoked` → delete OpenFGA tuple + create revocation record. `assistant.delegation.changed` → update OpenFGA delegation tuples. `reconciliation.requested` → compare expected state vs active tuples, emit drift report. Promote sync queue from in-memory to Redis (BullMQ). Connect existing `TupleSyncService` in `packages/openfga` to the sync processor pipeline.

**Depends on:** Phase 7 (real identity tokens needed for sync events).

### Phase 9 — Token Vault Integration (Not Started)

Replace Token Vault stubs in `delegated-access.service.ts` with real Auth0 Token Vault API calls. Implement delegated OAuth flow (initiate → callback → persist). Wire consent grant/revoke through Auth0 APIs. Implement vault session lifecycle (create, expire, revoke). Add real provider connections (Google, Slack as initial targets). Replace placeholder connection IDs (`conn_demo_vault`, `conn_demo_salesforce`) with live provider configurations.

**Depends on:** Phase 7 (authenticated users), Auth0 Token Vault feature enabled on tenant.

### Phase 10 — Agent Service Runtime (Not Started)

Build out `services/agent-service` with real business logic. Implement assistant invocation lifecycle (request → authorize → execute → audit). Wire full delegation intersection enforcement: OpenFGA executor check + delegator check + user authorization check. Implement tool execution with scoped secret retrieval via Token Vault. Implement kill-switch (disable Auth0 M2M app + purge OpenFGA tuples + revoke active sessions). Connect assistant runtime to sync service for state change events.

**Depends on:** Phase 8 (OpenFGA projections), Phase 9 (Token Vault for secret retrieval).

### Phase 11 — Production Infrastructure (Not Started)

Deploy to AWS with proper isolation. Terraform modules for VPC (public/private subnets), ECS/Fargate task definitions, RDS PostgreSQL, ElastiCache Redis. Environment isolation: separate Auth0 tenants, AWS accounts, and data stores per environment (dev/staging/prod). CloudWatch log shipping with structured JSON parsing. Secrets Manager rotation Lambda for automated credential cycling. Custom domain routing: `api.actbound.ai` → orchestrator-api, `auth.actbound.ai` → Auth0 tenant.

**Depends on:** Phase 7 (Auth0 custom domain), AWS account setup.

### Phase 12 — Hardening and Observability (Not Started)

Production-grade operational readiness. Per-principal rate limiting on orchestrator-api. Step-up authentication for high-risk operations (secret access, delegation changes, kill-switch). Real CloudTrail integration for infrastructure audit trail. Prometheus/Grafana metrics to replace in-memory observability counters. Recovery drill automation (scripted restore + validation). Expand test coverage to 70%+ across services and packages.

**Depends on:** Phase 11 (production infrastructure deployed).

---

## 17. Architecture Decisions Summary

### Service Architecture (ADR-004)

NestJS services use hexagonal architecture: `domain`, `application`, `infrastructure`, `presentation`. Strict layer import rules.

### SDK Boundary (ADR-004)

`packages/sdk` has zero NestJS, zero Drizzle, zero persistence. Pure Zod + TypeScript + OpenAPI.

### Data Access (ADR-005)

Drizzle ORM confined to `infrastructure` layers. Per-service migrations. Repository pattern with domain interfaces.

### Token Strategy (ADR-006)

15-min user access tokens, 1-hour M2M tokens. RS256 signing. Custom claims via `https://actbound.ai/` namespace. Tokens carry identity and role, not permissions.

### Agent Identity (ADR-007, ADR-022)

Per-agent-instance Auth0 M2M application. Full traceability via `sub` + `agent_instance_id` + `on_behalf_of`.

### Token Vault Boundary (ADR-009, ADR-013)

Token Vault = user-delegated external tokens. Secrets Manager = platform secrets. No exceptions. Separate code paths.

### Fail-Closed (ADR-021, ADR-040)

All authorization failures result in denial. No fail-open. No cached OpenFGA results as fallback.

---

## 18. Definition of Done (Global)

A feature is NOT complete unless:

- Identity path defined and tested
- Authorization path defined and tested
- Secrets usage defined (Secrets Manager or Token Vault, never both for the same credential)
- Rotation impact considered (will rotation break this feature?)
- Observability included (audit events emitted)
- Failure modes handled (what happens when dependencies are down?)
- Documentation updated (context.md progress tracker, ADR if new pattern)

---

## 19. AI Agent Operating Rules

These apply to every AI agent and tool operating in this repo.

1. **No repo-wide write commands** without explicit approval (`prettier --write .`, `eslint --fix .`).
2. **Only modify files in the current task scope.** Report issues in unrelated files — do not fix them.
3. **Hooks operate on staged or targeted files only.** No repo-wide scans during development.
4. **Local hooks are fast scoped checks. CI is the authority.**
5. **No reformatting unrelated files to pass a commit.** If a hook fails on a file you didn't change, stop and report.
6. **Stop and report on broad failures.** Do not apply broad fixes.
7. **Public-branch hygiene and secret prevention are mandatory.** No secrets, tokens, API keys, or credentials in any commit.

---

## 20. Auth0 Tenant

- Tenant: `dev-6az71xw7wqwtmp0q.us.auth0.com`
- Custom domain: `auth.actbound.ai` (to be configured in Phase 7)
- MCP access: configured in `.mcp.json` via `@auth0/auth0-mcp-server`
- **Auth0 dev setup is documented and provisioned** — see `docs/auth0-setup.md`
- `actbound-web` (SPA): client ID `VKm1ClfzHqI0VSKtjtzAtBDbgeBXAVLp`
- `actbound-api` (resource server): audience `https://api.actbound.ai`, 14 scopes (migrating from `https://api.actbound.dev`)
- `actbound-m2m` (M2M): client ID `ljGntsIp3TqZrXxvvdjNzH9MONSX68OQ`, granted all 14 scopes
- Actions: `actbound-post-login-enrich` and `actbound-m2m-enrich` deployed (need manual flow binding)
- Token broker pattern is the required M2M issuance path (see `docs/auth0-setup.md` section "Token Broker Pattern")
- Remaining: configure custom domain DNS, bind actions to flows, create demo users, migrate audience URL

---

## 21. Repository Guidance

- No secrets, no internal-only credentials or endpoints
- Keep docs clear and accurate
- Working branch: `feat/actbound-foundation`
