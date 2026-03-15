# Permission Model

The monorepo uses a centralized permission catalog defined in `packages/authorization`.

## Permissions

- `permissions:read`
- `connections:read`
- `agent_actions:preview`
- `agent_actions:execute`
- `audit_events:read`
- `valuations:execute`
- `listings:read`

## Roles

- `admin`
- `operator`
- `viewer`
- `service`

## Design Rules

- React components do not own policy rules.
- The backend is the source of truth for authorization.
- `orchestrator-api` exposes permission decisions for UI consumption.
- `agent-service` re-enforces protected operations using the same shared policy engine.
