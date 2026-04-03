# Application Enforcement Model

## Overview

This document defines how authorization decisions are executed across the platform. It covers the backend enforcement pattern, the CASL frontend integration contract, agent enforcement, observability, and failure handling.

**Core principle:** Authorization logic lives in one place — the centralized `AuthorizationService`. Every service, endpoint, and agent calls the same service. No inline permission checks. No duplicated logic.

---

## 1. Enforcement Architecture

### 1.1 Layered Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  Controllers, Guards, Middleware                             │
│  (extracts identity, calls AuthorizationService, returns     │
│   403 on deny)                                               │
├──────────────────────────────────────────────────────────────┤
│                     AUTHORIZATION SERVICE                    │
│  Single entry point for all authorization decisions          │
│  Orchestrates: RBAC → ABAC → OpenFGA → Decision             │
│  Lives in: packages/authorization                            │
├──────────────────┬──────────────────┬────────────────────────┤
│     RBAC         │     ABAC         │     OpenFGA            │
│  (JWT claims)    │  (request ctx)   │  (relationship store)  │
│  No external     │  No persistence  │  gRPC/HTTP call        │
│  call            │                  │                        │
├──────────────────┴──────────────────┴────────────────────────┤
│                     DATA SOURCES                             │
│  Auth0 (identity)  │  Backend state  │  OpenFGA (tuples)     │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Separation of Concerns

| Layer                            | Responsibility                                                             | Must NOT                                       |
| -------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------- |
| Presentation (guards/middleware) | Extract identity, invoke AuthorizationService, map result to HTTP response | Contain authorization logic                    |
| AuthorizationService             | Orchestrate RBAC + ABAC + OpenFGA, return structured decision              | Know about HTTP, controllers, or request shape |
| RBAC evaluator                   | Check roles from claims                                                    | Call external services                         |
| ABAC evaluator                   | Check context attributes                                                   | Persist state                                  |
| OpenFGA client                   | Query relationship store                                                   | Store identity data or cache tuples            |

---

## 2. Backend Authorization Pattern

### 2.1 Decision: Guard-Level Enforcement + Centralized Authorization Service

Authorization is enforced at the **NestJS guard level** using a `PermissionGuard` that delegates all logic to the centralized `AuthorizationService` in `packages/authorization`.

**Why guard-level, not middleware:**

- Guards have access to the route handler's metadata (decorators)
- Guards can read which permission is required for the specific endpoint
- Middleware runs too early — before route resolution

**Why not inline service-layer checks:**

- Scatters authorization logic across every service method
- Makes it impossible to audit which endpoints are protected
- Leads to inconsistency between services

### 2.2 Pattern

```typescript
// presentation/controllers/agent-actions.controller.ts
@RequirePermission("agent_actions:execute")
@Post("/agent-actions/execute")
async executeAction(@Body() body: ExecuteActionDto) {
  // By the time this runs, the guard has already:
  // 1. Validated identity
  // 2. Checked RBAC
  // 3. Checked ABAC
  // 4. Checked OpenFGA
  // If we're here, the request is authorized.
  return this.agentActionService.execute(body);
}
```

### 2.3 Guard Implementation

```typescript
// packages/authorization/src/nest.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authzService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.getAllAndOverride<Permission>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permission) return true; // No permission required

    const request = context.switchToHttp().getRequest();
    const authzContext = request.authorizationContext; // Set by middleware
    const resource = request.resourceContext; // Set by resource resolver

    const decision = await this.authzService.evaluate({
      context: authzContext,
      permission,
      resource,
    });

    request.authorizationDecision = decision; // Attach for audit

    if (!decision.allowed) {
      throw new ForbiddenException({
        message: "Authorization denied",
        permission,
        reasons: decision.reasons,
      });
    }

    return true;
  }
}
```

---

## 3. Authorization Service Design

### 3.1 API Contract

```typescript
// packages/authorization/src/authorization.service.ts

export interface AuthorizationEvaluationInput {
  context: AuthorizationContext; // Identity + ABAC attributes
  permission: Permission; // What action on what resource type
  resource?: ResourceContext; // Specific resource instance (for OpenFGA)
}

export interface AuthorizationDecision {
  permission: Permission;
  resource: ResourceType;
  action: Action;
  resourceId?: string;
  allowed: boolean;
  reasons: DecisionReason[]; // Always populated — allow or deny
  evaluatedAt: string; // ISO timestamp
  evaluationPath: EvaluationStep[]; // Which checks ran and their result
}

export interface EvaluationStep {
  layer: "rbac" | "abac" | "openfga";
  result: "pass" | "deny" | "skip";
  reason?: string;
  durationMs: number;
}

export interface AuthorizationService {
  evaluate(input: AuthorizationEvaluationInput): Promise<AuthorizationDecision>;
  evaluateAll(context: AuthorizationContext): Promise<AuthorizationDecision[]>;
}
```

