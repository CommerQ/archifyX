#!/usr/bin/env node
/** Self-contained package smoke — no external Archify required. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = path.join(root, 'archifyX');
const required = [
  'SKILL.md',
  'package.json',
  'bin/archifyX.mjs',
  'scripts/atlas.mjs',
  'assets/platform-viewer.css',
  'assets/platform-viewer.js',
  'schemas/platform-atlas.schema.json',
  'references/module-pack.md',
  'references/delivery-contract.md',
  'references/authoring-contract.md',
  'references/brand-marks.md',
  'references/viewer-runtime.md',
  'examples/platform.atlas.json',
  'recipes/platform.mjs',
  'scripts/guide.mjs',
  'test/atlas-smoke.mjs',
  'engine/bin/archify.mjs',
  'engine/package.json',
  'engine/schemas/architecture.schema.json',
  'engine/recipes/scenarios.mjs'
];

const rootRequired = [
  '.github/workflows/ci.yml',
  'docs/index.html',
  'docs/start.html',
  'docs/guide.html',
  'docs/gallery.html',
  'docs/install.md',
  'docs/present-mode.md',
  'docs/.nojekyll',
  'docs/authoring-cookbook.md',
  'docs/COMPLETENESS.md',
  'scripts/build-docs.mjs',
  'scripts/build-gallery.mjs',
  'scripts/build-guide.mjs',
  'scripts/run-tests.mjs',
  'scripts/build-zip.mjs',
  'scripts/install-skill.mjs',
  'scripts/check-release-identity.mjs',
  'scripts/write-deterministic-zip.mjs',
  '.github/workflows/release.yml'
];

let failed = false;
for (const rel of required) {
  const abs = path.join(pkg, rel);
  if (!fs.existsSync(abs)) {
    console.error(`missing skill: ${rel}`);
    failed = true;
  }
}
for (const rel of rootRequired) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    console.error(`missing repo: ${rel}`);
    failed = true;
  }
}

const pkgJson = JSON.parse(fs.readFileSync(path.join(pkg, 'package.json'), 'utf8'));
if (pkgJson.dependencies && Object.keys(pkgJson.dependencies).length) {
  console.error('skill package must stay zero runtime dependencies');
  failed = true;
}
if (pkgJson.peerDependencies && Object.keys(pkgJson.peerDependencies).length) {
  console.error('skill package must not declare peerDependencies (self-contained)');
  failed = true;
}

const doctor = spawnSync(process.execPath, [path.join(pkg, 'bin', 'archifyX.mjs'), 'doctor'], {
  encoding: 'utf8',
  env: { ...process.env, ARCHIFY_ROOT: '' }
});
if (doctor.status !== 0) {
  console.error('doctor failed');
  process.stderr.write(doctor.stderr || '');
  process.stdout.write(doctor.stdout || '');
  failed = true;
} else {
  process.stdout.write(doctor.stdout || '');
}

const identity = spawnSync(process.execPath, [path.join(root, 'scripts', 'check-release-identity.mjs')], {
  encoding: 'utf8'
});
if (identity.status !== 0) {
  process.stderr.write(identity.stderr || '');
  process.stdout.write(identity.stdout || '');
  failed = true;
} else {
  process.stdout.write(identity.stdout || '');
}

// Pack smoke: build zip from workdir, extract, doctor.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'archifyx-smoke-'));
const zipPath = path.join(tmp, 'archifyX.zip');
const pack = spawnSync(
  process.execPath,
  [path.join(root, 'scripts', 'build-zip.mjs'), zipPath, '--workdir', '--any-node'],
  { encoding: 'utf8' }
);
if (pack.status !== 0) {
  console.error('build-zip failed');
  process.stderr.write(pack.stderr || '');
  process.stdout.write(pack.stdout || '');
  failed = true;
} else {
  process.stdout.write(pack.stdout || '');
  const extractDir = path.join(tmp, 'out');
  fs.mkdirSync(extractDir);
  const tar = spawnSync('tar', ['-xf', zipPath, '-C', extractDir], { encoding: 'utf8' });
  const skillRoot = path.join(extractDir, 'archifyX');
  if (tar.status !== 0 || !fs.existsSync(path.join(skillRoot, 'SKILL.md'))) {
    console.error('zip extract / layout failed (expected archifyX/SKILL.md)');
    process.stderr.write(tar.stderr || '');
    failed = true;
  } else {
    const packedDoctor = spawnSync(process.execPath, [path.join(skillRoot, 'bin', 'archifyX.mjs'), 'doctor'], {
      encoding: 'utf8',
      env: { ...process.env, ARCHIFY_ROOT: '' }
    });
    if (packedDoctor.status !== 0) {
      console.error('packed doctor failed');
      process.stderr.write(packedDoctor.stderr || '');
      process.stdout.write(packedDoctor.stdout || '');
      failed = true;
    } else {
      console.log('packed zip doctor OK');
    }
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

if (failed) process.exit(1);
console.log('package-smoke OK (self-contained + pack)');
