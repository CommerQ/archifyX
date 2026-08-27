#!/usr/bin/env node
/**
 * archifyX — validate + build navigation index.
 *
 * Usage:
 *   node scripts/atlas.mjs validate <atlas.json> [--json] [--strict]
 *   node scripts/atlas.mjs build-index <atlas.json> [index.html] [--json] [--strict]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const schemaPath = path.join(skillRoot, 'schemas', 'platform-atlas.schema.json');

const DIAGRAM_TYPES = new Set([
  'architecture',
  'workflow',
  'sequence',
  'dataflow',
  'lifecycle'
]);

function fail(message, code = 1, extra = {}) {
  const payload = { ok: false, error: message, ...extra };
  if (extra.json) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.error(message);
  }
  process.exit(code);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveBeside(atlasPath, relativePath) {
  return path.resolve(path.dirname(atlasPath), relativePath);
}

const MAX_MODULE_DEPTH = 4;
const MAX_MODULE_NODES = 48;

function walkModuleTree(modules, { parentSegments = [], depth = 0 } = {}) {
  const nodes = [];
  (modules || []).forEach((mod, index) => {
    if (!mod) return;
    const segments = [...parentSegments, mod.id];
    nodes.push({
      mod,
      id: mod.id,
      title: mod.title,
      segments,
      depth,
      index,
      parentId: parentSegments.length ? parentSegments[parentSegments.length - 1] : null,
      hasChildren: Array.isArray(mod.children) && mod.children.length > 0,
      hasDiagrams: Array.isArray(mod.diagrams) && mod.diagrams.length > 0
    });
    if (Array.isArray(mod.children) && mod.children.length) {
      nodes.push(
        ...walkModuleTree(mod.children, {
          parentSegments: segments,
          depth: depth + 1
        })
      );
    }
  });
  return nodes;
}

function findModuleNode(atlas, moduleId) {
  if (!moduleId) return null;
  return walkModuleTree(atlas.modules).find((n) => n.id === moduleId) || null;
}

function moduleDirFor(atlasPath, segments) {
  return path.join(path.dirname(atlasPath), 'modules', ...segments);
}

function ancestorIds(segments) {
  if (!segments || segments.length < 2) return [];
  return segments.slice(0, -1);
}

function validateModuleNode(mod, pathLabel, moduleIds, diagramIds, depth, errors) {
  if (depth > MAX_MODULE_DEPTH) {
    errors.push(`${pathLabel} exceeds max depth ${MAX_MODULE_DEPTH}`);
    return;
  }
  if (!mod?.id) errors.push(`${pathLabel}.id is required`);
  else if (moduleIds.has(mod.id)) errors.push(`duplicate module id "${mod.id}"`);
  else moduleIds.add(mod.id);
  if (!mod?.title) errors.push(`${pathLabel}.title is required`);

  const diagrams = Array.isArray(mod?.diagrams) ? mod.diagrams : [];
  const children = Array.isArray(mod?.children) ? mod.children : [];
  if (diagrams.length < 1 && children.length < 1) {
    errors.push(`${pathLabel} must have diagrams and/or children`);
  }

  diagrams.forEach((d, j) => {
    if (!d?.id) errors.push(`${pathLabel}.diagrams[${j}].id is required`);
    else if (diagramIds.has(d.id)) errors.push(`duplicate diagram id "${d.id}"`);
    else diagramIds.add(d.id);
    if (!DIAGRAM_TYPES.has(d?.type)) {
      errors.push(`${pathLabel}.diagrams[${j}].type invalid: ${d?.type}`);
    }
    for (const key of ['title', 'spec', 'artifact']) {
      if (!d?.[key]) errors.push(`${pathLabel}.diagrams[${j}].${key} is required`);
    }
  });

  children.forEach((child, k) => {
    validateModuleNode(child, `${pathLabel}.children[${k}]`, moduleIds, diagramIds, depth + 1, errors);
  });
}

function validateShape(atlas) {
  const errors = [];
  if (atlas.schema_version !== 1) errors.push('schema_version must be 1');
  if (atlas.kind !== 'platform-atlas') errors.push('kind must be "platform-atlas"');
  if (!atlas.meta?.title) errors.push('meta.title is required');
  if (!atlas.overview) errors.push('overview is required');
  else {
    if (atlas.overview.type !== 'architecture') {
      errors.push('overview.type must be "architecture"');
    }
    for (const key of ['id', 'title', 'spec', 'artifact']) {
      if (!atlas.overview[key]) errors.push(`overview.${key} is required`);
    }
  }
  if (!Array.isArray(atlas.modules) || atlas.modules.length < 1) {
    errors.push('modules must contain at least one module');
  }

  const moduleIds = new Set();
  const diagramIds = new Set();
  (atlas.modules || []).forEach((mod, i) => {
    validateModuleNode(mod, `modules[${i}]`, moduleIds, diagramIds, 1, errors);
  });
  if (moduleIds.size > MAX_MODULE_NODES) {
    errors.push(`modules tree exceeds max nodes ${MAX_MODULE_NODES}`);
  }
  return errors;
}

function collectPaths(atlas, atlasPath) {
  const entries = [];
  entries.push({
    kind: 'overview',
    id: atlas.overview.id,
    type: atlas.overview.type,
    title: atlas.overview.title,
    spec: resolveBeside(atlasPath, atlas.overview.spec),
    artifact: resolveBeside(atlasPath, atlas.overview.artifact),
    relSpec: atlas.overview.spec,
    relArtifact: atlas.overview.artifact
  });
  for (const node of walkModuleTree(atlas.modules)) {
    for (const d of node.mod.diagrams || []) {
      entries.push({
        kind: 'module-diagram',
        moduleId: node.id,
        moduleTitle: node.title,
        modulePath: node.segments.join('/'),
        id: d.id,
        type: d.type,
        title: d.title,
        status: d.status || 'planned',
        spec: resolveBeside(atlasPath, d.spec),
        artifact: resolveBeside(atlasPath, d.artifact),
        relSpec: d.spec,
        relArtifact: d.artifact
      });
    }
  }
  return entries;
}

function pathStatus(filePath) {
  return fs.existsSync(filePath) ? 'present' : 'missing';
}

function validateAtlas(atlasPath, { strict = false } = {}) {
  const atlas = readJson(atlasPath);
  const shapeErrors = validateShape(atlas);
  const entries = shapeErrors.length ? [] : collectPaths(atlas, atlasPath);
  const pathReports = entries.map((e) => ({
    id: e.id,
    kind: e.kind,
    type: e.type,
    title: e.title,
    moduleId: e.moduleId || null,
    status: e.status || null,
    spec: e.relSpec,
    artifact: e.relArtifact,
    specStatus: pathStatus(e.spec),
    artifactStatus: pathStatus(e.artifact)
  }));

  const missingArtifacts = pathReports.filter((p) => p.artifactStatus === 'missing');
  const missingSpecs = pathReports.filter((p) => p.specStatus === 'missing');
  const errors = [...shapeErrors];
  if (strict) {
    for (const m of missingSpecs) errors.push(`missing spec: ${m.spec} (${m.id})`);
    for (const m of missingArtifacts) errors.push(`missing artifact: ${m.artifact} (${m.id})`);
  }

  return {
    ok: errors.length === 0,
    command: 'validate',
    atlas: atlasPath,
    title: atlas.meta?.title,
    moduleCount: walkModuleTree(atlas.modules || []).length,
    diagramCount: pathReports.length,
    errors,
    paths: pathReports,
    missingArtifacts: missingArtifacts.map((m) => m.artifact),
    missingSpecs: missingSpecs.map((m) => m.spec)
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function typeLabel(type, locale) {
  const zh = {
    architecture: 'Architecture 架构',
    workflow: 'Workflow 流程',
    sequence: 'Sequence 时序',
    dataflow: 'Data Flow 数据流',
    lifecycle: 'Lifecycle 生命周期'
  };
  const en = {
    architecture: 'Architecture',
    workflow: 'Workflow',
    sequence: 'Sequence',
    dataflow: 'Data Flow',
    lifecycle: 'Lifecycle'
  };
  return (locale === 'zh-CN' ? zh : en)[type] || type;
}

/** Primary diagram heading shown in the pane header, e.g. 运行时架构图 / 安全与会话时序图 */
function diagramHeading(base, type, isZh) {
  const stem = String(base || '').replace(/(架构|时序|生命周期|数据流|工作流|流程)?图$/u, '').trim();
  const nounsZh = {
    architecture: '架构图',
    sequence: '时序图',
    lifecycle: '生命周期图',
    dataflow: '数据流图',
    workflow: '工作流图'
  };
  const nounsEn = {
    architecture: ' Architecture',
    sequence: ' Sequence',
    lifecycle: ' Lifecycle',
    dataflow: ' Data Flow',
    workflow: ' Workflow'
  };
  const noun = (isZh ? nounsZh : nounsEn)[type] || '';
  if (!stem) return isZh ? noun || '图表' : (noun || 'Diagram').trim();
  return isZh ? `${stem}${noun}` : `${stem}${noun}`;
}

