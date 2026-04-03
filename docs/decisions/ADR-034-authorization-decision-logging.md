# ADR-034: Authorization Decision Logging Policy

## Status

Accepted

## Context

Authorization decisions are the most security-critical events in the platform. We must decide whether to log all decisions, sample them, or log only denials.

## Decision

**Log every authorization decision — both allow and deny. No sampling.**

### Why Full Logging

- Authorization decisions are low-volume relative to request traffic (one per request).
- Sampling creates audit gaps — a sampled-out denial could be a missed security signal.
- Allow logs are needed for forensic investigation ("prove user X was authorized at time T").
- The overhead is negligible (<1ms for structured JSON formatting).

### What Each Decision Log Contains

- Subject (sub, principal type, roles, tenant)
- Permission requested
- Resource (type, ID, owner)
- Decision (allowed/denied)
- Reasons (always populated — `policy_allow` or specific denial codes)
- Evaluation path (which layers ran, their result, their duration)
- Request ID and timestamp

### Log Level

- Allow: Info
- Deny: Warning
- Error (authorization system failure): Critical

### Performance

Full logging adds <1ms per request. The decision object is already computed — logging serializes it. No additional computation.

## Consequences

- Complete audit trail for every authorization decision.
- No gaps from sampling.
- Higher log volume than deny-only logging, but the cost is justified by audit completeness.
- CloudWatch Insights can answer "show all denials for user X" or "show all allows for resource Y" without gaps.
