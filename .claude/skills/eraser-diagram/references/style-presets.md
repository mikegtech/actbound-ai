# Eraser Style Presets

Load this file when the user asks for a non-default style, dark mode,
print export, executive presentation, or whiteboard aesthetic.

---

## Preset Table

| Use Case                             | `colorMode` | `styleMode` | `typeface` | `theme` | `imageQuality` |
| ------------------------------------ | ----------- | ----------- | ---------- | ------- | -------------- |
| Technical architecture (default)     | `pastel`    | `shadow`    | `mono`     | `light` | `2`            |
| Executive / stakeholder presentation | `bold`      | `shadow`    | `clean`    | `light` | `3`            |
| Whiteboard / brainstorm session      | `pastel`    | `plain`     | `rough`    | `light` | `2`            |
| Print / PDF export                   | `outline`   | `plain`     | `clean`    | `light` | `3`            |
| Dark mode dashboard or slide embed   | `bold`      | `shadow`    | `mono`     | `dark`  | `2`            |
| Minimal / clean internal doc         | `pastel`    | `plain`     | `clean`    | `light` | `2`            |

---

## Parameter Reference

### `colorMode`

- `pastel` — Soft, muted palette. Professional, easy on the eyes. **Default.**
- `bold` — High-contrast, saturated colors. Strong visual hierarchy. Good for
  presentations where diagrams will be projected or shown at a distance.
- `outline` — No fills, border-only nodes. Best for print or embedding in
  documents where background color would clash.

### `styleMode`

- `shadow` — Drop shadows on nodes. Adds depth and polish. **Default.**
- `plain` — Flat, no shadows. Cleaner for minimal aesthetics or dense diagrams
  where shadows add visual noise.
- `watercolor` — Soft painted fills. Informal, sketch-like. Use for
  brainstorming outputs or internal ideation diagrams.

### `typeface`

- `mono` — Monospace font. Technical, code-adjacent aesthetic. **Default.**
- `clean` — Sans-serif. More readable for business or non-technical audiences.
- `rough` — Hand-drawn lettering. Pairs well with `watercolor` styleMode for
  whiteboard feel.

### `theme`

- `light` — White background. **Default.**
- `dark` — Dark background. Use only when explicitly requested — most diagrams
  are embedded in light-background documents.

### `imageQuality`

- `1` — Fast, lower resolution. Use only for quick previews.
- `2` — Balanced. Good for iteration and most outputs. **Default.**
- `3` — High resolution. Use for final presentation exports, print, or any
  diagram that will be zoomed into by an audience.

---

## What Eraser Cannot Do

Know these limits before attempting workarounds:

- **Freeform annotations**: Dashed boundary lines and hand-drawn dividers
  aren't native. Express these as labeled edges with a color hint
  (e.g., "red dashed edge labeled Trust Boundary") — Eraser approximates them.
- **Pixel-perfect positioning**: Eraser's AI controls layout. You control
  zones, components, and connections — not exact x/y coordinates.
- **Custom icon URLs**: Reference icons by semantic name (e.g., "aws-secrets-manager",
  "postgresql", "redis"). External image URLs are not supported.
- **Private/self-hosted rendering**: All rendering is via Eraser's cloud.
  Output is a hosted URL, not a local file. If the user needs a local file,
  they can download the PNG from the `imageUrl`.

For use cases requiring pixel control or local file output, suggest:

- **Mermaid Chart MCP** — text-based, version-controlled, renders to SVG
- **Eraser's manual canvas editor** — at the `fileUrl` returned by the skill
