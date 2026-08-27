#!/usr/bin/env node
/**
 * Install the archifyX skill for one or more agents (no npm install).
 *
 * Usage:
 *   node scripts/install-skill.mjs [--agent cursor|claude|codex|opencode|all]
 *                                  [--from archifyX.zip|path/to/skill]
 *                                  [--force]
 *
 * Defaults: --agent cursor --from <repo>/archifyX (working tree skill)
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const skillName = 'archifyX';

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return null;
  return process.argv[i + 1] || null;
}

const agentArg = (argValue('--agent') || 'cursor').toLowerCase();
const fromArg = argValue('--from') || path.join(repoRoot, skillName);
const force = process.argv.includes('--force');

const AGENTS = {
  cursor: () => path.join(os.homedir(), '.cursor', 'skills', skillName),
  claude: () => path.join(os.homedir(), '.claude', 'skills', skillName),
  codex: () => path.join(os.homedir(), '.agents', 'skills', skillName),
  opencode: () => path.join(os.homedir(), '.config', 'opencode', 'skills', skillName)
};

function resolveAgents() {
  if (agentArg === 'all') return Object.keys(AGENTS);
  if (!AGENTS[agentArg]) die(`unknown --agent ${agentArg} (cursor|claude|codex|opencode|all)`);
  return [agentArg];
}

function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dest, ent.name);
    if (ent.isDirectory()) copyTree(s, d);
    else if (ent.isFile()) fs.copyFileSync(s, d);
  }
}

function extractZip(zipPath, destParent) {
  fs.mkdirSync(destParent, { recursive: true });
  // Prefer tar (Windows 10+ / Git / Unix). Fall back to PowerShell Expand-Archive.
  const tar = spawnSync('tar', ['-xf', zipPath, '-C', destParent], { encoding: 'utf8' });
  if (tar.status === 0) return;
  if (process.platform === 'win32') {
    const ps = spawnSync(
      'powershell',
      ['-NoProfile', '-Command', `Expand-Archive -Force -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destParent.replace(/'/g, "''")}'`],
      { encoding: 'utf8' }
    );
    if (ps.status === 0) return;
    die(`failed to extract zip:\n${tar.stderr || ''}\n${ps.stderr || ''}`);
  }
  die(`failed to extract zip (install tar): ${tar.stderr || tar.stdout || ''}`);
}

function prepareSource() {
  const from = path.resolve(fromArg);
  if (!fs.existsSync(from)) die(`--from not found: ${from}`);
  if (fs.statSync(from).isDirectory()) {
    if (!fs.existsSync(path.join(from, 'SKILL.md'))) die(`not a skill root (missing SKILL.md): ${from}`);
    return { kind: 'dir', path: from, cleanup: null };
  }
  if (!/\.zip$/i.test(from)) die(`--from must be a skill directory or .zip: ${from}`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archifyx-install-'));
  extractZip(from, tmp);
  const nested = path.join(tmp, skillName);
  const root = fs.existsSync(path.join(nested, 'SKILL.md'))
    ? nested
    : fs.existsSync(path.join(tmp, 'SKILL.md'))
      ? tmp
      : null;
  if (!root) {
    fs.rmSync(tmp, { recursive: true, force: true });
    die('zip did not contain archifyX/SKILL.md');
  }
  return { kind: 'zip', path: root, cleanup: tmp };
}

const source = prepareSource();
try {
  for (const agent of resolveAgents()) {
    const dest = AGENTS[agent]();
    if (fs.existsSync(dest)) {
      if (!force) die(`already installed at ${dest} (pass --force to replace)`);
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    copyTree(source.path, dest);
    const doctor = spawnSync(process.execPath, [path.join(dest, 'bin', 'archifyX.mjs'), 'doctor'], {
      encoding: 'utf8'
    });
    if (doctor.status !== 0) {
      process.stderr.write(doctor.stderr || '');
      process.stdout.write(doctor.stdout || '');
      die(`doctor failed after install to ${dest}`);
    }
    console.log(`[OK] ${agent}: ${dest}`);
  }
  console.log('install-skill OK (no npm install required)');
} finally {
  if (source.cleanup) fs.rmSync(source.cleanup, { recursive: true, force: true });
}
