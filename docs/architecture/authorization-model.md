# Authorization Model: RBAC, ABAC, and OpenFGA

## Overview

This document defines the unified authorization architecture for the ActBound AI platform. Three layers handle authorization at different granularities. Each layer has a strict scope — no overlap, no leakage.

| Layer       | Responsibility                  | Granularity                                                | Storage                 |
| ----------- | ------------------------------- | ---------------------------------------------------------- | ----------------------- |
| **RBAC**    | Coarse-grained role checks      | "Can this role access this feature area?"                  | Auth0 JWT claims        |
| **ABAC**    | Contextual attribute evaluation | "Does the request context allow this?"                     | Runtime (not persisted) |
| **OpenFGA** | Relationship-based access       | "Does this principal have this relation to this resource?" | OpenFGA tuple store     |

**Decision rule:** If a check only depends on the actor's role, use RBAC. If it depends on request context or attributes, use ABAC. If it depends on a relationship between a principal and a resource, use OpenFGA.

---

## 1. Authorization Model Overview

### 1.1 What Each Layer Does

**RBAC — Role-Based Access Control**

- Gates access to feature areas and API surface groups
- Uses roles from Auth0 JWT claims (`https://actbound.ai/roles`)
- Evaluated first as a fast short-circuit (no external calls)
- Examples: "Only admins can access admin endpoints." "Viewers cannot execute agent actions."

**ABAC — Attribute-Based Access Control**

- Evaluates request context, environment, and principal attributes
- Not persisted — computed from the request, JWT, and backend state at evaluation time
- Examples: "This request is a preview (read-only)." "This agent is acting on behalf of user X." "Step-up authentication is required for sensitive actions."

**OpenFGA — Relationship-Based Access Control**

- Models fine-grained, resource-level relationships
- Stores tuples like `user:alice#member@org:acme`
- Handles multi-tenant isolation, resource ownership, delegation chains
- Examples: "User alice is a member of org acme." "Agent research-001 can act on behalf of user alice within org acme."

### 1.2 What Each Layer Must NOT Do

| Layer   | Must NOT                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------ |
| RBAC    | Model resource-level permissions, per-resource ownership, or tenant membership                         |
| ABAC    | Persist decisions, replace OpenFGA for relationship checks, or act as a tuple store                    |
| OpenFGA | Store identity data (email, PII), store dynamic request context, or replace RBAC for coarse role gates |

---

## 2. RBAC Model

### 2.1 System Roles

| Role       | Purpose                                                  | Assigned to              |
| ---------- | -------------------------------------------------------- | ------------------------ |
| `admin`    | Full platform access, tenant management                  | Human users              |
| `operator` | Execute agent actions, manage connections, broker tokens | Human users              |
| `viewer`   | Read-only access to dashboards, audit logs, status       | Human users              |
| `service`  | Internal service-to-service operations                   | Backend services (M2M)   |
| `agent`    | Agent-specific operations, scoped by delegation          | AI agent instances (M2M) |

### 2.2 Where Roles Live

Roles are stored in Auth0 user/app metadata and injected into JWTs via Auth0 Actions.

| Principal type | Role source                     | JWT claim                                          |
| -------------- | ------------------------------- | -------------------------------------------------- |
| Human user     | Auth0 user `app_metadata.roles` | `https://actbound.ai/roles`                        |
| Service        | Auth0 M2M app metadata          | `https://actbound.ai/roles` (always `["service"]`) |
| Agent          | Auth0 M2M app metadata          | `https://actbound.ai/roles` (always `["agent"]`)   |

### 2.3 Role Assignment

- **Users:** assigned by an admin via the platform UI (writes to Auth0 `app_metadata`)
- **Services:** role is fixed at M2M application creation (always `service`)
- **Agents:** role is fixed at agent provisioning (always `agent`)

Roles are **not** stored in OpenFGA. Roles are identity metadata, not relationships.

### 2.4 Role Usage

RBAC is the first check in every authorization decision. It runs entirely from JWT claims — no external call.

```typescript
// Pseudocode: RBAC gate
if (!policy.allowedRoles.includes(actor.role)) {
  return deny("role_grant_missing");
}
// Proceed to ABAC and OpenFGA checks
```

---

## 3. ABAC Model

### 3.1 Subject Attributes (from JWT + backend state)

