#!/usr/bin/env node
/** Atlas IR + build-index smoke for archifyX. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(skillRoot, 'bin', 'archifyX.mjs');
const atlas = path.join(skillRoot, 'examples', 'platform.atlas.json');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'archifyx-atlas-'));

function run(args) {
  const r = spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    cwd: skillRoot
  });
  if (r.status !== 0) {
    console.error(r.stdout || '');
    console.error(r.stderr || '');
    throw new Error(`failed: archifyX ${args.join(' ')}`);
  }
  return r.stdout;
}

if (!fs.existsSync(cli)) throw new Error(`missing CLI ${cli}`);
if (!fs.existsSync(atlas)) throw new Error(`missing atlas ${atlas}`);

run(['validate', atlas, '--json']);
const out = path.join(scratch, 'index.html');
run(['build-index', atlas, out, '--json']);
if (!fs.existsSync(out)) throw new Error('build-index did not write index.html');

const html = fs.readFileSync(out, 'utf8');
if (!html.includes('platform-rail') || !html.includes('platform-frame')) {
  throw new Error('index.html missing platform shell markers');
}

console.log('atlas-smoke OK');
console.log(`scratch=${scratch}`);
