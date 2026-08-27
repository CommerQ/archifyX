# Viewer runtime (archifyX)

Reader chrome for **leaf** HTML artifacts is documented in the bundled engine:

[`../engine/references/viewer-runtime.md`](../engine/references/viewer-runtime.md)

## Platform Viewer (atlas SPA)

Product chrome for the multi-module atlas lives in `assets/platform-viewer.*`:

| Surface | Behavior |
|---|---|
| Header | Dark `#0b1220`, cyan brand dot, theme / preset / present / export |
| Tree rail | Nested modules; A/W/S/D/L on the row; no section labels |
| Stage | iframe; stubs never 404; `?view=` deep links |
| Present | Collapses header + rail |
| Presets | Persist across iframe navigations |

Leaf `?present=1` / named views still apply **inside** delivered diagram HTML.
Atlas present mode only yields SPA chrome — it does not rewrite leaf geometry.
