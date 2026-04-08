# Package Rules — packages/ui

## Role

`packages/ui` contains shared presentational components and UI primitives.

It should support frontend consistency without absorbing backend, policy-engine, or service-runtime responsibilities.

## Reviewer priorities

1. preserve presentation-focused scope
2. avoid business-logic and security-authority leakage
3. keep components reusable and composable
4. maintain accessibility and state clarity

## Flag as blocker

- authoritative authz or backend decision logic embedded in shared UI components
- token or secret handling in shared presentational layers
- direct service/runtime coupling inside component primitives

## Flag as high severity

- components assuming a single issuer/provider model where generic identity source support is required
- duplicated domain logic that belongs in app-layer hooks or adapters
- inaccessible or misleading status rendering for security-relevant states

## Review for

- presentation-first component boundaries
- reusable props and state models
- issuer-aware but provider-neutral UI affordances where relevant
- no hidden dependency on app-specific service modules
- accessibility, loading, error, and empty-state support where appropriate

## Dependency expectations

- should stay reusable and frontend-focused
- should not depend on backend services or persistence details

## Testing expectations

Require tests for:

- stateful security/status components
- identity source display components
- shared interaction primitives with important UX consequences
