# Monorepo Topology

## Overview

ActBound AI is organized as a layered monorepo. Each area has a distinct role and review standard.

## Major areas

### `apps/web`

Role:

- frontend SPA
- user-facing dashboard and controls
- consumes backend-issued authorization decisions
- advisory UX only; backend remains authoritative

Review focus:

- no backend enforcement logic in UI
- no trust placed in client-only authorization
- safe use of schemas and typed clients
- correct provider and API-client usage
- secure handling of session and identity context

### `services/orchestrator-api`

Role:

- external-facing API
- token broker
- delegated access orchestration
- entry point for authorization-aware flows

Review focus:

- authorization before sensitive actions
- correct token-broker behavior
- safe delegated access handling
- API contract integrity
- fail-closed service behavior
- structured observability and audit signals

### `services/agent-service`

Role:

- internal runtime/service
- independently re-checks authorization
- executes internal service behavior with backend enforcement

Review focus:

- no trust in upstream authorization alone
- independent enforcement preserved
- secure runtime behavior
- clear error handling and attribution
- proper audit and trace emission

### `packages/authorization`

Role:

- centralized permission and policy engine
- shared authorization decisions and reasoning

Review focus:

- policy integrity
- no permission widening without intent
- consistent structured decisions
- deterministic reasoning and denial paths
- no framework leakage that harms reuse unless intentional

### `packages/sdk`

Role:

- shared schemas
- typed clients
- OpenAPI-facing contracts
- source-of-truth exchange layer between consumers and services

Review focus:

- strong typing and schema discipline
- no contract drift
- versioning awareness
- generated artifact consistency
- reusable abstractions without runtime leakage

## Expected dependency direction

In general:

- apps depend on services only through approved API/client contracts
- services may depend on shared packages
- shared packages should avoid unnecessary runtime/framework coupling
- authorization logic should remain centralized rather than duplicated across layers

## Boundary expectations

The reviewer should flag:

- frontend code acting as authoritative enforcement
- services bypassing centralized authorization where it should apply
- service layers drifting from SDK contracts
- package imports that violate intended layering
- cross-cutting concerns duplicated inconsistently across multiple areas

## Cross-package scrutiny

PRs that touch multiple areas should be reviewed for:

- contract synchronization
- boundary violations
- missing test coverage across affected areas
- hidden coupling introduced by convenience imports or duplicated logic
