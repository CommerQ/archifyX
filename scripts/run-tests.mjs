#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const steps = [
  ['scripts/package-smoke.mjs'],
  ['archifyX/test/atlas-smoke.mjs']
];

for (const args of steps) {
  const script = path.join(root, args[0]);
  const r = spawnSync(process.execPath, [script], { stdio: 'inherit', cwd: root });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('run-tests OK');
