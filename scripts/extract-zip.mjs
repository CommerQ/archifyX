/**
 * Cross-platform ZIP extract (no npm deps).
 * Prefer a pure Node ZIP32 reader (matches write-deterministic-zip.mjs),
 * then fall back to unzip / tar / Expand-Archive.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';

const LOCAL_SIG = 0x04034b50;
const CENTRAL_SIG = 0x02014b50;
const END_SIG = 0x06054b50;
const STORE = 0;
const DEFLATE = 8;

function readU16(buf, offset) {
  return buf.readUInt16LE(offset);
}

function readU32(buf, offset) {
  return buf.readUInt32LE(offset);
}

/** Extract ZIP32 archives produced by scripts/write-deterministic-zip.mjs. */
export function extractZipNode(zipPath, destParent) {
  const buf = fs.readFileSync(zipPath);
  if (buf.length < 22) throw new Error('zip too small');

  let end = buf.length - 22;
  while (end >= 0 && readU32(buf, end) !== END_SIG) end -= 1;
  if (end < 0) throw new Error('zip end-of-central-directory not found');

  const entryCount = readU16(buf, end + 10);
  const centralSize = readU32(buf, end + 12);
  const centralOffset = readU32(buf, end + 16);
  if (centralOffset + centralSize > buf.length) throw new Error('zip central directory out of range');

  fs.mkdirSync(destParent, { recursive: true });
  let cursor = centralOffset;
  for (let i = 0; i < entryCount; i += 1) {
    if (readU32(buf, cursor) !== CENTRAL_SIG) throw new Error(`bad central header at ${cursor}`);
    const compression = readU16(buf, cursor + 10);
    const compressedSize = readU32(buf, cursor + 20);
    const uncompressedSize = readU32(buf, cursor + 24);
    const nameLen = readU16(buf, cursor + 28);
    const extraLen = readU16(buf, cursor + 30);
    const commentLen = readU16(buf, cursor + 32);
    const externalAttrs = readU32(buf, cursor + 38);
    const localOffset = readU32(buf, cursor + 42);
    const name = buf.subarray(cursor + 46, cursor + 46 + nameLen).toString('utf8');
    cursor += 46 + nameLen + extraLen + commentLen;

    if (!name || name.endsWith('/')) continue;
    if (name.includes('..') || path.isAbsolute(name)) {
      throw new Error(`refusing unsafe zip entry: ${name}`);
    }

    if (readU32(buf, localOffset) !== LOCAL_SIG) throw new Error(`bad local header for ${name}`);
    const localNameLen = readU16(buf, localOffset + 26);
    const localExtraLen = readU16(buf, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const compressed = buf.subarray(dataStart, dataStart + compressedSize);

    let raw;
    if (compression === STORE) raw = Buffer.from(compressed);
    else if (compression === DEFLATE) raw = inflateRawSync(compressed);
    else throw new Error(`unsupported compression ${compression} for ${name}`);

    if (raw.length !== uncompressedSize) {
      throw new Error(`size mismatch for ${name}: got ${raw.length}, expected ${uncompressedSize}`);
    }

    const outPath = path.join(destParent, name);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, raw);
    const mode = (externalAttrs >>> 16) & 0o777;
    if (mode && process.platform !== 'win32') {
      try {
        fs.chmodSync(outPath, mode);
      } catch (_) {}
    }
  }
}

function clearDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

export function extractZip(zipPath, destParent) {
  clearDir(destParent);

  let nodeMsg = '';
  try {
    extractZipNode(zipPath, destParent);
    return;
  } catch (nodeError) {
    clearDir(destParent);
    nodeMsg = nodeError.message || String(nodeError);
  }

  const errors = [`node: ${nodeMsg}`];

  const unzip = spawnSync('unzip', ['-q', '-o', zipPath, '-d', destParent], { encoding: 'utf8' });
  if (unzip.status === 0) return;
  if (unzip.error?.code !== 'ENOENT') {
    errors.push(`unzip: ${unzip.stderr || unzip.stdout || unzip.error?.message || ''}`);
  }

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
