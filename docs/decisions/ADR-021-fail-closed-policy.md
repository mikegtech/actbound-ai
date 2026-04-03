# ADR-021: Fail-Closed Authorization Policy

## Status

Accepted

## Context

When the authorization system (OpenFGA, identity validation, or the authorization service itself) is unavailable or errors, we must decide whether to allow requests (fail-open) or deny them (fail-closed).

## Decision

**Fail closed. All authorization failures result in denial.**

### Failure Responses

| Failure                     | HTTP Response | Reason                              |
| --------------------------- | ------------- | ----------------------------------- |
| OpenFGA unavailable         | 503           | `authorization_service_unavailable` |
| OpenFGA timeout (>5s)       | 503           | `authorization_timeout`             |
| JWT invalid/expired         | 401           | `identity_invalid`                  |
| JWT missing claims          | 401           | `identity_incomplete`               |
| Authorization service error | 500           | `authorization_error`               |

### Why Not Fail Open

A Zero Trust platform cannot allow requests when it cannot verify authorization:

- Agents could execute unauthorized actions during an outage
- Tenant isolation would be broken
- Delegated access could be misused
- A brief outage that denies all requests is recoverable; a brief window of unauthorized access may not be

### Resilience Measures

Fail-closed does not mean fragile. The system is designed to minimize authorization outage impact:

- RBAC and ABAC checks have zero external dependencies (JWT claims + request context)
- Many requests short-circuit at RBAC/ABAC before reaching OpenFGA
- OpenFGA client has 5s timeout, 1 retry, and circuit breaker
- Health check endpoints are exempt from authorization (allow monitoring during outages)

### Exception

The following are exempt from authorization:

- `/health` and `/ready` endpoints (infrastructure monitoring)
- Auth0 JWKS endpoint fetch (required for JWT validation itself)
- OpenFGA health checks (used by the circuit breaker)

## Consequences

- No request is ever processed without authorization during an outage.
- Users and agents experience 503 errors during authorization system failures.
- Monitoring must detect authorization failures quickly (circuit breaker state, OpenFGA health).
- The RBAC/ABAC short-circuit means many requests never hit OpenFGA, reducing the blast radius of an OpenFGA outage.
