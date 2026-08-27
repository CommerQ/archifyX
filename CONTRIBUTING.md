# Contributing to archifyX

Thank you for helping keep large-system maps navigable and self-contained.

## Scope

This repo is **independent**. Do not add runtime resolution of external Archify
skill paths. Leaf diagram work belongs in `archifyX/engine/`; Platform
Viewer / atlas IR belong in the skill shell (`scripts/atlas.mjs`, `assets/`).

## Before writing code

- One PR → one behavior
- State what changes and what deliberately does not
- Run `node archifyX/bin/archifyX.mjs doctor` and
  `node scripts/package-smoke.mjs`

## Contracts

- Atlas schema-v1 remains valid unless a reviewed breaking change ships
- `build-index` wraps delivered HTML or writes stubs — never re-renders SVG
- Undelivered types must never 404
- Tree rail remains primary navigation
- Header stays design-locked dark charcoal with cyan brand dot
- Skill shell stays zero runtime npm dependencies

## Local setup

```bash
cd D:\workspace\archifyX
node archifyX/bin/archifyX.mjs doctor
node archifyX/bin/archifyX.mjs demo examples/demo-out
node scripts/package-smoke.mjs
```

Engine `devDependencies` are optional (regenerate validators/brand-marks only).

## License

MIT. Engine provenance: [NOTICE.md](NOTICE.md).
