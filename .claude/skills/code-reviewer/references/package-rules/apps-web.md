# Package Rules — apps/web

## Role

`apps/web` is the frontend SPA for user-facing dashboards and controls.

It consumes backend-issued authorization decisions only. CASL and frontend logic are advisory UX, not authoritative enforcement.

## Reviewer priorities

1. preserve backend-authoritative security model
2. maintain safe API-client and schema usage
3. prevent sensitive logic from drifting into the UI
4. keep auth and identity handling correct but minimal
5. preserve user-facing clarity and state correctness

## Flag as blocker

- client-side logic becoming the source of truth for authorization
- UI granting access or hiding backend failures in a way that weakens security posture
- direct trust in client-only permissions or roles without backend validation
- raw token handling exposure to components that should not access it
- hard-coded issuer/provider assumptions that break the multi-issuer model
- bypass of approved gateway/API client patterns

## Flag as high severity

- contract drift with backend DTOs or typed clients
- missing loading/error/empty states on security-sensitive views
- identity source handling that assumes only Auth0 when UI should be issuer-aware
- state management taking on server-authoritative concerns
- duplicated API calling or schema parsing logic that should live in shared clients/hooks

## Review for

- proper use of approved typed clients and schemas
- no backend policy logic duplicated in components
- advisory-only CASL usage
- correct handling of tenant, issuer, and identity-source display
- no storage or logging of secrets, tokens, or sensitive identity details
- clear UX for denied, revoked, unlinked, issuer-mismatch, and session-expired states
- query/mutation patterns consistent with approved app conventions
- route guards and UI affordances aligned with backend authority

## Dependency expectations

- may depend on approved shared packages such as SDK and UI
- must not import backend-only implementation details
- must not depend on NestJS, persistence, or service-internal modules

## Testing expectations

Require tests or equivalent validation when changes affect:

- auth/login/logout flows
- route protection
- permission-driven rendering
- identity source display
- security controls
- audit/activity timeline rendering
