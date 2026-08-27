# archifyX 完整度对照（相对 Archify）

目标：成为**可发布的独立产品仓**，不是抄全 Archify 的研究史。

图例：✅ 已有 · ⏳ 可后补 · ❌ 不必搬

---

## A. 产品仓根目录

| 项 | Archify | archifyX | 判定 |
|---|---|---|---|
| Skill 包目录 | `archify/` | `archifyX/` + `engine/` | ✅ |
| PRODUCT / DESIGN / ROADMAP / CONTRIBUTING | ✅ | ✅ | ✅ |
| README 双语 | ✅ | ✅ | ✅ |
| CHANGELOG / LICENSE | ✅ | ✅ + NOTICE | ✅ |
| `package.json` + smoke / pack | ✅ | ✅ | ✅ |
| `.github/` CI + Release + Issue/PR | ✅ | ✅ | ✅ |
| `docs/` index/guide/start/gallery | ✅ | ✅ 生成 Proof Lab | ✅ |
| `docs/authoring-cookbook` + present | ✅ | ✅ | ✅ |
| 根 `examples/` | leaf + delta | platform-atlas + architecture-delta | ✅ |
| `scripts/build-gallery\|guide\|docs\|zip` | ✅ | ✅ | ✅ |
| `integrations/` | ✅ | ❌ | ⏳ 生态后再做 |
| `benchmarks/` / `experiments/` / research | ✅ | ❌ | ❌ 不搬 |
| `archify.zip` 发行 | ✅ | ✅ tag → `archifyX.zip` | ✅ |

---

## B. Skill / 引擎能力入口

| 项 | 判定 |
|---|---|
| 五图 validate / deliver / preview | ✅ CLI |
| `compare` 架构差分 | ✅ 一等命令 + cookbook + example |
| `guide` 合并平台 + 叶子配方 | ✅ |
| `brands` / `visual-check` | ✅ CLI + cookbook |
| brand-marks / viewer-runtime 引用 | ✅ skill `references/` 指针 |
| Platform Viewer SPA | ✅ |
| Proof Lab gallery（叶子 + atlas + delta） | ✅ |
| engine 全量 golden test 进 CI | ⏳ 子集后补 |

---

## C. 明确不做

- 复制 `docs/research-*`、`experiments/`、赞助商页
- 把 `renderers/` 扁平搬到 skill 根（保持 `engine/` 边界）
- 每个 PR 跑全量 engine 70+ 测试
