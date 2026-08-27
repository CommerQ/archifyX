# archifyX 完整度对照（相对 Archify）

目标：成为**可发布的独立产品仓**，不是抄全 Archify 的研究史。

图例：✅ 已有 · 🔧 需补（完整产品） · ⏳ 可后补 · ❌ 不必搬

---

## A. 产品仓根目录（`D:\workspace\archify` → `archifyX`）

| 项 | Archify | archifyX | 判定 |
|---|---|---|---|
| Skill 包目录 | `archify/` | `archifyX/` | ✅ |
| PRODUCT / DESIGN / ROADMAP / CONTRIBUTING | ✅ | ✅ | ✅ |
| README 双语 | ✅ | ✅ | ✅ |
| CHANGELOG / LICENSE | ✅ | ✅ + NOTICE | ✅ |
| `package.json` + smoke | ✅ | 弱 | 🔧 加强 |
| `.github/` CI + Issue/PR 模板 | ✅ | ❌ | 🔧 **必须** |
| `docs/` 官网入口 guide/gallery/start | ✅ | 仅 quickstart | 🔧 **必须**（可先静态页） |
| `docs/assets` 视觉素材 | ✅ | ❌ | 🔧 **必须**（可先占位） |
| `docs/authoring-cookbook` | ✅ | ❌ | 🔧 **必须** |
| 根 `examples/` 可提交成品 | ✅ | 仅 gitignore demo-out | 🔧 **必须** |
| `scripts/build-gallery|guide|start` | ✅ | ❌ | 🔧 **必须**（可生成静态页） |
| `scripts/package-smoke` 发布门禁 | 强 | 弱 | 🔧 **必须** |
| `scripts/run-tests` | ✅ | ❌ | 🔧 **必须** |
| `integrations/` | ✅ | ❌ | ⏳ 生态后再做 |
| `benchmarks/` | ✅ | ❌ | ⏳ |
| `experiments/` | ✅ | ❌ | ❌ 研究场，不搬 |
| `docs/research-*` 数十篇 | ✅ | ❌ | ❌ 不搬 |
| `archify.zip` 发行物 | ✅ | ❌ | ⏳ release 时再做 |

---

## B. Skill 包内（引擎能力）

Archify 的 `renderers/ brand-marks/ delta/ recipes/ test/` 在我们这边应落在 **`archifyX/engine/`**（已内置），不必在 skill 根再抄一份。

| 项 | 位置 | 判定 |
|---|---|---|
| 五图渲染 / validate / deliver | `engine/` | ✅ 已用上 |
| schemas / references（叶子） | `engine/` | ✅ |
| brand-marks / delta | `engine/` | ✅（能力在，文档入口弱） |
| recipes（场景选图） | `engine/recipes` | 🔧 skill 层要有入口 + **平台 atlas 配方** |
| engine `test/` | `engine/test` | ⏳ CI 里再挂；发布 ZIP 可不带 |
| Platform Viewer | `assets/` + `scripts/atlas.mjs` | ✅ **我们的特点** |
| Platform atlas schema / examples | ✅ | ✅ |
| Platform `test/`（atlas build） | ❌ | 🔧 **必须** 少量冒烟 |

---

## C. 「没用上」但其实已有的

这些在 `engine/` 里，只是**产品文档/CLI 入口没讲清楚**：

- `engine/recipes` → `guide` 命令
- `engine/brand-marks` → `brands` 命令
- `engine/delta` → 架构差分（CLI 若未暴露需补 `diagram` 透传）
- `engine/test` → 未进根仓 CI

---

## D. 完整产品最低闭环

| # | 项 | 状态 |
|---|---|---|
| 1 | `.github/` CI + Issue/PR 模板 | ✅ |
| 2 | `docs/` index/guide/start/gallery + cookbook | ✅ |
| 3 | 根 `examples/platform-atlas/` 可打开成品 | ✅（`npm run build:docs`） |
| 4 | `scripts/build-docs` + `run-tests` + 加强 smoke | ✅ |
| 5 | `archifyX/recipes/` 平台配方 | ✅ |
| 6 | `archifyX/test/atlas-smoke.mjs` | ✅ |
| 7 | 只保留 `D:\workspace\archifyX`（删旧 archify-platform） | ⏳ 人工清理 |

### 仍属后补（完整度增强，非阻塞发布）

- docs/assets 真实截图 / hero
- guide CLI 合并 platform recipes
- engine 全量 test 进 CI
- integrations / benchmarks / release zip
- GitHub Pages 发布 docs/

---

## E. 明确不做（避免虚胖）

- 复制 40+ 篇 `research-visual-evolution-round-*`
- 复制 `experiments/`、赞助商页、Trendshift 徽章依赖
- 把 engine 再扁平复制到 skill 根（保持 `engine/` 边界）
