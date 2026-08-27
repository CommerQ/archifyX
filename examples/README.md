# Product examples

| Path | Role |
|---|---|
| `platform-atlas/` | Committed Platform Viewer proof (`npm run build:docs`) |
| `architecture-delta/` | Architecture compare proof (`compare` on checkout base/head) |
| `../archifyX/examples/` | Skill atlas + overview sources |
| `../archifyX/engine/examples/` | Leaf diagram samples |
| `demo-out/` | Local `demo` output (gitignored) |

```bash
npm run build:docs
npx --yes serve examples/platform-atlas
npx --yes serve docs   # Proof Lab at /gallery.html
```
