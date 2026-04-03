# ADR-031: Home Network Trust Boundary

## Status

Accepted

## Context

The platform operator (Mike) works from a home network with UniFi infrastructure. We need to define how much the architecture depends on or trusts the home network.

## Decision

**The home network is untrusted for production purposes.**

### What the Home Network Provides

- Internet connectivity for dev machines to reach Tailscale and AWS Console
- Local development environment for coding and testing
- UniFi segmentation for device isolation (Dev/Work VLAN)

### What the Home Network Must NOT Provide

- Production service hosting or availability
- Direct routing to production resources (all access via Tailscale)
- Secret storage or credential caching beyond dev-machine memory
- Backup or recovery infrastructure

### Admin Access Path

```
Dev machine (home) → Tailscale client → Tailscale mesh → AWS subnet router → Private resources
```

The home network's role is limited to providing internet connectivity for the Tailscale tunnel. If the home network is compromised, Tailscale's end-to-end encryption protects the tunnel contents.

### UniFi Segmentation

Recommended VLAN separation: Management (UniFi devices), Dev/Work (dev machines with Tailscale), IoT (smart devices, no cloud access), Guest.

### Compromise Response

If the home network is compromised:

1. Revoke compromised Tailscale devices
2. Rotate any dev-only credentials
3. Production is unaffected (no home network dependency)

## Consequences

- Home network compromise has zero impact on production.
- Admin access is secured by Tailscale encryption, not home network integrity.
- Developer experience is maintained (local dev with Tailscale to cloud resources).
- UniFi segmentation provides defense-in-depth for the local network.
