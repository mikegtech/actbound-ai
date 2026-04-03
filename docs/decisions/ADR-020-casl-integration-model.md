# ADR-020: CASL Integration Model

## Status

Accepted

## Context

The React frontend needs to know which actions the current user can perform so it can render UI elements conditionally (hide buttons, disable forms, show upgrade prompts). We need a pattern that provides frontend permission awareness without creating a second authorization system.

Options considered:

1. **Frontend calls OpenFGA directly** — leaks authorization internals to the client, requires OpenFGA to be publicly accessible.
2. **Frontend re-implements authorization logic** — duplicates backend logic, drifts, creates false security.
3. **Backend pre-evaluates permissions, frontend consumes** — single source of truth, frontend is advisory only.

## Decision

**Backend evaluates all permissions and returns structured results via `GET /me/permissions`. The frontend builds CASL abilities from this response.**

### Contract

The backend endpoint evaluates the full RBAC + ABAC + OpenFGA pipeline for the authenticated user across all relevant permissions and returns:

```json
{
  "permissions": [
    { "action": "execute", "subject": "agent_action", "allowed": true },
    { "action": "inspect", "subject": "token_cache", "allowed": false }
  ]
}
```

### Frontend

```typescript
const ability = defineAbility((can, cannot) => {
  for (const p of response.permissions) {
    p.allowed ? can(p.action, p.subject) : cannot(p.action, p.subject);
  }
});
```

### Rules

1. CASL is advisory. Backend re-checks every action.
2. CASL never calls OpenFGA.
3. CASL never evaluates ABAC attributes.
4. Stale CASL is a UX inconvenience, not a security risk.
5. Abilities are re-fetched on login, token refresh, and delegation changes.

## Consequences

- Single source of truth: backend evaluates, frontend consumes.
- No authorization logic in the frontend beyond CASL ability mapping.
- Frontend can conditionally render UI without knowing the authorization internals.
- Permission changes are reflected on the next `/me/permissions` fetch (eventual consistency bounded by refresh strategy).
- The `/me/permissions` endpoint evaluates all permissions per call — this is acceptable because the permission set is small (<30 items) and evaluation is fast.