const TYPE_META = {
  architecture: {
    en: {
      focus: 'Components, services, storage, boundaries',
      fields: 'Scope, core components, primary path'
    },
    zh: {
      focus: '组件、服务、存储、边界',
      fields: '范围、核心组件、主路径'
    }
  },
  workflow: {
    en: {
      focus: 'CI/CD, approvals, tool calls, runbooks',
      fields: 'Participants, order, branches, exceptions'
    },
    zh: {
      focus: 'CI/CD、审批、工具调用、Runbook',
      fields: '参与方、顺序、分支、异常'
    }
  },
  sequence: {
    en: {
      focus: 'API calls, cache fallback, auth, async traces',
      fields: 'Callers, callees, returns, timing'
    },
    zh: {
      focus: 'API 调用、缓存回退、鉴权、异步追踪',
      fields: '调用方、被调方、返回、时序'
    }
  },
  dataflow: {
    en: {
      focus: 'Pipelines, lineage, PII, consumers',
      fields: 'Sources, transforms, stores, boundaries'
    },
    zh: {
      focus: '管道、血缘、PII、消费者',
      fields: '来源、变换、落库、边界'
    }
  },
  lifecycle: {
    en: {
      focus: 'States, retries, waits, terminal outcomes',
      fields: 'States, events, retry and cancellation paths'
    },
    zh: {
      focus: '状态、重试、等待、终态',
      fields: '状态、事件、重试与取消路径'
    }
  }
};

const TYPE_ORDER = ['architecture', 'workflow', 'sequence', 'dataflow', 'lifecycle'];

const TYPE_ICON = {
  architecture: 'A',
  workflow: 'W',
  sequence: 'S',
  dataflow: 'D',
  lifecycle: 'L'
};

const TYPE_ACCENT = {
  architecture: 'backend',
  workflow: 'cloud',
  sequence: 'frontend',
  dataflow: 'database',
  lifecycle: 'security'
};

const MODULE_ACCENT = {
  'security-session': 'security',
  mopai: 'external',
  collection: 'backend',
  'realtime-push': 'messagebus',
  'jobs-storage': 'database'
};

function loadOverviewViews(atlas, atlasPath) {
  try {
    const specAbs = resolveBeside(atlasPath, atlas.overview.spec);
    if (!fs.existsSync(specAbs)) return [];
    const spec = readJson(specAbs);
    return Array.isArray(spec?.meta?.views) ? spec.meta.views : [];
  } catch {
    return [];
  }
}

function modulesForView(atlas, view) {
  const focus = new Set(view.focus || []);
  return walkModuleTree(atlas.modules)
    .map((node) => {
      const hits = (node.mod.anchors || []).filter((a) => focus.has(a)).length;
      return { mod: node.mod, hits, node };
    })
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .map((x) => x.mod);
}

