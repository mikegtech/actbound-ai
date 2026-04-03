# ADR-036: Log Retention Strategy

## Status

Accepted

## Context

Logs have different value over time. Recent logs are queried frequently for debugging and alerts. Older logs are needed for compliance and forensic investigation. Storing everything in hot storage is expensive.

## Decision

### Three-Tier Retention

| Tier | Storage         | Retention | Queryable             | Use case                           |
| ---- | --------------- | --------- | --------------------- | ---------------------------------- |
| Hot  | CloudWatch Logs | 90 days   | Yes (Insights, <1s)   | Active debugging, alerting         |
| Warm | S3 Standard     | 1 year    | Yes (Athena, seconds) | Compliance queries, investigations |
| Cold | S3 Glacier      | 3+ years  | Slow (restore first)  | Legal hold, long-term compliance   |

### Lifecycle

- Days 0-90: CloudWatch Logs (automatic).
- Day 90: CloudWatch Logs subscription filter exports to S3 Standard.
- Day 365: S3 lifecycle rule transitions to Glacier.

### Per-Log-Group Retention

| Log group           | Hot retention                | Why                                     |
| ------------------- | ---------------------------- | --------------------------------------- |
| Application logs    | 90 days                      | Standard debugging window               |
| Audit logs          | 90 days (hot) + full archive | Compliance requires long-term retention |
| Security logs       | 90 days (hot) + full archive | Investigation support                   |
| OpenFGA query logs  | 30 days                      | High volume, short debugging value      |
| Infrastructure logs | 30 days                      | Operational, short-term value           |

### Immutability

- S3 Object Lock (compliance mode) on audit and security log archives.
- No runtime IAM role can delete archived logs.
- Only admin roles with MFA can modify retention policies.

## Consequences

- Cost-effective: hot storage for active use, cold storage for compliance.
- Audit trail preserved for 3+ years without hot storage cost.
- Querying warm logs via Athena is slightly slower but still practical.
- Lifecycle automation means no manual log management.
