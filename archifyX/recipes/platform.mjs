/**
 * Platform-oriented recipes for archifyX (Archify eXtension).
 * Leaf-only scenarios stay in ../engine/recipes/scenarios.mjs.
 */
export const PLATFORM_RECIPES = [
  {
    id: 'platform-atlas',
    kind: 'platform-atlas',
    signals: [
      ['platform atlas', 14],
      ['module tree', 12],
      ['submodule', 10],
      ['overview drill-down', 11],
      ['平台图谱', 14],
      ['子模块树', 12],
      ['总览下钻', 11],
      ['多模块', 10]
    ],
    en: {
      title: 'Platform atlas',
      question: 'How do I navigate a large system without one mega diagram?',
      summary: 'Overview architecture plus nested module packs (A/W/S/D/L) in one SPA.',
      useWhen: 'Multi-team platforms, nested subsystems, onboarding maps with drill-down.',
      avoidWhen: 'A single bounded map is enough — use a leaf deliver only.',
      include: ['overview architecture', 'nested modules', 'type stubs never 404', '?view= deep links'],
      prompt:
        'Use archifyX to build a platform atlas for this repository. Author an overview architecture, group subsystems into nested modules with A/W/S/D/L packs, deliver what is known, leave the rest as planned stubs, then build-index.'
    },
    zh: {
      title: '平台图谱',
      question: '大型系统如何避免一张巨图，又能下钻？',
      summary: '总览 architecture + 嵌套模块包（A/W/S/D/L）组成一个 SPA。',
      useWhen: '多团队平台、嵌套子系统、需要下钻的上手图谱。',
      avoidWhen: '只需一张有界单图时，直接 deliver 叶子即可。',
      include: ['总览架构图', '嵌套模块', '类型占位永不 404', '?view= 深链'],
      prompt:
        '用 archifyX 给这个仓库做平台图谱：先交付总览 architecture，再按子系统建嵌套模块与 A/W/S/D/L，已知的 deliver，未知的 planned 占位，最后 build-index。'
    }
  },
  {
    id: 'module-pack',
    kind: 'platform-atlas',
    signals: [
      ['module pack', 12],
      ['architecture sequence lifecycle', 9],
      ['模块包', 12],
      ['五种图', 10]
    ],
    en: {
      title: 'Module pack',
      question: 'Which diagram types belong in one module?',
      summary: 'Start with architecture + one deep type; add dataflow/workflow only when needed.',
      useWhen: 'Scoping a single submodule inside an atlas.',
      avoidWhen: 'You are still choosing the platform overview.',
      include: ['architecture', 'one of sequence|lifecycle|workflow|dataflow'],
      prompt:
        'For this module, use archifyX to deliver an architecture map and one deep diagram (sequence or lifecycle). Keep ≤12 primary nodes. Register both in the atlas module pack.'
    },
    zh: {
      title: '模块包',
      question: '一个模块里该放哪些图？',
      summary: '先 architecture + 一张深图；仅在需要时再加 dataflow/workflow。',
      useWhen: '在图谱里收敛单个子模块范围。',
      avoidWhen: '总览还没定就不要先铺满五类。',
      include: ['architecture', 'sequence|lifecycle|workflow|dataflow 之一'],
      prompt:
        '针对这个模块，用 archifyX 交付 architecture 和一张深图（sequence 或 lifecycle），节点控制在 12 以内，并写入 atlas 的 diagrams。'
    }
  }
];

export default PLATFORM_RECIPES;