function sharedCss() {
  return `
    :root, [data-theme="dark"] {
      --bg: #020617;
      --grid: #1e293b;
      --text: #ffffff;
      --text-muted: #94a3b8;
      --text-dim: #475569;
      --text-faint: #7d8da1;
      --panel: rgba(15, 23, 42, 0.72);
      --panel-border: #1e293b;
      --toolbar-bg: rgba(15, 23, 42, 0.88);
      --toolbar-border: #334155;
      --toolbar-text: #e2e8f0;
      --toolbar-hover: rgba(30, 41, 59, 0.95);
      --ok: #34d399;
      --warn: #fbbf24;
      --bad: #fb7185;
      --frontend: #22d3ee;
      --backend: #34d399;
      --database: #a78bfa;
      --cloud: #fbbf24;
      --security: #fb7185;
      --messagebus: #fb923c;
      --external: #94a3b8;
    }
    [data-theme="light"] {
      --bg: #f8fafc;
      --grid: #e2e8f0;
      --text: #0f172a;
      --text-muted: #64748b;
      --text-dim: #94a3b8;
      --text-faint: #64748b;
      --panel: #ffffff;
      --panel-border: #e2e8f0;
      --toolbar-bg: rgba(255,255,255,0.92);
      --toolbar-border: #cbd5e1;
      --toolbar-text: #0f172a;
      --toolbar-hover: #f1f5f9;
      --ok: #059669;
      --warn: #d97706;
      --bad: #e11d48;
      --frontend: #0891b2;
      --backend: #059669;
      --database: #7c3aed;
      --cloud: #d97706;
      --security: #e11d48;
      --messagebus: #ea580c;
      --external: #64748b;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 100%; }
    body {
      font: 14px/1.5 "JetBrains Mono", ui-monospace, "Cascadia Code", "Segoe UI", "PingFang SC", "Microsoft YaHei", monospace;
      color: var(--text);
      background-color: var(--bg);
      background-image:
        linear-gradient(var(--grid) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 24px 24px;
      background-position: -1px -1px;
    }
    .toolbar {
      position: sticky; top: 0; z-index: 40;
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 10px 18px;
      background: var(--toolbar-bg);
      border-bottom: 1px solid var(--toolbar-border);
      backdrop-filter: blur(10px);
    }
    .toolbar-brand { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .toolbar-brand strong { font-size: 13px; letter-spacing: .04em; }
    .toolbar-brand span { color: var(--text-muted); font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .toolbar-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .tb-btn {
      appearance: none; border: 1px solid var(--toolbar-border);
      background: transparent; color: var(--toolbar-text);
      padding: 6px 10px; border-radius: 8px; cursor: pointer;
      font: inherit; font-size: 12px; text-decoration: none;
    }
    .tb-btn:hover, .tb-btn:focus-visible { background: var(--toolbar-hover); outline: none; }
    .tb-btn.primary { border-color: var(--backend); color: var(--backend); }
    main { max-width: 1180px; margin: 0 auto; padding: 18px 18px 56px; }
    h1 { margin: 0 0 6px; font-size: 22px; letter-spacing: .02em; }
    h2 { margin: 0 0 8px; font-size: 13px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; }
    h3 { margin: 0 0 6px; font-size: 15px; }
    .lead { color: var(--text-muted); margin: 0 0 16px; max-width: 72ch; }
    .crumb { color: var(--text-muted); font-size: 12px; margin-bottom: 12px; }
    .crumb a { color: var(--frontend); text-decoration: none; }
    .guided {
      display: flex; flex-wrap: wrap; gap: 8px; align-items: stretch;
      padding: 12px 14px; margin-bottom: 14px;
      background: var(--panel); border: 1px solid var(--panel-border); border-radius: 12px;
    }
    .guided-label {
      display: flex; flex-direction: column; justify-content: center;
      min-width: 110px; padding-right: 8px; border-right: 1px solid var(--panel-border);
    }
    .guided-label strong { font-size: 12px; }
    .guided-label span { color: var(--text-faint); font-size: 11px; }
    .guided-stop {
      flex: 1 1 160px; text-align: left; text-decoration: none; color: inherit;
      border: 1px solid var(--panel-border); background: rgba(2,6,23,.35);
      border-radius: 10px; padding: 10px 12px; cursor: pointer;
      transition: border-color .15s, transform .15s;
    }
    [data-theme="light"] .guided-stop { background: #f8fafc; }
    .guided-stop:hover { border-color: var(--backend); transform: translateY(-1px); }
    .guided-stop .idx { color: var(--backend); font-weight: 700; font-size: 11px; letter-spacing: .08em; }
    .guided-stop .ttl { display: block; margin-top: 4px; font-weight: 600; }
    .guided-stop .note { display: block; margin-top: 4px; color: var(--text-muted); font-size: 11px; }
    .stage {
      background: var(--panel); border: 1px solid var(--panel-border);
      border-radius: 14px; overflow: hidden; margin-bottom: 18px;
      box-shadow: 0 20px 50px rgba(0,0,0,.35);
    }
    .stage-head {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      padding: 12px 14px; border-bottom: 1px solid var(--panel-border);
    }
    .stage-head p { margin: 0; color: var(--text-muted); font-size: 12px; }
    .stage-frame {
      position: relative; width: 100%; height: min(68vh, 640px);
      background: #020617;
    }
    .stage-frame iframe {
      position: absolute; inset: 0; width: 100%; height: 100%;
      border: 0; background: #020617;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
    }
    .type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }
    a.card, .type-card {
      display: block; text-decoration: none; color: inherit;
      background: var(--panel); border: 1px solid var(--panel-border);
      border-left-width: 3px; border-radius: 12px; padding: 14px 14px 12px;
      transition: border-color .15s, transform .15s, box-shadow .15s;
    }
    a.card:hover, .type-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(0,0,0,.28);
    }
    .accent-frontend { border-left-color: var(--frontend); }
    .accent-backend { border-left-color: var(--backend); }
    .accent-database { border-left-color: var(--database); }
    .accent-cloud { border-left-color: var(--cloud); }
    .accent-security { border-left-color: var(--security); }
    .accent-messagebus { border-left-color: var(--messagebus); }
    .accent-external { border-left-color: var(--external); }
    a.card:hover.accent-frontend, .type-card.accent-frontend:hover { border-color: var(--frontend); }
    a.card:hover.accent-backend, .type-card.accent-backend:hover { border-color: var(--backend); }
    a.card:hover.accent-database, .type-card.accent-database:hover { border-color: var(--database); }
    a.card:hover.accent-cloud, .type-card.accent-cloud:hover { border-color: var(--cloud); }
    a.card:hover.accent-security, .type-card.accent-security:hover { border-color: var(--security); }
    a.card:hover.accent-messagebus, .type-card.accent-messagebus:hover { border-color: var(--messagebus); }
    a.card:hover.accent-external, .type-card.accent-external:hover { border-color: var(--external); }
    .summary { color: var(--text-muted); margin: 0 0 8px; font-size: 12px; }
    .meta-line { color: var(--text-faint); font-size: 11px; margin: 0 0 4px; }
    .chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0 6px; }
    .chip {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 2px 8px; border-radius: 999px;
      border: 1px solid var(--panel-border); color: var(--text-muted); font-size: 11px;
    }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text-dim); }
    .dot.on { background: var(--ok); box-shadow: 0 0 8px rgba(52,211,153,.55); }
    .pill {
      display: inline-block; padding: 2px 8px; border-radius: 999px;
      border: 1px solid currentColor; font-size: 11px; font-weight: 700; opacity: .95;
    }
    .pill.frontend { color: var(--frontend); }
    .pill.backend { color: var(--backend); }
    .pill.database { color: var(--database); }
    .pill.cloud { color: var(--cloud); }
    .pill.security { color: var(--security); }
    .status { font-size: 11px; font-weight: 700; margin-top: 6px; }
    .status-delivered { color: var(--ok); }
    .status-draft { color: var(--warn); }
    .status-planned { color: var(--text-muted); }
    .status-missing { color: var(--bad); }
    .btn {
      display: inline-block; margin-top: 10px; padding: 8px 12px; border-radius: 8px;
      background: transparent; color: var(--backend); border: 1px solid var(--backend);
      text-decoration: none; font-weight: 600; font-size: 12px;
    }
    .btn:hover { background: rgba(52,211,153,.12); }
    .btn.disabled {
      color: var(--text-dim); border-color: var(--panel-border);
      pointer-events: none;
    }
    .legend {
      display: flex; flex-wrap: wrap; gap: 10px 14px;
      margin: 8px 0 18px; color: var(--text-muted); font-size: 11px;
    }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .swatch { width: 10px; height: 10px; border-radius: 2px; border: 1px solid currentColor; }
    footer { margin-top: 22px; color: var(--text-dim); font-size: 11px; }
    @media (max-width: 720px) {
      .stage-frame { height: 52vh; }
      .guided-label { border-right: 0; border-bottom: 1px solid var(--panel-border); padding: 0 0 8px; width: 100%; }
    }
  `;
}

