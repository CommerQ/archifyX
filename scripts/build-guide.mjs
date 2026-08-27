#!/usr/bin/env node
/**
 * Generate docs/guide.html from platform + leaf recipes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const guideMod = await import(pathToFileURL(path.join(root, 'archifyX', 'scripts', 'guide.mjs')).href);
const recipes = guideMod.publicGuideData();

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]
  );
}

const rows = recipes
  .map(
    (r) => `<tr id="recipe-${esc(r.id)}">
  <td><code>${esc(r.id)}</code><br/><span class="type">${esc(r.type)}</span></td>
  <td>
    <strong data-en="${esc(r.en.title)}" data-zh="${esc(r.zh.title)}">${esc(r.en.title)}</strong>
    <div class="q">${esc(r.en.question)}</div>
    <div class="zh">${esc(r.zh.title)} — ${esc(r.zh.question)}</div>
  </td>
  <td class="prompt"><code>${esc(r.en.prompt)}</code></td>
</tr>`
  )
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>archifyX Guide</title>
  <style>
    :root { color-scheme: dark; --bg:#0b1220; --text:#f8fafc; --muted:#94a3b8; --accent:#38bdf8; --border:#243044; }
    body { margin:0; font:15px/1.55 "JetBrains Mono", ui-monospace, Segoe UI, sans-serif; background:var(--bg); color:var(--text); }
    main { max-width: 64rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
    h1 { font-size:1.4rem; } p, .zh, .q { color:var(--muted); }
    a { color:var(--accent); }
    table { border-collapse: collapse; width:100%; margin-top:1rem; font-size:.85rem; }
    th, td { border:1px solid var(--border); padding:.55rem .65rem; text-align:left; vertical-align:top; }
    th { color:var(--text); }
    .type { color:var(--accent); font-size:.75rem; }
    .prompt code { display:block; white-space:pre-wrap; color:var(--text); }
    pre { background:#020617; border:1px solid var(--border); padding:1rem; overflow:auto; border-radius:.4rem; }
  </style>
</head>
<body>
<main>
  <p><a href="./index.html">← archifyX</a></p>
  <h1>Scenario guide (${recipes.length})</h1>
  <p>Platform recipes first, then leaf types. CLI merges both:</p>
  <pre>node bin/archifyX.mjs guide "平台图谱" --json
node bin/archifyX.mjs guide "agent tool call" --json</pre>
  <table>
    <thead><tr><th>Id</th><th>Question</th><th>Copy-ready prompt</th></tr></thead>
    <tbody>
${rows}
    </tbody>
  </table>
  <p style="margin-top:1.5rem"><a href="./gallery.html">Proof Lab</a> · <a href="./authoring-cookbook.md">Cookbook</a> · <a href="./present-mode.md">Present / presets</a></p>
</main>
</body>
</html>
`;

fs.writeFileSync(path.join(root, 'docs', 'guide.html'), html);
console.log(`guide OK — ${recipes.length} recipes → docs/guide.html`);
