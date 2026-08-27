# Quick start

Self-contained — **no external Archify install**.

```bash
cd D:\workspace\archifyX\archifyX
node bin/archifyX.mjs doctor
node bin/archifyX.mjs demo D:\workspace\archifyX\examples\demo-out
npx --yes serve D:\workspace\archifyX\examples\demo-out
```

Leaf deliver + atlas build:

```bash
node bin/archifyX.mjs deliver architecture <spec.json> <out.html> --quality showcase --json
node bin/archifyX.mjs build-index <atlas.json> <index.html> --json
```

Skill link:

```bat
mklink /J "%USERPROFILE%\.cursor\skills\archifyX" "D:\workspace\archifyX\archifyX"
```

See [SKILL.md](../archifyX/SKILL.md) and [NOTICE.md](../NOTICE.md).
