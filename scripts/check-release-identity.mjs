#!/usr/bin/env node
/**
 * Gate release packaging identity for archifyX (skill name, CLI, docs links).
 * Usage: node scripts/check-release-identity.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const skill = path.join(root, 'archifyX');
const errors = [];

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function mustInclude(file, needles, label = file) {
  const text = read(file);
  for (const n of needles) {
    if (!text.includes(n)) errors.push(`${label}: missing ${JSON.stringify(n)}`);
  }
}

function mustExist(p, label = p) {
  if (!fs.existsSync(p)) errors.push(`missing ${label}`);
}

mustExist(path.join(skill, 'SKILL.md'));
mustExist(path.join(skill, 'bin', 'archifyX.mjs'));
mustExist(path.join(skill, 'engine', 'bin', 'archify.mjs'));
mustExist(path.join(skill, 'package.json'));

const skillPkg = JSON.parse(read(path.join(skill, 'package.json')));
if (skillPkg.name !== 'archifyX') {
  errors.push(`skill package.json name must be archifyX (got ${skillPkg.name})`);
}

const rootPkg = JSON.parse(read(path.join(root, 'package.json')));
if (rootPkg.name !== 'archifyx' && rootPkg.name !== 'archifyX-repo') {
  errors.push(`root package.json name must be archifyx (got ${rootPkg.name})`);
}

mustInclude(path.join(skill, 'SKILL.md'), ['name: archifyX', 'archifyX', 'brand-marks.md'], 'SKILL.md');
mustInclude(path.join(root, 'README.md'), ['CommerQ/archifyX', 'skills add', 'compare'], 'README.md');
mustInclude(path.join(root, 'README_ZH.md'), ['CommerQ/archifyX', 'skills add'], 'README_ZH.md');
mustInclude(path.join(root, 'docs', 'start.html'), ['CommerQ/archifyX', 'skills add'], 'docs/start.html');
mustExist(path.join(root, 'docs', 'gallery', 'manifest.json'), 'docs/gallery/manifest.json');
mustExist(path.join(root, '.github', 'workflows', 'release.yml'), 'release.yml');
mustExist(path.join(skill, 'scripts', 'guide.mjs'), 'scripts/guide.mjs');
mustExist(path.join(skill, 'references', 'brand-marks.md'));
mustExist(path.join(skill, 'references', 'viewer-runtime.md'));

// Packaged skill must not advertise external Archify skill root resolution.
const cli = read(path.join(skill, 'bin', 'archifyX.mjs'));
for (const bad of ['ARCHIFY_ROOT', '~/.claude/skills/archify', '~/.cursor/skills/archify']) {
  if (cli.includes(bad)) errors.push(`bin/archifyX.mjs must not resolve external Archify via ${bad}`);
}
if (!cli.includes("cmd === 'compare'") && !cli.includes('compare')) {
  errors.push('bin/archifyX.mjs must expose compare');
}
if (!cli.includes('commandGuide') && !cli.includes('scripts/guide.mjs')) {
  errors.push('bin/archifyX.mjs must use merged guide recipes');
}

if (errors.length) {
  console.error('check-release-identity FAILED:');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log('check-release-identity OK');
