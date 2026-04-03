# ADR-037: Backup Strategy

## Status

Accepted

## Context

The platform has multiple critical data stores (Auth0 config, Secrets Manager, OpenFGA, RDS) that must be recoverable. We need a backup strategy that covers each system appropriately without over-engineering.

## Decision

### Per-System Backup

| System          | Method                                 | Frequency                  | Storage                     | Retention        |
| --------------- | -------------------------------------- | -------------------------- | --------------------------- | ---------------- |
| Auth0 config    | Terraform / Deploy CLI export          | On change (CI/CD)          | Git + S3                    | Versioned        |
| Secrets Manager | Built-in versioning                    | Automatic (every rotation) | AWS-managed                 | All versions     |
| OpenFGA         | Application-level tuple + model export | Daily Lambda               | S3 (encrypted, Object Lock) | 30 daily exports |
| RDS             | Automated snapshots + continuous PITR  | Daily + continuous         | RDS-managed                 | 30 days          |
| Infrastructure  | Terraform state                        | On change                  | S3 (versioned)              | Versioned        |

### Not Backed Up

Redis (ephemeral), token broker cache (ephemeral), in-flight agent workflows (stateless), CloudWatch Logs hot tier (archived via lifecycle policy per ADR-036).

### Backup Access Isolation

No runtime IAM role can access, modify, or delete backups. Only admin roles with MFA can perform restore operations. S3 backup buckets use Object Lock (compliance mode).

## Consequences

- Every critical system has a recovery path with defined RPO.
- Backups are encrypted at rest (KMS) and access-isolated from runtime.
- Daily OpenFGA export means up to 24h of tuple loss on corruption — acceptable given reconciliation Lambda fills most gaps.
- RDS PITR provides minute-level RPO for domain data.
