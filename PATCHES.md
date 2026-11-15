# PATCHES.md — 相对 Shirone 上游的本仓库魔改清单

> 用途：跟进上游（`git fetch shirone && git merge shirone/main`）时，下列文件可能产生冲突。
> 升级前逐项过一遍此清单，重放/复核改动。
> 基座 commit：`25fb1a81`（shirone/main, Shirone v2.0.0, 2026-11-15 合并；上一基座 `6fa3053`）
> 历史来源：Mizuki 侧 `mizuki-final` tag 与初始导入 commit 的差值。

## 存量魔改（合并后仍有效）

| # | 文件 | 改动摘要 |
|---|---|---|
| 1 | `src/content.config.ts` | ① posts schema 保留文章级元数据 `author / sourceLink / licenseName / licenseUrl` 与 `aiLevel`（int 0-3, optional，AI 参与度），与上游 `license` 覆写字段并存（见 #3 适配器）；② posts glob loader 增加 `generateId` **保留原始文件名作为 id**——Astro glob loader 默认 slugify（ASCII 小写化、剥离括号等标点）会把已上线文章的 URL 改掉（如 `用Go写一个K8s维护控制器(上)` → `用go写一个k8s维护控制器上`），外链与搜索引擎收录全部 404 |
| 2 | `src/components/molecules/AiParticipation.astro` | 新增组件（自 Mizuki 移植）：AI 参与度卡片，Lv.0-3 四档文案；图标用 `@iconify/svelte` 的 `material-symbols:auto-awesome-rounded`（v2.0 弃用 astro-icon 后改写） |
| 3 | `src/pages/posts/[...slug].astro` | ① AiParticipation 条件渲染（`typeof entry.data.aiLevel === "number"`，正文元信息后、封面渲染前）；② `legacyLicenseOverride` 适配器：把 Mizuki 迁移的 4 个 license 字段翻译成上游 `resolveLicenseConfig` 的覆写格式（文章若显式写了上游 `license:` 字段则优先）；③ 加密文章（`isEncrypted && hideHomeContent`）字数/阅读时长徽章显示 `-`，不泄露统计信息（上游模板无此遮蔽） |
| 4 | `src/plugins/markdown/remark-admonitions.mjs` | GitHub Alerts 增强：① 未知 alert 类型经 `ALERT_TYPE_FALLBACK` 映射（danger/error/bug→caution、success/hint→tip、question/abstract/example→info 等），未映射回退 note；② `[!type]+` / `[!type]-` 折叠标记 → `<details>`（`+` 默认展开）；③ 行内标题 `[!type] 自定义标题` |
| 5 | `src/plugins/markdown/rehype-component-admonition.mjs` | details 分支支持 `properties.open` → `<details open>`（配合 #4 的 `[!type]+`） |
| 6 | `src/layouts/Layout.astro` | `<head>` 手动注入 umami 统计脚本（website-id `08c978b1-…`）。上游 v2.0 的 `umamiConfig` 集成需要 umami 后台创建公开分享链接（`shareUrl`）才会启用，未创建前保留手动注入；迁移条件成熟后可删除此行改用 `src/config/umamiConfig.ts` |
| 7 | `src/config/fontConfig.ts` | body/cjk 角色为 MapleMono（`src/assets/fonts/MapleMono-SC-NF-Regular.ttf` / `MapleMono-NF-CN-Medium.ttf`），mono 保留 JetBrains Mono（已适配上游 v2.0 的角色制字体结构） |
| 8 | 配置目录 `src/config/*` | 站点身份/导航/番剧/公告/音乐等业务配置为 imicola 值（结构随上游，值以本站优先重放）；musicConfig 的 meting API 用 injahow 镜像（原域名失效） |
| 9 | `src/utils/mermaid.ts` | `parseSvg` 严格 XML 解析失败后的 `text/html` 回退（Mermaid htmlLabels 输出未闭合 `<br>` 导致全站图表不渲染）；上游 v2.0 重写了对比度主题，此修复已随合并保留 |
| 10 | `pnpm-workspace.yaml` | 追加 `publicHoistPattern: [cookie]`：把 cookie@2.0.1 提升到仓库 node_modules 根（pnpm 11 不再读 `.npmrc` 的 public-hoist-pattern，配置须落在本文件），屏蔽宿主目录残留的旧版 cookie（见契约差异 #3） |
| 11 | `src/plugins/markdown/manifest.json` | 指向演示文章的 `docs` 数组清空（本站删除了上游 demo posts，`pnpm check:manifest` 要求 docs 路径存在；上游恢复 demo 帖后可在冲突时重放清空） |
| 12 | `public/assets/banner/{desktop,mobile}/` | 本站 13 张自定义 banner 保留 public 路径引用（上游推荐 src/assets 以获得构建期响应式优化，public 路径仍受支持、仅不生成候选） |
| 13 | `.node-version` = `26.13.0` | Cloudflare Pages 构建环境 Node 版本（跟随上游 engines） |

