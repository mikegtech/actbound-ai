---
name: eraser-diagram
description: >
  Create and iterate on professional architecture and flow diagrams via the
  Eraser MCP. Use when the user wants to visualize system architecture, auth
  flows, data pipelines, service relationships, state machines, or any
  technical diagram. Trigger words: diagram, draw, visualize, map out, show
  how X works, sequence, flowchart, ER diagram, architecture.
compatibility: Requires Eraser MCP connected in Claude Code (api.eraser.io)
metadata:
  author: mikegtech
  version: "1.3.0"
allowed-tools: Eraser:generate Eraser:generateEdit Eraser:search
---

# Eraser Diagram Skill

Generate professional diagrams via the Eraser MCP. One API call, no JSON
authoring, no render loops. Output is a hosted PNG + editable Eraser file.

---

## Tool Selection

| Situation                         | Tool                                                  |
| --------------------------------- | ----------------------------------------------------- |
| New diagram                       | `Eraser:generate` with `resource: "file"`             |
| Edit existing diagram             | `Eraser:generateEdit` with `fileId` from prior result |
| Find a diagram the user mentioned | `Eraser:search` with `resource: "file"`               |

**Never** call `Eraser:generate` again to edit — always use `Eraser:generateEdit`
with the `fileId` to preserve the file and its history.

---

## Diagram Type → `diagramType` + `direction`

| Request                                      | `diagramType`                 | `direction` |
| -------------------------------------------- | ----------------------------- | ----------- |
| System/platform architecture, component map  | `cloud-architecture-diagram`  | `right`     |
| Auth flows, token exchange, PKCE, OAuth      | `sequence-diagram`            | `down`      |
| Authorization pipeline, RBAC/ABAC decision   | `flowchart-diagram`           | `down`      |
| Agent delegation, consent, multi-actor flows | `sequence-diagram`            | `down`      |
| Data models, ER, OpenFGA tuples              | `entity-relationship-diagram` | `right`     |
| Zero-trust zones, network/infra topology     | `cloud-architecture-diagram`  | `right`     |
| Hexagonal architecture, ports & adapters     | `flowchart-diagram`           | `right`     |
| Event flows, observability, pub/sub          | `flowchart-diagram`           | `right`     |
| State machines, circuit breakers, recovery   | `flowchart-diagram`           | `down`      |
| BPMN / business process                      | `bpmn-diagram`                | `right`     |

---

## Default Parameters (always apply unless user overrides)

```
colorMode:    pastel       # bold for high-contrast, outline for print
styleMode:    shadow       # plain for minimal, watercolor for informal
typeface:     mono         # clean for business, rough for whiteboard
theme:        light
background:   true
imageQuality: 2            # use 3 for final presentation exports
format:       png
```

---

## Prompt Structure

Structure the `text` parameter in three sections. For complex diagrams or
ActBound AI-specific diagrams, read `references/prompting-guide.md` first.

```
Zones:        logical boundaries / swimlanes / groups
Components:   nodes with labels, colors, ports
Connections:  A → B [label], direction, style
```

---

## Output Protocol

After every generate or edit:

1. Display the image inline using `imageUrl`
2. Link the editable file using `fileUrl`
3. Note any gaps (e.g., "trust boundary shown as labeled edge, not dashed line")
4. Offer a follow-up edit if needed

---

## Reference Files (load on demand)

| File                             | Load when...                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------ |
| `references/prompting-guide.md`  | Diagram is complex, multi-zone, or the first attempt missed the intent         |
| `references/actbound-catalog.md` | User asks for any of the 9 ActBound AI canonical diagrams                      |
| `references/style-presets.md`    | User asks for non-default style, dark mode, print export, or exec presentation |
