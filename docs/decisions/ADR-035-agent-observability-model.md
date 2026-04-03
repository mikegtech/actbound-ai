# ADR-035: Agent Observability Model

## Status

Accepted

## Context

AI agents perform multi-step workflows that span multiple services, tools, and external APIs. Without structured observability, debugging agent failures and auditing agent behavior is impossible.

## Decision

### Every Agent Action Gets a Structured Audit Event

Agent events include full attribution: agent identity, delegating user (if any), tool used, authorization decision, and result.

### Multi-Step Workflow Tracing

Agent workflows share a `workflowId`. Each step gets its own `requestId`. This enables end-to-end workflow reconstruction from audit logs.

### Required Agent Event Fields

- `agent.sub`, `agent.type`, `agent.instanceId` — which agent
- `delegation.onBehalfOf` — on whose behalf (if delegated)
- `action.permission`, `action.tool`, `action.resource` — what was done
- `authorization.allowed`, `authorization.evaluationPath` — was it authorized, how
- `tokenVault.accessed`, `tokenVault.provider` — was Token Vault used
- `result.status`, `result.durationMs` — outcome
- `requestId`, `workflowId` — correlation

### Debugging Support

Denied agent actions include the full evaluation path showing which authorization layer denied and the specific reason code. This eliminates guesswork.

### Alerts

- Agent action failure rate >50% in 10 min → Warning
- Agent rate limit exceeded → Warning
- Agent denied authorization spike → Warning
- Agent Token Vault access from unexpected agent → Critical

## Consequences

- Full visibility into agent behavior.
- Multi-step workflows are traceable end-to-end.
- Failed actions are debuggable from the log alone (no reproduction needed).
- Audit trail supports "show me everything agent X did on behalf of user Y this week."
