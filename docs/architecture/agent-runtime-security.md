# Agent Runtime Security Model

## Overview

This document defines the complete runtime security model for AI agents operating on the ActBound platform. It covers how agents authenticate, access secrets, call tools, act on behalf of users, and remain observable and controllable in production.

**Core principle:** Agents are first-class principals with their own identity, constrained by explicit permission boundaries. They are never anonymous, never share identities, and never bypass backend authorization.

---

## 1. Agent Security Model Overview

### 1.1 What Is an Agent

An agent is an autonomous or semi-autonomous process that performs actions — reading data, calling APIs, executing tasks — either independently or on behalf of a user. Agents are not backend services. They are **untrusted principals** that must prove authorization for every action.

### 1.2 Agent vs Service

| Property      | Backend service            | AI agent                                  |
| ------------- | -------------------------- | ----------------------------------------- |
| Trust level   | Trusted (runs our code)    | Untrusted (runs dynamic logic)            |
| Identity      | Fixed at deployment        | Per-instance, provisioned                 |
| AWS access    | Direct IAM role            | None (brokered through services)          |
| Secret access | Direct via Secrets Manager | Brokered through services only            |
| Authorization | RBAC + known behavior      | RBAC + ABAC + OpenFGA + delegation        |
| Supervision   | Logs + metrics             | Logs + metrics + guardrails + kill switch |

