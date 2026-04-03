# ADR-023: Delegated vs Independent Agent Execution

## Status

Accepted

## Context

Agents perform two fundamentally different types of actions: those they do on their own behalf (system tasks) and those they do on behalf of a user (delegated tasks). The authorization model, audit trail, and revocation patterns differ significantly between the two.

## Decision

### Two Execution Modes

**Independent execution:** Agent acts under its own identity. No user delegation involved. Used for system-level operations (health checks, batch processing, internal maintenance).

**Delegated execution:** Agent acts on behalf of a specific user. The user has explicitly consented to the delegation. Used for user-facing tasks (execute agent actions, call external APIs with user tokens, access user resources).

### How They Differ

| Property             | Independent                            | Delegated                                               |
| -------------------- | -------------------------------------- | ------------------------------------------------------- |
| `on_behalf_of` claim | Absent                                 | User's `sub`                                            |
| Authorization        | Agent RBAC + OpenFGA (agent relations) | Intersection: agent + user consent + user authorization |
| Token Vault access   | Not applicable                         | Allowed (with consent scope check)                      |
| Audit attribution    | Agent only                             | Agent + delegating user                                 |
| Revocation           | Disable agent                          | Disable agent OR revoke user delegation                 |

### Intersection Rule for Delegated Actions

An agent can only do what the **intersection** of these three allows:

1. Agent's own capability (OpenFGA `executor` tuples)
2. User's consent (delegation scopes)
3. User's own authorization (user's OpenFGA relations)

If any of the three is insufficient, the action is denied.

### Revocation

- **User revokes delegation:** Agent loses all delegated actions for that user. Independent actions unaffected.
- **Admin disables agent:** All actions (independent and delegated) stop.
- **User revokes provider connection:** Token Vault access for that provider stops. Other delegated actions unaffected.

## Consequences

- Clean separation: independent actions never require user context, delegated actions always do.
- The intersection rule prevents agents from exceeding the delegating user's own permissions.
- Revocation is granular: user can revoke delegation without affecting the agent's independent work.
- The `on_behalf_of` claim is the discriminator — its presence or absence determines the execution mode.
