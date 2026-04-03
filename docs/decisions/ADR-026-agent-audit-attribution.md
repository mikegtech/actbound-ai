# ADR-026: Agent Audit and Attribution Model

## Status

Accepted

## Context

Every agent action must be traceable to answer: "Which agent did what, on whose behalf, using which tool, against which resource, and was it authorized?" Without structured audit, agent behavior in production is unobservable.

## Decision

### Every Significant Agent Action Gets an Audit Event

Significant actions include: authorization decisions, tool executions, Token Vault accesses, delegation changes, and agent lifecycle events.

### Attribution Fields (Required)

| Field                          | Source               | Purpose                               |
| ------------------------------ | -------------------- | ------------------------------------- |
| `agent.sub`                    | JWT                  | Which specific agent instance         |
| `agent.type`                   | JWT claim            | What kind of agent                    |
| `agent.instanceId`             | JWT claim            | Unique instance identifier            |
| `delegation.onBehalfOf`        | JWT claim            | Delegating user (if delegated)        |
| `action.permission`            | Request metadata     | What was requested                    |
| `action.tool`                  | Tool registration    | Which tool was used                   |
| `action.resource`              | Request / route      | Which resource was affected           |
| `authorization.allowed`        | AuthorizationService | Whether it was authorized             |
| `authorization.evaluationPath` | AuthorizationService | Which layers checked and their result |
| `requestId`                    | Middleware           | Per-request correlation               |
| `workflowId`                   | Agent runtime        | Multi-step workflow correlation       |

### Multi-Step Workflow Tracing

Agent workflows that span multiple actions share a `workflowId`. Each step within the workflow gets its own `requestId`. This enables:

- Full workflow reconstruction from audit logs
- Per-step authorization visibility
- Detection of workflows that partially succeed and partially fail

### Retention

Audit events are immutable append-only records. Retention aligned with compliance requirements (minimum 90 days, recommended 1 year).

### Never Logged

- Raw secret values or Token Vault tokens
- Full request/response bodies (only metadata)
- PII beyond `sub` identifiers

## Consequences

- Full observability into agent behavior in production.
- Every action is attributable to a specific agent, optional user, and specific resource.
- Multi-step workflows are traceable end-to-end.
- Audit events support incident investigation, compliance, and debugging.
- Structured JSON format enables querying and alerting.
