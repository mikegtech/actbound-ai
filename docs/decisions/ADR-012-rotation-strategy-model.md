# ADR-012: Rotation Strategy Model

## Status

Accepted

## Context

Secrets that never rotate accumulate risk. Compromised credentials remain valid indefinitely. We need a rotation strategy that balances security with operational simplicity and zero downtime.

## Decision

### Rotation Tiers

| Tier                         | Strategy                                  | Frequency | Automation      | Examples                                   |
| ---------------------------- | ----------------------------------------- | --------- | --------------- | ------------------------------------------ |
| Tier 1: Automated            | Lambda rotation with dual-version staging | 30 days   | Fully automated | Database credentials, Redis credentials    |
| Tier 2: Semi-automated       | Lambda rotation via vendor API            | 90 days   | Fully automated | Auth0 M2M client secrets                   |
| Tier 3: Manual with alerting | CloudWatch age alert, human rotates       | On demand | Alert only      | OpenAI key, Stripe key, vendor-issued keys |

### Rotation Protocol

All automated rotations follow the AWS four-step protocol:

1. **createSecret** — generate or request new credential, store as `AWSPENDING`
2. **setSecret** — apply new credential to the target system (database user, Auth0 API, etc.)
3. **testSecret** — validate `AWSPENDING` works against the target
4. **finishSecret** — promote `AWSPENDING` to `AWSCURRENT`, demote old to `AWSPREVIOUS`

### Zero-Downtime Contract

- Services cache secrets with a 5-minute TTL
- `AWSPREVIOUS` remains valid until the next rotation cycle
- Services implement retry-on-auth-failure to handle the cache/rotation race
- Database rotation uses alternating users so both old and new credentials work simultaneously

### Rotation Failure Handling

| Failure                 | Response                                                       |
| ----------------------- | -------------------------------------------------------------- |
| Lambda timeout          | AWS retries automatically. Alert after 2 consecutive failures. |
| Target validation fails | `AWSPENDING` is not promoted. `AWSCURRENT` unchanged. Alert.   |
| Lambda exception        | CloudWatch alarm. Manual investigation. Secret unchanged.      |
| Stuck in pending state  | Admin manually promotes or removes `AWSPENDING` via CLI.       |

### Alerting

| Event                                   | Threshold   | Action                    |
| --------------------------------------- | ----------- | ------------------------- |
| Rotation Lambda failure                 | Any failure | CloudWatch alarm → SNS    |
| Secret age (Tier 3 manual secrets)      | 90 days     | CloudWatch metric → alert |
| Secret access from unexpected principal | Any         | CloudTrail → alarm        |

## Consequences

- Database and Redis credentials rotate automatically every 30 days with zero downtime.
- Auth0 M2M secrets rotate every 90 days, aligned with the Auth0 API.
- Vendor-issued keys that cannot be auto-rotated are tracked by age and flagged for manual rotation.
- Rotation failures are visible and recoverable without data loss.
- Operational overhead: one Lambda per rotatable secret type, not per secret instance.