function themeBootScript() {
  return `<script>
(function () {
  try {
    var theme = null;
    try {
      var param = new URLSearchParams(window.location.search).get('theme');
      if (param === 'light' || param === 'dark') theme = param;
    } catch (_) {}
    if (!theme) {
      try { theme = localStorage.getItem('archify-theme'); } catch (_) {}
    }
    if (theme !== 'light' && theme !== 'dark') {
      theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
  } catch (_) {}
})();
</script>`;
}

function themeToggleScript() {
  return `<script>
(function () {
  var btn = document.getElementById('btn-theme');
  if (!btn) return;
  function sync() {
    var t = document.documentElement.getAttribute('data-theme') || 'dark';
    btn.textContent = t === 'dark' ? 'Dark' : 'Light';
  }
  sync();
  btn.addEventListener('click', function () {
    var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('archify-theme', next); } catch (_) {}
    sync();
    document.querySelectorAll('iframe.archify-stage').forEach(function (frame) {
      try {
        var u = new URL(frame.src, window.location.href);
        u.searchParams.set('theme', next);
        frame.src = u.toString();
      } catch (_) {}
    });
  });
})();
</script>`;
}

function pageShell({ locale, title, toolbarHtml, bodyHtml }) {
  return `<!doctype html>
<html lang="${escapeHtml(locale)}" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="generator" content="archifyX atlas" />
  <title>${escapeHtml(title)}</title>
  ${themeBootScript()}
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet" media="print" onload="this.media='all'">
  <style>${sharedCss()}</style>
</head>
<body>
  ${toolbarHtml || ''}
  <main>
    ${bodyHtml}
    <footer>archifyX · multi-json / multi-page · ${escapeHtml(new Date().toISOString())}</footer>
  </main>
  ${themeToggleScript()}
</body>
</html>`;
}

function toolbarHtml({ brand, subtitle, actions = [] }) {
  const links = actions
    .map((a) => {
      if (a.kind === 'button') {
        return `<button class="tb-btn" type="button" id="${escapeHtml(a.id)}">${escapeHtml(a.label)}</button>`;
      }
      return `<a class="tb-btn${a.primary ? ' primary' : ''}" href="${escapeHtml(a.href)}">${escapeHtml(a.label)}</a>`;
    })
    .join('');
  return `<header class="toolbar">
    <div class="toolbar-brand">
      <strong>${escapeHtml(brand)}</strong>
      <span>${escapeHtml(subtitle || '')}</span>
    </div>
    <div class="toolbar-actions">
      ${links}
      <button class="tb-btn" type="button" id="btn-theme">Dark</button>
    </div>
  </header>`;
}

function relFrom(fromFile, toFile) {
  let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/');
  if (!rel.startsWith('.') && !rel.startsWith('/')) rel = './' + rel;
  return rel;
}

function isDeliveredArchifyHtml(abs) {
  if (!abs || !fs.existsSync(abs)) return false;
  const head = fs.readFileSync(abs, 'utf8').slice(0, 5000);
  // Platform pending stubs use generator "archifyX atlas" — not a real diagram.
  if (/content="archifyX/.test(head)) return false;
  return (
    /content="archify[\s"]/i.test(head) ||
    /class="diagram-container"/.test(head) ||
    /data-node-id=/.test(head)
  );
}

function diagramReady(atlasPath, diagram) {
  if (!diagram) return { ready: false, status: 'planned', abs: null };
  const abs = resolveBeside(atlasPath, diagram.artifact);
  const ready = isDeliveredArchifyHtml(abs);
  const status = ready ? 'delivered' : diagram.status || 'planned';
  return { ready, status, abs, diagram };
}

const PLATFORM_MARK_START = '<!-- archifyX:viewer:start -->';
const PLATFORM_MARK_END = '<!-- archifyX:viewer:end -->';
const PLATFORM_CSS = fs.readFileSync(path.join(skillRoot, 'assets', 'platform-viewer.css'), 'utf8');
const PLATFORM_JS = fs.readFileSync(path.join(skillRoot, 'assets', 'platform-viewer.js'), 'utf8');

function extractToolbarBlock(html) {
  const startRe = /(?:<!--\s*Toolbar:[\s\S]*?-->\s*)?<div class="toolbar"[^>]*>/i;
  const m = startRe.exec(html);
  if (!m) return { html, toolbar: '' };
  const start = m.index;
  let depth = 0;
  let i = m.index;
  while (i < html.length) {
    if (html.startsWith('<div', i)) {
      depth += 1;
      const gt = html.indexOf('>', i);
      if (gt === -1) break;
      i = gt + 1;
      continue;
    }
    if (html.startsWith('</div>', i)) {
      depth -= 1;
      i += 6;
      if (depth === 0) {
        const toolbar = html.slice(start, i).trim();
        const rest = `${html.slice(0, start)}${html.slice(i)}`;
        return { html: rest, toolbar };
      }
      continue;
    }
    i += 1;
  }
  return { html, toolbar: '' };
}

function stripPlatformInjection(html) {
  let out = html;
  let rescuedToolbar = '';
  const headerMatch = /<header class="platform-header"[^>]*>([\s\S]*?)<\/header>/i.exec(out);
  if (headerMatch) {
    const extracted = extractToolbarBlock(headerMatch[1]);
    rescuedToolbar = extracted.toolbar;
    out = out.replace(headerMatch[0], '');
  }

  out = out
    .replace(/<!-- archifyX:viewer:start -->[\s\S]*?<!-- archifyX:viewer:end -->/g, '')
    .replace(/<!-- archifyX:modules:start -->[\s\S]*?<!-- archifyX:modules:end -->/g, '')
    .replace(/<style id="archifyX-css">[\s\S]*?<\/style>/g, '')
    .replace(/<script id="archifyX-js">[\s\S]*?<\/script>/g, '')
    .replace(/<!-- archifyX:back:start -->[\s\S]*?<!-- archifyX:back:end -->/g, '')
    .replace(/<style id="archifyX-back-css">[\s\S]*?<\/style>/g, '')
    .replace(/\s*data-platform="true"/g, '')
    .replace(/\s*data-platform-shell="true"/g, '')
    .replace(/\s*data-platform-pane="true"/g, '')
    .replace(/\s*data-rail="(?:left|right)"/g, '')
    .replace(/\s*data-platform-rail="[^"]*"/g, '')
    .replace(/\s*data-platform-module="[^"]*"/g, '')
    .replace(/\s*data-platform-module-title="[^"]*"/g, '')
    .replace(/\s*data-platform-focus="[^"]*"/g, '');

  out = out.replace(/<div class="platform-app"[^>]*>\s*/gi, '');
  out = out.replace(/<div class="platform-body"[^>]*>\s*/gi, '');
  out = out.replace(/<div class="platform-stage"[^>]*>\s*/gi, '');
  out = out.replace(/<\/div><!-- \/\.platform-stage -->\s*/g, '');
  out = out.replace(/<\/div><!-- \/\.platform-body -->\s*/g, '');
  out = out.replace(/<\/div><!-- \/\.platform-app -->\s*/g, '');

  if (rescuedToolbar && !/<div class="toolbar"\b/i.test(out)) {
    out = out.replace(/<body([^>]*)>/i, `<body$1>\n${rescuedToolbar}\n`);
  }
  return out;
}

