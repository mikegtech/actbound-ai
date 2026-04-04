# OpenFGA Authorization Model — v1

## Object Types

| Type           | Purpose                          | Identity source                              |
| -------------- | -------------------------------- | -------------------------------------------- |
| `user`         | Human user                       | Auth0 `sub` claim (e.g., `user:alice`)       |
| `agent`        | AI agent instance                | Auth0 M2M `sub` (e.g., `agent:research-001`) |
| `organization` | Tenant boundary                  | Platform-managed                             |
| `resource`     | Protected data/project           | Platform-managed                             |
| `agent_action` | Specific agent-executable action | Platform-managed                             |

## Relations

### organization

| Relation | Assignees   | Meaning                                     |
| -------- | ----------- | ------------------------------------------- |
| `admin`  | user, agent | Full control over the org and its resources |
| `member` | user, agent | Standard access; inherits from admin        |

### resource

| Relation | Assignees    | Meaning                                       |
| -------- | ------------ | --------------------------------------------- |
| `org`    | organization | Links resource to its owning org              |
| `owner`  | user         | Full control over this resource               |
| `editor` | user, agent  | Can modify; inherits from owner and org admin |
| `viewer` | user, agent  | Can read; inherits from editor and org member |

### agent_action

| Relation      | Assignees    | Meaning                                               |
| ------------- | ------------ | ----------------------------------------------------- |
| `org`         | organization | Links action to its owning org                        |
| `executor`    | agent        | The agent assigned to execute                         |
| `delegator`   | user         | The user who delegated authority                      |
| `can_execute` | (computed)   | Requires BOTH executor AND delegator                  |
| `can_preview` | user, agent  | Can preview; inherits from can_execute and org member |

## Access Inheritance

```
org:admin → resource:editor → resource:viewer
org:member → resource:viewer
resource:owner → resource:editor
agent_action:can_execute = executor AND delegator
```

## What Belongs Where

| Check type                                                   | System                  | Example                              |
| ------------------------------------------------------------ | ----------------------- | ------------------------------------ |
| "Can this role use this feature?"                            | RBAC (Auth0 JWT claims) | admin can access admin endpoints     |
| "Does the request context allow this?"                       | ABAC (runtime)          | tenant_id matches, step-up satisfied |
| "Does this principal have access to this resource?"          | OpenFGA (this model)    | alice is editor of project-alpha     |
| "Can this agent execute this action on behalf of this user?" | OpenFGA (this model)    | agent executor AND user delegator    |

## What Does NOT Belong in OpenFGA

- User profile data (email, name) — stays in Auth0
- System roles (admin, operator, viewer) — stays in JWT claims
- Request context (step-up status, preview mode) — stays in ABAC
- Secrets, tokens, credentials — never in OpenFGA
- Ephemeral state (session data, cache status) — runtime only

## Example Authorization Paths

**"Can alice view project-alpha?"**

```
Check(user:alice, viewer, resource:project-alpha)
→ alice is owner of resource:project-alpha
→ owner implies editor implies viewer
→ ALLOWED
```

**"Can bob edit dataset-sales-q1?"**

```
Check(user:bob, editor, resource:dataset-sales-q1)
→ bob has direct editor on resource:dataset-sales-q1
→ ALLOWED
```

**"Can agent research-001 execute valuation-reconcile?"**

```
Check(agent:research-001, can_execute, agent_action:valuation-reconcile)
→ can_execute requires executor AND delegator
→ research-001 is executor ✓
→ alice is delegator ✓
→ ALLOWED
```

**"Can bob execute valuation-reconcile?"**

```
Check(user:bob, can_execute, agent_action:valuation-reconcile)
→ bob is not an executor (only agents can be executors)
→ DENIED
```
