#!/usr/bin/env node
/**
 * Build the distributable archifyX skill ZIP (zero npm install at runtime).
 *
 * Usage:
 *   node scripts/build-zip.mjs [output.zip] [--workdir] [--any-node]
 *
 * Default: stage only git-tracked files under archifyX/.
 * --workdir: stage from the working tree (for local packaging before commit).
 * --any-node: skip Node 22 canonical-byte gate (local packs only).
 *
 * Excludes engine tests, skill tests, package-locks, and generate-* scripts.
 * Strips scripts/devDependencies from packaged package.json files.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const skillName = 'archifyX';
const skillRoot = path.join(repoRoot, skillName);

const args = process.argv.slice(2).filter((a) => a !== '--workdir' && a !== '--any-node');
const workdir = process.argv.includes('--workdir');
const out = path.resolve(args[0] || path.join(repoRoot, 'archifyX.zip'));

const EXCLUDE = [
  /^archifyX\/engine\/test(\/|$)/,
  /^archifyX\/test(\/|$)/,
  /^archifyX\/engine\/package-lock\.json$/,
  /^archifyX\/package-lock\.json$/,
  /^archifyX\/engine\/scripts\/generate-brand-marks\.mjs$/,
  /^archifyX\/engine\/scripts\/generate-validators\.mjs$/
];

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function listTracked() {
  const r = spawnSync('git', ['-C', repoRoot, 'ls-files', '-z', '--', skillName], {
    encoding: 'buffer'
  });
  if (r.status !== 0) die('git ls-files failed; commit the skill or pass --workdir');
  const raw = r.stdout.toString('utf8');
  return raw.split('\0').filter(Boolean);
}

function listWorkdir(dir, prefix = skillName) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    const rel = `${prefix}/${ent.name}`.replace(/\\/g, '/');
    if (ent.isSymbolicLink()) die(`refusing symlink: ${rel}`);
    if (ent.isDirectory()) out.push(...listWorkdir(abs, rel));
    else if (ent.isFile()) out.push(rel);
  }
  return out;
}

function shouldExclude(rel) {
  return EXCLUDE.some((re) => re.test(rel));
}

function stripPackageJson(filePath) {
  const pkg = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  delete pkg.scripts;
  delete pkg.devDependencies;
  delete pkg.peerDependencies;
  delete pkg.optionalDependencies;
  // Keep bin for CLI discovery after install.
  fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n');
}

function copyMode(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  try {
    const mode = fs.statSync(src).mode;
    fs.chmodSync(dest, mode & 0o777);
  } catch (_) {}
}

if (!fs.existsSync(skillRoot)) die(`missing skill root: ${skillRoot}`);
if (!fs.existsSync(path.join(skillRoot, 'engine', 'renderers', 'shared', 'generated-validators.mjs'))) {
  die('generated validators missing under engine/ — refuse to package');
}

const files = (workdir ? listWorkdir(skillRoot) : listTracked()).filter((rel) => !shouldExclude(rel));
if (!files.length) die('no files to package');

const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'archifyx-pack-'));
try {
  for (const rel of files) {
    const src = path.join(repoRoot, rel);
    if (!fs.existsSync(src) || !fs.statSync(src).isFile()) {
      die(`missing package input: ${rel}`);
    }
    if (fs.lstatSync(src).isSymbolicLink()) die(`refusing symlink: ${rel}`);
    copyMode(src, path.join(stage, rel));
  }

  for (const rel of [
    path.join(skillName, 'package.json'),
    path.join(skillName, 'engine', 'package.json')
  ]) {
    const p = path.join(stage, rel);
    if (fs.existsSync(p)) stripPackageJson(p);
  }

  // write-deterministic-zip prefixes entries with basename(root) → archifyX/…
  const zipSource = path.join(stage, skillName);
  if (!fs.existsSync(path.join(zipSource, 'SKILL.md'))) die('staged skill folder missing');

  const major = Number(process.versions.node.split('.')[0]);
  if (major !== 22 && !process.argv.includes('--any-node')) {
    die(`canonical archifyX.zip builds require Node 22 (current: ${process.versions.node}); pass --any-node for local packs`);
  }

  const zipHelper = path.join(repoRoot, 'scripts', 'write-deterministic-zip.mjs');
  const zip = spawnSync(process.execPath, [zipHelper, zipSource, out], {
    encoding: 'utf8'
  });
  if (zip.status !== 0) {
    process.stderr.write(zip.stderr || '');
    process.stdout.write(zip.stdout || '');
    die('write-deterministic-zip failed', zip.status ?? 1);
  }
  console.log(`built ${out}`);
  console.log(`files=${files.length} mode=${workdir ? 'workdir' : 'git-tracked'}`);
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
}
