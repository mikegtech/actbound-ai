# ADR-042: Shared SDK Strategy

## Status

Accepted

## Context

Security patterns (identity parsing, secret retrieval, authorization, audit) are needed by every service and agent. Without shared libraries, each service re-implements these patterns, leading to drift, inconsistency, and bugs.

## Decision

### Six shared SDKs in the monorepo `packages/` workspace

| SDK               | Package                             | Purpose                                                  |
| ----------------- | ----------------------------------- | -------------------------------------------------------- |
| Identity SDK      | `packages/identity`                 | Token parsing, claim normalization, principal extraction |
| Secrets SDK       | `packages/secrets`                  | Rotation-safe Secrets Manager retrieval with caching     |
| Authorization SDK | `packages/authorization` (existing) | RBAC + ABAC + OpenFGA evaluation                         |
| CASL Helpers      | `packages/casl`                     | Frontend ability factory from backend permissions        |
| Agent SDK         | `packages/agent-sdk`                | Delegation, tool authorization, audit attribution        |
| Audit SDK         | `packages/audit`                    | Structured event emission, correlation ID management     |

### SDK Boundaries

Each SDK has a narrow, well-defined scope. SDKs do not overlap:

- Identity SDK parses claims. It does not make authorization decisions.
- Secrets SDK retrieves secrets. It does not handle rotation Lambda logic.
- Authorization SDK evaluates policies. It does not parse JWTs or retrieve secrets.
- Audit SDK emits events. It does not store or query logs.

### Adoption Rule

All services and agents must use the shared SDKs for these concerns. Direct AWS SDK calls for secrets, inline authorization logic, and custom JWT parsing are forbidden patterns (see ADR-045).

## Consequences

- Consistent security behavior across all services and agents.
- Bug fixes and improvements apply platform-wide on next deployment.
- Clear ownership: each SDK has a defined scope and API boundary.
- Developers can build secure services by composing SDKs, not re-inventing patterns.
- Six packages to maintain — acceptable for the consistency they provide.
