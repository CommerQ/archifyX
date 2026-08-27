---
name: archifyX
description: >-
  archifyX (Archify eXtension): independent Platform Atlas skill — nested
  module tree + in-tree diagram engine + SPA viewer. Covers overview → nested
  submodules → five diagram types (architecture, workflow, sequence, dataflow,
  lifecycle). Use for multi-module platforms; undelivered types open stubs
  (never 404). Self-contained — no external Archify install required.
license: MIT
metadata:
  version: "0.1.0"
  product_repo: "D:/workspace/archifyX"
  extends: "Archify (platform atlas / multi-module navigation)"
---

# archifyX

**archifyX** = short name for an **Archify eXtension**: Platform Atlas navigation
on top of a bundled typed-diagram engine. Self-contained — no external Archify
skill install.

Create an explorable **platform atlas**: one SPA that navigates many validated
diagrams through a nested module tree.

| Layer | Location |
|---|---|
| Typed JSON → SVG HTML, themes/presets, present/export/motion, validate/deliver | **In-tree** `engine/` via `bin/archifyX.mjs deliver …` |
| Atlas IR, nested tree rail, type stubs, SPA shell, `?view=` deep links | **This package** `scripts/atlas.mjs` + `assets/platform-viewer.*` |

See root `NOTICE.md` for engine provenance. Runtime does **not** resolve any
external Archify skill path.

## Fast authoring path

1. Confirm the user needs a **platform atlas** (many modules / nested packs). For a single map only, still use this CLI’s `deliver` (bundled engine).
2. Atlas shape: read `schemas/platform-atlas.schema.json` + `examples/platform.atlas.json`. Leaf shape: read `engine/schemas/<type>.schema.json` + one matching `engine/examples/` file (field shape only).
3. Artifact first for each leaf: write candidate JSON → validate → deliver:

   ```bash
   node bin/archifyX.mjs validate-diagram <type> <candidate.json> --quality showcase --json
   node bin/archifyX.mjs deliver <type> <candidate.json> <output.html> --quality showcase --json
   ```

4. Author `<name>.platform.atlas.json` beside delivered HTML (paths relative to the atlas file).
5. Build the Platform Viewer:

   ```bash
   node bin/archifyX.mjs validate <atlas.json> --json
   node bin/archifyX.mjs build-index <atlas.json> <index.html> --json
   ```

A non-zero exit can never be described as success. `build-index --strict` requires real delivered HTML (stubs do not count).

Do not replace the tree rail with dropdowns or bottom docks.

## Platform surface (product traits)

1. **SPA shell** — fixed dark header (cyan brand dot + title + theme/preset/present/export) + **left nested tree** + **right iframe stage**
2. **Click tree → swap diagram** — no full page reload; `?view=` deep links
3. **Tree** — overview + nested modules; **A/W/S/D/L** on the same row; no section labels; no decorative row dots
4. **Stage** — full-width diagram pane; composed titles; stubs for pending types — **never 404**
5. **Present mode** — header + rail collapse
6. **Preset persistence** across iframe navigations

## Type router

| Type | Icon | Use for |
|---|---|---|
| `architecture` | A | Components, services, boundaries, infrastructure |
| `workflow` | W | Processes, approvals, tool calls, runbooks, CI/CD |
| `sequence` | S | API chains, async traces, returns |
| `dataflow` | D | Pipelines, lineage, consumers |
| `lifecycle` | L | States, retries, waiting and terminal outcomes |

Ambiguous single-diagram scenario:

```bash
node bin/archifyX.mjs guide "<scenario>" --json
```

## Nested modules

`children[]` max depth **4**, max **48** nodes. Ids unique tree-wide. Output under `modules/<seg…>/`. Overview `type` must be `architecture`.

## Mermaid / repository evidence

Read Mermaid for topology, author fresh typed JSON. Inspect repository evidence when the map must reflect real code. Atlas authorship only organizes leaves — never invents topology.

## Authoring invariants

### Platform

- Prefer many bounded packs over one mega diagram.
- Tree rail is primary navigation.
- Undelivered types still emit stub pages.
- `meta.railPosition`: `left` | `right`.
- Paths relative to the atlas file.

### Leaf diagrams

- One obvious main path; `meta.quality_profile: "showcase"` unless user asks for `standard`.
- Omit `meta.visual_preset` by default (Classic). Theme ⊥ preset.
- Omit `meta.subtitle` unless requested.
- Desktop first-screen containment; never fake pass with `overflow: hidden`.
- Preserve exact product names, protocols, API paths.

Leaf field enums / geometry: `engine/references/authoring-contract.md`.  
Pack mix / nesting: `references/module-pack.md`.  
Atlas delivery: `references/delivery-contract.md`.

## Delivery

```bash
node bin/archifyX.mjs deliver <type> <json> <html> --quality showcase --json
node bin/archifyX.mjs validate <atlas.json> --json
node bin/archifyX.mjs build-index <atlas.json> <index.html> --json
```

Optional leaf evidence:

```bash
node bin/archifyX.mjs visual-check <output.html> --json
```

## Setup

No external skill install. Verify:

```bash
node bin/archifyX.mjs doctor
node bin/archifyX.mjs demo <output-directory>
```

## Output

Return atlas path, `index.html`, page/module counts, delivered vs stubbed leaves, and leaf validation summaries. Do not claim success for a non-zero command.
