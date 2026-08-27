---
name: archifyX
description: Independent platform atlas — nested navigation first, in-tree diagram stage.
colors:
  header: "#0B1220"
  canvas: "#020617"
  mask: "#0F172A"
  ink: "#F8FAFC"
  muted: "#94A3B8"
  dim: "#475569"
  border: "#243044"
  brand-dot: "#38BDF8"
  frontend: "#22D3EE"
  backend: "#34D399"
  database: "#A78BFA"
  cloud: "#FBBF24"
  security: "#FB7185"
  messagebus: "#FB923C"
  external: "#94A3B8"
typography:
  header-brand:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Code, Segoe UI, PingFang SC, Microsoft YaHei, monospace"
    fontSize: "1.15rem"
    fontWeight: 700
  tree-title:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Code, Segoe UI, PingFang SC, Microsoft YaHei, monospace"
    fontSize: "1.02rem"
    fontWeight: 500
  type-icon:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.68rem"
    fontWeight: 700
rounded:
  control: "0.4rem"
  tree: "0.35rem"
  pill: "999px"
spacing:
  header-height: "3.65rem"
  rail-width: "18rem"
  rail-pad: "0.65rem"
components:
  platform-header:
    backgroundColor: "{colors.header}"
    textColor: "{colors.ink}"
    borderBottom: "{colors.border}"
    brandDot: "{colors.brand-dot}"
  platform-rail:
    backgroundColor: "mix(canvas, mask)"
    textColor: "{colors.ink}"
  type-icon:
    size: "1.35rem"
    activeStroke: "{colors.frontend}"
  iframe-stage:
    flex: "1 1 auto"
    minWidth: 0
    minHeight: 0
---

# Design

## Product reading

1. **Header is product chrome** — always dark charcoal (`#0B1220`), white title, cyan brand dot; must not wash out when the stage theme is light.
2. **Tree is the map index** — numbered modules, nested children, A/W/S/D/L on the row. No section captions, no decorative row dots.
3. **Stage is a delivered diagram** — truthful HTML from the in-tree engine, or an honest stub. Shell never invents topology.
4. **Present mode yields** — header + rail collapse.

## Anti-references

- Mega single diagrams for whole platforms
- Dropdown / bottom-dock module pickers as primary nav
- Light translucent headers that break brand when theme syncs
- External peer engines required to open a map