### 3.2 Implementation

```typescript
export class DefaultAuthorizationService implements AuthorizationService {
  constructor(
    private readonly rbac: RbacEvaluator,
    private readonly abac: AbacEvaluator,
    private readonly openfga: OpenFGAClient,
  ) {}

  async evaluate(
    input: AuthorizationEvaluationInput,
  ): Promise<AuthorizationDecision> {
    const steps: EvaluationStep[] = [];
    const policy = getPolicy(input.permission);

    // Step 1: RBAC (from JWT claims, no external call)
    const rbacResult = this.rbac.evaluate(input.context, policy);
    steps.push({ layer: "rbac", ...rbacResult });
    if (rbacResult.result === "deny") {
      return this.buildDecision(input, false, rbacResult.reasons, steps);
    }

    // Step 2: ABAC (from request context, no external call)
    const abacResult = this.abac.evaluate(
      input.context,
      policy,
      input.resource,
    );
    steps.push({ layer: "abac", ...abacResult });
    if (abacResult.result === "deny") {
      return this.buildDecision(input, false, abacResult.reasons, steps);
    }

    // Step 3: OpenFGA (relationship check, external call)
    if (policy.requiresRelationshipCheck && input.resource?.id) {
      const fgaResult = await this.openfga.check(
        this.buildSubject(input.context),
        policy.relation,
        this.buildObject(input.resource),
      );
      steps.push({ layer: "openfga", ...fgaResult });
      if (fgaResult.result === "deny") {
        return this.buildDecision(
          input,
          false,
          ["relationship_missing"],
          steps,
        );
      }
    } else {
      steps.push({
        layer: "openfga",
        result: "skip",
        reason: "no_relationship_required",
        durationMs: 0,
      });
    }

    return this.buildDecision(input, true, ["policy_allow"], steps);
  }
}
```

### 3.3 Where It Lives

The `AuthorizationService` lives in `packages/authorization`. Both `orchestrator-api` and `agent-service` import it. Neither service contains its own authorization logic.

```
packages/authorization/
  src/
    authorization.service.ts    ← Main orchestrator
    rbac/evaluator.ts           ← Role-based checks (from JWT claims)
    abac/evaluator.ts           ← Attribute-based checks (from context)
    openfga/client.ts           ← OpenFGA relationship checks
    types.ts                    ← Shared types
    policies.ts                 ← Policy definitions
    nest.ts                     ← NestJS guard + decorator
```

---

## 4. Request Evaluation Flow (Implementation Level)

### 4.1 Full Flow

```
HTTP Request
    │
    ▼
AuthorizationContextMiddleware
    │  1. Extract JWT from Authorization header
    │  2. Validate signature, expiry, audience
    │  3. Extract: sub, principal_type, roles, tenant_id, agent metadata
    │  4. Build AuthorizationContext object
    │  5. Attach to request
    │
    ▼
ResourceContextMiddleware (optional, route-specific)
    │  6. Extract resource ID from route params or body
    │  7. Load resource metadata (owner, tenant, classification)
    │  8. Build ResourceContext object
    │  9. Attach to request
    │
    ▼
PermissionGuard
    │  10. Read required permission from @RequirePermission decorator
    │  11. Call AuthorizationService.evaluate()
    │      │
    │      ├── 12. RBAC: check actor.roles against policy.allowedRoles
    │      │       ✗ deny → 403 with role_grant_missing
    │      │
    │      ├── 13. ABAC: check tenant match, ownership, step-up, classification
    │      │       ✗ deny → 403 with specific ABAC reason
    │      │
    │      └── 14. OpenFGA: Check(subject, relation, object)
    │              ✗ deny → 403 with relationship_missing
    │
    │  15. Attach decision to request (for audit)
    │  16. Allow or throw ForbiddenException
    │
    ▼
Controller Handler
    │  17. Execute business logic
    │  18. Return response
    │
    ▼
AuditInterceptor
    │  19. Log authorization decision (allow or deny)
    │  20. Include: permission, subject, resource, result, reasons, duration
```

