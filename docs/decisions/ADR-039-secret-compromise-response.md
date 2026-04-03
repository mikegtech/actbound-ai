# ADR-039: Secret Compromise Response Strategy

## Status

Accepted

## Context

When a secret is compromised, the response must be fast, correct, and auditable. Delayed rotation extends the attack window. Incorrect rotation breaks live services.

## Decision

### Response Protocol

1. **Identify** the compromised secret (which path, which environment)
2. **Rotate immediately** using the appropriate method:
   - DB credentials: trigger Lambda rotation (dual-user strategy, zero downtime)
   - Auth0 M2M: call Management API to rotate client secret, update Secrets Manager
   - Vendor API key: regenerate at provider, update Secrets Manager
3. **Verify** the new credential works (Lambda testSecret step or manual validation)
4. **Invalidate** the old credential at the target system if possible
5. **Audit** CloudTrail for unauthorized access using the old credential
6. **Notify** affected service owners and team

### Service Recovery

Services pick up new credentials within 5 minutes (cache TTL). Services implement retry-on-auth-failure to handle the rotation race window. No service restart is required for normal rotations.

### Broad Compromise

If the compromise is account-wide (e.g., IAM access key leaked):

1. Revoke compromised IAM credentials immediately
2. Rotate ALL secrets in the affected environment
3. Restart all services to force cache eviction
4. Full CloudTrail audit of the compromise window

## Consequences

- Sub-5-minute credential replacement for automated secrets.
- Zero downtime for database rotations (dual-user strategy).
- CloudTrail provides full audit of the compromise window.
- The protocol is concrete and executable — not theoretical.
