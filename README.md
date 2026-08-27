<p align="center">
  <strong>English</strong> · <a href="./README_ZH.md">简体中文</a>
</p>

# archifyX

**archifyX** (Archify eXtension) — short name for an independent platform atlas:
nested module tree + five diagram types + interactive HTML. Self-contained skill/CLI; no external Archify install.

- **Atlas SPA** — dark header · nested tree · iframe stage · `?view=` deep links
- **Five types** — Architecture · Workflow · Sequence · Data Flow · Lifecycle (A/W/S/D/L)
- **Stubs never 404** — planned pages still open
- **In-tree engine** — `validate` / `deliver` / themes / presets / present / export under `archifyX/engine/`
- **Name** — **X** = eXtension of Archify’s diagram idea into multi-module atlas navigation; shorter to type than `archify-platform`

![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)
![Agent Skill](https://img.shields.io/badge/Agent-Skill-7C3AED?style=flat-square)
![Version](https://img.shields.io/badge/version-0.1.0-0891b2?style=flat-square)
![Self-contained](https://img.shields.io/badge/runtime-self--contained-0ea5e9?style=flat-square)

See [NOTICE.md](NOTICE.md) · [PRODUCT.md](PRODUCT.md) · [DESIGN.md](DESIGN.md) · [ROADMAP.md](ROADMAP.md) · [Completeness](docs/COMPLETENESS.md) · [Changelog](CHANGELOG.md)

## Quick start

Node ≥ 18. **Nothing else to install** for ordinary doctor/demo/build-index.

```bash
cd archifyX
node bin/archifyX.mjs doctor
node bin/archifyX.mjs demo ../examples/demo-out
npx --yes serve ../examples/demo-out
```

Deliver a leaf, then build an atlas:

```bash
node bin/archifyX.mjs deliver architecture overview.json overview.html --quality showcase --json
node bin/archifyX.mjs validate path/to/atlas.json --json
node bin/archifyX.mjs build-index path/to/atlas.json path/to/index.html --json
```

Ask your agent: `Use archifyX to build a platform atlas for this repository.`

## Install as a skill

Full matrix: [docs/install.md](docs/install.md) · [docs/start.html](docs/start.html)

```bash
# Recommended — skills CLI
npx -y skills add CommerQ/archifyX --skill archifyX --agent cursor --global --copy --yes

# Or pack + install from this repo (Node 22 for canonical ZIP)
npm run pack:local
npm run install:skill -- --agent cursor --from archifyX.zip --force
```

Windows junction (dev):

```bat
mklink /J "%USERPROFILE%\.cursor\skills\archifyX" "D:\workspace\archifyX\archifyX"
```

## CLI

| Command | Role |
|---|---|
| `doctor` / `demo` | Health + seeded SPA |
| `validate` / `build-index` | Atlas IR → Platform Viewer |
| `deliver` / `validate-diagram` / `preview` | In-tree diagram engine |
| `compare` | Architecture base/head delta + receipt |
| `guide` / `brands` / `visual-check` | Platform+leaf recipes, brands, proof check |

## Product traits

1. Nested module tree as primary nav  
2. Design-locked dark header + cyan brand dot  
3. A/W/S/D/L on the module row; stubs never 404  
4. Present mode collapses header + rail  
5. Fully self-contained (no peer skill required)

## Layout

```
archifyX/                 # product repo
  NOTICE.md  PRODUCT.md  DESIGN.md …
  archifyX/               # skill package
    bin/archifyX.mjs
    scripts/atlas.mjs
    assets/platform-viewer.*
    schemas/platform-atlas.schema.json
    engine/                       # bundled diagram engine
    examples/  references/
```

## License

MIT. Engine provenance: see [NOTICE.md](NOTICE.md).
