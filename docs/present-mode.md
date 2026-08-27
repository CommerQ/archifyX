# Present mode & presets (archifyX)

## Atlas SPA

- **Present** — collapses product header + tree rail so the iframe stage dominates.
- **Theme** — dark / light chrome around the stage (does not re-author leaf SVG).
- **Preset** — Classic / Signal / Blueprint / Editorial style tokens for the shell;
  preference is persisted across diagram swaps.

## Leaf diagrams

Bundled engine artifacts also support:

- `?present=1` — Presentation Stage framing for a single map
- `meta.views` — named chapters + optional guided playback
- `meta.animation: "trace"` — finite Live/Still motion
- `meta.visual_preset` — leaf visual family (classic, signal-flow, blueprint, …)

Theme ⊥ preset: theme is light/dark; preset is composition language. Do not
conflate them when authoring or documenting.

See `archifyX/references/viewer-runtime.md` and
`archifyX/engine/references/viewer-runtime.md`.
