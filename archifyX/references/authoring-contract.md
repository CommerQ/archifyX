# Authoring contract — Platform Atlas IR

Leaf diagram field enums and geometry repairs: `../engine/references/authoring-contract.md`.
This file covers **atlas-only** authorship.

## Atlas document

Required: `schema_version: 1`, `kind: "platform-atlas"`, `meta.title`,
`overview` (`id`, `title`, `type: "architecture"`, `spec`, `artifact`),
`modules[]` (≥ 1).

Optional meta: `locale` (`en`|`zh-CN`), `description`, `railPosition` (`left`|`right`),
`engineRoot` (override bundled engine; rarely needed).

## Module node

Required: `id`, `title`, and (`diagrams[]` and/or `children[]`).
Optional: `summary`, `anchors[]`.
Limits: depth ≤ 4; nodes ≤ 48; ids unique.

## Diagram entry

Required: `id`, `type`, `title`, `spec`, `artifact`.
Optional: `status` (`planned`|`pending`|`delivered`).
`type` ∈ architecture | workflow | sequence | dataflow | lifecycle.

## Pack guidance

See `module-pack.md`.