### 1.3 Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                       USER BOUNDARY                             │
│  User authenticates via Auth0, delegates to agents via consent  │
├─────────────────────────────────────────────────────────────────┤
│                       AGENT BOUNDARY                            │
│  Agent authenticates with own M2M credentials                   │
│  Agent requests actions through orchestrator-api                │
│  Agent never has direct infrastructure access                   │
├─────────────────────────────────────────────────────────────────┤
│                       SERVICE BOUNDARY                          │
│  orchestrator-api validates agent identity + authorization      │
│  orchestrator-api brokers secrets, tools, and external calls    │
│  agent-service re-checks authorization independently            │
├─────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE BOUNDARY                      │
│  AWS (Secrets Manager, KMS, compute) — IAM roles only           │
│  OpenFGA — relationship store                                   │
│  Auth0 Token Vault — delegated OAuth tokens                     │
│  Redis, databases — service-layer access only                   │
└─────────────────────────────────────────────────────────────────┘
```

**Key rule:** Agents interact with infrastructure exclusively through the service boundary. No direct AWS, database, Redis, or Token Vault access.

---

## 2. Agent Identity Strategy

### 2.1 Decision: Per-Agent-Instance Identity

Each deployed agent instance gets its own Auth0 M2M application with unique credentials. See ADR-007 for the full rationale.

| Model              | Traceability | Revocability         | Blast radius | Chosen  |
| ------------------ | ------------ | -------------------- | ------------ | ------- |
| Shared identity    | Low          | All agents affected  | Maximum      | No      |
| Per-agent-type     | Medium       | All of type affected | Type-wide    | No      |
| Per-agent-instance | High         | Single instance      | Minimal      | **Yes** |

### 2.2 Agent JWT

```json
{
  "iss": "https://dev-6az71xw7wqwtmp0q.us.auth0.com/",
  "sub": "agent_research_001_client_id@clients",
  "aud": "https://api.actbound.ai",
  "exp": 1720003600,
  "https://actbound.ai/principal_type": "agent",
  "https://actbound.ai/roles": ["agent"],
  "https://actbound.ai/agent_type": "research",
  "https://actbound.ai/agent_instance_id": "agent_research_001",
  "https://actbound.ai/on_behalf_of": "auth0|alice",
  "https://actbound.ai/tenant_id": "tenant_acme"
}
```

### 2.3 Attribution

Every agent action is attributable via:

| Dimension       | Source              | Example                      |
| --------------- | ------------------- | ---------------------------- |
| Agent identity  | JWT `sub`           | `agent_research_001@clients` |
| Agent type      | JWT claim           | `research`                   |
| Instance ID     | JWT claim           | `agent_research_001`         |
| Delegating user | JWT `on_behalf_of`  | `auth0\|alice` (or absent)   |
| Tenant          | JWT `tenant_id`     | `tenant_acme`                |
| Action          | Request + audit log | `agent_actions:execute`      |
| Resource        | Request + audit log | `project:proj_001`           |

### 2.4 Lifecycle

```
Provision → Auth0 M2M app created, client secret stored in AWS Secrets Manager
Operate   → Agent authenticates with own credentials, acts within boundaries
Revoke    → Auth0 M2M app disabled, Secrets Manager entry removed, OpenFGA tuples purged
```

---

## 3. Independent vs Delegated Agent Actions

### 3.1 Independent Actions

The agent acts under its own identity for system-level operations.

| Property       | Value                                               |
| -------------- | --------------------------------------------------- |
| `on_behalf_of` | Absent from JWT                                     |
| Authorization  | Agent's own RBAC role + OpenFGA tuples              |
| Use cases      | Health checks, system maintenance, batch processing |
| OpenFGA check  | `agent:X can_read project:Y`                        |

### 3.2 Delegated Actions

The agent acts on behalf of a specific user with the user's delegated consent.

| Property       | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| `on_behalf_of` | Present in JWT (user's `sub`)                                            |
| Authorization  | Intersection of agent capability AND user consent AND user authorization |
| Use cases      | Execute user-requested tasks, call external APIs with user tokens        |
| OpenFGA check  | `agent:X executor agent_action:Y` AND `user:Z delegator agent_action:Y`  |

### 3.3 Decision Matrix

| Agent wants to...                 | Independent | Delegated | Authorization required                                |
| --------------------------------- | ----------- | --------- | ----------------------------------------------------- |
| Read system metrics               | Yes         | —         | Agent RBAC only                                       |
| Read user's project data          | —           | Yes       | Agent executor + user delegator + user project access |
| Call Google API with user's token | —           | Yes       | Agent executor + user delegator + Token Vault consent |
| Execute a sensitive action        | —           | Yes       | All above + step-up authentication                    |

### 3.4 Revocation

| What is revoked                  | Effect                                                            |
| -------------------------------- | ----------------------------------------------------------------- |
| User revokes delegation          | All `delegator` tuples for that user + agent removed from OpenFGA |
| Admin disables agent             | Auth0 M2M app disabled, all OpenFGA tuples purged                 |
| User revokes provider connection | Token Vault entries removed, broker cache invalidated             |

---

## 4. Delegation Model

### 4.1 Delegation Chain

```
User ──(consents)──▶ Delegation Grant ──(authorizes)──▶ Agent Action
  │                      │                                    │
  │                      │                                    │
  ▼                      ▼                                    ▼
Auth0 identity      OpenFGA tuples                    Backend validates:
(sub, roles)        (delegator + executor)            1. Agent is executor
                                                      2. User is delegator
                                                      3. User has resource access
                                                      4. Consent scopes match
```

### 4.2 Token Vault Role in Delegation

Token Vault is involved **only** when the agent needs to call an external third-party API on behalf of the user (Google, Slack, GitHub).

```
Agent ──(M2M JWT)──▶ orchestrator-api
                          │
                          ├── 1. Validate agent identity
                          ├── 2. Check OpenFGA: agent executor + user delegator
                          ├── 3. Check ABAC: consent scopes, step-up
                          ├── 4. Retrieve delegated token from Token Vault
                          └── 5. Call external API with delegated token
                          │
                          ▼
                     External API (Google, Slack, etc.)
```

The agent never sees the Token Vault token. The orchestrator retrieves it, uses it, and returns only safe metadata.

### 4.3 OpenFGA Role in Delegation

```
# Agent can execute this action
agent:research_001  executor    agent_action:action_001

# User has delegated this action
user:auth0|alice    delegator   agent_action:action_001

