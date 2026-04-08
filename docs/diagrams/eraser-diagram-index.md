# ActBound AI — Eraser Diagram Index

Canonical architecture diagrams generated via Eraser MCP. Each diagram is editable at its Eraser URL and has a static PNG export.

| #   | Title                                  | Type                | Eraser File                                                            | Image                                                                                                                                                             |
| --- | -------------------------------------- | ------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Platform System Architecture           | cloud-architecture  | [Open in Eraser](https://app.eraser.io/workspace/6QEO7ANSOkH82tiqoeuk) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3A2974fc6fd66adca91577f658eb4afe2fbe1ec3d0833541c3d104af2e5e556156.png) |
| 2   | Identity & Token Flow                  | sequence-diagram    | [Open in Eraser](https://app.eraser.io/workspace/p7GCkljvVhv7gbCQkW7b) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Ac66b2196c5874147277abdb156cbfb0a18de51ac3f7f672edb7dfbee1529ad63.png) |
| 3   | Authorization Decision Pipeline        | flowchart           | [Open in Eraser](https://app.eraser.io/workspace/XAHA2PQIiMOBAgKGqncO) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Aa10c56eef34d427093f3b45cd3f4083c14690817debc53c1e30728bc48fc9ea5.png) |
| 4   | Agent Delegation & Consent Flow        | flowchart           | [Open in Eraser](https://app.eraser.io/workspace/sFlxvTDXWBhtUwiYVy4t) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Ad05de0fb0a282bebf956fa6a54fbc95289677bfb065cb4095e992b06a24e4d86.png) |
| 5   | OpenFGA Principal & Relationship Model | entity-relationship | [Open in Eraser](https://app.eraser.io/workspace/paP73ygHJaBXbgGm0yHA) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Aab4965c79b17610944af9b25b07341e94441107781017a11c2acd13070576019.png) |
| 6   | Infrastructure Security Topology       | cloud-architecture  | [Open in Eraser](https://app.eraser.io/workspace/94Sg8YdqZIpGXJr7uT2Q) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3A24f3a3b1ff474a99898402bc0cbc664a306a99b40a27f9d48597c8dfd23a72e8.png) |
| 7   | Hexagonal Service Architecture         | cloud-architecture  | [Open in Eraser](https://app.eraser.io/workspace/ALgr51f340RsM8bfC5EQ) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Ad79b8769cd89da28c0d5e4617d5ad0c83641bd087b6f29c28a91039c970e3de4.png) |
| 8   | Security Observability Event Flow      | flowchart           | [Open in Eraser](https://app.eraser.io/workspace/EvAgIgDlBaYsUqikLSvN) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3A23f0105c5b36186d4106d7585ea8323201b3fe382a46973a8532430d0b84c27e.png) |
| 9   | Resilience, Break-Glass & Recovery     | flowchart           | [Open in Eraser](https://app.eraser.io/workspace/fCk0CL3I72yfXsBMQic5) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Ae921dafd2bfd1db2b17c511eea10ab97eaac28d7127eddbeef87fe21283ad1af.png) |

## File IDs

| #   | fileId                 |
| --- | ---------------------- |
| 1   | `6QEO7ANSOkH82tiqoeuk` |
| 2   | `p7GCkljvVhv7gbCQkW7b` |
| 3   | `XAHA2PQIiMOBAgKGqncO` |
| 4   | `sFlxvTDXWBhtUwiYVy4t` |
| 5   | `paP73ygHJaBXbgGm0yHA` |
| 6   | `94Sg8YdqZIpGXJr7uT2Q` |
| 7   | `ALgr51f340RsM8bfC5EQ` |
| 8   | `EvAgIgDlBaYsUqikLSvN` |
| 9   | `fCk0CL3I72yfXsBMQic5` |

## Diagram Details

### 1. Platform System Architecture

Foundation diagram showing all components and trust boundaries. React SPA → orchestrator-api (only public service) → internal services → data stores. External dependencies: Auth0, AWS Secrets Manager, Token Vault.

### 2. Identity & Token Flow

Sequence diagram showing three token types: User PKCE login via Auth0, M2M cache-first token broker, and delegated access via Token Vault. Includes JWT custom claims in `https://actbound.ai/` namespace.

### 3. Authorization Decision Pipeline

RBAC → ABAC → OpenFGA fail-closed chain. Each stage can deny independently. 25 permissions across 20 resource types. No fail-open path (ADR-021, ADR-040).

### 4. Agent Delegation & Consent Flow

Assistant runtime security checks (checkAssistantActive → checkDelegation → checkToolAuthorization → checkSecretBoundary). Delegation intersection rule: agent capability ∩ user consent ∩ user authorization. Kill-switch procedure.

### 5. OpenFGA Principal & Relationship Model

Entity-relationship diagram of the OpenFGA authorization model: user, agent, organization, resource, agent_action types. Key: `can_execute = executor AND delegator` intersection rule.

### 6. Infrastructure Security Topology

Zero-trust zone boundaries: Public Internet → DMZ/Gateway → Internal Services → Data Stores. Only orchestrator-api is publicly accessible. Tailscale is admin-only overlay.

### 7. Hexagonal Service Architecture

Four-layer architecture per ADR-004: Presentation → Application → Domain → Infrastructure. Strict import rules. Domain has zero dependencies. Infrastructure implements Domain interfaces.

### 8. Security Observability Event Flow

Event sources → ObservabilityService → rolling counters + timing records + durable audit. Alert thresholds: denied ≥20/min, openfga_failure ≥3/min. Dependency health feeds ResilienceService.

### 9. Resilience, Break-Glass & Recovery

Break-glass procedure with follow-up checklist. Four compromise response types (platform secret, delegated token, service credential, assistant kill-switch). 8-step validated recovery order.

---

Generated: 2026-04-08
