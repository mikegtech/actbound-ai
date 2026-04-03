# ADR-016: Authorization Decision Flow

## Status

Accepted

## Context

Every API request must be authorized. The platform has three authorization layers (RBAC, ABAC, OpenFGA). We need a standard evaluation order with clear short-circuit points, default-deny semantics, and no ambiguity about which layer runs when.

## Decision

### Evaluation Order

```
1. Identity Validation → 2. RBAC → 3. ABAC → 4. OpenFGA → 5. Allow
```

Each step either passes (proceed to next) or fails (deny immediately).

### Step Details

| Step                   | Input                           | Fails with                      | Short-circuits                     |
| ---------------------- | ------------------------------- | ------------------------------- | ---------------------------------- |
| 1. Identity Validation | JWT from Authorization header   | 401 Unauthorized                | Always                             |
| 2. RBAC                | `roles` from JWT claims         | 403 `role_grant_missing`        | Fast — no external calls           |
| 3. ABAC                | Request context + backend state | 403 (specific ABAC reason code) | Prevents unnecessary OpenFGA query |
| 4. OpenFGA             | Subject + relation + object     | 403 `relationship_missing`      | Final check                        |

### Default Deny

If any step fails, errors, or times out, the request is denied. There is no fallback to a less restrictive check. There is no "allow by default."

### Not All Checks Apply to All Requests

The policy for each endpoint specifies which layers are checked. Simple feature-area gates may only use RBAC + tenant ABAC. Resource-level operations use all four steps.

### Re-evaluation

Authorization is evaluated at the point of action, not cached from a prior request. If a user's permissions change between two requests, the second request reflects the change.

## Consequences

- Predictable evaluation: RBAC first (fast), ABAC second (contextual), OpenFGA last (relational).
- Short-circuiting avoids expensive OpenFGA queries when a cheap check would deny.
- Default-deny prevents accidental access on misconfiguration.
- Each layer's denial includes a specific reason code for debugging and audit.
- Slight latency cost for OpenFGA queries on resource-level operations (mitigated by the short-circuit design).
