# ADR-030: Public vs Private Service Exposure Policy

## Status

Accepted

## Context

The platform has multiple services. We need a clear rule for which are publicly accessible and which are strictly private.

## Decision

**Only orchestrator-api is publicly exposed. Everything else is private.**

### Public

| Service                      | Exposure | How                                       |
| ---------------------------- | -------- | ----------------------------------------- |
| orchestrator-api             | Public   | ALB in public subnet → private app subnet |
| Static web assets (apps/web) | Public   | CloudFront or S3 static hosting           |

### Private (no public access)

| Service               | Why private                                           |
| --------------------- | ----------------------------------------------------- |
| agent-service         | Internal only, called by orchestrator-api via M2M JWT |
| OpenFGA               | Authorization store, no external consumers            |
| RDS (Postgres)        | Data store, accessed only by services                 |
| Redis (ElastiCache)   | Cache, accessed only by services                      |
| Secrets Manager       | AWS API, accessed via VPC endpoint                    |
| Monitoring dashboards | Admin access via Tailscale only                       |

### Enforcement

- Private services run in private subnets with no route to an internet gateway.
- Security groups restrict inbound to specific source SGs (not CIDR ranges where possible).
- No ALB or API Gateway target group for private services.
- Periodic audit: any service with a public security group rule is flagged.

## Consequences

- Minimal public attack surface: one ALB endpoint.
- Internal services are unreachable from the internet even if misconfigured.
- Defense-in-depth: even the public endpoint requires Auth0 JWT validation.
- Admins access private resources via Tailscale (break-glass) or AWS Console.
