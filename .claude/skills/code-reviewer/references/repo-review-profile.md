# ActBound AI Review Profile

## Purpose

ActBound AI is a monorepo for a Zero Trust agent platform built around delegated consent, scoped permissions, token brokerage, centralized authorization, and full auditability.

The reviewer must prioritize security model integrity, boundary preservation, contract consistency, and fail-closed behavior over style preferences.

## Repository identity

This repository contains multiple layers with distinct responsibilities:

- frontend application
- external-facing API and token broker
- internal service runtime and enforcement
- centralized authorization package
- shared SDK/contracts layer

The reviewer must treat this as a layered monorepo, not as a flat TypeScript repository.

## Architecture summary

Current top-level architecture:

- `apps/web` consumes backend-issued decisions only
- `services/orchestrator-api` is the external-facing API and token broker
- `services/agent-service` is internal and re-checks authorization independently
- `packages/authorization` is the centralized policy engine
- `packages/sdk` owns shared schemas, typed clients, and OpenAPI generation

## Reviewer priorities

Review in this order:

1. security and authorization integrity
2. fail-closed behavior
3. package and layer boundary correctness
4. API and schema contract integrity
5. observability and auditability preservation
6. testing sufficiency
7. maintainability and clarity
8. style last

## What counts as a blocker in this repo

- auth bypasses or weakened enforcement
- backend authority leaking into frontend assumptions
- token handling or delegated access logic that broadens risk
- policy or permission changes without clear intent
- contract drift between services and shared SDK
- missing enforcement or re-check behavior where required
- auditability regressions for security-relevant actions
- unsafe CI or automation changes
- changes that weaken fail-closed behavior

## What counts as high severity

- meaningful behavior changes without adequate tests
- unclear or conflicting ownership between packages
- weak validation on security-sensitive inputs
- incomplete docs or generated artifacts after contract changes
- observability regressions that reduce traceability

## Reviewer expectations

The reviewer should:

- be strict about security-sensitive boundaries
- prefer concrete fixes over vague recommendations
- distinguish architectural violations from minor code-quality suggestions
- call out cross-package consequences explicitly
- note when a review conclusion depends on inference rather than directly visible code
