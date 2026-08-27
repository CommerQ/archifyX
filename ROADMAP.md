# archifyX Roadmap

Current line: `v0.1.0`.

## Shipped in 0.1

- Independent product: Platform Atlas SPA + **bundled in-tree diagram engine**
- No external Archify skill / `ARCHIFY_ROOT` required at runtime
- Atlas IR + `validate` / `build-index`; stubs never 404; nesting depth ≤ 4
- CLI: platform commands + engine `deliver` / `validate-diagram` / `preview` / …
- Design-locked dark header + cyan brand dot; tree without section labels/row dots

## Next

- Platform Proof Lab gallery
- Stricter delivered-vs-stub counts in `build-index --json`
- SPA chrome `visual-check` evidence helper
- GitHub Release attach for `archifyX.zip`

## Not planned

- Requiring an external Archify install to run
- Hosted multiplayer editor / telemetry
- Replacing the tree with dropdowns / bottom docks
- Mobile-first product surface

## Dependency policy

- Skill shell: zero runtime npm dependencies
- Diagram engine: vendored under `archifyX/engine/` (see NOTICE.md)
- Node ≥ 18