### 4.2 Short-Circuit Rules

| Step           | Short-circuits when                  | Why                                         |
| -------------- | ------------------------------------ | ------------------------------------------- |
| JWT validation | Invalid/expired token                | No identity = 401 immediately               |
| RBAC           | Role not in allowed set              | Fast, no external call, covers most denials |
| ABAC           | Tenant mismatch or ownership failure | Avoids OpenFGA round-trip for clear denials |
| OpenFGA        | No relationship found                | Fine-grained, final check                   |

### 4.3 Performance

| Step           | Latency            | External call                    |
| -------------- | ------------------ | -------------------------------- |
| JWT validation | <1ms (cached JWKS) | No (after initial JWKS fetch)    |
| RBAC           | <1ms               | No                               |
| ABAC           | <1ms               | No (uses request-scoped context) |
| OpenFGA        | 5-20ms             | Yes (gRPC to OpenFGA)            |

Total overhead per request: **5-25ms** for fully-evaluated permissions. RBAC-only endpoints add <1ms.

---

## 5. CASL Integration Model

### 5.1 Architecture

```
Backend                                    Frontend
┌──────────────────────┐                  ┌──────────────────────┐
│ GET /me/permissions  │                  │  CASL AbilityFactory │
│                      │──── JSON ────▶   │                      │
│ Evaluates full       │                  │  Builds ability from │
│ RBAC+ABAC+OpenFGA    │                  │  backend response    │
│ for all permissions  │                  │                      │
└──────────────────────┘                  └──────────┬───────────┘
                                                     │
                                                     ▼
                                          ┌──────────────────────┐
                                          │  React Components    │
                                          │  <Can I="execute"    │
                                          │       a="agent">     │
                                          │  Conditionally render│
                                          └──────────────────────┘
```

### 5.2 Backend Contract: `/me/permissions`

```json
{
  "evaluatedAt": "2026-04-03T12:00:00Z",
  "principal": { "sub": "auth0|alice", "type": "user", "roles": ["operator"] },
  "permissions": [
    { "action": "execute", "subject": "agent_action", "allowed": true },
    { "action": "read", "subject": "audit_event", "allowed": true },
    {
      "action": "inspect",
      "subject": "token_cache",
      "allowed": false,
      "reason": "role_grant_missing"
    },
    { "action": "connect", "subject": "provider_connection", "allowed": true },
    { "action": "revoke", "subject": "provider_connection", "allowed": true },
    { "action": "read", "subject": "brokered_token", "allowed": true },
    { "action": "broker", "subject": "brokered_token", "allowed": true }
  ]
}
```

### 5.3 Frontend Ability Factory

```typescript
// apps/web/src/auth/ability-factory.ts
import { defineAbility } from "@casl/ability";
import type { PermissionResponse } from "@actbound/sdk";

export function buildAbility(permissions: PermissionResponse) {
  return defineAbility((can, cannot) => {
    for (const p of permissions.permissions) {
      if (p.allowed) {
        can(p.action, p.subject);
      } else {
        cannot(p.action, p.subject);
      }
    }
  });
}
```

### 5.4 Refresh Strategy

| Event                              | Action                                 |
| ---------------------------------- | -------------------------------------- |
| Login                              | Fetch `/me/permissions`, build ability |
| Navigation to protected route      | Re-fetch if stale (>5 min)             |
| Delegation change (connect/revoke) | Re-fetch immediately                   |
| Token refresh                      | Re-fetch                               |

### 5.5 CASL Rules

1. **CASL never makes authorization decisions.** It hides/disables UI elements.
2. **Backend re-checks every action.** Even if CASL says "can", the backend may deny.
3. **CASL never calls OpenFGA.** The frontend has no OpenFGA access.
4. **CASL never evaluates ABAC.** Context-dependent checks are backend-only.
5. **Stale CASL state is a UX inconvenience, not a security risk.** The backend is authoritative.

---

## 6. Agent Enforcement Pattern

### 6.1 How Agents Are Authorized

Agents follow the exact same enforcement flow as users. The `PermissionGuard` does not distinguish between human and agent requests — the `AuthorizationService` handles principal-type-specific logic internally.

