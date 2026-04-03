# ADR-017: IdP to OpenFGA Sync Strategy

## Status

Accepted

## Context

OpenFGA needs to reflect organizational membership and delegation relationships that originate in Auth0. When a user joins an organization or an agent is provisioned, corresponding OpenFGA tuples must be created. When these relationships end, tuples must be deleted.

We need a sync mechanism that is reliable, eventually consistent, and recoverable from failures.

## Decision

### Architecture

```
Auth0 ──(Log Stream/Webhook)──▶ EventBridge ──▶ Sync Lambda ──▶ OpenFGA
                                                     │
                                                     ▼
                                              SQS Dead Letter Queue
```

### Event Mapping

| Auth0 Event                | Tuple Action                                         |
| -------------------------- | ---------------------------------------------------- |
| User added to org          | Write `user:X member organization:Y`                 |
| User removed from org      | Delete `user:X member organization:Y`                |
| User promoted to org admin | Write `user:X admin organization:Y`, delete `member` |
| User deleted               | Delete all tuples for `user:X`                       |
| Agent provisioned          | Write executor tuples for agent                      |
| Agent decommissioned       | Delete all tuples for `agent:X`                      |

### Events That Do NOT Trigger Tuple Writes

Login, logout, token refresh, password change, email change, role assignment (roles are in JWT claims, not OpenFGA).

### Reliability Model

1. **At-least-once delivery.** EventBridge guarantees at-least-once. Safe because OpenFGA writes are idempotent.
2. **Idempotent operations.** Writing an existing tuple is a no-op. Deleting a non-existent tuple is a no-op.
3. **Dead letter queue.** Failed events go to SQS DLQ. CloudWatch alarm on DLQ depth.
4. **Retry.** Lambda retries 2x with backoff before DLQ.
5. **Reconciliation.** Daily scheduled Lambda compares Auth0 org membership to OpenFGA tuples and fixes drift (add missing, remove orphaned).

### What Is Projected to OpenFGA vs What Stays in Auth0

| Data              | Projected to OpenFGA | Stays in Auth0        |
| ----------------- | -------------------- | --------------------- |
| Org membership    | Yes (tuples)         | Also in Auth0 orgs    |
| Roles             | No                   | JWT claims only       |
| Email, profile    | No                   | Auth0 userinfo        |
| Agent delegation  | Yes (tuples)         | Also in backend state |
| Project ownership | Yes (tuples)         | Also in backend DB    |

### Consistency Model

The sync is eventually consistent. Between an Auth0 event and the tuple write, there is a window (seconds to low minutes) where OpenFGA does not reflect the change. This is acceptable because:

- RBAC (from JWT claims) catches most changes immediately at token refresh
- OpenFGA convergence happens within seconds for normal operations
- The daily reconciliation Lambda catches any missed events

## Consequences

- Auth0 remains the source of truth for identity and org membership.
- OpenFGA reflects relationships for authorization queries without storing identity data.
- The sync is reliable (idempotent + DLQ + reconciliation) and operationally simple.
- EventBridge provides native AWS integration without managing webhook infrastructure.
- The reconciliation Lambda prevents long-term drift even if events are missed.
- Operational cost: one sync Lambda, one reconciliation Lambda, one DLQ — minimal infrastructure.