function railPositionOf(atlas) {
  return atlas.meta?.railPosition === 'right' ? 'right' : 'left';
}

function moduleCounts(atlasPath, mod) {
  const plannedTypes = (mod.diagrams || []).length;
  const delivered = (mod.diagrams || []).filter((d) =>
    isDeliveredArchifyHtml(resolveBeside(atlasPath, d.artifact))
  ).length;
  const childCount = Array.isArray(mod.children) ? mod.children.length : 0;
  return { delivered, total: plannedTypes || TYPE_ORDER.length, childCount, plannedTypes };
}

function diagramForType(mod, type) {
  return (mod.diagrams || []).find((d) => d.type === type) || null;
}

function typeEntry(atlasPath, mod, type) {
  const found = diagramForType(mod, type);
  if (!found) {
    return { type, found: null, ready: false, status: 'missing', abs: null };
  }
  const info = diagramReady(atlasPath, found);
  return { type, found, ready: info.ready, status: info.status, abs: info.abs };
}

function preferredTypeEntry(atlasPath, mod) {
  for (const type of TYPE_ORDER) {
    const entry = typeEntry(atlasPath, mod, type);
    if (entry.ready) return entry;
  }
  for (const type of TYPE_ORDER) {
    const entry = typeEntry(atlasPath, mod, type);
    if (entry.found) return entry;
  }
  return null;
}

function moduleTypePageAbs(moduleDir, type) {
  return path.join(moduleDir, `${type}.html`);
}

function statusLabel(status, isZh) {
  if (status === 'delivered' || status === 'ready') return isZh ? '已交付' : 'delivered';
  if (status === 'draft') return isZh ? '草稿' : 'draft';
  if (status === 'planned') return isZh ? '待交付' : 'planned';
  return isZh ? '未规划' : 'missing';
}

function indexLabel(segments, rootIndex) {
  if (segments.length === 1) return String(rootIndex + 1).padStart(2, '0');
  return `${String(rootIndex + 1).padStart(2, '0')}.${segments.slice(1).join('.')}`;
}

/** Icons only for types declared on the module — missing types are omitted (no 404). */
function buildTypeIconsHtml({ atlasPath, mod, pagePath, moduleDir, activeType, isZh }) {
  const icons = TYPE_ORDER.map((type) => {
    const entry = typeEntry(atlasPath, mod, type);
    if (!entry.found) return '';
    const href = relFrom(pagePath, moduleTypePageAbs(moduleDir, type));
    const status = entry.ready ? 'delivered' : entry.status;
    const cls = [
      'platform-type-icon',
      `accent-${TYPE_ACCENT[type]}`,
      entry.ready ? 'is-ready' : 'is-pending',
      activeType === type ? 'is-active' : ''
    ].join(' ');
    const label = typeLabel(type, isZh ? 'zh-CN' : 'en');
    return `<a class="${cls}" href="${escapeHtml(href)}" title="${escapeHtml(
      `${label} · ${statusLabel(status, isZh)}`
    )}" aria-label="${escapeHtml(label)}" data-type="${escapeHtml(type)}">${TYPE_ICON[type]}</a>`;
  }).join('');
  if (!icons) return '';
  return `<span class="platform-type-icons" role="group" aria-label="${
    isZh ? '图类型' : 'Diagram types'
  }">${icons}</span>`;
}

function buildTreeNodeHtml({
  atlas,
  atlasPath,
  pagePath,
  node,
  rootIndex,
  activeModuleId,
  activeType,
  expandIds,
  isZh
}) {
  const moduleDir = moduleDirFor(atlasPath, node.segments);
  const preferred = preferredTypeEntry(atlasPath, node.mod);
  const hubPath = preferred?.found
    ? moduleTypePageAbs(moduleDir, preferred.type)
    : path.join(moduleDir, 'index.html');
  const isActiveModule = activeModuleId === node.id;
  const hubHref = isActiveModule && !activeType ? '#' : relFrom(pagePath, hubPath);
  const { delivered, plannedTypes, childCount } = moduleCounts(atlasPath, node.mod);
  const expanded = expandIds.has(node.id) || isActiveModule;
  const current = isActiveModule ? ' aria-current="page"' : '';
  const metaParts = [];
  if (plannedTypes) metaParts.push(`${delivered}/${plannedTypes}`);
  if (childCount > 0) metaParts.push(`${childCount}${isZh ? '子' : 'c'}`);
  const meta = metaParts.join(' · ');
  const icons = buildTypeIconsHtml({
    atlasPath,
    mod: node.mod,
    pagePath,
    moduleDir,
    activeType: isActiveModule ? activeType : null,
    isZh
  });

  const childNodes = (node.mod.children || []).map((child, i) => {
    const childNode = {
      mod: child,
      id: child.id,
      title: child.title,
      segments: [...node.segments, child.id],
      depth: node.depth + 1,
      index: i,
      parentId: node.id,
      hasChildren: Array.isArray(child.children) && child.children.length > 0,
      hasDiagrams: Array.isArray(child.diagrams) && child.diagrams.length > 0
    };
    return buildTreeNodeHtml({
      atlas,
      atlasPath,
      pagePath,
      node: childNode,
      rootIndex,
      activeModuleId,
      activeType,
      expandIds,
      isZh
    });
  });

  const kids = childNodes.length
    ? `<div class="platform-tree-kids"><ul class="platform-tree">${childNodes.join('')}</ul></div>`
    : '';

  const toggle = node.hasChildren
    ? `<button type="button" class="platform-tree-toggle" aria-expanded="${
        expanded ? 'true' : 'false'
      }" aria-label="${isZh ? '展开/折叠' : 'Expand/collapse'}"></button>`
    : `<span class="platform-tree-spacer" aria-hidden="true"></span>`;

  return `<li class="platform-tree-node" data-module-id="${escapeHtml(node.id)}" data-expanded="${
    expanded ? 'true' : 'false'
  }" data-depth="${node.depth}">
  <div class="platform-tree-row">
    ${toggle}
    <div class="platform-tree-main">
      <a class="platform-rail-module" href="${escapeHtml(hubHref)}"${current} title="${escapeHtml(
        meta ? `${node.title} · ${meta}` : node.title
      )}">
        <span class="idx">${escapeHtml(indexLabel(node.segments, rootIndex))}</span>
        <span class="title">${escapeHtml(node.title)}</span>
      </a>
      ${icons}
    </div>
  </div>
  ${kids}
</li>`;
}

