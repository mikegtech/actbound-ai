# Security Enablement Architecture

## Overview

This document defines how the platform's security architecture becomes repeatable, adoptable, and self-enforcing. It covers shared SDKs, service/agent templates, naming standards, testing requirements, documentation practices, and delivery guardrails.

**Principle:** The secure path must be the easiest path. If doing the right thing requires more effort than cutting corners, the platform has failed.

---

## 1. Enablement Architecture Overview

### 1.1 How Developers Consume Platform Capabilities

```
Developer builds new service/agent
        │
        ▼
┌────────────────────────────────────────────────────┐
│              PLATFORM ENABLEMENT LAYER              │
│                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Identity │ │ Secrets  │ │  AuthZ   │          │
│  │   SDK    │ │   SDK    │ │   SDK    │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  CASL    │ │  Agent   │ │  Audit   │          │
│  │ Helpers  │ │   SDK    │ │ Helpers  │          │
│  └──────────┘ └──────────┘ └──────────┘          │
│                                                    │
│  ┌────────────────────────────────────────┐       │
│  │  Service Template  │  Agent Template   │       │
│  └────────────────────────────────────────┘       │
│                                                    │
│  ┌────────────────────────────────────────┐       │
│  │  Standards: naming, testing, docs, ADRs │       │
│  └────────────────────────────────────────┘       │
│                                                    │
│  ┌────────────────────────────────────────┐       │
│  │  Guardrails: lint rules, CI checks     │       │
│  └────────────────────────────────────────┘       │
└────────────────────────────────────────────────────┘
```

### 1.2 Enablement Components

| Component        | What it is                                                     | Where it lives                               |
| ---------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Shared SDKs      | Importable packages for identity, secrets, authz, CASL, agents | `packages/` monorepo workspace               |
| Service template | Baseline folder structure + wiring for new NestJS services     | Documented pattern + scaffold script         |
| Agent template   | Baseline identity + delegation + audit for new agents          | Documented pattern + scaffold script         |
| Standards        | Naming, testing, documentation conventions                     | `docs/` architecture and decision records    |
| Guardrails       | Lint rules, CI checks, forbidden patterns                      | ESLint rules, pre-commit hooks, CI workflows |
| ADRs             | Recorded decisions that explain "why"                          | `docs/decisions/`                            |
| Playbooks        | Operational procedures for incidents and recovery              | `docs/architecture/`                         |

---

## 2. Shared Library / SDK Strategy

### 2.1 SDK Map

| SDK               | Package                             | Purpose                                                  | Consumed by           |
| ----------------- | ----------------------------------- | -------------------------------------------------------- | --------------------- |
| Identity SDK      | `packages/identity`                 | Token parsing, claim normalization, principal extraction | All services          |
| Secrets SDK       | `packages/secrets`                  | Rotation-safe secret retrieval with caching              | All services          |
| Authorization SDK | `packages/authorization` (existing) | RBAC + ABAC + OpenFGA orchestration                      | All services          |
| CASL Helpers      | `packages/casl`                     | Ability factory, permission hydration                    | apps/web              |
| Agent SDK         | `packages/agent-sdk`                | Delegation, tool auth, audit attribution                 | Agent runtimes        |
| Audit SDK         | `packages/audit`                    | Structured event emission, correlation ID management     | All services + agents |

### 2.2 Identity SDK

**Purpose:** Parse and normalize Auth0 JWTs into a typed `Principal` object.

```typescript
interface Principal {
  sub: string;
  principalType: "user" | "service" | "agent";
  roles: string[];
  tenantId: string;
  agentType?: string;
  agentInstanceId?: string;
  onBehalfOf?: string;
}

// Usage
const principal = identitySdk.extractPrincipal(jwtPayload);
```

**Boundaries:** Parses claims. Does NOT validate JWT signatures (middleware handles that). Does NOT make authorization decisions.

### 2.3 Secrets SDK

**Purpose:** Rotation-safe secret retrieval with in-memory caching and retry-on-auth-failure.

