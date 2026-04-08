# Cross-Cutting Rules — Observability

## Purpose

Use this file whenever a change affects audit events, logs, traces, metrics, correlation IDs, workflow attribution, authorization decision logging, activity timelines, or security event visibility.

In this repo, observability is part of the security model, not just operational plumbing.

## Reviewer priorities

1. preserve security-relevant auditability
2. preserve request and workflow correlation
3. ensure denied and failed outcomes remain visible
4. prevent sensitive data leakage in logs/events
5. keep event semantics structured and consistent

## Flag as blocker

- removal or weakening of audit trails for security-relevant actions
- missing attribution for agent, user, or service actions
- dropped requestId or workflowId propagation in multi-step flows
- logging tokens, secrets, or prohibited sensitive fields
- observability regressions that make authorization outcomes non-traceable

## Flag as high severity

- inconsistent event naming or result semantics
- missing logs for denial, revocation, reconciliation, or failure paths
- activity timeline regressions for user-control or audit features
- poor distinction between allowed, denied, failed, and step-up-required outcomes
- schema drift in audit-related payloads without downstream updates

## Review for

- structured JSON event discipline
- requestId and workflowId propagation where relevant
- explicit subject and principal attribution
- permission/resource/decision context on authorization events
- clear differentiation between business failures and authorization denials
- retention- and downstream-friendly event shapes
- no secret values, raw tokens, or disallowed PII in logs
- updates to audit-facing contracts and UI consumers when event shapes change

## Related repo principles

- every authorization decision is logged
- event taxonomy should remain structured
- observability must support debugging, audit, and detection
- auditability is part of definition of done
