# ActBound AI — Eraser Diagram Index (v2)

Generated via eraser-diagram skill v1.3.0 with defaults: `pastel` / `shadow` / `mono` / `light` / quality `2`.

| #   | Title                                  | Type                | Eraser File                                                  | Image                                                                                                                                                             |
| --- | -------------------------------------- | ------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Platform System Architecture           | cloud-architecture  | [Open](https://app.eraser.io/workspace/gFxaO7ccmERGo8QivSBa) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3A7863f438322c52677dda485a424979c2c211d197597633ef2abf2e57424be8a8.png) |
| 2   | Identity & Token Flow                  | sequence-diagram    | [Open](https://app.eraser.io/workspace/Id9NtFh2isnW55oOqi12) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3A5ac9f473d8c4631735741559ba1173b762acb9696f6467f8f4dd52c6fa7c4e43.png) |
| 3   | Authorization Decision Pipeline        | flowchart           | [Open](https://app.eraser.io/workspace/WYi8SFORxiv7aTud5LgI) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Abc9377ff6f1443d71badbe5151c287c5fc25421a3cfdf8e18acc55ab517171a6.png) |
| 4   | Agent Delegation & Consent Flow        | sequence-diagram    | [Open](https://app.eraser.io/workspace/vHQ5NE16Pd00jmyKoB8r) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Abe39a18995e2754b312abff4508377e5e5e95065a132c0cfe41b16904ef18146.png) |
| 5   | OpenFGA Principal & Relationship Model | entity-relationship | [Open](https://app.eraser.io/workspace/nfzImAL7aMNSATbUNSpi) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Aed68d1275254f7031583bfae6e387ccf0a56838626f41968d97ec66c87ff21ec.png) |
| 6   | Infrastructure Security Topology       | cloud-architecture  | [Open](https://app.eraser.io/workspace/5N9WFBTqwkPA1lyGDnIT) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3A32cfad307060a542737e9c456272875498434c30240267a5786772b3650e7a12.png) |
| 7   | Hexagonal Service Architecture         | flowchart           | [Open](https://app.eraser.io/workspace/62RTg74dneER30aD4PxR) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Abdd53e0b67e4b66bbe770992dd8f94d6cbc45fad956808db7c382a8906d75a1d.png) |
| 8   | Security Observability Event Flow      | flowchart           | [Open](https://app.eraser.io/workspace/og6nmnj0L2IrgXxyOOw5) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3A0eed45a57bfb47dc0eaedaafe821e29adcfa13809885719c8fdb38d23cb5a27e.png) |
| 9   | Resilience, Break-Glass & Recovery     | flowchart           | [Open](https://app.eraser.io/workspace/IK8lWS1m4oi8546vxMLO) | [PNG](https://storage.googleapis.com/second-petal-295822.appspot.com/elements/autoDiagram%3Aa1ac4432b4159acac31856edbf6a63fe00c7a055b03197e19e533290cc487e3a.png) |

## File IDs (for Eraser:generateEdit)

| #   | fileId                 |
| --- | ---------------------- |
| 1   | `gFxaO7ccmERGo8QivSBa` |
| 2   | `Id9NtFh2isnW55oOqi12` |
| 3   | `WYi8SFORxiv7aTud5LgI` |
| 4   | `vHQ5NE16Pd00jmyKoB8r` |
| 5   | `nfzImAL7aMNSATbUNSpi` |
| 6   | `5N9WFBTqwkPA1lyGDnIT` |
| 7   | `62RTg74dneER30aD4PxR` |
| 8   | `og6nmnj0L2IrgXxyOOw5` |
| 9   | `IK8lWS1m4oi8546vxMLO` |

## Diagram Descriptions

### 1. Platform System Architecture

Foundation diagram — all components and trust boundaries. React SPA → orchestrator-api (only public service) → internal services → data stores. External: Auth0, AWS Secrets Manager, Token Vault. Trust boundary highlighted in red.

### 2. Identity & Token Flow

Sequence diagram — three token types: User PKCE login via Auth0, M2M cache-first token broker (Redis), and delegated access via Token Vault. Shows cache hit/miss alt paths. JWT custom claims in `https://actbound.ai/` namespace.

### 3. Authorization Decision Pipeline

Flowchart — RBAC → ABAC → OpenFGA fail-closed chain. Each stage can DENY independently. 25 permissions across 20 resource types. No fail-open path (ADR-021, ADR-040). Color-coded pass/deny paths.

### 4. Agent Delegation & Consent Flow

Sequence diagram — User delegates to agent, orchestrator checks consent scope, then parallel OpenFGA checks (executor, delegator, viewer relations). Intersection rule: all three required. Includes tool/secret boundary validation.

### 5. OpenFGA Principal & Relationship Model

ER diagram — 5 types: user, agent, organization, resource, agent_action. Key: `can_execute = executor AND delegator` intersection rule. Shows all relations and cardinalities.

### 6. Infrastructure Security Topology

Cloud architecture — 4 trust zones: Public Internet → Public Subnet/DMZ → Private Subnet → Data Subnet. ALB terminates TLS. NAT Gateway for egress. VPC endpoints for Secrets Manager. No direct public → data path.

### 7. Hexagonal Service Architecture

Flowchart — ports and adapters pattern per ADR-004. Inbound ports → Domain Core (9 services + types + interfaces) → Outbound ports ← Adapters (Drizzle, Auth0, OpenFGA with circuit breaker, Redis). Cross-cutting: ResilienceService monitors adapter health.

### 8. Security Observability Event Flow

Flowchart — 5 event sources → ObservabilityService (emit, increment, timing) → rolling counters + timing records + durable PostgreSQL audit. Alert thresholds: denied ≥20/min, openfga_failure ≥3/min = CRITICAL. Dependency health feeds ResilienceService.

### 9. Resilience, Break-Glass & Recovery

Flowchart — 6 platform states (OPERATIONAL → DEGRADED → CRITICAL → BREAK-GLASS-ACTIVE → RECOVERING → RESTORED). 4 compromise response types. 8-step validated recovery order: Infrastructure → Database → Identity → Secrets → OpenFGA → Services → Sync → Assistants.

---

Generated: 2026-04-08 | Skill: eraser-diagram v1.3.0 | Style: pastel/shadow/mono/light
