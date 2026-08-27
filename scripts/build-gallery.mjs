#!/usr/bin/env node
/**
 * Build docs/gallery Proof Lab: leaf delivers + compare delta + platform atlas link.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const skill = path.join(root, 'archifyX');
const cli = path.join(skill, 'bin', 'archifyX.mjs');
const engineEx = path.join(skill, 'engine', 'examples');
const docs = path.join(root, 'docs');
const artifacts = path.join(docs, 'gallery', 'artifacts');
const sources = path.join(docs, 'gallery', 'sources');
const pkg = JSON.parse(fs.readFileSync(path.join(skill, 'package.json'), 'utf8'));

const CASES = [
  {
    id: 'platform-atlas',
    kind: 'atlas',
    type: 'platform-atlas',
    featured: true,
    accent: '#38bdf8',
    titleEn: 'Platform Atlas SPA',
    titleZh: '平台图谱 SPA',
    descriptionEn: 'Nested module tree + overview architecture + A/W/S/D/L stubs in one SPA.',
    descriptionZh: '嵌套模块树 + 总览架构 + 行内 A/W/S/D/L 占位，组成一个 SPA。',
    href: '../examples/platform-atlas/index.html'
  },
  {
    id: 'web-app',
    type: 'architecture',
    input: 'web-app.architecture.json',
    output: 'web-app.architecture.html',
    accent: '#6ee7b7',
    titleEn: 'Three-tier Web App',
    titleZh: '三层 Web 应用',
    descriptionEn: 'Edge, auth, API, cache, persistence, and background work.',
    descriptionZh: '边缘、鉴权、API、缓存、持久化与后台任务。'
  },
  {
    id: 'deployment-ownership',
    type: 'architecture',
    input: 'production-deployment.architecture.json',
    output: 'production-deployment.architecture.html',
    accent: '#38bdf8',
    titleEn: 'Production Deployment',
    titleZh: '生产部署与归属',
    descriptionEn: 'Regions, networks, workloads, state, and boundary crossings.',
    descriptionZh: '区域、网络、工作负载、状态与跨边界机制。'
  },
  {
    id: 'agent-tool-call',
    type: 'workflow',
    input: 'agent-tool-call.workflow.json',
    output: 'agent-tool-call.workflow.html',
    accent: '#67e8f9',
    titleEn: 'Agent Tool Call',
    titleZh: '智能体工具调用',
    descriptionEn: 'Planner, approval, tools, exceptions, and observability lanes.',
    descriptionZh: '规划、审批、工具、异常与可观测泳道。'
  },
  {
    id: 'release-delivery',
    type: 'workflow',
    input: 'release-delivery.workflow.json',
    output: 'release-delivery.workflow.html',
    accent: '#34d399',
    titleEn: 'Release Delivery',
    titleZh: '研发交付流程',
    descriptionEn: 'Build, gates, approval, canary, communicate, rollback.',
    descriptionZh: '构建、门禁、审批、金丝雀、沟通与回滚。'
  },
  {
    id: 'cache-miss',
    type: 'sequence',
    input: 'cache-miss-request.sequence.json',
    output: 'cache-miss-request.sequence.html',
    accent: '#c4b5fd',
    titleEn: 'Cache Miss Request',
    titleZh: '缓存未命中请求',
    descriptionEn: 'Auth, cache fallback, persist, return traffic, tracing.',
    descriptionZh: '鉴权、缓存回退、持久化、返回流量与追踪。'
  },
  {
    id: 'async-roundtrip',
    type: 'sequence',
    input: 'async-job-roundtrip.sequence.json',
    output: 'async-job-roundtrip.sequence.html',
    accent: '#a78bfa',
    titleEn: 'Async Job Roundtrip',
    titleZh: '异步任务往返',
    descriptionEn: 'Ack, queue, worker, retry, webhook, polling fallback.',
    descriptionZh: '确认、队列、worker、重试、Webhook 与轮询回退。'
  },
  {
    id: 'product-analytics',
    type: 'dataflow',
    input: 'product-analytics.dataflow.json',
    output: 'product-analytics.dataflow.html',
    accent: '#f6c453',
    titleEn: 'Product Analytics',
    titleZh: '产品分析数据流',
    descriptionEn: 'Consent, stream, PII isolation, warehouse, consumers.',
    descriptionZh: '同意、流处理、PII 隔离、数仓与下游消费者。'
  },
  {
    id: 'event-stream',
    type: 'dataflow',
    input: 'event-stream.dataflow.json',
    output: 'event-stream.dataflow.html',
    accent: '#fbbf24',
    titleEn: 'Order Event Stream',
    titleZh: '订单事件流',
    descriptionEn: 'Producers, topics, consumers, DLQ, controlled replay.',
    descriptionZh: '生产者、Topic、消费者、死信与受控重放。'
  },
  {
    id: 'agent-run',
    type: 'lifecycle',
    input: 'agent-run.lifecycle.json',
    output: 'agent-run.lifecycle.html',
    accent: '#fb7185',
    titleEn: 'Agent Run Lifecycle',
    titleZh: '智能体运行生命周期',
    descriptionEn: 'Plan, execute, review, approve, retry, cancel, terminals.',
    descriptionZh: '规划、执行、复核、审批、重试、取消与终态。'
  },
  {
    id: 'architecture-delta',
    kind: 'compare',
    type: 'architecture',
    accent: '#f472b6',
    titleEn: 'Architecture Delta',
    titleZh: '架构差分对比',
    descriptionEn: 'Base vs head checkout platform — compare receipt beside HTML.',
    descriptionZh: 'checkout 平台 base/head 对比，HTML 旁带 receipt。',
    base: 'checkout-platform.base.architecture.json',
    head: 'checkout-platform.head.architecture.json',
    output: 'checkout-platform-delta.html'
  }
];

const TYPE_LABELS = {
  'platform-atlas': 'Platform',
  architecture: 'Architecture',
  workflow: 'Workflow',
  sequence: 'Sequence',
  dataflow: 'Data flow',
  lifecycle: 'Lifecycle'
};

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c]
  );
}

function runCli(args) {
  const r = spawnSync(process.execPath, [cli, ...args], {
    encoding: 'utf8',
    cwd: root
  });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || '');
    process.stdout.write(r.stdout || '');
    die(`cli failed: ${args.join(' ')}`, r.status ?? 1);
  }
  return r;
}

fs.mkdirSync(artifacts, { recursive: true });
fs.mkdirSync(sources, { recursive: true });

// Platform atlas card links to examples/platform-atlas (built by build-docs).
const atlasIndex = path.join(root, 'examples', 'platform-atlas', 'index.html');
if (!fs.existsSync(atlasIndex)) {
  console.warn('warn: examples/platform-atlas/index.html missing — run npm run build:docs first for the atlas card target');
}

const entries = [];

for (const item of CASES) {
  if (item.kind === 'atlas') {
    entries.push({
      id: item.id,
      type: item.type,
      titleEn: item.titleEn,
      titleZh: item.titleZh,
      descriptionEn: item.descriptionEn,
      descriptionZh: item.descriptionZh,
      accent: item.accent,
      featured: !!item.featured,
      href: item.href,
      kind: 'atlas'
    });
    continue;
  }

  if (item.kind === 'compare') {
    const base = path.join(engineEx, item.base);
    const head = path.join(engineEx, item.head);
    const out = path.join(artifacts, item.output);
    const deltaDir = path.join(root, 'examples', 'architecture-delta');
    fs.mkdirSync(deltaDir, { recursive: true });
    const committed = path.join(deltaDir, item.output);
    runCli(['compare', 'architecture', base, head, out, '--quality', 'showcase', '--json']);
    fs.copyFileSync(out, committed);
    const receiptSrc = out.replace(/\.html$/i, '.receipt.json');
    if (fs.existsSync(receiptSrc)) {
      fs.copyFileSync(receiptSrc, path.join(deltaDir, path.basename(receiptSrc)));
      fs.copyFileSync(receiptSrc, path.join(artifacts, path.basename(receiptSrc)));
    }
    fs.copyFileSync(base, path.join(sources, item.base));
    fs.copyFileSync(head, path.join(sources, item.head));
    const buf = fs.readFileSync(out);
    entries.push({
      id: item.id,
      type: item.type,
      kind: 'compare',
      titleEn: item.titleEn,
      titleZh: item.titleZh,
      descriptionEn: item.descriptionEn,
      descriptionZh: item.descriptionZh,
      accent: item.accent,
      artifact: `gallery/artifacts/${item.output}`,
      sources: [`gallery/sources/${item.base}`, `gallery/sources/${item.head}`],
      artifactSha256: sha256(buf),
      artifactBytes: buf.byteLength
    });
    continue;
  }

  const inputPath = path.join(engineEx, item.input);
  if (!fs.existsSync(inputPath)) die(`missing example: ${item.input}`);
  const out = path.join(artifacts, item.output);
  runCli(['deliver', item.type, inputPath, out, '--quality', 'showcase', '--json']);
  fs.copyFileSync(inputPath, path.join(sources, item.input));
  const buf = fs.readFileSync(out);
  const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  entries.push({
    id: item.id,
    type: item.type,
    kind: 'leaf',
    titleEn: item.titleEn,
    titleZh: item.titleZh,
    descriptionEn: item.descriptionEn,
    descriptionZh: item.descriptionZh,
    accent: item.accent,
    featured: !!item.featured,
    artifact: `gallery/artifacts/${item.output}`,
    source: `gallery/sources/${item.input}`,
    artifactSha256: sha256(buf),
    artifactBytes: buf.byteLength,
    visualPreset: source.meta?.visual_preset || 'classic',
    animation: source.meta?.animation || 'static'
  });
}

const manifest = {
  schemaVersion: 1,
  generator: 'scripts/build-gallery.mjs',
  archifyXVersion: pkg.version,
  entryCount: entries.length,
  entries
};
fs.writeFileSync(path.join(docs, 'gallery', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

const cards = entries
  .map((e, i) => {
    if (e.kind === 'atlas') {
      return `<article class="card" id="proof-${esc(e.id)}" style="--accent:${esc(e.accent)}">
  <div class="kicker">${esc(TYPE_LABELS[e.type])} · ${String(i + 1).padStart(2, '0')}</div>
  <h2>${esc(e.titleEn)} <span class="zh">/ ${esc(e.titleZh)}</span></h2>
  <p>${esc(e.descriptionEn)}</p>
  <p class="zh">${esc(e.descriptionZh)}</p>
  <a class="primary" href="${esc(e.href)}">Open atlas SPA</a>
</article>`;
    }
    const art = e.artifact;
    return `<article class="card" id="proof-${esc(e.id)}" style="--accent:${esc(e.accent)}">
  <div class="kicker">${esc(TYPE_LABELS[e.type] || e.type)} · ${String(i + 1).padStart(2, '0')}</div>
  <h2>${esc(e.titleEn)} <span class="zh">/ ${esc(e.titleZh)}</span></h2>
  <div class="preview"><iframe src="${esc(art)}?embed=1&amp;theme=dark" title="${esc(e.titleEn)}" loading="lazy"></iframe></div>
  <p>${esc(e.descriptionEn)}</p>
  <p class="zh">${esc(e.descriptionZh)}</p>
  <div class="meta">SHA ${esc((e.artifactSha256 || '').slice(0, 12))} · ${(e.artifactBytes / 1024).toFixed(1)} KB</div>
  <div class="actions">
    <a class="primary" href="${esc(art)}" target="_blank" rel="noopener">Artifact</a>
    ${e.source ? `<a href="${esc(e.source)}" target="_blank" rel="noopener">JSON</a>` : ''}
    ${e.sources ? e.sources.map((s) => `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(path.basename(s))}</a>`).join(' ') : ''}
    <a href="./start.html">Create</a>
  </div>
</article>`;
  })
  .join('\n');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="generator" content="archifyX gallery ${esc(pkg.version)}" />
  <title>archifyX Proof Lab</title>
  <style>
    :root { color-scheme: dark; --bg:#0b1220; --text:#f8fafc; --muted:#94a3b8; --accent:#38bdf8; --border:#243044; --panel:#111827; }
    body { margin:0; font:15px/1.55 "JetBrains Mono", ui-monospace, Segoe UI, sans-serif; background:var(--bg); color:var(--text); }
    main { max-width: 72rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
    h1 { font-size:1.45rem; margin:0 0 .5rem; }
    .lead, .zh, p { color:var(--muted); }
    a { color:var(--accent); }
    .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr)); gap:1rem; margin-top:1.5rem; }
    .card { border:1px solid var(--border); border-radius:.5rem; padding:1rem; background:var(--panel); border-top:3px solid var(--accent, #38bdf8); }
    .kicker { font-size:.7rem; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); }
    h2 { font-size:1rem; margin:.35rem 0 .75rem; }
    h2 .zh { font-weight:400; font-size:.85rem; color:var(--muted); }
    .preview { aspect-ratio: 16/10; border:1px solid var(--border); border-radius:.35rem; overflow:hidden; background:#020617; margin-bottom:.75rem; }
    .preview iframe { width:100%; height:100%; border:0; }
    .meta { font-size:.75rem; color:var(--muted); margin:.5rem 0; }
    .actions { display:flex; flex-wrap:wrap; gap:.65rem; }
    a.primary { color:#0b1220; background:var(--accent); padding:.25rem .55rem; border-radius:.3rem; text-decoration:none; font-weight:600; }
  </style>
</head>
<body>
<main>
  <p><a href="./index.html">← archifyX</a></p>
  <h1>Proof Lab</h1>
  <p class="lead">${entries.length} proofs — platform atlas, five leaf types, architecture compare. Rebuild: <code>npm run build:gallery</code></p>
  <div class="grid">
${cards}
  </div>
  <p style="margin-top:2rem"><a href="./guide.html">Guide</a> · <a href="./gallery/manifest.json">manifest.json</a> · <a href="./authoring-cookbook.md">Cookbook</a></p>
</main>
</body>
</html>
`;

fs.writeFileSync(path.join(docs, 'gallery.html'), html);
console.log(`gallery OK — ${entries.length} entries → docs/gallery.html`);
