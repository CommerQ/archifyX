# Skill examples

Platform Atlas sample (this folder):

| File | Role |
|---|---|
| `platform.atlas.json` | Atlas IR — overview + nested modules |
| `web-app.architecture.json` | Overview leaf spec (delivered) |
| `web-app-rendered.html` | Overview leaf HTML (delivered) |

Build a runnable SPA from this atlas:

```bash
node ../bin/archifyX.mjs validate platform.atlas.json --json
node ../bin/archifyX.mjs build-index platform.atlas.json ./out/index.html --json
```

Planned module pages become stubs until you `deliver` matching HTML.

## Leaf diagram samples (five types)

Do **not** duplicate them here. Use the bundled engine examples:

`../engine/examples/`

(e.g. `agent-tool-call.workflow.json`, `cache-miss-request.sequence.json`, …)
