# Product

## Register

product

## Users

Software engineers, architects, technical leads, reviewers, and AI coding agents who need to explain a **multi-module platform**: overview → nested packs → five diagram types, without collapsing everything into one mega diagram.

## Product Purpose

**archifyX** (Archify eXtension) is an **independent** product: a Platform Viewer SPA plus an **in-tree** typed diagram engine. The **X** marks an extension of Archify’s single-map idea into multi-module atlas navigation — with a short name.

Success means a reader can navigate hierarchy quickly, deep-link with `?view=`, open honest stubs instead of 404s, and trust each delivered leaf as a validated interactive HTML map.

## Independence

- No runtime dependency on an external Archify install or skill path
- Diagram validate/deliver runs from `archifyX/engine/`
- See `NOTICE.md` for engine provenance (MIT); product shell is first-party

## Brand Personality

Precise, composed, platform-scale. Atlas navigation first; each stage page still authoritative.

## Anti-references

- Mega single diagrams for whole platforms
- Dropdown / bottom-dock module pickers as primary nav
- External peer engines required to run the CLI
- Dense dashboard shells and decorative AI chrome

## Design Principles

1. Truth before spectacle — leaf topology from authored JSON + validation.
2. Overview → nested modules → five types; stubs never 404.
3. Tree rail is the primary navigator; A/W/S/D/L on the module row.
4. Header is design-locked dark charcoal with a cyan brand dot.
5. Present mode collapses chrome; diagram owns the viewport.
6. Portable proof — static files; no required hosted runtime.
7. Self-contained — `doctor` must pass without network or sibling checkouts.

## Dependencies

- **Runtime npm (skill shell):** none
- **In-tree engine:** bundled under `archifyX/engine/` (optional engine `devDependencies` only for regenerating validators/brand-marks)
- **Node:** ≥ 18