| Attribute        | Source                  | Example                    |
| ---------------- | ----------------------- | -------------------------- |
| `principal_type` | JWT claim               | `user`, `service`, `agent` |
| `roles`          | JWT claim               | `["operator"]`             |
| `tenant_id`      | JWT claim               | `tenant_acme`              |
| `agent_type`     | JWT claim (agents only) | `research`                 |
| `on_behalf_of`   | JWT claim (agents only) | `auth0\|abc123`            |

### 3.2 Resource Attributes (from backend state)

| Attribute          | Source                    | Example                               |
| ------------------ | ------------------------- | ------------------------------------- |
| `resource_type`    | Request routing / handler | `agent_action`, `brokered_token`      |
| `owner_subject_id` | Database / backend state  | `auth0\|abc123`                       |
| `classification`   | Resource metadata         | `routine`, `sensitive`, `high_impact` |
| `tenant_id`        | Resource metadata         | `tenant_acme`                         |

### 3.3 Request Context Attributes (ephemeral, never persisted)

| Attribute               | Source                     | Example          |
| ----------------------- | -------------------------- | ---------------- |
| `step_up_satisfied`     | Auth middleware            | `true` / `false` |
| `preview_mode`          | Request parameter          | `true` / `false` |
| `internal_service_call` | JWT `principal_type` check | `true` / `false` |
| `request_id`            | Middleware                 | UUID             |

### 3.4 ABAC Evaluation Rules

ABAC attributes are assembled into an `AuthorizationContext` object at the middleware layer and passed to the authorization evaluator. They are never persisted or stored in OpenFGA.

**ABAC checks include:**

- Tenant boundary enforcement (`request.tenant_id === resource.tenant_id`)
- Ownership validation (`resource.owner_subject_id === subject.id`)
- Step-up requirements for sensitive actions
- Agent delegation scope validation
- Preview mode restrictions

---

## 4. OpenFGA Model Design

### 4.1 Type Definitions (OpenFGA DSL)

```
model
  schema 1.1

type organization
  relations
    define admin: [user, service]
    define member: [user, agent] or admin
    define viewer: [user] or member

type project
  relations
    define org: [organization]
    define owner: [user]
    define editor: [user, agent] or owner or admin from org
    define viewer: [user, agent] or editor or member from org

type agent_action
  relations
    define project: [project]
    define executor: [agent]
    define delegator: [user]
    define can_execute: executor and delegator
    define can_preview: [user, agent] or can_execute or viewer from project

type provider_connection
  relations
    define owner: [user]
    define org: [organization]
    define can_use: owner or admin from org
    define can_revoke: owner or admin from org
    define can_read: can_use or member from org

type vault_session
  relations
    define owner: [user]
    define connection: [provider_connection]
    define can_read: owner

type brokered_token
  relations
    define project: [project]
    define can_read: [user, service] or viewer from project
    define can_broker: [user, service] or editor from project
    define can_inspect_cache: [user, service] or admin from project
```

### 4.2 Example Tuples

```
# Organization membership
user:auth0|alice    member    organization:acme
user:auth0|bob      admin     organization:acme
service:orchestrator member   organization:acme

# Project ownership
organization:acme   org       project:proj_001
user:auth0|alice    owner     project:proj_001

# Agent delegation
agent:research_001  executor  agent_action:action_001
user:auth0|alice    delegator agent_action:action_001
project:proj_001    project   agent_action:action_001

# Provider connection
user:auth0|alice    owner     provider_connection:google_alice
organization:acme   org       provider_connection:google_alice

# Vault session
user:auth0|alice    owner     vault_session:sess_001
provider_connection:google_alice connection vault_session:sess_001
```

### 4.3 Design Principles

1. **OpenFGA stores relationships, not identity.** No email, no PII, no role assignments.
2. **Subjects are typed identifiers.** `user:auth0|alice`, `agent:research_001`, `service:orchestrator`.
3. **Dynamic context is never a tuple.** Step-up status, request mode, and timestamps are ABAC attributes, not OpenFGA data.
4. **Inheritance flows through relations.** Org admin inherits project editor. Project editor inherits project viewer.
5. **Agent authorization requires both executor AND delegator.** An agent can only execute an action if it is assigned as executor and a user has delegated.

---

## 5. Authorization Decision Flow

