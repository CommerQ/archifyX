# 写作手册 — archifyX

## 平台图谱（多模块）

1. 用内置引擎交付总览 architecture HTML  
2. 编写 `<name>.platform.atlas.json`  
3. 声明模块 / `children` / 各类型图（可为 `planned`）  
4. `validate` → `build-index` → 打开 `index.html`  
5. 陆续 `deliver` 叶子图并重建，替换占位页  

## 单图

五种类型仍走内置引擎：`validate-diagram` / `deliver`。  
字段形状看 `engine/schemas/` 与 `engine/examples/`。

## 配方

- 平台：`archifyX/recipes/`  
- 单图场景：`engine/recipes/`，或 `archifyX guide "…"`

## 原则

- 嵌套子包，占位永不 404  
- 左侧树主导航  
- 每张叶子图控制在 showcase 规模  
- 顶栏深色 + 青点为产品锁定样式  

English: [authoring-cookbook.md](./authoring-cookbook.md)
