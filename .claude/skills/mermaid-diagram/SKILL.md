---
name: mermaid-diagram
description: >
  Generate Mermaid diagram files (.mmd) for version-controlled, CI-friendly
  diagrams. Use when the user wants diagrams that live in the repo alongside
  code, render in GitHub/GitLab markdown, or are generated in a pipeline.
  Prefer eraser-diagram for presentation-quality output. Use mermaid-diagram
  for docs-as-code, README diagrams, ADR illustrations, and PR context.
  Trigger phrases: "mermaid", "diagram in the repo", "README diagram",
  "docs diagram", ".mmd file".
compatibility: Requires Mermaid Chart MCP or mermaid-js CLI
metadata:
  author: mikegtech
  version: "1.0"
allowed-tools: Bash(npx:*) Write Read
---

# Mermaid Diagram Skill

Generate `.mmd` files using Mermaid syntax. Output lives in the repo,
renders natively in GitHub markdown, and can be validated in CI.

---

## Diagram Type Selection

| Request                                | Mermaid type                             |
| -------------------------------------- | ---------------------------------------- |
| System/platform architecture           | `C4Context` or `graph TD` with subgraphs |
| Auth flows, token exchange             | `sequenceDiagram`                        |
| Authorization pipeline, decision chain | `flowchart TD`                           |
| Agent delegation, consent flows        | `sequenceDiagram`                        |
| Data models, entity relationships      | `erDiagram`                              |
| Service layers, hexagonal arch         | `graph TD` with subgraphs                |
| State machines, break-glass            | `stateDiagram-v2`                        |
| Event flows, pub/sub                   | `graph LR`                               |

---

## File Placement Convention

```
docs/diagrams/
├── 01-platform-architecture.mmd
├── 02-identity-token-flow.mmd
└── ...
```

Reference in markdown:

```markdown
![Platform Architecture](docs/diagrams/01-platform-architecture.mmd)
```

Or embed directly in ADRs using a fenced code block:

````markdown
```mermaid
graph TD
  A --> B
```
````

---

## Output Protocol

1. Write the `.mmd` file to `docs/diagrams/<n>-<slug>.mmd`
2. Show the Mermaid source inline for review
3. Offer to also generate the Eraser version for presentation use