function buildRailHtml({
  atlas,
  atlasPath,
  pagePath,
  activeModuleId = null,
  activeType = null,
  overviewHref = null
}) {
  const isZh = (atlas.meta.locale || 'en') === 'zh-CN';
  const activeNode = findModuleNode(atlas, activeModuleId);
  const expandIds = new Set();
  if (activeNode) {
    expandIds.add(activeNode.id);
    for (const id of ancestorIds(activeNode.segments)) expandIds.add(id);
  }

  const tree = (atlas.modules || [])
    .map((mod, i) => {
      const node = {
        mod,
        id: mod.id,
        title: mod.title,
        segments: [mod.id],
        depth: 0,
        index: i,
        parentId: null,
        hasChildren: Array.isArray(mod.children) && mod.children.length > 0,
        hasDiagrams: Array.isArray(mod.diagrams) && mod.diagrams.length > 0
      };
      return buildTreeNodeHtml({
        atlas,
        atlasPath,
        pagePath,
        node,
        rootIndex: i,
        activeModuleId,
        activeType,
        expandIds,
        isZh
      });
    })
    .join('\n');

  const overviewLink = overviewHref
    ? `<a class="platform-rail-module" href="${escapeHtml(overviewHref)}"${
        activeModuleId ? '' : ' aria-current="page"'
      }>
      <span class="idx">OV</span>
      <span class="title">${escapeHtml(atlas.overview.title)}</span>
    </a>`
    : '';

  return `${PLATFORM_MARK_START}
<aside class="platform-rail no-print" id="platform-rail" aria-label="${isZh ? '子模块树' : 'Module tree'}">
  ${overviewLink}
  <ul class="platform-tree" id="platform-tree">${tree}</ul>
</aside>
${PLATFORM_MARK_END}`;
}

function asPlatformPane(html, { title = null, subtitle = null } = {}) {
  let out = stripPlatformInjection(html);
  out = retitleArchifyHeader(out, { title, subtitle });
  out = out.replace(/<html\b([^>]*)>/, (match, attrs) => {
    const next = attrs
      .replace(/\s*data-platform="true"/g, '')
      .replace(/\s*data-platform-pane="true"/g, '')
      .replace(/\s*data-platform-shell="true"/g, '')
      .replace(/\s*data-rail="(?:left|right)"/g, '');
    return `<html${next} data-platform-pane="true">`;
  });
  // Always refresh embedded platform CSS so containment/title rules stay current.
  out = out.replace(/<style id="archifyX-css">[\s\S]*?<\/style>/g, '');
  out = out.replace(/<style id="archifyX-pane-width">[\s\S]*?<\/style>/g, '');
  const paneCss = `<style id="archifyX-css">\n${PLATFORM_CSS}\n</style>`;
  const widthCss = `<style id="archifyX-pane-width">
html[data-platform-pane="true"]{height:100%!important;max-height:100%!important;overflow:hidden!important;--archify-reader-width:100%!important}
html[data-platform-pane="true"] body{height:100%!important;max-height:100%!important;min-height:0!important;padding:.65rem!important;overflow:hidden!important;margin:0!important}
html[data-platform-pane="true"] .container{display:flex!important;flex-direction:column!important;gap:.5rem!important;width:100%!important;max-width:none!important;height:100%!important;min-height:0!important;overflow:hidden!important}
html[data-platform-pane="true"] .header,html[data-platform-pane="true"] .guided-views{flex:none!important;margin:0!important}
html[data-platform-pane="true"] .header{margin-bottom:0!important;padding-right:0!important}
html[data-platform-pane="true"] .header .subtitle,
html[data-platform-pane="true"] p.subtitle{display:block!important;visibility:visible!important;height:auto!important;margin:.2rem 0 0 1.75rem!important;padding:0!important;color:var(--text-muted,#94a3b8)!important;font-size:.72rem!important;font-weight:400!important;line-height:1.35!important}
html[data-platform-pane="true"] .cards{display:grid!important;flex:none!important;margin:0!important;min-height:0!important;max-height:28%!important;overflow:auto!important;gap:.45rem!important}
html[data-platform-pane="true"] .cards .card{padding:.55rem .65rem!important}
html[data-platform-pane="true"] .diagram-container{display:flex!important;flex:1 1 auto!important;align-items:center!important;justify-content:center!important;min-height:0!important;height:auto!important;overflow:hidden!important;padding:.5rem!important;padding-bottom:calc(.5rem + var(--archify-nav-reserve,3.5rem))!important}
html[data-platform-pane="true"] .diagram-container>svg{width:100%!important;height:100%!important;min-width:0!important;max-height:100%!important}
html[data-platform-pane="true"] .diagram-container:focus,html[data-platform-pane="true"] .diagram-container:focus-visible,html[data-platform-pane="true"] .diagram-container>svg:focus,html[data-platform-pane="true"] .diagram-container>svg:focus-visible,html[data-platform-pane="true"] svg:focus,html[data-platform-pane="true"] svg:focus-visible{outline:none!important;box-shadow:none!important}
</style>`;
  out = out.replace('</head>', `${paneCss}\n${widthCss}\n</head>`);
  return out;
}

function buildChromeToolbarHtml(isZh) {
  return `<div class="platform-chrome-toolbar" id="platform-chrome-toolbar" role="toolbar" aria-label="${
    isZh ? '图表操作' : 'Diagram actions'
  }">
  <button type="button" id="platform-btn-theme" data-archify-proxy="btn-theme" aria-pressed="false" title="${
    isZh ? '切换主题（T）' : 'Toggle theme (T)'
  }">
    <span aria-hidden="true">☾</span><span data-label>${isZh ? '深色' : 'Dark'}</span>
  </button>
  <button type="button" id="platform-btn-preset" data-archify-proxy="btn-preset" title="${
    isZh ? '选择视觉风格（S）' : 'Visual style (S)'
  }">
    <span aria-hidden="true" class="platform-preset-mark">◌</span><span data-label>${
      isZh ? '经典' : 'Classic'
    }</span><span aria-hidden="true">▾</span>
  </button>
  <button type="button" id="platform-btn-motion" data-archify-proxy="btn-motion" hidden aria-pressed="true" title="${
    isZh ? '动效' : 'Motion'
  }">
    <span aria-hidden="true" class="platform-motion-dot"></span><span data-label>${isZh ? '动态' : 'Live'}</span>
  </button>
  <button type="button" id="platform-btn-present" data-archify-proxy="btn-present" aria-pressed="false" title="${
    isZh ? '演示模式（F）' : 'Present (F)'
  }">
    <span aria-hidden="true">⛶</span><span data-label>${isZh ? '演示' : 'Present'}</span>
  </button>
  <button type="button" id="platform-btn-export" data-archify-proxy="btn-export" title="${
    isZh ? '导出图表（E）' : 'Export (E)'
  }">
    <span data-label>${isZh ? '导出' : 'Export'}</span><span aria-hidden="true">▾</span>
  </button>
</div>`;
}

