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

Same five types as a classic Archify map — use in-tree engine only:

```bash
node bin/archifyX.mjs validate-diagram <type> candidate.json --quality showcase --json
node bin/archifyX.mjs deliver <type> candidate.json out.html --quality showcase --json
```

Read `engine/schemas/<type>.schema.json` + one `engine/examples/` file for field shape.

## Recipes

- Platform-oriented: `archifyX/recipes/`
- Leaf scenarios: `engine/recipes/` + `archifyX guide "…"`

## Do / Don't

| Do | Don't |
|---|---|
| Nested packs, stubs never 404 | One mega diagram for the whole platform |
| Tree rail as primary nav | Dropdown / bottom dock as primary nav |
| Showcase ≤12 primary nodes per leaf | Invent topology without evidence |
| Design-locked dark header | Let light theme wash out chrome |

中文版：[authoring-cookbook.zh-CN.md](./authoring-cookbook.zh-CN.md)
