# ADR-019: Backend Enforcement Strategy

## Status

Accepted

## Context

We need to decide where in the request lifecycle authorization is enforced. Options:

1. **Middleware** — runs before route resolution, no access to handler metadata
2. **NestJS Guards** — run after route resolution, can read decorators, can inject services
3. **Inline service-layer checks** — authorization checked inside each service method

## Decision

**Guard-level enforcement with `@RequirePermission` decorators.**

### Why Guards

- Guards have access to handler metadata (which permission is required via decorator)
- Guards run after route resolution but before the handler — the correct point for authorization
- Guards integrate with NestJS dependency injection (can use `AuthorizationService`)
- Every endpoint's required permission is visible in the controller code via the decorator

### Why Not Middleware

Middleware runs before route resolution. It cannot know which handler will run or what permission is required. This forces either a route-to-permission lookup table (fragile) or overly broad checks.

### Why Not Inline Service-Layer Checks

Inline checks scatter authorization logic across every service method. This makes it impossible to audit which endpoints are protected by reading the controller code. It also leads to inconsistency — some methods check, some forget.

### Pattern

```typescript
@RequirePermission("brokered_tokens:read")
@Get("/token-broker/status")
async getStatus() { ... }
```

The guard reads the decorator, calls `AuthorizationService.evaluate()`, and either allows the handler to run or throws `ForbiddenException` with structured reason codes.

### Exception: Action-Level Sub-Checks

Complex operations (e.g., agent execution with delegation) may need conditional sub-checks within the handler. These still call `AuthorizationService` — they just make additional calls beyond the route-level guard.

```typescript
@RequirePermission("agent_actions:execute")
@Post("/agent-actions/execute")
async execute(@Body() body, @Req() req) {
  // Guard already checked agent_actions:execute
  // Additional sub-check for delegation
  const delegationDecision = await this.authzService.evaluate({
    context: req.authorizationContext,
    permission: "delegated_tokens:use",
    resource: { type: "delegated_token", id: body.connectionId },
  });
  // ...
}
```

## Consequences

- Every endpoint's permission requirement is visible in the controller.
- Authorization logic is never in service methods (except rare sub-checks).
- The guard pattern is consistent across both services.
- New endpoints that forget `@RequirePermission` are unauthenticated — but the guard returns true for undecorated endpoints. A linting rule or code review practice should catch missing decorators.