```
Agent M2M JWT
    │
    ▼
AuthorizationContextMiddleware
    │  Extracts: sub, principal_type=agent, agent_type, agent_instance_id, on_behalf_of
    │
    ▼
PermissionGuard
    │  Calls AuthorizationService.evaluate()
    │  RBAC: agent role allowed?
    │  ABAC: delegation context valid? step-up required?
    │  OpenFGA: agent is executor AND user is delegator?
    │
    ▼
Controller (if authorized)
```

### 6.2 Delegation Enforcement

When an agent acts on behalf of a user, authorization checks the **intersection** of three scopes:

1. **Agent capability** — OpenFGA: `agent:X executor agent_action:Y`
2. **User delegation** — OpenFGA: `user:Z delegator agent_action:Y`
3. **User authorization** — OpenFGA: user has permission on the resource

All three must pass. If any is missing, the action is denied.

### 6.3 Overreach Prevention

| Guard                       | What it prevents                                      |
| --------------------------- | ----------------------------------------------------- |
| Per-agent-instance identity | Agent cannot impersonate another agent                |
| Delegation intersection     | Agent cannot exceed the delegating user's permissions |
| ABAC step-up check          | Sensitive actions require step-up even for agents     |
| OpenFGA dual-authorization  | Agent alone cannot execute — needs user delegation    |
| No direct AWS access        | Agent cannot reach Secrets Manager or infrastructure  |

---

## 7. API Enforcement Standards

### 7.1 Every Endpoint Must Be Protected

No endpoint is unprotected. Either it requires a specific permission (via `@RequirePermission`) or it requires authentication only (via `@RequireAuth`). There is no unauthenticated API surface.

### 7.2 Permission Naming Convention

```
<resource_type>:<action>
```

| Permission                     | Meaning                             |
| ------------------------------ | ----------------------------------- |
| `agent_actions:execute`        | Execute an agent action             |
| `agent_actions:preview`        | Preview an agent action (read-only) |
| `brokered_tokens:read`         | Read broker status                  |
| `brokered_tokens:broker`       | Request a new brokered token        |
| `token_cache:inspect`          | Inspect the token cache             |
| `provider_connections:connect` | Connect a new provider              |
| `provider_connections:revoke`  | Revoke a provider connection        |
| `audit_events:read`            | Read audit logs                     |

### 7.3 Route-Level vs Action-Level

| Level                              | When to use                                 | Example                                                    |
| ---------------------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| Route-level (`@RequirePermission`) | Standard CRUD and feature endpoints         | `@RequirePermission("brokered_tokens:read")`               |
| Action-level (in-handler call)     | Complex operations with multiple sub-checks | Agent execution that checks executor + delegator + step-up |

Route-level is the default. Action-level is the exception for operations that need conditional sub-checks.

### 7.4 Cross-Service Consistency

Both `orchestrator-api` and `agent-service` use the same:

- `@RequirePermission` decorator
- `PermissionGuard`
- `AuthorizationService`
- Permission naming convention
- Decision shape (`AuthorizationDecision`)

The guard and authorization service come from `packages/authorization`. No service has its own authorization logic.

---

## 8. Observability and Audit

### 8.1 Decision Logging

Every authorization decision (allow and deny) is logged as a structured JSON event.

```json
{
  "event": "authorization_decision",
  "timestamp": "2026-04-03T12:00:00.123Z",
  "requestId": "req_abc123",
  "principal": {
    "sub": "auth0|alice",
    "type": "user",
    "roles": ["operator"]
  },
  "permission": "agent_actions:execute",
  "resource": {
    "type": "agent_action",
    "id": "action_001",
    "owner": "auth0|alice"
  },
  "decision": {
    "allowed": true,
    "reasons": [{ "code": "policy_allow" }],
    "evaluationPath": [
      { "layer": "rbac", "result": "pass", "durationMs": 0 },
      { "layer": "abac", "result": "pass", "durationMs": 0 },
      { "layer": "openfga", "result": "pass", "durationMs": 12 }
    ]
  },
  "service": "orchestrator-api"
}
```

### 8.2 What Is Captured

| Field                     | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `requestId`               | Correlates across services and audit entries |
| `principal.sub`           | Who made the request                         |
| `principal.type`          | User, service, or agent                      |
| `permission`              | What was requested                           |
| `resource.id`             | Which specific resource                      |
| `decision.allowed`        | Result                                       |
| `decision.reasons`        | Why (for both allow and deny)                |
| `decision.evaluationPath` | Which layers ran, their result and timing    |
| `service`                 | Which service evaluated the decision         |