```typescript
interface SecretProvider {
  getSecret<T>(path: string): Promise<T>;
  evict(path: string): void;
}

// Usage
const dbCreds = await secrets.getSecret<DbCredentials>(
  "actbound/prod/orchestrator-api/db-credentials",
);
```

**Boundaries:** Retrieves and caches secrets. Does NOT store secrets in persistent storage. Does NOT handle rotation Lambda logic (that's infrastructure). Does NOT expose raw secrets in logs.

### 2.4 Authorization SDK (existing `packages/authorization`)

Already defined in ADR-018. Provides:

- `AuthorizationService.evaluate()` — orchestrates RBAC → ABAC → OpenFGA
- `PermissionGuard` + `@RequirePermission` — NestJS enforcement
- Policy definitions — maps permissions to requirements

**Boundaries:** Makes authorization decisions. Does NOT handle identity extraction (that's the Identity SDK). Does NOT handle secret retrieval.

### 2.5 CASL Helpers

**Purpose:** Build CASL abilities from backend `/me/permissions` responses.

```typescript
// packages/casl
export function buildAbility(permissions: PermissionResponse): Ability;
export function usePermissions(): { ability: Ability; loading: boolean };
```

**Boundaries:** Maps backend decisions to CASL abilities. Does NOT call OpenFGA. Does NOT make authorization decisions. Advisory UX only.

### 2.6 Agent SDK

**Purpose:** Standard patterns for agent identity handling, delegation validation, tool authorization, and audit attribution.

```typescript
interface AgentRuntime {
  authenticate(): Promise<AgentPrincipal>;
  validateDelegation(userSub: string): Promise<DelegationContext>;
  authorizeTool(
    tool: ToolRegistration,
    resource: ResourceContext,
  ): Promise<AuthorizationDecision>;
  emitAuditEvent(event: AgentAuditEvent): void;
}
```

**Boundaries:** Helpers for agent-specific patterns. Does NOT replace the Authorization SDK (calls it internally). Does NOT handle M2M credential storage (that's Secrets Manager).

### 2.7 Audit SDK

**Purpose:** Structured event emission with correlation ID propagation.

```typescript
interface AuditLogger {
  emitEvent(event: AuditEvent): void;
  withRequestId(requestId: string): AuditLogger;
  withWorkflowId(workflowId: string): AuditLogger;
}
```

**Boundaries:** Emits structured JSON events. Does NOT store or query logs. Does NOT handle log aggregation or alerting.

---

## 3. Standard Service Template

### 3.1 Folder Structure

```
services/<service-name>/
  src/
    presentation/           # Controllers, guards, middleware, DTO mappers
      controllers/
      middleware/
        authorization-context.middleware.ts   ← Identity SDK
        correlation-id.middleware.ts          ← Audit SDK
    application/            # Use cases, orchestration
      <feature>/
    domain/                 # Entities, value objects, repository interfaces
      <feature>/
    infrastructure/         # Implementations: DB, Redis, external clients
      secrets/
        secret-provider.ts                   ← Secrets SDK
      auth/
        jwt-validation.middleware.ts         ← Identity SDK
      <feature>/
    app.module.ts
    main.ts
  vitest.config.ts
  tsconfig.json
  package.json
```

### 3.2 Required Modules

Every new service must include:

| Module                           | SDK               | Purpose                                      |
| -------------------------------- | ----------------- | -------------------------------------------- |
| JWT validation middleware        | Identity SDK      | Extract and validate Auth0 JWT               |
| Authorization context middleware | Identity SDK      | Build `AuthorizationContext` from JWT        |
| Correlation ID middleware        | Audit SDK         | Generate/propagate `X-Request-Id`            |
| PermissionGuard (global)         | Authorization SDK | Enforce `@RequirePermission` on routes       |
| SecretProvider                   | Secrets SDK       | Rotation-safe secret retrieval               |
| Health endpoint                  | Built-in          | `/health` and `/ready` (unauthenticated)     |
| Audit interceptor                | Audit SDK         | Log authorization decisions on every request |

### 3.3 Service Checklist

Before a new service is production-ready:

- [ ] JWT validation middleware configured
- [ ] All endpoints have `@RequirePermission` or `@RequireAuth`
- [ ] Secrets retrieved via Secrets SDK (not env vars or hardcoded)
- [ ] Correlation IDs propagated to all downstream calls
- [ ] Structured audit events emitted for authorization decisions
- [ ] Health check endpoint exists
- [ ] Vitest tests cover authorization scenarios
- [ ] ADR written if the service introduces new architectural decisions

---

## 4. Standard Agent Template

### 4.1 Template Structure

```
agents/<agent-name>/
  src/
    runtime/
      agent.ts              # Main agent loop
      identity.ts           ← Agent SDK (authentication)
      delegation.ts         ← Agent SDK (delegation validation)
      tool-access.ts        ← Agent SDK (tool authorization)
      audit.ts              ← Audit SDK (structured logging)
    tools/
      <tool-name>.ts        # Tool implementations
    config.ts               # Agent configuration
  vitest.config.ts
  package.json
```

### 4.2 Required Lifecycle Hooks

| Hook           | When                 | What it does                                              |
| -------------- | -------------------- | --------------------------------------------------------- |
| `onStart`      | Agent process starts | Authenticate with M2M credentials, verify identity        |
| `beforeAction` | Before each action   | Validate delegation (if delegated), authorize tool        |
| `afterAction`  | After each action    | Emit audit event with full attribution                    |
| `onError`      | On action failure    | Log failure with evaluation path, increment error counter |
| `onShutdown`   | Agent process stops  | Clean up, emit shutdown audit event                       |

### 4.3 Agent Checklist

Before a new agent is production-ready:

- [ ] Per-instance Auth0 M2M application created
- [ ] Client secret stored in Secrets Manager
- [ ] OpenFGA executor tuples created
- [ ] `onStart` authenticates and verifies identity
- [ ] `beforeAction` checks delegation and tool authorization
- [ ] `afterAction` emits structured audit events with requestId + workflowId
- [ ] Rate limits configured
- [ ] Kill-switch procedure documented
- [ ] Vitest tests cover delegation and authorization scenarios

---

## 5. Policy and Permission Standardization

### 5.1 Naming Conventions

| Entity               | Convention                      | Examples                                                     |
| -------------------- | ------------------------------- | ------------------------------------------------------------ |
| Permission           | `<resource_type>:<action>`      | `agent_actions:execute`, `brokered_tokens:read`              |
| Action               | Lowercase verb                  | `read`, `execute`, `connect`, `revoke`, `inspect`            |
| Resource type        | Lowercase snake_case            | `agent_action`, `brokered_token`, `provider_connection`      |
| Auth0 custom claim   | `https://actbound.ai/<claim>`   | `https://actbound.ai/roles`, `https://actbound.ai/tenant_id` |
| OpenFGA object       | `<type>:<id>`                   | `user:auth0\|alice`, `organization:acme`, `project:proj_001` |
| OpenFGA relation     | Lowercase, descriptive          | `member`, `admin`, `executor`, `delegator`, `can_execute`    |
| Secrets Manager path | `actbound/<env>/<owner>/<name>` | `actbound/prod/orchestrator-api/db-credentials`              |
| IAM role             | `actbound-<service>-<env>-role` | `actbound-orchestrator-prod-role`                            |
| Log event            | `<domain>.<action>.<result>`    | `authz.decision`, `agent.action.executed`                    |

### 5.2 Consistency Rules

1. New permissions must follow the `<resource_type>:<action>` convention.
2. New OpenFGA types must be documented in the model with purpose and relations.
3. New custom claims must use the `https://actbound.ai/` namespace.
4. New secrets must follow the `actbound/<env>/<owner>/<name>` path convention.
5. New log events must follow the `<domain>.<action>.<result>` taxonomy.

---

## 6. Testing Standards

### 6.1 Authorization Tests (Required)

Every service must test its authorization behavior:

```typescript
// Unit test: policy engine evaluation
it("denies when actor has no roles", () => {
  const decision = authzService.evaluate({
    context: noRolesContext,
    permission: "...",
  });
  expect(decision.allowed).toBe(false);
  expect(decision.reasons).toContain("actor_roles_missing");
});

// Integration test: guard-level enforcement
it("returns 403 for unauthorized request", async () => {
  const res = await request(app)
    .get("/protected")
    .set("Authorization", `Bearer ${viewerToken}`);
  expect(res.status).toBe(403);
});
```

### 6.2 Secret Retrieval Tests (Required)

```typescript
// Test: cache TTL behavior
it("returns cached value within TTL", async () => { ... });
it("refreshes after TTL expiry", async () => { ... });
it("retries on auth failure (rotation race)", async () => { ... });
```

### 6.3 Agent Delegation Tests (Required for agents)

```typescript
// Test: delegation intersection
it("denies when agent has executor but user has not delegated", async () => { ... });
it("denies when user has delegated but agent is not executor", async () => { ... });
it("allows when both executor and delegator are present", async () => { ... });
```

### 6.4 CASL Tests (Required for frontend)

```typescript
// Test: ability factory
it("builds correct abilities from backend permissions", () => {
  const ability = buildAbility(mockPermissions);
  expect(ability.can("execute", "agent_action")).toBe(true);
  expect(ability.can("inspect", "token_cache")).toBe(false);
});
```

### 6.5 Audit Event Tests (Required)

```typescript
// Test: authorization decision logged
it("emits authz.decision event on every evaluation", () => {
  authzService.evaluate({ ... });
  expect(auditLogger.emitEvent).toHaveBeenCalledWith(
    expect.objectContaining({ event: "authz.decision" })
  );
});
```

### 6.6 Coverage Expectations

| Package                     | Minimum coverage | Target |
| --------------------------- | ---------------- | ------ |
| `packages/authorization`    | 80%              | 95%    |
| `packages/identity`         | 80%              | 90%    |
| `packages/secrets`          | 70%              | 85%    |
| Service authorization paths | 80%              | 95%    |
| Agent delegation paths      | 80%              | 95%    |

---

## 7. Documentation and ADR Standards

### 7.1 When an ADR Is Required

An ADR must be written when:

- A new authorization pattern is introduced
- A new system integration is added (identity, secrets, authorization, infrastructure)
- A security-relevant architectural decision is made
- An existing ADR is being superseded or deprecated
- A tradeoff is being accepted (document why)

### 7.2 ADR Format

```markdown
# ADR-NNN: Title

## Status

Accepted | Superseded by ADR-XXX | Deprecated

## Context

What is the problem? Why does a decision need to be made?

## Decision

What was decided and why? Include alternatives considered.

## Consequences

What are the tradeoffs? What does this enable or constrain?
```

### 7.3 Documentation Locations

| Content                   | Location                                   |
| ------------------------- | ------------------------------------------ |
| Architecture models       | `docs/architecture/<topic>.md`             |
| Decision records          | `docs/decisions/ADR-NNN-<title>.md`        |
| Security controls         | `docs/security/`                           |
| AI context and guardrails | `docs/ai/context.md`                       |
| Agent instructions        | `.github/agents/<name>.agent.md`           |
| API contracts             | `packages/sdk/src/contracts/`              |
| Operational playbooks     | `docs/architecture/resilience-recovery.md` |

### 7.4 New Service/Agent Documentation Requirements

Every new service or agent must produce:

- [ ] ADR if introducing new patterns
- [ ] Entry in `docs/ai/context.md` progress tracker
- [ ] API contract in `packages/sdk` (if externally consumed)
- [ ] Agent file in `.github/agents/` (if agent-scoped)

---

## 8. Guardrails and Delivery Controls

### 8.1 Forbidden Patterns

| Pattern                                               | Why forbidden                          | Enforcement                                |
| ----------------------------------------------------- | -------------------------------------- | ------------------------------------------ |
| Hardcoded secrets                                     | Security violation                     | Gitleaks (pre-commit + CI)                 |
| Direct Secrets Manager SDK call (without Secrets SDK) | Bypasses caching and rotation safety   | Code review + ESLint rule (when available) |
| Inline authorization logic in controllers             | Scatters policy, impossible to audit   | Code review + agent instructions           |
| Raw OpenFGA calls outside Authorization SDK           | Bypasses RBAC/ABAC layering            | Code review + agent instructions           |
| CASL as backend authorization source                  | CASL is advisory only                  | Code review + ADR-020                      |
| `prettier --write .` or `eslint --fix .` (repo-wide)  | Unscoped formatting churn              | Pre-commit hook + AI guardrails            |
| Shared agent identities                               | No attribution, no revocation          | ADR-007 + agent provisioning process       |
| Environment variables containing secret values        | Secrets must come from Secrets Manager | Code review + `.env.example` template      |

### 8.2 CI Validation

| Check                       | Tool                         | When            |
| --------------------------- | ---------------------------- | --------------- |
| Secret scanning             | Gitleaks                     | Pre-commit + CI |
| Lint (code quality)         | ESLint                       | Pre-commit + CI |
| Format (consistency)        | Prettier                     | Pre-commit + CI |
| Type checking               | TypeScript `tsc`             | Pre-push + CI   |
| Dependency versions         | Syncpack                     | Pre-commit + CI |
| Authorization test coverage | Vitest + coverage thresholds | CI              |
| Workflow linting            | actionlint                   | CI              |
| SAST                        | Semgrep + CodeQL             | CI              |
| Dependency vulnerabilities  | dependency-review-action     | CI (PRs)        |

### 8.3 Review Triggers

A security-focused review is required when a PR modifies:

- `.github/workflows/` — CI/CD pipelines
- `packages/authorization/` — authorization logic
- `*.gitleaks.toml`, `.pre-commit-config.yaml` — security controls
- `docs/decisions/ADR-*` — architectural decisions
- Any new service or agent

Enforced via CODEOWNERS.

---

## 9. Migration and Adoption Strategy

### 9.1 Phased Adoption

| Phase   | Scope                                                 | Milestone                                  |
| ------- | ----------------------------------------------------- | ------------------------------------------ |
| Phase 1 | Authorization SDK adopted by both existing services   | All endpoints use `@RequirePermission`     |
| Phase 2 | Secrets SDK adopted (replace direct env-var patterns) | All secrets retrieved via `SecretProvider` |
| Phase 3 | Identity SDK extracted from inline parsing            | All services use `extractPrincipal()`      |
| Phase 4 | Audit SDK adopted                                     | All services emit structured audit events  |
| Phase 5 | Agent SDK adopted by agent runtimes                   | All agents use standard lifecycle hooks    |
| Phase 6 | CASL helpers adopted by frontend                      | `apps/web` uses `buildAbility()`           |

### 9.2 Compatibility

New SDKs are additive — they wrap existing patterns, not replace them. Migration can happen incrementally per-service, per-endpoint.

---

## 10. Developer Workflow Model

### 10.1 Building a New Service

```
1. SCAFFOLD
   └── Create service folder per template (section 3)
   └── Add to pnpm-workspace.yaml
   └── Add vitest.config.ts from shared config

2. WIRE IDENTITY
   └── Import Identity SDK
   └── Configure JWT validation middleware
   └── Configure authorization context middleware

3. WIRE SECRETS
   └── Import Secrets SDK
   └── Configure SecretProvider with service-specific paths
   └── Add secret paths to .env.example (path only, not values)

4. WIRE AUTHORIZATION
   └── Import Authorization SDK
   └── Register PermissionGuard globally
   └── Add @RequirePermission to every endpoint
   └── Define new policies in packages/authorization (if needed)

5. WIRE AUDIT
   └── Import Audit SDK
   └── Configure correlation ID middleware
   └── Configure audit interceptor

6. TEST
   └── Write authorization unit tests (all allow/deny paths)
   └── Write secret retrieval tests
   └── Write integration tests (guard-level 403/200)
   └── Meet coverage thresholds

7. DOCUMENT
   └── Write ADR if new patterns introduced
   └── Update docs/ai/context.md progress tracker
   └── Add agent file to .github/agents/ (if applicable)

8. VALIDATE
   └── CI passes (lint, format, typecheck, build, test, security)
   └── Pre-commit hooks pass
   └── Code review approved (CODEOWNERS for security paths)

9. DEPLOY
   └── Merge PR
   └── CI deploys to target environment
```

### 10.2 Building a New Agent

Same as above, plus:

- Create Auth0 M2M application (per-instance)
- Store client secret in Secrets Manager
- Create OpenFGA executor tuples
- Wire Agent SDK lifecycle hooks
- Document kill-switch procedure
- Test delegation intersection scenarios

---

## 11. Reusable Skills

### 11.1 `skill.enablement.build.service-template`

**Purpose:** Scaffold a new service with all required platform integrations.

**Inputs:** Service name, required endpoints, secret paths.

**Outputs:** Service folder with template structure, configured modules, baseline tests.

**Steps:** Create folder → add package.json → wire Identity/Secrets/AuthZ/Audit SDKs → add health endpoint → add baseline authorization tests → add to workspace.

### 11.2 `skill.enablement.build.agent-template`

**Purpose:** Scaffold a new agent with identity, delegation, and audit hooks.

**Inputs:** Agent name, agent type, required tools.

**Outputs:** Agent folder with template structure, lifecycle hooks, baseline tests.

**Steps:** Create folder → wire Agent SDK → implement lifecycle hooks → register tools → add delegation tests → add audit event tests → document kill-switch.

### 11.3 `skill.enablement.apply.authz-sdk`

**Purpose:** Integrate the Authorization SDK into an existing or new service.

**Inputs:** Service module, list of endpoints and their required permissions.

**Outputs:** Configured PermissionGuard, decorated endpoints, baseline tests.

**Steps:** Import AuthorizationModule → register guard globally → add @RequirePermission to each endpoint → write allow/deny tests → verify audit events emitted.

### 11.4 `skill.enablement.apply.secrets-sdk`

**Purpose:** Integrate the Secrets SDK into a service for rotation-safe secret retrieval.

**Inputs:** Service name, required secret paths, environment.

**Outputs:** Configured SecretProvider, .env.example updated, baseline tests.

**Steps:** Import Secrets SDK → configure SecretProvider with paths → add retry-on-auth-failure → write cache TTL tests → update .env.example with paths (not values).

### 11.5 `skill.enablement.define.permission-standard`

**Purpose:** Define a new permission following platform naming standards.

**Inputs:** Resource type, action, required roles, OpenFGA relation (if needed).

**Outputs:** Permission definition in policies, OpenFGA model update (if needed), documentation.

**Steps:** Name permission per convention → add to policy definitions → add required roles and ABAC attributes → add OpenFGA relation (if resource-level) → document in architecture → write tests.

### 11.6 `skill.enablement.write.adr`

**Purpose:** Write an ADR for a new architectural decision.

**Inputs:** Decision topic, context, alternatives considered, chosen option.

**Outputs:** ADR file in `docs/decisions/` following the standard format.

**Steps:** Assign next ADR number → write Context → write Decision (with rationale) → write Consequences → format with Prettier → add to relevant architecture doc references.

---

## Related ADRs

- [ADR-042: Shared SDK Strategy](../decisions/ADR-042-shared-sdk-strategy.md)
- [ADR-043: New Service Template Standard](../decisions/ADR-043-service-template-standard.md)
- [ADR-044: New Agent Template Standard](../decisions/ADR-044-agent-template-standard.md)
- [ADR-045: Guardrail Enforcement Policy](../decisions/ADR-045-guardrail-enforcement-policy.md)
- [ADR-046: Documentation and ADR Standard](../decisions/ADR-046-documentation-adr-standard.md)