### 5.1 Standard Request Flow

```
Request arrives with JWT
        │
        ▼
Step 1: VALIDATE IDENTITY
        │  Parse and verify JWT (signature, expiry, audience)
        │  Extract: sub, principal_type, roles, tenant_id, agent metadata
        │  ✗ Invalid token → 401
        │
        ▼
Step 2: RBAC CHECK (fast, from JWT claims, no external call)
        │  Does the actor's role allow this feature area?
        │  ✗ Role not allowed → 403 (role_grant_missing)
        │
        ▼
Step 3: ABAC EVALUATION (from request context + backend state)
        │  Assemble AuthorizationContext
        │  Check: tenant boundary, ownership, step-up, preview mode
        │  ✗ Context check fails → 403 (specific ABAC reason)
        │
        ▼
Step 4: OpenFGA CHECK (relationship query)
        │  Check(subject, relation, object)
        │  Example: Check(user:auth0|alice, can_execute, agent_action:action_001)
        │  ✗ No relationship → 403 (relationship_missing)
        │
        ▼
Step 5: ALLOW
        │  All checks passed → proceed with request
```

### 5.2 Short-Circuit Logic

| Step              | Short-circuits on                  | Why                                      |
| ----------------- | ---------------------------------- | ---------------------------------------- |
| Step 1 (Identity) | Invalid/expired JWT                | No identity = no authorization possible  |
| Step 2 (RBAC)     | Role not in allowed set            | Fast rejection, no external calls needed |
| Step 3 (ABAC)     | Tenant mismatch, ownership failure | Prevents unnecessary OpenFGA query       |
| Step 4 (OpenFGA)  | No matching relation               | Fine-grained denial                      |

### 5.3 Fallback Behavior

**Default deny.** If any step fails or errors, the request is denied. There is no fallback to a less restrictive check. Authorization failures are logged with the specific step and reason.

### 5.4 Which Checks Apply When

Not every request requires all four steps. The policy definition specifies which checks apply.

| Permission type                                 | RBAC               | ABAC               | OpenFGA                  |
| ----------------------------------------------- | ------------------ | ------------------ | ------------------------ |
| Feature-area access (e.g., view dashboard)      | Yes                | Tenant only        | No                       |
| Resource operation (e.g., execute agent action) | Yes                | Full context       | Yes                      |
| Admin operation (e.g., manage org)              | Yes                | Tenant only        | Yes (org admin check)    |
| Service-to-service call                         | Yes (role=service) | Internal call flag | No (pre-trusted via M2M) |

---

## 6. Identity to Authorization Contract

### 6.1 JWT Claims Required for Authorization

| Claim                                   | Used by        | Purpose                                      |
| --------------------------------------- | -------------- | -------------------------------------------- |
| `sub`                                   | OpenFGA        | Principal identifier for relationship checks |
| `https://actbound.ai/principal_type`    | RBAC routing   | Determines which evaluation path             |
| `https://actbound.ai/roles`             | RBAC           | Role-based feature gating                    |
| `https://actbound.ai/tenant_id`         | ABAC           | Tenant boundary enforcement                  |
| `https://actbound.ai/agent_type`        | ABAC           | Agent-type-specific policy                   |
| `https://actbound.ai/agent_instance_id` | OpenFGA        | Agent principal in relationship checks       |
| `https://actbound.ai/on_behalf_of`      | ABAC + OpenFGA | Delegation chain validation                  |

### 6.2 What Must NOT Be in JWTs

| Data                     | Why not                       | Where it lives               |
| ------------------------ | ----------------------------- | ---------------------------- |
| Fine-grained permissions | Too large, stale quickly      | OpenFGA (queried at runtime) |
| Org membership list      | Changes over time, too large  | OpenFGA tuples               |
| Resource ownership       | Per-request, not per-identity | Backend state + OpenFGA      |
| PII (email, name)        | Unnecessary exposure          | Auth0 userinfo endpoint      |

### 6.3 Identity Mapping

| JWT field                                                  | Maps to                                      |
| ---------------------------------------------------------- | -------------------------------------------- |
| `sub` = `auth0\|abc`                                       | OpenFGA subject: `user:auth0\|abc`           |
| `sub` = `client_id@clients` + `principal_type` = `service` | OpenFGA subject: `service:client_id`         |
| `sub` = `client_id@clients` + `principal_type` = `agent`   | OpenFGA subject: `agent:<agent_instance_id>` |

