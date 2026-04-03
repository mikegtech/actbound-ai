# Security Observability Architecture

## Overview

This document defines the complete observability, audit, and detection model for the ActBound AI platform. It covers what is logged, how events are correlated, where they are stored, and what triggers alerts.

**Principle:** Log decisions, not data. Every authorization decision, secret access, and agent action must be traceable. No raw secrets or PII in logs. Structured JSON everywhere.

---

## 1. Observability Architecture Overview

### 1.1 Three Logging Layers

| Layer          | What it captures                                        | Source                              |
| -------------- | ------------------------------------------------------- | ----------------------------------- |
| Application    | Authorization decisions, agent actions, business events | Backend services                    |
| Security       | Auth events, secret access, anomalies                   | Auth0 logs, CloudTrail, app events  |
| Infrastructure | Network flows, compute events, container lifecycle      | VPC Flow Logs, ECS events, ALB logs |

### 1.2 Data Flow

```
┌────────────────┐  ┌────────────────┐  ┌──────────────────┐
│ Backend        │  │ Auth0          │  │ AWS              │
│ Services       │  │ Log Streams    │  │ CloudTrail       │
│ (structured    │  │                │  │ VPC Flow Logs    │
│  JSON logs)    │  │                │  │ ECS Events       │
└───────┬────────┘  └───────┬────────┘  └────────┬─────────┘
        │                   │                     │
        ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 CloudWatch Logs (aggregation)                │
│  Log groups per service, per environment                    │
│  Structured JSON, queryable via Insights                    │
├─────────────────────────────────────────────────────────────┤
│                 CloudWatch Metrics + Alarms                  │
│  Metric filters on log events                               │
│  Alarms → SNS → notification                               │
├─────────────────────────────────────────────────────────────┤
│                 S3 (cold storage)                            │
│  Archived logs for compliance and forensics                 │
│  Lifecycle: 90d hot (CloudWatch) → S3 Standard → Glacier    │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Metrics vs Logs vs Events

| Type    | When to use                                                     | Storage                       |
| ------- | --------------------------------------------------------------- | ----------------------------- |
| Metrics | Counts, rates, latencies (time-series)                          | CloudWatch Metrics            |
| Logs    | Detailed event records (authorization decisions, agent actions) | CloudWatch Logs               |
| Events  | State changes (secret rotation, agent provisioning)             | CloudWatch Logs + EventBridge |

---

## 2. Event and Log Taxonomy

### 2.1 Identity Events

| Event                      | Fields                                         | Severity |
| -------------------------- | ---------------------------------------------- | -------- |
| `identity.login.success`   | sub, principal_type, tenant_id, ip, user_agent | Info     |
| `identity.login.failure`   | attempted_sub, reason, ip, user_agent          | Warning  |
| `identity.token.issued`    | sub, principal_type, aud, exp, token_type      | Info     |
| `identity.token.refreshed` | sub, token_family                              | Info     |
| `identity.token.rejected`  | sub, reason (expired, invalid_sig, bad_aud)    | Warning  |
| `identity.mfa.required`    | sub, trigger (step-up, login)                  | Info     |
| `identity.mfa.failure`     | sub, reason                                    | Warning  |

### 2.2 Secrets Events

| Event                         | Fields                                            | Severity |
| ----------------------------- | ------------------------------------------------- | -------- |
| `secrets.read`                | secret_path, service, iam_role, cache_hit         | Info     |
| `secrets.rotation.started`    | secret_path, rotation_lambda                      | Info     |
| `secrets.rotation.completed`  | secret_path, new_version_id                       | Info     |
| `secrets.rotation.failed`     | secret_path, error, step (create/set/test/finish) | Critical |
| `secrets.access.denied`       | secret_path, iam_principal, reason                | Warning  |
| `secrets.token_vault.read`    | user_sub, provider, agent_sub (if delegated)      | Info     |
| `secrets.token_vault.revoked` | user_sub, provider, connection_id                 | Info     |

### 2.3 Authorization Events

| Event                   | Fields                                                                            | Severity                     |
| ----------------------- | --------------------------------------------------------------------------------- | ---------------------------- |
| `authz.decision`        | subject, permission, resource, allowed, reasons[], evaluation_path[], duration_ms | Info (allow), Warning (deny) |
| `authz.rbac.evaluated`  | subject, roles, required_roles, result                                            | Debug                        |
| `authz.abac.evaluated`  | subject, context_attributes, result, reason                                       | Debug                        |
| `authz.openfga.checked` | subject, relation, object, result, duration_ms                                    | Debug                        |
| `authz.openfga.error`   | subject, relation, object, error                                                  | Critical                     |

### 2.4 Agent Events

| Event                     | Fields                                                       | Severity |
| ------------------------- | ------------------------------------------------------------ | -------- |
| `agent.action.requested`  | agent_sub, agent_type, instance_id, permission, on_behalf_of | Info     |
| `agent.action.authorized` | agent_sub, permission, resource, decision                    | Info     |
| `agent.action.denied`     | agent_sub, permission, resource, reasons[]                   | Warning  |
| `agent.action.executed`   | agent_sub, tool, resource, result, duration_ms               | Info     |
| `agent.action.failed`     | agent_sub, tool, resource, error                             | Warning  |
| `agent.delegated.started` | agent_sub, user_sub, scopes[]                                | Info     |
| `agent.delegated.revoked` | agent_sub, user_sub, revoked_by                              | Info     |
| `agent.provisioned`       | agent_instance_id, agent_type, provisioned_by                | Info     |
| `agent.decommissioned`    | agent_instance_id, decommissioned_by, reason                 | Info     |

### 2.5 Infrastructure Events

| Event                           | Fields                                       | Severity |
| ------------------------------- | -------------------------------------------- | -------- |
| `infra.service.started`         | service_name, environment, version           | Info     |
| `infra.service.health.degraded` | service_name, check, details                 | Warning  |
| `infra.admin.access`            | user, target, method (tailscale/console), ip | Info     |
| `infra.network.denied`          | src_ip, dst_ip, dst_port, sg_rule            | Warning  |

---

## 3. Correlation and Trace Model

### 3.1 Correlation ID Strategy

Every request entering the platform receives a `requestId` (UUID) at the orchestrator-api edge. This ID propagates through all downstream calls.

| Header           | Purpose                   | Set by                      | Propagated by                    |
| ---------------- | ------------------------- | --------------------------- | -------------------------------- |
| `X-Request-Id`   | Per-request correlation   | orchestrator-api middleware | All services                     |
| `X-Workflow-Id`  | Multi-step agent workflow | Agent runtime               | orchestrator-api → agent-service |
| `X-Original-Sub` | Originating principal     | orchestrator-api            | Service-to-service calls         |
| `X-On-Behalf-Of` | Delegating user           | orchestrator-api            | Service-to-service calls         |

### 3.2 Propagation Rules

1. **orchestrator-api generates `X-Request-Id`** if not present in the incoming request.
2. **Every downstream call includes `X-Request-Id`** in the header.
3. **Every log line includes `requestId`** as a top-level field.
4. **Agent workflows set `X-Workflow-Id`** at workflow start. Each step in the workflow shares this ID.
5. **External API calls include `X-Request-Id`** where the external API supports correlation (e.g., in request metadata).

### 3.3 Multi-Step Workflow Tracing

```json
{
  "workflowId": "wf_abc123",
  "steps": [
    { "requestId": "req_001", "action": "agent.action.authorized", "step": 1 },
    { "requestId": "req_002", "action": "secrets.token_vault.read", "step": 2 },
    { "requestId": "req_003", "action": "agent.action.executed", "step": 3 }
  ]
}
```

Query: `fields @timestamp, @message | filter workflowId = "wf_abc123" | sort @timestamp`

---

## 4. Authorization Decision Logging

### 4.1 Full Decision Log Entry

Every authorization decision (allow and deny) produces a structured log event:

```json
{
  "event": "authz.decision",
  "timestamp": "2026-04-03T12:00:00.123Z",
  "requestId": "req_abc123",
  "subject": {
    "sub": "auth0|alice",
    "principalType": "user",
    "roles": ["operator"],
    "tenantId": "tenant_acme"
  },
  "permission": "agent_actions:execute",
  "resource": {
    "type": "agent_action",
    "id": "action_001",
    "ownerSubjectId": "auth0|alice"
  },
  "decision": {
    "allowed": true,
    "reasons": [
      {
        "code": "policy_allow",
        "message": "Policy engine allows agent_actions:execute"
      }
    ]
  },
  "evaluationPath": [
    { "layer": "rbac", "result": "pass", "durationMs": 0 },
    { "layer": "abac", "result": "pass", "durationMs": 0 },
    { "layer": "openfga", "result": "pass", "durationMs": 12 }
  ],
  "totalDurationMs": 13,
  "service": "orchestrator-api"
}
```

### 4.2 Logging Policy

| Decision             | Logged | Level    | Why                        |
| -------------------- | ------ | -------- | -------------------------- |
| Allow                | Yes    | Info     | Audit trail completeness   |
| Deny                 | Yes    | Warning  | Security signal, debugging |
| Error (OpenFGA down) | Yes    | Critical | Incident detection         |

### 4.3 Performance Considerations

- RBAC and ABAC logging adds <1ms (string formatting only).
- OpenFGA call duration is already measured — logging adds negligible overhead.
- **Full logging, no sampling.** Authorization decisions are low-volume relative to request traffic and high-value for security. Sampling would create audit gaps.

---

## 5. Secrets Access Observability

### 5.1 AWS-Native Logging

| Source             | What it captures                                              | Storage              |
| ------------------ | ------------------------------------------------------------- | -------------------- |
| CloudTrail         | Every Secrets Manager API call (GetSecretValue, RotateSecret) | CloudTrail S3 bucket |
| CloudWatch Metrics | Secrets Manager API call counts, latency                      | CloudWatch           |
| Application logs   | Secret path, service, cache hit/miss, requestId               | CloudWatch Logs      |

### 5.2 Application-Level Secret Access Log

```json
{
  "event": "secrets.read",
  "timestamp": "2026-04-03T12:00:00.456Z",
  "requestId": "req_abc123",
  "secretPath": "actbound/prod/orchestrator-api/db-credentials",
  "service": "orchestrator-api",
  "iamRole": "actbound-orchestrator-prod-role",
  "cacheHit": true,
  "durationMs": 0
}
```

**Never logged:** The secret value itself.

### 5.3 Anomaly Detection Patterns

| Pattern                            | Detection method                               | Alert                  |
| ---------------------------------- | ---------------------------------------------- | ---------------------- |
| Unusual secret access frequency    | CloudWatch metric filter on secrets.read count | Warning at 2x baseline |
| Secret accessed by unexpected role | CloudTrail → IAM principal mismatch            | Critical               |
| Rotation failure                   | CloudWatch alarm on secrets.rotation.failed    | Critical               |
| Secret age exceeding threshold     | CloudWatch custom metric on secret metadata    | Warning at 90 days     |

---

## 6. Agent Observability Model

### 6.1 Agent Action Audit Event

```json
{
  "event": "agent.action.executed",
  "timestamp": "2026-04-03T12:00:00.789Z",
  "requestId": "req_abc123",
  "workflowId": "wf_xyz789",
  "agent": {
    "sub": "agent_research_001@clients",
    "type": "research",
    "instanceId": "agent_research_001"
  },
  "delegation": {
    "onBehalfOf": "auth0|alice",
    "consentGrantId": "grant_001",
    "delegatedScopes": ["agent.execute", "tokens.delegated"]
  },
  "action": {
    "permission": "agent_actions:execute",
    "tool": "google.calendar.create_event",
    "toolCategory": "write_external",
    "resource": { "type": "agent_action", "id": "action_001" }
  },
  "authorization": {
    "allowed": true,
    "evaluationPath": [
      { "layer": "rbac", "result": "pass" },
      { "layer": "abac", "result": "pass" },
      { "layer": "openfga", "result": "pass" }
    ]
  },
  "tokenVault": {
    "accessed": true,
    "provider": "google",
    "scopesUsed": ["calendar.events.create"]
  },
  "result": { "status": "success", "durationMs": 450 },
  "service": "orchestrator-api"
}
```

### 6.2 Debugging Failed Agent Actions

When an agent action fails, the log contains the full evaluation path plus the failure reason:

```json
{
  "event": "agent.action.denied",
  "requestId": "req_def456",
  "agent": { "sub": "agent_research_001@clients" },
  "permission": "agent_actions:execute",
  "decision": {
    "allowed": false,
    "reasons": [
      {
        "code": "step_up_required",
        "message": "Step-up authentication is required before sensitive actions"
      }
    ]
  },
  "evaluationPath": [
    { "layer": "rbac", "result": "pass" },
    { "layer": "abac", "result": "deny", "reason": "step_up_required" }
  ]
}
```

The `evaluationPath` tells you exactly which layer denied and why — no guessing.

---

## 7. Log Storage and Aggregation Strategy

### 7.1 Storage Architecture

| Tier | Storage         | Retention | Queryable               | Cost   |
| ---- | --------------- | --------- | ----------------------- | ------ |
| Hot  | CloudWatch Logs | 90 days   | Yes (Insights)          | Higher |
| Warm | S3 Standard     | 1 year    | Yes (Athena)            | Medium |
| Cold | S3 Glacier      | 3+ years  | Slow (restore required) | Low    |

### 7.2 Log Groups

| Log group                          | Source                                    | Retention (hot) |
| ---------------------------------- | ----------------------------------------- | --------------- |
| `/actbound/{env}/orchestrator-api` | orchestrator-api application logs         | 90 days         |
| `/actbound/{env}/agent-service`    | agent-service application logs            | 90 days         |
| `/actbound/{env}/openfga`          | OpenFGA query logs                        | 30 days         |
| `/actbound/{env}/audit`            | Authorization decisions + agent actions   | 90 days         |
| `/actbound/{env}/security`         | Secret access, identity events, anomalies | 90 days         |

### 7.3 Lifecycle

```
Day 0-90:  CloudWatch Logs (hot, queryable via Insights)
Day 90-365: Export to S3 Standard (queryable via Athena)
Day 365+:   Transition to S3 Glacier (compliance archive)
```

### 7.4 Cost Optimization

- **VPC endpoints for CloudWatch Logs** — no NAT cost for log delivery.
- **Metric filters instead of Insights for alerts** — filters are real-time and cheaper than scheduled queries.
- **Log level control** — Debug-level events (`authz.rbac.evaluated`, `authz.abac.evaluated`) are only emitted when debug logging is enabled. Info and above are always on.

---

## 8. Detection and Alerting Model

### 8.1 Alert Rules

| Alert                      | Trigger                                | Severity | Escalation              |
| -------------------------- | -------------------------------------- | -------- | ----------------------- |
| Auth failure spike         | >10 `identity.login.failure` in 5 min  | Warning  | SNS → Slack             |
| Authorization denial spike | >20 `authz.decision` (denied) in 5 min | Warning  | SNS → Slack             |
| OpenFGA unavailable        | Any `authz.openfga.error`              | Critical | SNS → Slack + PagerDuty |
| Secret rotation failure    | Any `secrets.rotation.failed`          | Critical | SNS → Slack + PagerDuty |
| Unexpected secret access   | CloudTrail: unknown IAM principal      | Critical | SNS → Slack + PagerDuty |
| Agent action failure rate  | >50% `agent.action.failed` in 10 min   | Warning  | SNS → Slack             |
| Agent rate limit exceeded  | Agent exceeds 60 actions/min           | Warning  | SNS → Slack             |
| Secret age threshold       | Secret not rotated in 90+ days         | Warning  | SNS → email             |

### 8.2 Severity Levels

| Level    | Meaning                                        | Response time          |
| -------- | ---------------------------------------------- | ---------------------- |
| Critical | Production impact or security breach indicator | Immediate (< 15 min)   |
| Warning  | Degradation or anomaly requiring investigation | Same business day      |
| Info     | Normal operational events                      | Review in daily digest |

### 8.3 Alert Implementation

CloudWatch Metric Filters → CloudWatch Alarms → SNS Topics → notification channels.

```
Application log → CloudWatch Logs → Metric Filter (pattern match)
                                         │
                                         ▼
                                  CloudWatch Alarm (threshold)
                                         │
                                         ▼
                                  SNS Topic → Slack / email / PagerDuty
