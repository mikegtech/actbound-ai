# ADR-044: New Agent Template Standard

## Status

Accepted

## Context

AI agents must authenticate, validate delegation, authorize tools, and emit audit events. Without a standard template, agents are inconsistently secured.

## Decision

### Every new agent must include

- Per-instance Auth0 M2M identity (ADR-007)
- Client secret in Secrets Manager (ADR-010)
- OpenFGA executor tuples (ADR-015)
- Lifecycle hooks: `onStart`, `beforeAction`, `afterAction`, `onError`, `onShutdown`
- Structured audit events with requestId and workflowId
- Documented kill-switch procedure

### Lifecycle Hooks

| Hook           | What it does                                              |
| -------------- | --------------------------------------------------------- |
| `onStart`      | Authenticate with M2M credentials, verify identity        |
| `beforeAction` | Validate delegation (if delegated), authorize tool        |
| `afterAction`  | Emit audit event with full attribution                    |
| `onError`      | Log failure with evaluation path, increment error counter |
| `onShutdown`   | Clean up, emit shutdown audit event                       |

### Production-Readiness Checklist

An agent is not production-ready until: M2M app created, Secrets Manager entry exists, OpenFGA tuples created, lifecycle hooks implemented, delegation tests pass, kill-switch documented.

## Consequences

- Agents start secure by default with per-instance identity and delegation validation.
- Every agent action is auditable from day one.
- Kill-switch is documented before the agent reaches production.
- The template is lightweight — it adds structure without excessive boilerplate.
