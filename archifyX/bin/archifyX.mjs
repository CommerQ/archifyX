#!/usr/bin/env node
/**
 * archifyX CLI — self-contained (no external Archify install).
 *
 * Platform:
 *   doctor | demo <outdir>
 *   validate <atlas.json> [--json] [--strict]
 *   build-index <atlas.json> [index.html] [--json] [--strict]
 *
 * Diagram engine (in-tree ./engine):
 *   validate-diagram <type> <spec.json> [...]
 *   deliver <type> <spec.json> <out.html> [...]
 *   compare architecture <base.json> <head.json> [out.html] [...]
 *   preview | guide | brands | visual-check | diagram <engine-args...>
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.resolve(__dirname, '..');
const atlasCli = path.join(pkgRoot, 'scripts', 'atlas.mjs');
const engineRoot = path.join(pkgRoot, 'engine');
const engineBin = path.join(engineRoot, 'bin', 'archify.mjs');
const VERSION = '0.1.0';

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function usage() {
  return `archifyX v${VERSION} (self-contained)

Platform Atlas:
  doctor
  demo <outdir>
  validate <atlas.json> [--json] [--strict]
  build-index <atlas.json> [index.html] [--json] [--strict]

Diagram engine (bundled under ./engine — no external install):
  validate-diagram <type> <spec.json> [--quality showcase] [--json]
  deliver <type> <spec.json> <out.html> [--quality showcase] [--json]
  compare architecture <base.json> <head.json> [out.html] [--receipt path] [--json]
  preview <type> <spec.json> <out.html> [--quality showcase]
  guide ["<scenario>"] [--json] [--lang en|zh]
  brands [list|capture <url>] [--json]
  visual-check <html> [--json]
  diagram <engine-subcommand-and-args...>

Examples:
  node bin/archifyX.mjs doctor
  node bin/archifyX.mjs demo ../examples/demo-out
  node bin/archifyX.mjs deliver architecture web-app.architecture.json out.html --quality showcase --json
  node bin/archifyX.mjs guide "平台图谱" --json
  node bin/archifyX.mjs compare architecture base.json head.json delta.html --json
`;
}

function runNode(script, args, { cwd } = {}) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: cwd || process.cwd(),
    stdio: 'inherit',
    env: process.env
  });
  if (result.error) die(result.error.message);
  process.exit(result.status ?? 1);
}

function runAtlas(args) {
  if (!fs.existsSync(atlasCli)) die(`Missing atlas CLI: ${atlasCli}`);
  runNode(atlasCli, args, { cwd: pkgRoot });
}

function requireEngine() {
  if (!fs.existsSync(engineBin)) {
    die(`Bundled diagram engine missing: ${engineBin}`);
  }
  return { root: engineRoot, bin: engineBin };
}

function commandDoctor() {
  const checks = [
    { name: 'package root', ok: fs.existsSync(pkgRoot), detail: pkgRoot },
    { name: 'atlas.mjs', ok: fs.existsSync(atlasCli), detail: atlasCli },
    {
      name: 'platform-viewer.css',
      ok: fs.existsSync(path.join(pkgRoot, 'assets', 'platform-viewer.css')),
      detail: path.join(pkgRoot, 'assets', 'platform-viewer.css')
    },
    {
      name: 'platform-viewer.js',
      ok: fs.existsSync(path.join(pkgRoot, 'assets', 'platform-viewer.js')),
      detail: path.join(pkgRoot, 'assets', 'platform-viewer.js')
    },
    {
      name: 'platform-atlas.schema.json',
      ok: fs.existsSync(path.join(pkgRoot, 'schemas', 'platform-atlas.schema.json')),
      detail: path.join(pkgRoot, 'schemas', 'platform-atlas.schema.json')
    },
    { name: 'SKILL.md', ok: fs.existsSync(path.join(pkgRoot, 'SKILL.md')), detail: path.join(pkgRoot, 'SKILL.md') },
    {
      name: 'bundled diagram engine',
      ok: fs.existsSync(engineBin),
      detail: engineBin
    }
  ];

  let ok = true;
  console.log(`archifyX v${VERSION}`);
  for (const c of checks) {
    const mark = c.ok ? 'OK  ' : 'FAIL';
    if (!c.ok) ok = false;
    console.log(`[${mark}] ${c.name}: ${c.detail}`);
  }

  if (fs.existsSync(engineBin)) {
    const probe = spawnSync(process.execPath, [engineBin, 'doctor'], {
      encoding: 'utf8',
      env: process.env,
      cwd: engineRoot
    });
    if (probe.status === 0) {
      console.log('[OK  ] diagram engine doctor');
    } else {
      ok = false;
      console.log('[FAIL] diagram engine doctor');
      if (probe.stderr) process.stderr.write(probe.stderr);
      if (probe.stdout) process.stdout.write(probe.stdout);
    }
  }

  process.exit(ok ? 0 : 1);
}

async function commandGuide(args) {
  const { pathToFileURL } = await import('node:url');
  const guidePath = path.join(pkgRoot, 'scripts', 'guide.mjs');
  let guide;
  try {
    guide = await import(pathToFileURL(guidePath).href);
  } catch (error) {
    die(`Could not load guide recipes: ${error.message}`);
  }

  let lang;
  let json = false;
  const queryParts = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--json') json = true;
    else if (arg === '--lang') {
      const value = args[i + 1];
      if (value !== 'en' && value !== 'zh') die('--lang must be "en" or "zh"');
      lang = value;
      i += 1;
    } else if (arg.startsWith('--lang=')) {
      const value = arg.slice('--lang='.length);
      if (value !== 'en' && value !== 'zh') die('--lang must be "en" or "zh"');
      lang = value;
    } else if (arg.startsWith('--')) die(`Unknown guide option "${arg}"`);
    else queryParts.push(arg);
  }

  const query = queryParts.join(' ').trim();
  if (!query) {
    const selectedLang = lang || 'en';
    if (json) {
      console.log(
        JSON.stringify(
          { ok: true, mode: 'list', lang: selectedLang, recipes: guide.listScenarioRecipes(selectedLang) },
          null,
          2
        )
      );
    } else {
      console.log(guide.formatScenarioList(selectedLang));
    }
    return;
  }

  const result = guide.recommendScenario(query, lang ? { lang } : {});
  console.log(json ? JSON.stringify(result, null, 2) : guide.formatScenarioRecommendation(result));
}

function commandDemo(outdirArg) {
  if (!outdirArg) die('Usage: archifyX demo <outdir>');
  const outdir = path.resolve(outdirArg);
  fs.mkdirSync(outdir, { recursive: true });

  const srcRendered = path.join(pkgRoot, 'examples', 'web-app-rendered.html');
  const srcSpec = path.join(pkgRoot, 'examples', 'web-app.architecture.json');
  const overviewHtml = path.join(outdir, 'runtime-overview.architecture.html');
  const overviewSpec = path.join(outdir, 'runtime-overview.architecture.json');
  if (!fs.existsSync(srcRendered)) die(`Demo seed missing: ${srcRendered}`);
  fs.copyFileSync(srcRendered, overviewHtml);
  if (fs.existsSync(srcSpec)) fs.copyFileSync(srcSpec, overviewSpec);

  const atlas = {
    schema_version: 1,
    kind: 'platform-atlas',
    meta: {
      title: 'archifyX Demo',
      locale: 'zh-CN',
      description: 'Self-contained Platform Atlas demo.',
      railPosition: 'left'
    },
    overview: {
      id: 'runtime-overview',
      title: '运行时总览',
      type: 'architecture',
      summary: 'Demo overview seeded from packaged example HTML.',
      spec: 'runtime-overview.architecture.json',
      artifact: 'runtime-overview.architecture.html'
    },
    modules: [
      {
        id: 'identity',
        title: '身份与会话',
        summary: '登录拦截、会话边界（演示模块，待交付）。',
        diagrams: [
          {
            id: 'identity-architecture',
            type: 'architecture',
            title: '身份组件',
            spec: 'modules/identity/architecture.json',
            artifact: 'modules/identity/architecture.html',
            status: 'planned'
          },
          {
            id: 'identity-sequence',
            type: 'sequence',
            title: '登录时序',
            spec: 'modules/identity/sequence.json',
            artifact: 'modules/identity/sequence.html',
            status: 'planned'
          }
        ]
      },
      {
        id: 'delivery',
        title: '交付链路',
        summary: '发布与回滚（演示模块，待交付）。',
        diagrams: [
          {
            id: 'delivery-workflow',
            type: 'workflow',
            title: '交付工作流',
            spec: 'modules/delivery/workflow.json',
            artifact: 'modules/delivery/workflow.html',
            status: 'planned'
          },
          {
            id: 'delivery-lifecycle',
            type: 'lifecycle',
            title: '发布生命周期',
            spec: 'modules/delivery/lifecycle.json',
            artifact: 'modules/delivery/lifecycle.html',
            status: 'planned'
          }
        ],
        children: [
          {
            id: 'rollback',
            title: '回滚策略',
            summary: '嵌套子模块示例。',
            diagrams: [
              {
                id: 'rollback-workflow',
                type: 'workflow',
                title: '回滚流程',
                spec: 'modules/delivery/rollback/workflow.json',
                artifact: 'modules/delivery/rollback/workflow.html',
                status: 'planned'
              }
            ]
          }
        ]
      }
    ]
  };

  const atlasPath = path.join(outdir, 'demo.platform.atlas.json');
  fs.writeFileSync(atlasPath, JSON.stringify(atlas, null, 2) + '\n', 'utf8');

  const indexPath = path.join(outdir, 'index.html');
  const build = spawnSync(
    process.execPath,
    [atlasCli, 'build-index', atlasPath, indexPath, '--json'],
    { encoding: 'utf8', env: process.env }
  );
  if (build.status !== 0) {
    process.stderr.write(build.stderr || '');
    process.stdout.write(build.stdout || '');
    die('demo build-index failed', build.status ?? 1);
  }
  console.log(`Demo ready: ${indexPath}`);
  console.log(`Atlas:      ${atlasPath}`);
  console.log('Serve with:  npx --yes serve ' + outdir);
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd || cmd === '-h' || cmd === '--help' || cmd === 'help') {
    console.log(usage());
    process.exit(0);
  }
  if (cmd === '-v' || cmd === '--version' || cmd === 'version') {
    console.log(VERSION);
    process.exit(0);
  }

  if (cmd === 'doctor') return commandDoctor();
  if (cmd === 'demo') return commandDemo(rest[0]);
  if (cmd === 'validate') return runAtlas(['validate', ...rest]);
  if (cmd === 'build-index') return runAtlas(['build-index', ...rest]);
  if (cmd === 'guide') return commandGuide(rest);

  const engine = requireEngine();
  if (cmd === 'diagram') return runNode(engine.bin, rest);
  if (cmd === 'validate-diagram') return runNode(engine.bin, ['validate', ...rest]);
  if (cmd === 'visual-check') return runNode(engine.bin, ['visual-check', ...rest]);
  if (cmd === 'compare') return runNode(engine.bin, ['compare', ...rest]);
  if (cmd === 'deliver' || cmd === 'preview' || cmd === 'brands') {
    return runNode(engine.bin, [cmd, ...rest]);
  }

  die(`Unknown command: ${cmd}\n\n${usage()}`);
}

main().catch((error) => die(error.message || String(error)));
