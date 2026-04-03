# ADR-043: New Service Template Standard

## Status

Accepted

## Context

New services must integrate identity, secrets, authorization, and audit correctly from day one. Without a standard template, each service is wired differently, making security posture inconsistent.

## Decision

### Every new NestJS service must include these modules at creation

| Module                           | SDK               | Purpose                                    |
| -------------------------------- | ----------------- | ------------------------------------------ |
| JWT validation middleware        | Identity SDK      | Extract and validate Auth0 JWT             |
| Authorization context middleware | Identity SDK      | Build `AuthorizationContext` from claims   |
| Correlation ID middleware        | Audit SDK         | Generate/propagate `X-Request-Id`          |
| PermissionGuard (global)         | Authorization SDK | Enforce `@RequirePermission` on all routes |
| SecretProvider                   | Secrets SDK       | Rotation-safe secret retrieval             |
| Health endpoint                  | Built-in          | `/health` and `/ready` (unauthenticated)   |
| Audit interceptor                | Audit SDK         | Log authorization decisions per request    |

### Folder Structure

Services follow hexagonal architecture (ADR-004): `presentation/`, `application/`, `domain/`, `infrastructure/`.

### Production-Readiness Checklist

A service is not production-ready until: all endpoints have `@RequirePermission`, secrets use SecretProvider, correlation IDs propagate, authorization tests pass, and coverage meets thresholds.

## Consequences

- New services start secure by default.
- No service goes to production without authorization enforcement.
- The template is a starting point, not a constraint — services can add domain-specific modules.
- The checklist ensures nothing is forgotten.
