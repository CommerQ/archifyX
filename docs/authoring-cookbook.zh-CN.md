# 写作手册 — archifyX

## 平台图谱（多模块）

1. 用内置引擎交付总览 architecture HTML  
2. 编写 `<name>.platform.atlas.json`  
3. 声明模块 / `children` / 各类型图（可为 `planned`）  
4. `validate` → `build-index` → 打开 `index.html`  
5. 陆续 `deliver` 叶子图并重建，替换占位页  

```bash
node bin/archifyX.mjs deliver architecture overview.json overview.html --quality showcase --json
node bin/archifyX.mjs validate atlas.json --json
node bin/archifyX.mjs build-index atlas.json index.html --json
```

## 单图

```bash
node bin/archifyX.mjs validate-diagram <type> candidate.json --quality showcase --json
node bin/archifyX.mjs deliver <type> candidate.json out.html --quality showcase --json
node bin/archifyX.mjs visual-check out.html --json
```

字段形状看 `engine/schemas/` 与 `engine/examples/`。

## 架构差分（compare）

```bash
node bin/archifyX.mjs compare architecture base.json head.json delta.html --quality showcase --json
```

示例对：`engine/examples/checkout-platform.{base,head}.architecture.json` →
`examples/architecture-delta/`。

## Guide / 品牌 / 演示模式

```bash
node bin/archifyX.mjs guide "平台图谱" --json
node bin/archifyX.mjs brands "Claude" --json
```

演示模式与预设：[present-mode.md](./present-mode.md)。  
引用：`archifyX/references/viewer-runtime.md`、`brand-marks.md`。

## 配方

- 平台：`archifyX/recipes/`（已并入 `guide`）  
- 单图：`engine/recipes/` + Proof Lab `docs/gallery.html`

## 原则

- 嵌套子包，占位永不 404  
- 左侧树主导航  
- 每张叶子图控制在 showcase 规模  
- 顶栏深色 + 青点为产品锁定样式  

English: [authoring-cookbook.md](./authoring-cookbook.md)