function buildShellHtml(atlas, atlasPath, indexPath) {
  const locale = atlas.meta.locale || 'en';
  const isZh = locale === 'zh-CN';
  const rail = railPositionOf(atlas);
  const overviewAbs = resolveBeside(atlasPath, atlas.overview.artifact);
  const overviewHref = fs.existsSync(overviewAbs)
    ? relFrom(indexPath, overviewAbs)
    : '#';
  const railHtml = buildRailHtml({
    atlas,
    atlasPath,
    pagePath: indexPath,
    activeModuleId: null,
    activeType: null,
    overviewHref
  });

  return `<!DOCTYPE html>
<html lang="${escapeHtml(locale)}" data-theme="dark" data-platform="true" data-platform-shell="true" data-rail="${rail}" data-platform-rail="open">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="archifyX atlas">
  <title>${escapeHtml(atlas.meta.title)}</title>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
        rel="stylesheet" media="print" onload="this.media='all'">
  <style id="archifyX-css">
:root, [data-theme="dark"] {
  --bg: #020617;
  --text: #ffffff;
  --text-muted: #94a3b8;
  --text-faint: #7d8da1;
  --text-dim: #475569;
  --panel: rgba(15, 23, 42, 0.5);
  --panel-border: #334155;
  --toolbar-bg: rgba(15, 23, 42, 0.92);
  --toolbar-border: #334155;
  --toolbar-text: #e2e8f0;
  --frontend-stroke: #22d3ee;
  --frontend-fill: rgba(8, 51, 68, 0.4);
  --backend-stroke: #34d399;
  --cloud-stroke: #fbbf24;
  --database-stroke: #a78bfa;
  --security-stroke: #fb7185;
  --grid: rgba(148, 163, 184, 0.12);
}
[data-theme="light"] {
  --bg: #f8fafc;
  --text: #0f172a;
  --text-muted: #64748b;
  --text-faint: #64748b;
  --text-dim: #94a3b8;
  --panel: rgba(255, 255, 255, 0.86);
  --panel-border: #cbd5e1;
  --toolbar-bg: rgba(255, 255, 255, 0.92);
  --toolbar-border: #cbd5e1;
  --toolbar-text: #0f172a;
  --frontend-stroke: #0891b2;
  --frontend-fill: rgba(8, 145, 178, 0.12);
  --backend-stroke: #059669;
  --cloud-stroke: #d97706;
  --database-stroke: #7c3aed;
  --security-stroke: #e11d48;
  --grid: rgba(100, 116, 139, 0.14);
}
${PLATFORM_CSS}
  </style>
</head>
<body>
<div class="platform-app" id="platform-app">
  <header class="platform-header" id="platform-header">
    <div class="platform-header-brand">${escapeHtml(atlas.meta.title)}</div>
    ${buildChromeToolbarHtml(isZh)}
  </header>
  <div class="platform-body" id="platform-body">
    ${railHtml}
    <iframe class="platform-frame" id="platform-frame" title="${escapeHtml(
      isZh ? '图谱舞台' : 'Diagram stage'
    )}" data-default-src="${escapeHtml(overviewHref)}" src="${escapeHtml(overviewHref)}"></iframe>
  </div>
</div>
<script id="archifyX-js">
${PLATFORM_JS}
</script>
</body>
</html>
`;
}

function buildPlatformIndexHtml(atlas, atlasPath, indexPath) {
  const overviewAbs = resolveBeside(atlasPath, atlas.overview.artifact);
  if (!fs.existsSync(overviewAbs)) {
    const locale = atlas.meta.locale || 'en';
    const isZh = locale === 'zh-CN';
    return pageShell({
      locale,
      title: atlas.meta.title,
      toolbarHtml: toolbarHtml({
        brand: atlas.meta.title,
        subtitle: isZh ? '总览尚未交付' : 'Overview missing'
      }),
      bodyHtml: `<h1>${escapeHtml(atlas.meta.title)}</h1><p class="lead">${
        isZh ? '请先用 archifyX deliver 交付总览 architecture。' : 'Deliver overview architecture first.'
      }</p>`
    });
  }
  // Always refresh overview as a scrollable pane (no nested platform chrome).
  const locale = atlas.meta.locale || 'en';
  const isZh = locale === 'zh-CN';
  const overviewSource = fs.readFileSync(overviewAbs, 'utf8');
  const overviewType = atlas.overview.type || 'architecture';
  const overviewHeading = diagramHeading(isZh ? '运行时' : 'Runtime', overviewType, isZh);
  const overviewSub =
    atlas.overview.summary || atlas.overview.title || typeLabel(overviewType, locale);
  fs.writeFileSync(
    overviewAbs,
    asPlatformPane(overviewSource, {
      title: escapeHtml(overviewHeading),
      subtitle: escapeHtml(overviewSub)
    }),
    'utf8'
  );
  return buildShellHtml(atlas, atlasPath, indexPath);
}

function retitleArchifyHeader(html, { title = null, subtitle = null } = {}) {
  // Strip every existing subtitle first so rebuilds never stack.
  let out = html.replace(/<p\b[^>]*class="[^"]*subtitle[^"]*"[^>]*>[\s\S]*?<\/p>\s*/gi, '');
  if (title) {
    out = out.replace(/<h1>[^<]*<\/h1>/, `<h1>${title}</h1>`);
    out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  }
  if (subtitle) {
    const sub = `<p class="subtitle">${subtitle}</p>`;
    // Insert after the header-row that contains h1 (not after an inner pulse-dot </div>).
    if (/<div class="header-row"[^>]*>[\s\S]*?<h1>[^<]*<\/h1>\s*<\/div>/.test(out)) {
      out = out.replace(
        /(<div class="header-row"[^>]*>[\s\S]*?<h1>[^<]*<\/h1>\s*<\/div>)/,
        `$1\n      ${sub}`
      );
    } else {
      out = out.replace(/<\/h1>/, `</h1>\n      ${sub}`);
    }
  }
  return out;
}

function wrapOverviewStage(atlas, atlasPath, pagePath, mod, {
  title,
  subtitle,
  activeType = null,
  focusAnchors = null
}) {
  const overviewAbs = resolveBeside(atlasPath, atlas.overview.artifact);
  if (!fs.existsSync(overviewAbs)) return null;
  let html = fs.readFileSync(overviewAbs, 'utf8');
  const locale = atlas.meta.locale || 'en';
  const isZh = locale === 'zh-CN';
  const type = activeType || atlas.overview.type || 'architecture';
  const heading = title
    ? diagramHeading(title, type, isZh)
    : diagramHeading(mod.title, type, isZh);
  const sub = subtitle || mod.summary || typeLabel(type, locale);
  return asPlatformPane(html, {
    title: escapeHtml(heading),
    subtitle: escapeHtml(sub)
  });
}

