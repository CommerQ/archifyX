#!/usr/bin/env node
/**
 * Build committed Platform Atlas proof, guide, and Proof Lab gallery.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skill = path.join(root, 'archifyX');
const cli = path.join(skill, 'bin', 'archifyX.mjs');
const srcDir = path.join(skill, 'examples');
const outDir = path.join(root, 'examples', 'platform-atlas');

function run(script, args = []) {
  const r = spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], {
    encoding: 'utf8',
    cwd: root
  });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || '');
    process.stdout.write(r.stdout || '');
    process.exit(r.status ?? 1);
  }
  process.stdout.write(r.stdout || '');
}

function copyFile(name) {
  fs.copyFileSync(path.join(srcDir, name), path.join(outDir, name));
}

fs.mkdirSync(outDir, { recursive: true });
copyFile('platform.atlas.json');
copyFile('web-app.architecture.json');
copyFile('web-app-rendered.html');

const atlas = path.join(outDir, 'platform.atlas.json');
const index = path.join(outDir, 'index.html');
const build = spawnSync(process.execPath, [cli, 'build-index', atlas, index, '--json'], {
  encoding: 'utf8',
  cwd: outDir
});
if (build.status !== 0) {
  process.stderr.write(build.stderr || '');
  process.stdout.write(build.stdout || '');
  process.exit(build.status ?? 1);
}

run('build-guide.mjs');
run('build-gallery.mjs');

const requiredDocs = [
  'docs/index.html',
  'docs/start.html',
  'docs/guide.html',
  'docs/gallery.html',
  'docs/gallery/manifest.json',
  'docs/.nojekyll',
  'docs/install.md',
  'docs/present-mode.md',
  'docs/authoring-cookbook.md',
  'docs/authoring-cookbook.zh-CN.md',
  'docs/COMPLETENESS.md',
  'examples/architecture-delta/checkout-platform-delta.html'
];
for (const rel of requiredDocs) {
  if (!fs.existsSync(path.join(root, rel))) {
    console.error(`missing ${rel}`);
    process.exit(1);
  }
}

if (!fs.existsSync(path.join(outDir, 'modules', 'identity', 'index.html'))) {
  console.error('platform-atlas modules not generated beside index');
  process.exit(1);
}

console.log(`docs OK; platform-atlas example → ${index}`);
