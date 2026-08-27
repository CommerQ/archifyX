# In-tree diagram engine

This directory is the **bundled diagram engine** for archifyX.
Agents and users should call the parent CLI only:

```bash
node ../bin/archifyX.mjs deliver <type> <spec.json> <out.html> --quality showcase --json
```

Do not install or link an external Archify skill. See repository root `NOTICE.md`.

Leaf schemas: `schemas/`  
Leaf authoring: `references/authoring-contract.md`  
Examples: `examples/`
