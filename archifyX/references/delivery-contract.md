# Delivery contract — Platform Atlas

Covers Platform Viewer + atlas IR. Leaf diagram delivery uses the **in-tree**
engine (`archifyX/engine/`) via this CLI — not an external install.

## Commands

| Stage | Command | Success means |
|---|---|---|
| Leaf validate | `validate-diagram <type> <json> --quality showcase --json` | Engine receipt OK |
| Leaf deliver | `deliver <type> <json> <html> --quality showcase --json` | Atomic HTML commit |
| Atlas validate | `validate <atlas.json> [--strict] --json` | Shape OK; `--strict` requires files + delivered HTML |
| Atlas build | `build-index <atlas.json> <index.html> [--strict] --json` | SPA + module pages written |
| Smoke | `doctor` / `demo <outdir>` | Self-contained package OK |

## Output layout

Paths relative to the atlas file directory:

```
<atlas-dir>/
  <name>.platform.atlas.json
  index.html
  <overview>.architecture.html
  modules/<id>/index.html
  modules/<id>/<type>.html          # stub or wrapped delivered HTML
  modules/<id>/<child>/…
```

## Stub rule

Every module node always gets all five type pages. Missing artifacts → pending stubs (never 404). Stubs do not count under `--strict`.

## SPA invariants

- Header: `#0b1220`, cyan brand dot, white title
- Rail: nested tree; A/W/S/D/L on row; no section labels; no row dots
- Stage: iframe; `?view=`; present collapses header + rail

## Non-goals

- Re-rendering SVG inside `build-index`
- Resolving an external Archify skill at runtime
- Hosted runtime / telemetry
