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

- `[!note]-`：收起面板，summary 显示 NOTE；`[!note]+`：展开面板。
- `[!note]+ 什么是 docker compose ?`：展开面板，summary 显示"什么是 docker compose ?"。
- `[!danger]`：普通 admonition（caution 配色），标题显示 Danger。
- `[!Tip]` 大小写不敏感，渲染 tip。
- 未设置 `aiLevel` 的文章不显示 AI 参与度卡片。
