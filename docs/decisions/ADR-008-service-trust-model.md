# ADR-008: Service Trust Model

## Status

Accepted

## Context

The ActBound platform runs multiple services (orchestrator-api, agent-service) plus AI agents that need to communicate securely. We need to define how services authenticate to each other and where trust boundaries exist.

The platform spans AWS infrastructure and a Tailscale-connected network. We need to decide whether service-to-service trust uses Auth0, AWS IAM, or a hybrid approach.

## Decision

### Hybrid Trust Model

| Boundary                         | Trust mechanism | Why                                        |
| -------------------------------- | --------------- | ------------------------------------------ |
| External → orchestrator-api      | Auth0 user JWT  | Standard OIDC validation at the edge       |
| orchestrator-api → agent-service | Auth0 M2M JWT   | Identity-carrying, validated independently |
| Any service → AWS resources      | IAM roles       | Native AWS trust, no token overhead        |
| Network level                    | Tailscale       | Zero-trust network overlay, encrypted mesh |

### Why Not Pure Auth0 for Everything

AWS IAM roles are the correct trust mechanism for AWS resources. Introducing Auth0 tokens into the AWS access path would add unnecessary complexity and a non-native authentication layer. IAM roles are attached to compute (EC2 instance profiles, ECS task roles) and scoped per-service.

### Why Not Pure AWS IAM for Everything

Auth0 JWTs carry identity context (principal type, roles, tenant, delegation) that authorization decisions need. IAM credentials identify the compute instance, not the logical principal. Service-to-service calls need to carry the chain of identity (which user, which agent, which delegation).

### Trust Rules

1. **No service trusts upstream authorization decisions.** Each service independently validates the JWT and queries OpenFGA.
2. **orchestrator-api is the only internet-facing service.** All external traffic enters through the orchestrator.
3. **agent-service validates that the caller is a known service or agent.** It checks `sub` against a list of trusted M2M client IDs.
4. **Network isolation is defense-in-depth, not a substitute for authentication.** Tailscale restricts network access, but JWT validation happens regardless.
5. **AWS access is scoped per-service.** No shared IAM roles across services.

### Service Identity Registration

| Service          | Auth0 M2M App      | AWS IAM Role                 | Purpose                                       |
| ---------------- | ------------------ | ---------------------------- | --------------------------------------------- |
| orchestrator-api | Yes                | Yes                          | Edge service, user JWT validation, M2M caller |
| agent-service    | Yes                | Yes                          | Internal service, M2M receiver                |
| Agent instances  | Yes (per-instance) | No (access via orchestrator) | Agent identity                                |

## Consequences

- Clear separation: Auth0 handles identity, AWS handles infrastructure access.
- Each service can validate tokens independently (no central gateway dependency).
- M2M token overhead for internal calls (acceptable for security posture).
- Tailscale adds network-level zero trust without managing traditional VPNs or security groups.
- Agent instances do not have direct AWS access — they go through the orchestrator/agent-service.
