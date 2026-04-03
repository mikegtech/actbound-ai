# ADR-028: VPS Role in Platform Architecture

## Status

Accepted

## Context

A VPS is available in addition to AWS infrastructure. We need to decide what role it plays: production workload host, admin utility, build runner, or something else.

## Decision

**The VPS is an admin utility and dev tooling host. It is NOT a production workload host.**

### What Runs on VPS

- CI/CD self-hosted runners (GitHub Actions)
- Monitoring dashboards (Grafana)
- Dev/staging ad-hoc tooling
- Tailscale exit node (optional)

### What Does NOT Run on VPS

- Production API services (orchestrator-api, agent-service)
- Production databases or caches
- OpenFGA (production)
- Agent execution
- Secrets Manager runtime access

### Trust Level

Semi-trusted. Connected to Tailscale mesh with ACL-restricted access to dev and staging environments. No production credentials or IAM roles stored on the VPS.

### Hardening

SSH key-only, firewall (Tailscale + SSH only), automatic security updates, fail2ban, no production IAM credentials.

## Consequences

- VPS compromise has limited blast radius (dev/staging tooling only).
- Production is fully AWS-hosted and unaffected by VPS status.
- VPS provides cost-effective build/monitoring infrastructure.
- Clear rule: if a workload is production-critical, it runs in AWS.
