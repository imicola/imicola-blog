# PATCHES.md — 相对 Shirone 上游的本仓库魔改清单

> 用途：Shirone 处于 alpha，跟进上游（`git fetch shirone && git merge shirone/main`）时，
> 下列文件可能产生冲突。升级前逐项过一遍此清单，重放/复核改动。
> 基座 commit：`6fa30531602e3ba35cf726cceb9da3940ded0344`（shirone/main, 2026-10-21 迁移时）
> 原始 diff 来源：Mizuki 侧 `mizuki-final` tag 与初始导入 commit 的差值。

| # | 文件 | 改动摘要 |
|---|---|---|
| 1 | `src/content.config.ts` | posts schema 新增文章级元数据字段：`author / sourceLink / licenseName / licenseUrl`（string, default ""）与 `aiLevel`（int 0-3, optional，AI 参与度） |
| 2 | `src/components/molecules/AiParticipation.astro` | 新增组件（自 Mizuki `src/components/misc/AiParticipation.astro` 移植）：AI 参与度卡片，Lv.0-3 四档文案；依赖 astro-icon `material-symbols:auto-awesome-rounded` 与主题 CSS 变量 |
| 3 | `src/pages/posts/[...slug].astro` | ① import AiParticipation 并在正文元信息后、封面渲染前条件渲染（`typeof entry.data.aiLevel === "number"`）；② License 调用透传 `author / sourceLink / licenseName / licenseUrl` |
| 4 | `src/components/molecules/License.astro` | 新增 4 个可选 props（author/sourceLink/licenseName/licenseUrl）：作者回退 profileConfig.name，链接 sourceLink 优先，版权名/URL 文章级优先、站点级 licenseConfig 兜底（licenseName 存在而 licenseUrl 为空时不输出链接） |
| 5 | `src/plugins/markdown/remark-admonitions.mjs` | GitHub Alerts 增强（自 Mizuki `remark-fix-github-admonitions.js` 移植适配）：① `GITHUB_ALERT` 放开类型白名单，未知类型经 `ALERT_TYPE_FALLBACK` 映射（danger/error/bug→caution、success/hint→tip、question/abstract/example→info 等），未映射类型回退 note，标题显示首字母大写原类型名；② 识别 `[!type]+` / `[!type]-` 折叠标记 → 输出 `admonition-details` 指令（`+` 附加 `open` 属性）；③ 行内标题 `[!type] 自定义标题` → `attributes.title` |
| 6 | `src/plugins/rehype-component-admonition.mjs` | details 分支支持 `properties.open` → `<details open>`（配合 #5 的 `[!type]+` 默认展开） |
| 7 | `src/layouts/Layout.astro` | `<head>` 注入 umami 统计脚本（website-id `08c978b1-650d-45ef-ac92-9e4ea0a0ff90`，自 Mizuki 迁移） |
| 8 | `src/config/fontConfig.ts` | body/cjk 角色替换为 MapleMono（`src/assets/fonts/MapleMono-SC-NF-Regular.ttf` / `MapleMono-NF-CN-Medium.ttf`），mono 保留 JetBrains Mono |
| 9 | 配置目录 `src/config/*` | 站点身份/导航/番剧/公告/音乐等业务配置改写为 imicola 值（非结构性魔改，升级冲突时以业务值优先重放） |

## 行为约定（与 Mizuki 一致，验收基线）

- `[!note]-`：收起面板，summary 显示 NOTE；`[!note]+`：展开面板（`<details open>`）。
- `[!note]+ 什么是 docker compose ?`：展开面板，summary 显示"什么是 docker compose ?"。
- `[!danger]`：普通 admonition（caution 配色），标题显示 Danger。
- `[!Tip]` 大小写不敏感，渲染 tip。
- 未设置 `aiLevel` 的文章不显示 AI 参与度卡片。

## 与上游的重要契约差异（升级时注意）

1. **加密契约（fail-closed）**：Shirone 判定加密文章的条件是 **frontmatter 存在非空 `password`**（`src/utils/post-encryption.ts`），与 Mizuki 的 `encrypted: true` 语义不同。迁移时已清除 6 篇 `encrypted: false` + 残留 `password: imicola` 的字段；**爱国公司CloseAI食用指南** 与 **继续在21世纪活下去** 两篇为真加密（保留）。若文章误带 password 字段，正文会整页进入加密路径（视觉上表现为"内容消失"）。
2. **CRLF 文章**：源文件多为 CRLF 行尾，mdast 的 text value 会保留 `\r`，`remark-admonitions.mjs` 已在取声明行时剥离（`declaration.replace(/\r$/, "")`）。
3. **本地 `.npmrc` 的 `public-hoist-pattern[]=cookie`**：本机 home 目录残留 `~/node_modules/cookie@0.7.2`（CJS）会被构建产物的 Node 模块解析链命中，与 Astro 7 需要的 cookie@2.x（ESM）冲突报 `Named export 'parseCookie' not found`；hoist 正确版本到项目顶层屏蔽。CF Pages 干净环境理论上不需要，保留无害。
4. **渲染缓存位置**：改 markdown 插件源码后，需删除 `node_modules/.astro`（content layer data store）才能让改动生效——`.astro`（项目根）与 `node_modules/.vite` 都不够。