```

---

## 9. Audit Trail Design

### 9.1 Audit-Critical Events

These events form the immutable audit trail. They must be preserved for compliance and forensic investigation.

| Category             | Events                                                   |
| -------------------- | -------------------------------------------------------- |
| Authorization        | All `authz.decision` events (allow and deny)             |
| Agent actions        | All `agent.action.*` events                              |
| Secret access        | All `secrets.read` and `secrets.token_vault.read` events |
| Secret rotation      | All `secrets.rotation.*` events                          |
| Identity lifecycle   | Login, token issuance, MFA events                        |
| Agent lifecycle      | Provisioning, decommissioning                            |
| Delegation lifecycle | Created, revoked                                         |
| Admin operations     | Infrastructure access, configuration changes             |

### 9.2 Immutability

- CloudWatch Logs are append-only by default.
- S3 archive uses Object Lock (compliance mode) to prevent deletion.
- CloudTrail logs are delivered to a separate S3 bucket with restricted access.
- No runtime IAM role can delete audit logs. Only admin roles with MFA can manage retention.

### 9.3 Audit Query Patterns

| Question                                               | Query approach                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| "What did agent X do on behalf of user Y?"             | CloudWatch Insights: filter agent.sub AND delegation.onBehalfOf                                    |
| "Who accessed secret Z in the last 24 hours?"          | CloudTrail: filter eventName=GetSecretValue AND secretId=Z                                         |
| "Show all denied authorization decisions for tenant A" | CloudWatch Insights: filter event=authz.decision AND decision.allowed=false AND subject.tenantId=A |
| "Reconstruct workflow W end-to-end"                    | CloudWatch Insights: filter workflowId=W, sort by timestamp                                        |
| "Show all Token Vault accesses this week"              | CloudWatch Insights: filter event=secrets.token_vault.read                                         |

---

## 10. Failure and Observability Gaps

### 10.1 Logging Failures

| Failure                            | Impact                  | Mitigation                                                                    |
| ---------------------------------- | ----------------------- | ----------------------------------------------------------------------------- |
| CloudWatch Logs unavailable        | Events buffered locally | ECS Firelens/Fluentd with local buffer, retry on delivery                     |
| Application crashes before logging | Event lost              | Log authorization decisions synchronously before returning response           |
| Log delivery delayed               | Alerts delayed          | Metric filters operate on ingestion, not real-time — acceptable lag is <1 min |

### 10.2 Missing Correlation IDs

| Cause                                       | Mitigation                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| External caller doesn't send `X-Request-Id` | Middleware generates one if absent                                        |
| Service-to-service call drops header        | Propagation is mandatory — missing header is a bug, caught in code review |
| Agent workflow doesn't set `X-Workflow-Id`  | Agent runtime generates one at workflow start                             |

### 10.3 Partial Traces

Multi-step workflows may have incomplete traces if a step fails silently. Mitigation:

- Each step logs independently (not dependent on workflow completion).
- Workflow summary event logged at completion or timeout.
- Alert on workflows with start event but no completion event within timeout.

### 10.4 Noisy vs Missing Signals

| Problem                              | Mitigation                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Too many debug logs in production    | Debug events gated behind log level configuration. Default: Info.          |
| Alert fatigue from frequent warnings | Tune thresholds after baseline period. Start conservative, tighten.        |
| Missing events for new features      | Observability checklist in PR review: "Does this action have a log event?" |

---

## 11. Reusable Skills

### 11.1 `skill.observability.design.event-taxonomy`

**Purpose:** Define structured event types for a new feature or domain.

**Inputs:** Feature description, actions that can occur, principals involved.

**Outputs:** Event table (event name, required fields, severity level).

**Steps:** Identify actions → define event names (domain.action.result) → define required fields → assign severity → document in taxonomy.

### 11.2 `skill.observability.propagate.correlation-id`

**Purpose:** Ensure requestId and workflowId propagate across a service call chain.

**Inputs:** Service call graph, middleware configuration.

**Outputs:** Middleware that generates/propagates IDs, header injection for downstream calls.

**Steps:** Generate requestId if missing → attach to request context → inject into all outbound HTTP headers → include in all log lines → verify propagation in integration tests.

### 11.3 `skill.authz.log.decision`

**Purpose:** Emit a structured authorization decision log event.

**Inputs:** AuthorizationDecision object, request context, requestId.

**Outputs:** Structured JSON log event written to audit log group.

**Steps:** Build event from decision → include subject, permission, resource, reasons, evaluationPath → set severity (Info for allow, Warning for deny) → include requestId and timestamp → write to logger.

### 11.4 `skill.agent.trace.execution`

**Purpose:** Trace an agent workflow across multiple steps.

**Inputs:** Agent context, workflowId, step sequence.

**Outputs:** Per-step log events plus workflow summary event.

**Steps:** Generate workflowId → log workflow start → for each step: log action, authorization, result with shared workflowId → log workflow completion/failure → include total duration and step count.

### 11.5 `skill.secrets.audit.access`

**Purpose:** Log a secret access event with context.

**Inputs:** Secret path, requesting service/agent, cache hit status, requestId.

**Outputs:** Structured JSON log event (never containing the secret value).

**Steps:** Build event with secret path (not value) → include requesting principal → include cache hit status → include duration → write to security log group → CloudTrail captures the AWS API call independently.

---

## Related ADRs

- [ADR-032: Observability Architecture](../decisions/ADR-032-observability-architecture.md)
- [ADR-033: Event Taxonomy Standard](../decisions/ADR-033-event-taxonomy-standard.md)
- [ADR-034: Authorization Decision Logging Policy](../decisions/ADR-034-authorization-decision-logging.md)
- [ADR-035: Agent Observability Model](../decisions/ADR-035-agent-observability-model.md)
- [ADR-036: Log Retention Strategy](../decisions/ADR-036-log-retention-strategy.md)
