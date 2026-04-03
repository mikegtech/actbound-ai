# ADR-032: Observability Architecture

## Status

Accepted

## Context

The platform needs a unified observability system for debugging, security auditing, and anomaly detection. We must decide between AWS-native tooling, third-party SaaS (Datadog, Grafana Cloud), or self-hosted solutions.

## Decision

**AWS-native observability stack: CloudWatch Logs, CloudWatch Metrics, CloudTrail, S3 for archival.**

### Why AWS-Native

- Already in the AWS ecosystem — no additional vendor, no data egress cost.
- CloudWatch Logs Insights provides ad-hoc querying on structured JSON.
- CloudTrail captures all AWS API calls automatically (Secrets Manager, IAM).
- Metric filters and alarms provide real-time alerting.
- S3 + Athena provides cost-effective long-term querying.
- Sufficient for a small team. Upgrade to Datadog/Grafana Cloud when scale demands it.

### Architecture

Three layers: Application logs (structured JSON to CloudWatch Logs), Security logs (CloudTrail + application security events), Infrastructure logs (VPC Flow Logs, ECS events). All queryable via CloudWatch Insights. Archived to S3 with lifecycle policies.

### When to Upgrade

Move to a dedicated observability platform (Datadog, Grafana Cloud) when: log volume exceeds CloudWatch cost efficiency, the team needs complex dashboarding, or cross-account log aggregation is required.

## Consequences

- Single vendor for compute, secrets, and observability — operational simplicity.
- CloudWatch Insights is powerful but less ergonomic than Datadog/Grafana for complex queries.
- No additional SaaS cost.
- All logs stay within AWS — no data egress or third-party trust concerns.
