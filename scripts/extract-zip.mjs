/**
 * Cross-platform ZIP extract helper (no npm deps).
 * Linux CI: unzip. Windows: tar or Expand-Archive.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export function extractZip(zipPath, destParent) {
  fs.mkdirSync(destParent, { recursive: true });
  const errors = [];

  const unzip = spawnSync('unzip', ['-q', '-o', zipPath, '-d', destParent], { encoding: 'utf8' });
  if (unzip.status === 0) return;
  if (unzip.error?.code !== 'ENOENT') errors.push(`unzip: ${unzip.stderr || unzip.stdout || unzip.error?.message || ''}`);

  // Windows 10+ tar often understands zip; GNU tar usually does not.
  const tar = spawnSync('tar', ['-xf', zipPath, '-C', destParent], { encoding: 'utf8' });
  if (tar.status === 0) return;
  errors.push(`tar: ${tar.stderr || tar.stdout || tar.error?.message || ''}`);

  if (process.platform === 'win32') {
    const ps = spawnSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `Expand-Archive -Force -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destParent.replace(/'/g, "''")}'`
      ],
      { encoding: 'utf8' }
    );
    if (ps.status === 0) return;
    errors.push(`Expand-Archive: ${ps.stderr || ps.stdout || ''}`);
  }

  throw new Error(`failed to extract zip ${zipPath}:\n${errors.join('\n')}`);
}
