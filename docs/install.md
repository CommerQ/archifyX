# Install archifyX

Node ≥ 18. **No `npm install`** for ordinary use — the skill is zero runtime dependencies.

## A. Agent skill install (recommended)

### skills CLI (`npx skills add`)

| Agent | Global install |
|---|---|
| Cursor | `npx -y skills add CommerQ/archifyX --skill archifyX --agent cursor --global --copy --yes` |
| Claude Code | `npx -y skills add CommerQ/archifyX --skill archifyX --agent claude-code --global --copy --yes` |
| Codex | `npx -y skills add CommerQ/archifyX --skill archifyX --agent codex --global --copy --yes` |
| OpenCode | `npx -y skills add CommerQ/archifyX --skill archifyX --agent opencode --global --copy --yes` |

Project-scoped (omit `--global`):

```bash
npx -y skills add CommerQ/archifyX --skill archifyX --agent cursor --copy --yes
```

### From this repo (junction / copy)

**Cursor (Windows junction):**

```bat
mklink /J "%USERPROFILE%\.cursor\skills\archifyX" "D:\workspace\archifyX\archifyX"
```

**Cross-platform installer** (working tree or ZIP):

```bash
node scripts/install-skill.mjs --agent cursor
node scripts/install-skill.mjs --agent all --from archifyX.zip --force
```

Targets:

| Agent | Path |
|---|---|
| cursor | `~/.cursor/skills/archifyX` |
| claude | `~/.claude/skills/archifyX` |
| codex | `~/.agents/skills/archifyX` |
| opencode | `~/.config/opencode/skills/archifyX` |

## B. Release ZIP

Canonical bytes are built on **Node 22** (zlib determinism):

```bash
# CI / release
node scripts/build-zip.mjs              # → archifyX.zip (git-tracked skill files)
node scripts/check-release-identity.mjs

# Local pack on other Node majors
node scripts/build-zip.mjs --workdir --any-node
```

ZIP layout: top-level `archifyX/` (contains `SKILL.md`, `bin/`, `engine/`, …). Extract into your agent’s `skills/` directory, or:

```bash
node scripts/install-skill.mjs --agent cursor --from archifyX.zip --force
```

Excluded from ZIP: skill/engine tests, package-locks, `generate-*` scripts. `package.json` ships without `scripts` / `devDependencies`.

## C. Verify

```bash
node ~/.cursor/skills/archifyX/bin/archifyX.mjs doctor
# or from the repo:
npm run doctor
npm test
```

## D. From source without installing a skill

```bash
cd archifyX   # skill folder inside the product repo
node bin/archifyX.mjs doctor
node bin/archifyX.mjs demo ../examples/demo-out
```
