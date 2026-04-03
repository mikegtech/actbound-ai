# ADR-033: Event Taxonomy Standard

## Status

Accepted

## Context

Without a standard event naming and field convention, logs become inconsistent across services, making querying and alerting unreliable.

## Decision

### Event Naming Convention

```
<domain>.<action>.<result>
```

Examples: `authz.decision`, `agent.action.executed`, `secrets.rotation.failed`, `identity.login.success`.

### Required Fields (All Events)

| Field       | Type     | Purpose                         |
| ----------- | -------- | ------------------------------- |
| `event`     | string   | Event name (taxonomy)           |
| `timestamp` | ISO 8601 | When the event occurred         |
| `requestId` | UUID     | Per-request correlation         |
| `service`   | string   | Which service emitted the event |

### Optional Fields (Context-Dependent)

| Field                   | When present               |
| ----------------------- | -------------------------- |
| `workflowId`            | Multi-step agent workflows |
| `subject.sub`           | Identity-related events    |
| `subject.principalType` | Identity-related events    |
| `subject.tenantId`      | All authenticated events   |
| `agent.instanceId`      | Agent events               |
| `delegation.onBehalfOf` | Delegated agent events     |

### Severity Assignment

| Level    | When                                                              |
| -------- | ----------------------------------------------------------------- |
| Debug    | Internal evaluation details (RBAC step, ABAC step)                |
| Info     | Normal successful operations                                      |
| Warning  | Denied authorization, failed login, anomaly                       |
| Critical | System failure (OpenFGA down, rotation failed, unexpected access) |

### What Is Never Logged

- Secret values, tokens, passwords
- PII beyond `sub` identifiers
- Full request/response bodies
- Stack traces in production (error message and code only)

## Consequences

- Every event across every service follows the same naming and field convention.
- CloudWatch Insights queries work consistently across log groups.
- New services and features follow the taxonomy via code review and agent instructions.
- The taxonomy is extensible — new domains and actions can be added without breaking existing patterns.