## 已收编上游（不再维护本地补丁）

- **License.astro 文章级覆写**：上游 `e6ba8a53`+`7270030c` 实现了 frontmatter `license:` 覆写（含 author/source），本站旧的 4-prop 补丁已删除，改用适配器方案（#3②）保持旧 frontmatter 兼容、避免全站文章批量迁移。
- **fancybox CSS 静态导入修复**：上游 `33a2bde0` 与本站 2d90b4d3① 等价，已采上游。
- **图标系统**：上游 v2.0 弃用 astro-icon 改为内置生成 + `@iconify/svelte`；生成文件 `src/generated/local-icon-collections.ts` 已被上游 gitignore（本仓库历史遗留的行尾幻影改动随之消失）。

## 行为约定（验收基线）

- `[!note]-`：收起面板，summary 显示 NOTE；`[!note]+`：展开面板（`<details open>`）。
- `[!note]+ 什么是 docker compose ?`：展开面板，summary 显示"什么是 docker compose ?"。
- `[!danger]`：普通 admonition（caution 配色），标题显示 Danger。
- `[!Tip]` 大小写不敏感，渲染 tip。
- 未设置 `aiLevel` 的文章不显示 AI 参与度卡片。
- 文章 URL = 原始文件名（大小写/括号原样），见 #1②。

## 与上游的重要契约差异（升级时注意）

1. **加密契约（fail-closed）**：判定加密的条件是 frontmatter **存在非空 `password`**（`src/utils/post-encryption.ts`），与 `encrypted` 标志无关；不加密的文章不要留 password 字段。真加密文章：爱国公司CloseAI食用指南、继续在21世纪活下去。
2. **CRLF 文章**：源文件多为 CRLF 行尾，mdast 的 text value 会保留 `\r`，`remark-admonitions.mjs` 已在取声明行时剥离。
3. **cookie 解析劫持**：本机 home 目录残留 `~/node_modules/`（cookie@0.7.2 等），会被构建产物的 Node 模块解析链命中，与 Astro 7 需要的 cookie@2.x 冲突报 `Named export 'parseCookie' not found`。已用 pnpm-workspace.yaml 的 publicHoistPattern 屏蔽（#10）；彻底解决需清理 `~/node_modules`（待站长处理）。CF Pages 干净环境不受影响。
4. **渲染缓存位置**：改 markdown 插件源码后，需删除 `node_modules/.astro`（content layer data store）才能让改动生效；改 `content.config.ts`（含 generateId）需重启 dev server。
5. **URL 规范化差异**：上游默认 slugify 文章 id（小写化/去标点），本站必须保留 generateId 补丁（#1②），否则全站 URL 变更。上游 permalink 功能（`permalinkConfig`，默认关闭）与原始 id 兼容，如启用 `%raw_postname%` 保留大小写。
6. **工具链**：Node ≥ 26.13.0（本机 nvm 已装 26.13.0），pnpm 11.28.2（lockfile v11）。上游 CI 门禁：astro check、svelte-check、biome ci、manifest/skills/font 校验。