### 8.3 Correlation

The `requestId` is generated at the edge (orchestrator-api middleware) and propagated to all downstream service calls. This allows tracing an authorization decision across orchestrator-api → agent-service.

### 8.4 Audit Trail

Authorization decisions are a first-class audit resource. The audit trail supports:

- "Show me all denied requests for user X in the last 24 hours"
- "Show me all agent actions executed on behalf of user Y"
- "Show me all requests that required OpenFGA and the query time"

---

## 9. Failure Handling

### 9.1 Policy: Fail Closed

**Every authorization failure results in denial.** There is no fail-open path.

| Failure                      | Response                  | Reason code                         |
| ---------------------------- | ------------------------- | ----------------------------------- |
| OpenFGA unavailable          | 503 Service Unavailable   | `authorization_service_unavailable` |
| OpenFGA timeout (>5s)        | 503 Service Unavailable   | `authorization_timeout`             |
| JWT invalid/expired          | 401 Unauthorized          | `identity_invalid`                  |
| JWT missing required claims  | 401 Unauthorized          | `identity_incomplete`               |
| AuthorizationService throws  | 500 Internal Server Error | `authorization_error`               |
| Unknown permission requested | 403 Forbidden             | `unknown_permission`                |

### 9.2 Why Not Fail Open

Fail-open means that when the authorization system is down, all requests are allowed. This is unacceptable for a Zero Trust platform:

- Agents could execute unauthorized actions during an outage
- Tenant isolation would be broken
- Delegated access could be misused

A brief outage that denies all requests is preferable to a brief window where authorization is bypassed.

### 9.3 Resilience

| Measure                                 | Purpose                                            |
| --------------------------------------- | -------------------------------------------------- |
| OpenFGA client timeout: 5s              | Prevent request hanging                            |
| OpenFGA retry: 1 retry with 500ms delay | Handle transient failures                          |
| Circuit breaker on OpenFGA client       | Stop hammering a failing service                   |
| RBAC + ABAC don't depend on OpenFGA     | Many requests short-circuit before OpenFGA         |
| Health check endpoint (unauthenticated) | Monitoring can detect authorization service issues |

---

## 10. Reusable Skills

### 10.1 `skill.authz.evaluate.request`

**Purpose:** Evaluate a full authorization decision for a request.

**Inputs:** `AuthorizationContext` (identity + ABAC attributes), `Permission`, `ResourceContext` (optional)

**Outputs:** `AuthorizationDecision` (allowed, reasons, evaluation path)

**Steps:** Extract policy → RBAC check → ABAC check → OpenFGA check (if needed) → aggregate → return decision

### 10.2 `skill.casl.build.ability-factory`

**Purpose:** Build a CASL ability set from backend permission responses.

**Inputs:** `/me/permissions` JSON response

**Outputs:** CASL `Ability` instance

**Steps:** Parse response → iterate permissions → map to `can`/`cannot` rules → return ability

### 10.3 `skill.backend.enforce.policy`

**Purpose:** Enforce authorization at the NestJS guard level.

**Inputs:** Route handler metadata (`@RequirePermission`), request with `AuthorizationContext`

**Outputs:** Pass (allow handler to execute) or throw `ForbiddenException`

**Steps:** Read permission from decorator → call `skill.authz.evaluate.request` → attach decision to request → allow or throw

### 10.4 `skill.agent.enforce.permissions`

**Purpose:** Authorize an agent action with delegation validation.

**Inputs:** Agent `AuthorizationContext` (with `on_behalf_of`), action permission, resource

**Outputs:** `AuthorizationDecision` with delegation-specific reasons

**Steps:** RBAC (agent role) → ABAC (delegation context, step-up) → OpenFGA (executor AND delegator) → aggregate

---

## Related ADRs

- [ADR-018: Centralized Authorization Service Pattern](../decisions/ADR-018-centralized-authorization-service.md)
- [ADR-019: Backend Enforcement Strategy](../decisions/ADR-019-backend-enforcement-strategy.md)
- [ADR-020: CASL Integration Model](../decisions/ADR-020-casl-integration-model.md)
- [ADR-021: Fail-Closed Authorization Policy](../decisions/ADR-021-fail-closed-policy.md)
