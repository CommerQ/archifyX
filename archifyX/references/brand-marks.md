# Brand marks (archifyX)

Leaf brand catalogue and capture live in the bundled engine.

Full reference: [`../engine/references/brand-marks.md`](../engine/references/brand-marks.md)

## Quick path

```bash
node bin/archifyX.mjs brands "Claude" --json
node bin/archifyX.mjs brands capture "https://partner.example.com" --json
```

Put the returned canonical `brand` id (or digest-pinned object) on the node /
participant / state. Prefer catalogue matches; only capture when the user
supplies an official site and no catalogue entry exists.
