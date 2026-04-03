# ADR-018: Centralized Authorization Service Pattern

## Status

Accepted

## Context

Authorization logic must be consistent across `orchestrator-api` and `agent-service`. If each service implements its own authorization checks, the logic will drift, bugs will differ between services, and auditing becomes fragmented.

We need to decide whether authorization logic is centralized in a shared package or distributed across services.

## Decision

**All authorization logic lives in `packages/authorization`.** Both backend services import and use the same `AuthorizationService` with the same policy definitions, evaluators, and decision types.

### What lives in `packages/authorization`

- `AuthorizationService` — orchestrates RBAC → ABAC → OpenFGA evaluation
- `RbacEvaluator` — checks roles from JWT claims
- `AbacEvaluator` — checks request context attributes
- `OpenFGAClient` wrapper — queries the relationship store
- Policy definitions — maps permissions to required roles, attributes, and relations
- NestJS integration — `PermissionGuard`, `@RequirePermission` decorator
- Decision types — `AuthorizationDecision`, `EvaluationStep`, reason codes

### What does NOT live in `packages/authorization`

- HTTP controllers or route definitions (presentation layer)
- Business logic or domain operations
- Database queries or persistence
- Auth0 token validation (handled by middleware before authorization)

### Service Integration

```typescript
// services/orchestrator-api/src/app.module.ts
import { AuthorizationModule } from "@actbound/authorization";

@Module({
  imports: [AuthorizationModule.forRoot({ openfgaUrl: config.OPENFGA_URL })],
})
export class AppModule {}
```

Both services use the identical module. Configuration (OpenFGA URL, etc.) is injected per-service.

## Consequences

- Single source of truth for all authorization logic.
- Policy changes apply to both services simultaneously on next deployment.
- Authorization is testable in isolation (unit tests in `packages/authorization`).
- Services have zero custom authorization code.
- The authorization package has a well-defined API boundary — services call `evaluate()`, never internal methods.