# OpenFGA model: can_execute requires BOTH executor AND delegator
```

### 4.4 Audit Requirements

Every delegated action must log:

- Agent `sub` and `agent_instance_id`
- Delegating user's `sub` (from `on_behalf_of`)
- What was delegated (action, resource, scope)
- Whether Token Vault was accessed
- Result (success/failure)
- Correlation ID for multi-step workflows

---

## 5. Agent Secret Access Model

### 5.1 Access Tiers

| Tier                              | What the agent can access            | How                                                |
| --------------------------------- | ------------------------------------ | -------------------------------------------------- |
| Tier 0: Own credentials           | Agent's own Auth0 M2M client secret  | AWS Secrets Manager (at startup)                   |
| Tier 1: Brokered platform secrets | API keys, service credentials        | Via orchestrator-api (agent never sees raw secret) |
| Tier 2: Delegated user tokens     | User's OAuth tokens from Token Vault | Via orchestrator-api (agent never sees raw token)  |
| Tier 3: Direct AWS access         | —                                    | **Forbidden.** Agents have no IAM role.            |

### 5.2 Rules

1. **Agents authenticate with their own M2M credentials.** The agent's client secret is the only secret it directly holds.
2. **All other secrets are brokered.** The agent calls the orchestrator, which retrieves the secret via its own IAM role.
3. **Agents never receive raw secrets in API responses** unless architecturally required and explicitly approved. The orchestrator uses the secret on the agent's behalf and returns results.
4. **Token Vault tokens are never exposed to agents.** The orchestrator retrieves delegated tokens, calls the external API, and returns safe metadata.
5. **No blanket secret access.** Each secret retrieval requires a separate authorization check.

### 5.3 Flow

```
Agent                   orchestrator-api                 Secrets Manager / Token Vault
  │                           │                                    │
  │── M2M JWT ──────────────▶ │                                    │
  │                           │── Validate identity ──────────────▶│
  │                           │── Check authorization (OpenFGA) ──▶│
  │                           │── Retrieve secret (IAM role) ─────▶│
  │                           │◀── Secret value ──────────────────│
  │                           │── Use secret (call external API) ──│
  │◀── Safe result ──────────│                                    │
  │   (no raw secret)         │                                    │
```

---

## 6. Tool Access Control Model

### 6.1 Tool Categories

| Category           | Risk level | Examples                                  | Authorization                       |
| ------------------ | ---------- | ----------------------------------------- | ----------------------------------- |
| Read-only internal | Low        | Query project data, list connections      | RBAC + OpenFGA project access       |
| Read-only external | Medium     | Search Google, read Slack messages        | Delegation + Token Vault consent    |
| Write internal     | High       | Update records, create resources          | RBAC + OpenFGA + ABAC ownership     |
| Write external     | High       | Send email, post to Slack, execute trades | Delegation + Token Vault + step-up  |
| Destructive        | Critical   | Delete resources, revoke connections      | Delegation + step-up + confirmation |

### 6.2 Tool Registration

Tools are registered in the authorization model with:

```typescript
interface ToolRegistration {
  toolId: string; // "google.calendar.create_event"
  category: ToolCategory; // "write_external"
  permission: Permission; // "agent_actions:execute"
  requiresDelegation: boolean;
  requiresStepUp: boolean;
  requiredScopes: string[]; // Token Vault / consent scopes needed
}
```

### 6.3 When Checks Happen

| Phase            | What is checked                                         | Why                                              |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Before planning  | Agent can access the tool category                      | Prevent wasted computation on unauthorized plans |
| Before execution | Full authorization (RBAC + ABAC + OpenFGA + delegation) | Definitive authorization at the point of action  |

Both checks are mandatory for write and destructive tools. Read-only tools may skip the planning check.

### 6.4 Tool Permission Flow

```
Agent plans to use tool "google.calendar.create_event"
    │
    ├── Pre-check: Does agent have write_external capability? (RBAC)
    │   ✗ deny → agent replans without this tool
    │
    ├── Pre-check: Is delegation active for this user + scope? (OpenFGA)
    │   ✗ deny → agent reports delegation required
    │
    ▼
