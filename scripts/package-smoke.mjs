#!/usr/bin/env node
/** Self-contained package smoke — no external Archify required. */
import fs from 'node:fs';
import path from 'node:path';
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
  'examples/platform.atlas.json',
  'recipes/platform.mjs',
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
  'docs/authoring-cookbook.md',
  'docs/COMPLETENESS.md',
  'scripts/build-docs.mjs',
  'scripts/run-tests.mjs'
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

if (failed) process.exit(1);
console.log('package-smoke OK (self-contained)');
