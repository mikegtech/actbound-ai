# ADR-041: Break-Glass Access Model

## Status

Accepted

## Context

Disaster recovery sometimes requires elevated access beyond normal IAM roles. We need a break-glass procedure that enables recovery without creating a permanent backdoor.

## Decision

### Break-Glass Credentials

- Stored offline (sealed physical envelope or hardware security module)
- Provide full AWS account access (IAM admin)
- Require MFA for any action
- Every action logged to CloudTrail (non-deletable trail)

### Activation Protocol

1. Incident declared by team lead
2. Break-glass credentials retrieved from offline storage
3. Dual approval required (two team members or team lead + documented reason)
4. MFA verified before any action
5. Recovery performed per documented playbook
6. All actions logged automatically (CloudTrail)

### Post-Use Requirements

1. Break-glass credentials rotated immediately after use
2. New credentials sealed in offline storage
3. Full audit log review of all actions taken during break-glass period
4. Post-incident review within 48 hours
5. Playbook updated if gaps were found

### What Break-Glass Is NOT

- Not a daily admin tool (use scoped IAM roles for normal operations)
- Not unaudited (CloudTrail captures everything)
- Not permanent (credentials rotated after every use)
- Not single-person (dual approval required)

## Consequences

- Recovery is always possible even if normal IAM access is compromised.
- Break-glass access is auditable and time-bounded.
- Offline storage means credentials are not exposed to network-based attacks.
- Post-use rotation means credentials cannot be reused after an incident.
- The dual-approval requirement prevents unilateral misuse.