function buildModuleHubHtml(atlas, atlasPath, node, moduleIndexPath) {
  const mod = node.mod;
  const locale = atlas.meta.locale || 'en';
  const isZh = locale === 'zh-CN';
  const preferred = preferredTypeEntry(atlasPath, mod);

  if (preferred?.ready && preferred.abs) {
    return buildDeliveredTypeHtml(
      atlas,
      atlasPath,
      mod,
      preferred.type,
      moduleIndexPath,
      preferred.abs
    );
  }

  if (preferred?.found) {
    const stage = wrapOverviewStage(atlas, atlasPath, moduleIndexPath, mod, {
      title: mod.title,
      activeType: preferred.type
    });
    if (stage) return stage;
  }

  const stage = wrapOverviewStage(atlas, atlasPath, moduleIndexPath, mod, {
    title: mod.title
  });
  if (stage) return stage;

  return asPlatformPane(
    pageShell({
      locale,
      title: mod.title,
      toolbarHtml: toolbarHtml({ brand: mod.title, subtitle: isZh ? '子模块' : 'Module' }),
      bodyHtml: `<section class="platform-pack"><div class="platform-pack-head"><h1>${escapeHtml(
        mod.title
      )}</h1><p class="lead">${escapeHtml(mod.summary || '')}</p></div></section>`
    }),
    { title: escapeHtml(mod.title) }
  );
}

function buildPendingTypeHtml(atlas, atlasPath, mod, type, typePagePath) {
  const locale = atlas.meta.locale || 'en';
  const isZh = locale === 'zh-CN';
  const entry = typeEntry(atlasPath, mod, type);
  const meta = TYPE_META[type][isZh ? 'zh' : 'en'];
  const status = entry.ready ? 'delivered' : entry.status;
  const stage = wrapOverviewStage(atlas, atlasPath, typePagePath, mod, {
    title: mod.title,
    activeType: type
  });
  if (stage) return stage;

  return asPlatformPane(
    pageShell({
      locale,
      title: mod.title,
      toolbarHtml: toolbarHtml({ brand: mod.title, subtitle: typeLabel(type, locale) }),
      bodyHtml: `<section class="platform-pack"><div class="platform-pending-panel"><h2>${escapeHtml(
        statusLabel(status, isZh)
      )}</h2><p>Focus · ${escapeHtml(meta.focus)}</p><p>Fields · ${escapeHtml(meta.fields)}</p></div></section>`
    }),
    { title: escapeHtml(mod.title) }
  );
}

function buildDeliveredTypeHtml(atlas, atlasPath, mod, type, typePagePath, artifactAbs) {
  const locale = atlas.meta.locale || 'en';
  const isZh = locale === 'zh-CN';
  const entry = typeEntry(atlasPath, mod, type);
  const heading = diagramHeading(mod.title, type, isZh);
  const diagramTitle = entry.found && entry.found.title;
  const sub =
    (diagramTitle && diagramTitle !== heading ? diagramTitle : null) ||
    mod.summary ||
    typeLabel(type, locale);
  let source = fs.readFileSync(artifactAbs, 'utf8');
  return asPlatformPane(source, {
    title: escapeHtml(heading),
    subtitle: escapeHtml(sub)
  });
}

function writeModulePages(atlas, atlasPath, node, written) {
  const moduleDir = moduleDirFor(atlasPath, node.segments);
  const moduleIndex = path.join(moduleDir, 'index.html');
  fs.mkdirSync(moduleDir, { recursive: true });

  const hubHtml = buildModuleHubHtml(atlas, atlasPath, node, moduleIndex);
  fs.writeFileSync(moduleIndex, hubHtml, 'utf8');
  written.push(moduleIndex);

  for (const type of TYPE_ORDER) {
    const typePage = moduleTypePageAbs(moduleDir, type);
    const entry = typeEntry(atlasPath, node.mod, type);
    if (!entry.found) {
      // No atlas row → no icon, no page (avoids 404 from hidden types).
      if (fs.existsSync(typePage) && !isDeliveredArchifyHtml(typePage)) {
        try {
          const head = fs.readFileSync(typePage, 'utf8').slice(0, 800);
          if (/archifyX/.test(head)) fs.unlinkSync(typePage);
        } catch (_) {}
      }
      continue;
    }
    const html =
      entry.ready && entry.abs
        ? buildDeliveredTypeHtml(atlas, atlasPath, node.mod, type, typePage, entry.abs)
        : buildPendingTypeHtml(atlas, atlasPath, node.mod, type, typePage);
    fs.writeFileSync(typePage, html, 'utf8');
    written.push(typePage);
  }
}

function buildSite(atlas, atlasPath, indexPath) {
  const written = [];
  const platformHtml = buildPlatformIndexHtml(atlas, atlasPath, indexPath);
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, platformHtml, 'utf8');
  written.push(indexPath);

  for (const node of walkModuleTree(atlas.modules)) {
    writeModulePages(atlas, atlasPath, node, written);
  }
  return written;
}

function commandValidate(args) {
  const json = args.includes('--json');
  const strict = args.includes('--strict');
  const positional = args.filter((a) => !a.startsWith('--'));
  const atlasPath = path.resolve(positional[0] || '');
  if (!positional[0] || !fs.existsSync(atlasPath)) {
    fail('Usage: atlas.mjs validate <atlas.json> [--json] [--strict]', 1, { json });
  }
  let receipt;
  try {
    receipt = validateAtlas(atlasPath, { strict });
  } catch (error) {
    fail(error.message, 1, { json });
  }
  if (json) console.log(JSON.stringify(receipt, null, 2));
  else {
    console.log(receipt.ok ? 'Atlas OK' : 'Atlas FAILED');
    console.log(`modules=${receipt.moduleCount} diagrams=${receipt.diagramCount}`);
    for (const err of receipt.errors) console.error('- ' + err);
  }
  process.exit(receipt.ok ? 0 : 1);
}

function commandBuildIndex(args) {
  const json = args.includes('--json');
  const strict = args.includes('--strict');
  const positional = args.filter((a) => !a.startsWith('--'));
  const atlasPath = path.resolve(positional[0] || '');
  if (!positional[0] || !fs.existsSync(atlasPath)) {
    fail('Usage: atlas.mjs build-index <atlas.json> [index.html] [--json] [--strict]', 1, { json });
  }
  const receipt = validateAtlas(atlasPath, { strict });
  if (!receipt.ok) {
    fail('Atlas validation failed; refuse to build index.', 1, { json, receipt });
  }
  const atlas = readJson(atlasPath);
  const defaultOut = path.join(path.dirname(atlasPath), 'index.html');
  const outPath = path.resolve(positional[1] || defaultOut);
  const written = buildSite(atlas, atlasPath, outPath);
  const result = {
    ok: true,
    command: 'build-index',
    atlas: atlasPath,
    output: outPath,
    pages: written,
    pageCount: written.length,
    moduleCount: receipt.moduleCount,
    diagramCount: receipt.diagramCount
  };
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`Wrote ${written.length} pages`);
    for (const p of written) console.log('- ' + p);
  }
}

function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'validate') return commandValidate(rest);
  if (cmd === 'build-index') return commandBuildIndex(rest);
  fail(
    'Usage:\n  atlas.mjs validate <atlas.json> [--json] [--strict]\n  atlas.mjs build-index <atlas.json> [index.html] [--json] [--strict]'
  );
}

main();
