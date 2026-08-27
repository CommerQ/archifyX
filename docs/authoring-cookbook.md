# Authoring cookbook — archifyX

## Platform Atlas (multi-module)

1. Deliver overview architecture HTML with the bundled engine.
2. Author `<name>.platform.atlas.json` (`schemas/platform-atlas.schema.json`).
3. List modules + nested `children` + diagram rows (`planned` OK).
4. `validate` → `build-index` → open `index.html`.
5. Deliver leaf HTML over time; rebuild to replace stubs.

```bash
node bin/archifyX.mjs deliver architecture overview.json overview.html --quality showcase --json
node bin/archifyX.mjs validate atlas.json --json
node bin/archifyX.mjs build-index atlas.json index.html --json
```

## Single leaf diagram

```bash
node bin/archifyX.mjs validate-diagram <type> candidate.json --quality showcase --json
node bin/archifyX.mjs deliver <type> candidate.json out.html --quality showcase --json
node bin/archifyX.mjs visual-check out.html --json
```

Read `engine/schemas/<type>.schema.json` + one `engine/examples/` file for field shape.

## Architecture compare (delta)

```bash
node bin/archifyX.mjs compare architecture base.json head.json delta.html --quality showcase --json
```

Receipt is written beside the HTML (or `--receipt path`). Seed pair:
`engine/examples/checkout-platform.{base,head}.architecture.json` →
`examples/architecture-delta/`.

## Guide / brands / present

```bash
node bin/archifyX.mjs guide "平台图谱" --json
node bin/archifyX.mjs guide "agent tool call" --json
node bin/archifyX.mjs brands "Claude" --json
```

Present mode, themes, presets: [present-mode.md](./present-mode.md).
Viewer refs: `archifyX/references/viewer-runtime.md`, `brand-marks.md`.

## Recipes

- Platform: `archifyX/recipes/` (merged into `guide`)
- Leaf: `engine/recipes/` + Proof Lab `docs/gallery.html`

## Do / Don't

| Do | Don't |
|---|---|
| Nested packs, stubs never 404 | One mega diagram for the whole platform |
| Tree rail as primary nav | Dropdown / bottom dock as primary nav |
| Showcase ≤12 primary nodes per leaf | Invent topology without evidence |
| Design-locked dark header | Let light theme wash out chrome |

中文版：[authoring-cookbook.zh-CN.md](./authoring-cookbook.zh-CN.md)