---

## 7. IdP Lifecycle to OpenFGA Sync Model

### 7.1 Architecture

```
Auth0 ──(webhook/log stream)──▶ EventBridge ──▶ Sync Lambda ──▶ OpenFGA
                                                     │
                                                     ▼
                                              Dead Letter Queue
                                              (failed events)
```

### 7.2 Event Sources and Tuple Actions

| Auth0 Event                | OpenFGA Action                   | Tuple Example                                       |
| -------------------------- | -------------------------------- | --------------------------------------------------- |
| User created               | Write org membership tuple       | `user:auth0\|new member organization:default`       |
| User added to org          | Write membership tuple           | `user:auth0\|alice member organization:acme`        |
| User removed from org      | Delete membership tuple          | Delete `user:auth0\|alice member organization:acme` |
| User role changed to admin | Write admin tuple, delete member | `user:auth0\|alice admin organization:acme`         |
| User deleted               | Delete all tuples for subject    | Delete all tuples where subject = `user:auth0\|xxx` |
| Agent provisioned          | Write agent executor tuples      | `agent:research_001 executor agent_action:*`        |
| Agent decommissioned       | Delete all agent tuples          | Delete all tuples where subject = `agent:xxx`       |

### 7.3 Events That Do NOT Trigger Tuple Writes

| Event           | Why                                        |
| --------------- | ------------------------------------------ |
| User login      | Login is authentication, not authorization |
| Token refresh   | No relationship change                     |
| Password change | Identity concern, not authorization        |
| Email change    | PII, not stored in OpenFGA                 |
| Role assignment | Roles live in Auth0 claims, not OpenFGA    |

### 7.4 Sync Design Rules

1. **Idempotent writes.** The sync Lambda uses OpenFGA's `Write` API which is idempotent — writing an existing tuple is a no-op.
2. **Idempotent deletes.** Deleting a non-existent tuple is a no-op.
3. **At-least-once delivery.** EventBridge guarantees at-least-once. Combined with idempotent operations, this is safe.
4. **Dead letter queue.** Failed events go to SQS DLQ for manual inspection and replay.
5. **Reconciliation.** A scheduled Lambda runs daily to compare Auth0 org membership with OpenFGA tuples and fix drift.

### 7.5 Projection Rules

| Data                               | Projected to                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| User org membership                | OpenFGA tuple (`user:X member organization:Y`)                                        |
| Agent-user delegation              | OpenFGA tuple (`agent:X executor agent_action:Y` + `user:Z delegator agent_action:Y`) |
| Project ownership                  | OpenFGA tuple (`user:X owner project:Y`)                                              |
| User roles (admin/operator/viewer) | Auth0 JWT claims (NOT OpenFGA)                                                        |
| Email, name, profile               | Auth0 (NOT OpenFGA)                                                                   |

---

## 8. Agent Authorization Model

### 8.1 Agent Authorization is Two-Dimensional

An agent needs both its own permission AND a user's delegation to act.

```
Agent authorized = agent_has_capability AND user_has_delegated
```

### 8.2 OpenFGA Agent Tuples

```
# Agent is capable of executing actions in this project
agent:research_001  executor    agent_action:action_001

# User has delegated authority for this action
user:auth0|alice    delegator   agent_action:action_001

# The OpenFGA model requires BOTH:
# can_execute: executor and delegator
```

### 8.3 Agent Access Patterns

| Pattern                               | How it works                       | OpenFGA check                                            |
| ------------------------------------- | ---------------------------------- | -------------------------------------------------------- |
| Agent acts on behalf of user          | Agent `sub` + `on_behalf_of` claim | Check agent is executor AND delegating user is delegator |
| Agent acts autonomously (system task) | Agent `sub` + role `agent`         | RBAC only (no user delegation needed)                    |
| Agent reads project data              | Agent `sub`                        | Check agent has viewer relation to project               |

### 8.4 Delegation Scope

Delegation is not unlimited. The agent's scope is the **intersection** of:

1. What the agent is assigned to do (OpenFGA `executor` tuples)
2. What the user has consented to (consent scopes in backend state)
3. What the user is authorized to do (OpenFGA relations on the user)

