# ADR-011: Secret Naming Convention

## Status

Accepted

## Context

As the platform grows to multiple services, agents, and environments, secrets need a predictable naming structure for IAM policy scoping, operational clarity, and automation.

## Decision

### Naming Pattern

```
actbound/<environment>/<owner>/<secret-name>
```

| Segment         | Description                           | Examples                                                |
| --------------- | ------------------------------------- | ------------------------------------------------------- |
| `actbound`      | Fixed project prefix                  | Always `actbound`                                       |
| `<environment>` | Deployment environment                | `dev`, `staging`, `prod`                                |
| `<owner>`       | Service or scope that owns the secret | `orchestrator-api`, `agent-service`, `shared`, `agents` |
| `<secret-name>` | Descriptive credential name           | `db-credentials`, `auth0-m2m-client`, `openai-api-key`  |

### Owner Values

| Owner              | Used for                                                   |
| ------------------ | ---------------------------------------------------------- |
| `orchestrator-api` | Secrets used only by the orchestrator service              |
| `agent-service`    | Secrets used only by the agent service                     |
| `shared`           | Secrets used by multiple services (Redis, shared API keys) |
| `agents`           | Per-agent-instance credentials (Auth0 M2M secrets)         |

### Examples

| Secret                | Path                                            |
| --------------------- | ----------------------------------------------- |
| Orchestrator database | `actbound/prod/orchestrator-api/db-credentials` |
| Shared Redis          | `actbound/prod/shared/redis-credentials`        |
| Agent instance        | `actbound/prod/agents/agent-research-001`       |
| OpenAI key            | `actbound/prod/shared/openai-api-key`           |

### IAM Policy Alignment

The naming convention directly maps to IAM resource ARN patterns:

```
arn:aws:secretsmanager:REGION:ACCOUNT:secret:actbound/prod/orchestrator-api/*
```

This allows per-service policies using wildcard matching on the owner segment.

### Multi-Tenant Extension (Future)

When multi-tenancy is added:

```
actbound/<environment>/<tenant-id>/<owner>/<secret-name>
```

## Consequences

- Predictable, scriptable naming for all secrets.
- IAM policies align directly with the naming hierarchy.
- Easy to audit which service owns which secrets.
- Agent secrets scale naturally under the `agents` owner.
- Multi-tenant extension is additive, not breaking.
