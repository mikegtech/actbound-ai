# ADR-029: Tailscale Private Access Model

## Status

Accepted

## Context

Private AWS resources (databases, OpenFGA, internal services) need to be accessible for admin operations and development without exposing them publicly. Traditional VPNs add infrastructure overhead. Tailscale provides a zero-config WireGuard mesh.

## Decision

**Tailscale provides private admin/operator access. It is NOT in the production runtime data path.**

### What Goes Through Tailscale

- Admin SSH to VPS and AWS instances
- Developer access to dev/staging private subnets
- VPS access to monitoring targets
- Emergency break-glass access to prod private resources

### What Does NOT Go Through Tailscale

- Production user traffic (ALB handles this)
- Service-to-service communication within AWS (security groups handle this)
- Secrets Manager access (VPC endpoints handle this)
- CI/CD deployments (IAM OIDC federation handles this)

### Implementation

A Tailscale subnet router (small EC2 or ECS task) in each VPC advertises the VPC CIDR to the mesh. Admin devices connect via Tailscale client.

### ACL Policy

- `tag:admin` → can reach dev, staging, and prod (prod is break-glass, audited)
- `tag:vps` → can reach dev and staging only
- All other devices → no cloud access

### Production Access

Production access via Tailscale is break-glass only. Day-to-day operations use CI/CD pipelines, AWS Console (with MFA), and CloudWatch. Direct prod access is audited via Tailscale access logs.

## Consequences

- No public SSH or management ports anywhere.
- Private resources remain private — reachable only through Tailscale mesh or within the VPC.
- Tailscale outage does not affect production. Admins fall back to AWS Console.
- Subnet routers are lightweight and low-maintenance.