If any of these three are insufficient, the action is denied.

---

## 9. CASL Integration Contract

### 9.1 Purpose

CASL provides frontend permission-aware rendering in `apps/web`. It is an advisory UX layer — never authoritative.

### 9.2 Data Flow

```
Backend (GET /me/permissions)
        │
        │ Returns: array of { action, subject, allowed, reason }
        │
        ▼
Frontend (CASL ability builder)
        │
        │ Builds: defineAbility(can => { ... })
        │
        ▼
React components
        │ Use: <Can I="execute" a="agent_action">
        │ Conditionally render UI elements
```

### 9.3 CASL Inputs

The `/me/permissions` endpoint returns pre-evaluated decisions:

```json
[
  { "action": "execute", "subject": "agent_action", "allowed": true },
  { "action": "read", "subject": "audit_event", "allowed": true },
  { "action": "inspect", "subject": "token_cache", "allowed": false },
  { "action": "connect", "subject": "provider_connection", "allowed": true }
]
```

These decisions are computed by the backend using the full RBAC + ABAC + OpenFGA pipeline.

### 9.4 What CASL Must NOT Do

1. **Never make backend authorization decisions.** CASL hides buttons — the backend re-checks everything.
2. **Never call OpenFGA directly.** The frontend does not have OpenFGA access.
3. **Never cache permissions beyond the session.** Refresh on login, on navigation, and on delegation changes.
4. **Never evaluate ABAC attributes.** Context-dependent checks are backend-only.

---

## 10. Failure and Security Considerations

### 10.1 Permission Escalation Risks

| Risk                                   | Mitigation                                                                                   |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| User assigns themselves a higher role  | Role assignment is admin-only, enforced in Auth0                                             |
| Stale JWT with old role after demotion | Short token lifetime (15 min). Backend always checks current state for sensitive ops.        |
| Agent inherits user's full permissions | Delegation is intersection-scoped (agent capability AND user consent AND user authorization) |
| OpenFGA tuple grants unintended access | Tuple writes are audited. Reconciliation Lambda detects drift.                               |

### 10.2 Stale Tuples

| Risk                                     | Mitigation                                                              |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| User removed from org but tuple persists | Auth0 event triggers tuple delete. Daily reconciliation as safety net.  |
| Agent decommissioned but tuples remain   | Agent lifecycle includes tuple cleanup. Reconciliation catches orphans. |
| Project deleted but tuples remain        | Project deletion handler purges all related tuples.                     |

### 10.3 Inconsistent State Between Auth0 and OpenFGA

| Risk                              | Mitigation                                                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sync Lambda fails                 | DLQ captures failed events. Alert on DLQ depth. Manual replay.                                                                                      |
| Auth0 webhook missed              | Daily reconciliation Lambda compares Auth0 org membership to OpenFGA tuples.                                                                        |
| Race condition during role change | RBAC uses JWT claims (eventually consistent via token refresh). OpenFGA uses tuples (eventually consistent via sync). Both converge within minutes. |

### 10.4 Replay and Race Conditions

| Risk                         | Mitigation                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------- |
| Replayed JWT with old claims | Short token lifetime + `iat` validation                                             |
| Concurrent tuple writes      | OpenFGA handles concurrent writes safely (idempotent)                               |
| Check-then-act race          | Authorization is re-evaluated at the point of action, not cached from a prior check |

### 10.5 Overuse of RBAC vs Relationship Modeling

| Risk                                                | Mitigation                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------- |
| Adding fine-grained permissions to roles            | Policy: if a check involves a specific resource, it must use OpenFGA |
| Role explosion (creating roles for every edge case) | Keep roles to 5 or fewer. Use OpenFGA relations for granularity.     |
| Skipping OpenFGA because RBAC is easier             | Code review + agent instructions enforce the boundary                |

---

## Related ADRs

- [ADR-014: RBAC vs ABAC vs OpenFGA Separation](../decisions/ADR-014-rbac-abac-openfga-separation.md)
- [ADR-015: OpenFGA Model Design](../decisions/ADR-015-openfga-model-design.md)
- [ADR-016: Authorization Decision Flow](../decisions/ADR-016-authorization-decision-flow.md)
- [ADR-017: IdP to OpenFGA Sync Strategy](../decisions/ADR-017-idp-openfga-sync-strategy.md)