Agent requests execution
    │
    ├── Full check: RBAC + ABAC + OpenFGA (executor + delegator)
    ├── Token Vault: retrieve delegated Google token
    ├── Step-up: required for write_external? Check ABAC.
    ├── Execute: orchestrator calls Google Calendar API
    └── Audit: log agent, user, tool, resource, result
```

---

## 7. Agent-to-Service Trust Pattern

### 7.1 Call Pattern

Agents always call through the orchestrator. Never directly to agent-service, databases, or infrastructure.

```
Agent ──(M2M JWT)──▶ orchestrator-api ──(M2M JWT)──▶ agent-service
                          │                               │
                     Validates agent               Validates service
                     identity + authz              identity + re-checks authz
```

### 7.2 Identity Context Propagation

The orchestrator propagates identity context downstream:

| Header/claim     | Value                       | Purpose                           |
| ---------------- | --------------------------- | --------------------------------- |
| `Authorization`  | Orchestrator's own M2M JWT  | Service-to-service authentication |
| `X-Original-Sub` | Agent's `sub`               | Attribution                       |
| `X-On-Behalf-Of` | User's `sub` (if delegated) | Delegation chain                  |
| `X-Request-Id`   | Correlation ID              | Audit trail                       |

The agent-service independently validates the orchestrator's M2M JWT and re-checks authorization using the propagated identity context.

### 7.3 Trust Rules

1. Agent-service trusts orchestrator-api's M2M JWT (the service identity).
2. Agent-service does NOT trust the authorization decision — it re-checks independently.
3. Agent-service uses the propagated `X-Original-Sub` and `X-On-Behalf-Of` for its own OpenFGA query.
4. If propagated headers are missing, agent-service denies the request.

---

## 8. Agent Authorization Model

### 8.1 Authorization Layers for Agents

| Layer   | What it checks for agents                                                                          |
| ------- | -------------------------------------------------------------------------------------------------- |
| RBAC    | Agent has role `agent`. Role allows the feature area.                                              |
| ABAC    | Tenant matches. Delegation context valid. Step-up if needed. Classification check.                 |
| OpenFGA | Agent is `executor` for this action. User is `delegator` (if delegated). User has resource access. |

### 8.2 Example Evaluations

**Agent reads tenant project data (independent):**

```
RBAC: role "agent" allowed for project:read? → Yes
ABAC: tenant_id matches? → Yes
OpenFGA: Check(agent:research_001, can_read, project:proj_001) → Yes
Result: ALLOW
```

**Agent executes action on behalf of user (delegated):**

```
RBAC: role "agent" allowed for agent_actions:execute? → Yes
ABAC: on_behalf_of present? → Yes (auth0|alice). Tenant matches? → Yes.
      Classification? → sensitive. Step-up satisfied? → No.
Result: DENY (step_up_required)
```

**Agent calls external API on behalf of user:**

```
RBAC: role "agent" allowed? → Yes
ABAC: delegation context valid? → Yes. Consent scopes include required scope? → Yes.
OpenFGA: Check(agent:research_001, executor, agent_action:X) → Yes
         Check(user:auth0|alice, delegator, agent_action:X) → Yes
