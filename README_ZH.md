<p align="center">
  <a href="./README.md">English</a> · <strong>简体中文</strong>
</p>

# archifyX

**archifyX**（Archify eXtension）— 独立平台图谱的短名：嵌套模块树 + 五种技术图 + 可交互 HTML。自包含 Skill/CLI，**不需要安装外部 Archify**。

- **Atlas SPA** — 深色顶栏 · 嵌套树 · iframe 舞台 · `?view=` 深链
- **五种图** — 架构 / 工作流 / 时序 / 数据流 / 生命周期（行内 A/W/S/D/L）
- **占位永不 404**
- **内置图引擎** — `deliver` / 主题 / 预设 / 演示 / 导出均在 `archifyX/engine/`
- **命名** — **X** = 对 Archify 单图能力的 **eXtension**（扩展到多模块图谱导航）；比 `archify-platform` 更短

![License](https://img.shields.io/badge/license-MIT-22c55e?style=flat-square)
![Self-contained](https://img.shields.io/badge/runtime-self--contained-0ea5e9?style=flat-square)

详见 [NOTICE.md](NOTICE.md) · [PRODUCT.md](PRODUCT.md) · [CHANGELOG.md](CHANGELOG.md)

## 快速开始

只需 Node ≥ 18：

```bash
cd archifyX
node bin/archifyX.mjs doctor
node bin/archifyX.mjs demo ../examples/demo-out
```

对 Agent 说：`用 archifyX 给这个仓库做平台图谱。`

## 安装 Skill

完整矩阵见 [docs/install.md](docs/install.md) · [docs/start.html](docs/start.html)

```bash
# 推荐 — skills CLI
npx -y skills add CommerQ/archifyX --skill archifyX --agent cursor --global --copy --yes

# 或本仓库打包安装（正式 ZIP 用 Node 22）
npm run pack:local
npm run install:skill -- --agent cursor --from archifyX.zip --force
```

Windows 开发联接：

```bat
mklink /J "%USERPROFILE%\.cursor\skills\archifyX" "D:\workspace\archifyX\archifyX"
```

## 产品特点

1. 嵌套模块树主导航  
2. 深色顶栏 + 青色品牌圆点  
3. 行内 A/W/S/D/L；未交付占位  
4. 演示模式收起顶栏与树  
5. **完全自包含**，无 peer 外部引擎

## License

MIT。引擎来源说明见 [NOTICE.md](NOTICE.md)。