Token Vault: retrieve delegated Google token → Success
Result: ALLOW (orchestrator calls Google API, returns safe metadata)
```

---

## 9. Runtime Guardrails

### 9.1 Action Confirmation

| Classification                       | Confirmation required   | Who confirms               |
| ------------------------------------ | ----------------------- | -------------------------- |
| Routine (read)                       | No                      | —                          |
| Standard (internal write)            | No                      | —                          |
| Sensitive (external write)           | Yes — step-up           | User (via Auth0)           |
| High-impact (destructive, financial) | Yes — explicit approval | User (via UI confirmation) |

### 9.2 Restricted Tool Categories

Agents are never allowed to:

- Delete user accounts or org memberships
- Modify agent permissions or delegation grants
- Access other agents' credentials
- Bypass authorization by calling infrastructure directly
- Execute actions in a different tenant

### 9.3 Privilege Envelope

Every agent has a maximum privilege envelope defined by:

1. **Auth0 M2M scopes** — what the agent's client credentials grant allows
2. **OpenFGA relations** — what resources the agent can access
3. **User consent scopes** — what the delegating user has authorized (intersection)
4. **Tool registration** — which tools the agent can call

The effective permission is the **intersection** of all four. The agent can never exceed the most restrictive boundary.

### 9.4 Rate and Budget Limits

| Guardrail                             | Default             | Adjustable     |
| ------------------------------------- | ------------------- | -------------- |
| Max actions per minute per agent      | 60                  | Per agent-type |
| Max Token Vault retrievals per minute | 10                  | Per agent      |
| Max external API calls per execution  | 20                  | Per workflow   |
| Max total cost per execution          | $1.00 (placeholder) | Per org        |

### 9.5 Tenant Isolation

Agents are scoped to exactly one tenant via `tenant_id` in their JWT. Cross-tenant access is impossible — ABAC enforces tenant boundary on every request.

---

## 10. Observability and Audit

### 10.1 Audit Event Schema

```json
{
  "event": "agent_action",
  "timestamp": "2026-04-03T12:00:00.123Z",
  "requestId": "req_abc123",
  "workflowId": "wf_xyz789",
  "agent": {
    "sub": "agent_research_001@clients",
    "type": "research",
    "instanceId": "agent_research_001"
  },
  "delegation": {
    "onBehalfOf": "auth0|alice",
    "consentGrantId": "grant_001",
    "delegatedScopes": ["agent.execute", "tokens.delegated"]
  },
  "action": {
    "permission": "agent_actions:execute",
    "tool": "google.calendar.create_event",
    "toolCategory": "write_external",
    "resource": { "type": "agent_action", "id": "action_001" }
  },
  "authorization": {
    "allowed": true,
    "evaluationPath": [
      { "layer": "rbac", "result": "pass" },
      { "layer": "abac", "result": "pass" },
      { "layer": "openfga", "result": "pass" }
    ]
  },
  "tokenVault": {
    "accessed": true,
    "provider": "google",
    "scopesUsed": ["calendar.events.create"]
  },
  "result": {
    "status": "success",
    "durationMs": 450
  },
  "service": "orchestrator-api"
}
```

### 10.2 Multi-Step Workflow Tracing

Agent workflows that span multiple actions share a `workflowId`. Each step within the workflow gets its own `requestId`. This allows:

- "Show me all steps in workflow wf_xyz789"
- "Show me all actions agent_research_001 took on behalf of auth0|alice today"
- "Show me all Token Vault accesses for this workflow"

### 10.3 What Must Be Logged

| Event                            | Required fields                               |
| -------------------------------- | --------------------------------------------- |
| Agent authenticates              | agent sub, timestamp, success/failure         |
| Authorization decision           | Full audit event (section 10.1)               |
| Token Vault access               | agent, user, provider, scopes, result         |
| Tool execution                   | agent, user, tool, category, resource, result |
| Delegation created/revoked       | user, agent, scopes, timestamp                |
| Agent provisioned/decommissioned | agent instance, admin who acted, timestamp    |

---

## 11. Failure and Abuse Scenarios

### 11.1 Compromised Agent Credentials

| Response       | Action                                                        |
| -------------- | ------------------------------------------------------------- |
| Immediate      | Disable Auth0 M2M app (revokes all tokens at next validation) |
| Within minutes | Delete Secrets Manager entry for agent client secret          |
| Within minutes | Purge all OpenFGA tuples for agent (revokes all permissions)  |
| Audit          | Review all actions taken by the compromised agent             |
| Notify         | Alert affected users whose delegations were active            |

### 11.2 Delegated Token Misuse

| Scenario                             | Detection                                   | Response         |
| ------------------------------------ | ------------------------------------------- | ---------------- |
| Agent exceeds delegated scope        | Token Vault scope check at retrieval        | Deny + alert     |
| Agent uses revoked delegation        | OpenFGA check finds missing delegator tuple | Deny + alert     |
| Agent calls external API excessively | Rate limit exceeded                         | Throttle + alert |

### 11.3 Tool Misuse

| Scenario                             | Prevention                                                              |
| ------------------------------------ | ----------------------------------------------------------------------- |
| Agent calls restricted tool          | Tool permission check (pre-planning + pre-execution)                    |
| Agent escalates by crafting requests | Backend validates all requests independently, not agent-provided claims |
| Agent attempts cross-tenant access   | ABAC tenant boundary enforcement                                        |

### 11.4 Stale Permissions

| Risk                                            | Mitigation                                                                              |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| OpenFGA tuple persists after delegation revoked | Delegation revocation deletes tuples immediately. Daily reconciliation catches orphans. |
| Agent JWT cached with old claims                | 1-hour token lifetime. Agent re-authenticates frequently.                               |
| Consent scopes expanded without authorization   | Backend re-checks consent at every action, not just at delegation creation.             |

### 11.5 Kill Switch

Emergency agent shutdown procedure:

```
1. Disable Auth0 M2M application (immediate — all new token requests fail)
2. Existing JWTs expire within 1 hour (or 15 minutes for users)
3. Delete all OpenFGA tuples for agent (immediate — all relationship checks fail)
4. Remove Secrets Manager entry (prevents re-provisioning)
5. Log shutdown event with admin identity and reason
```

For tenant-wide emergency: disable all agent M2M applications in the tenant.

---

## 12. Reusable Skills

### 12.1 `skill.agent.secure.runtime-pattern`

**Purpose:** Standard pattern for securing an agent's runtime environment.

**Inputs:** Agent M2M credentials, tenant configuration, tool registrations.

**Outputs:** Configured agent runtime with identity, authorization, and guardrails active.

**Steps:** Authenticate agent → validate tenant → load tool permissions → configure rate limits → register audit hooks → ready.

### 12.2 `skill.agent.delegate.user-action`

**Purpose:** Execute an action on behalf of a user with full delegation validation.

**Inputs:** Agent context, user sub, action permission, resource, required scopes.

**Outputs:** Execution result or structured denial with reasons.

**Steps:** Validate `on_behalf_of` → RBAC check → ABAC check (consent, step-up, classification) → OpenFGA check (executor + delegator) → execute → audit.

### 12.3 `skill.agent.authorize.tool-call`

**Purpose:** Authorize an agent's use of a specific tool.

**Inputs:** Agent context, tool registration, resource context.

**Outputs:** Authorization decision (allow/deny with reasons).

**Steps:** Resolve tool registration → pre-check category permission (RBAC) → check delegation if required → check OpenFGA relations → check step-up if required → return decision.

### 12.4 `skill.agent.retrieve.secrets.scoped`

**Purpose:** Retrieve a secret on behalf of an agent through the service broker.

**Inputs:** Agent context, secret type (platform vs delegated), resource identifier.

**Outputs:** Safe metadata (never raw secret unless architecturally required).

**Steps:** Validate agent identity → check authorization for secret type → retrieve via orchestrator (IAM role for Secrets Manager, M2M for Token Vault) → return safe metadata → audit access.

### 12.5 `skill.agent.audit.execution`

**Purpose:** Emit a structured audit event for an agent action.

**Inputs:** Agent context, delegation context, action details, authorization decision, result.

**Outputs:** Structured audit event (JSON) written to audit log.

**Steps:** Assemble audit event → include requestId + workflowId → include all attribution fields → include authorization evaluation path → write to log → return event ID.

---

## Related ADRs

- [ADR-022: Agent Identity Strategy](../decisions/ADR-022-agent-identity-strategy.md)
- [ADR-023: Delegated vs Independent Agent Execution](../decisions/ADR-023-delegated-vs-independent-execution.md)
- [ADR-024: Tool Access Control Model](../decisions/ADR-024-tool-access-control-model.md)
- [ADR-025: Agent Secret Access Boundary](../decisions/ADR-025-agent-secret-access-boundary.md)
- [ADR-026: Agent Audit and Attribution Model](../decisions/ADR-026-agent-audit-attribution.md)
