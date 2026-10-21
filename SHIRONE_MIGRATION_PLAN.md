# Mizuki → Shirone 架构升级迁移计划

> 目标：将本博客从 Mizuki v8.3（Astro 5）整体升级到 [Shirone](https://github.com/matsuzaka-yuki/Shirone)（Astro 7 / Material 3 Expressive）。
> 原则：**文章与站点配置带走，实验性内容（重庆旅游、daily RSS、flashcards、canvas 实验室等）不迁移**。
> 部署：继续使用当前 Cloudflare Pages 项目（已连接本仓库），通过分支 + 预览部署完成灰度切换。
> 本计划基于 2026-10-21 对两边仓库的实际代码调研，所有"已验证"结论均来自源码比对，非推测。

---

## 1. 两套架构对照

| 维度 | 当前（Mizuki v8.3） | 目标（Shirone alpha） |
|---|---|---|
| Astro | 5.18.0 | 7.2.6 |
| Svelte / Tailwind | 5 / 4 | 5 / 4.3 |
| Node 要求 | 18+ 即可 | **≥ 22.12（硬性要求）** |
| pnpm | `pnpm@10.22.0` | `pnpm@9.14.4`（packageManager 锁定） |
| 配置入口 | 单文件 `src/config.ts`（666 行） | 配置目录 `src/config/*Config.ts`（约 20 个领域文件） |
| 数据 | `src/data/*.ts` | `src/data/*.ts`（结构同款，同作者设计，便于互迁） |
| 文章 schema | `src/content.config.ts` | 兼容（见 §2 预检结论） |
| 番剧数据 | 构建时实时拉 Bangumi/Bilibili API（需 SESSDATA） | 快照模式：`pnpm anime:sync` 生成 `src/data/anime-snapshots/`，构建零网络请求 |
| 代码风格工具 | Prettier + ESLint（ESLint 实际未配置） | Biome（`biome.json`） |
| 字体压缩 | `scripts/compress-fonts.js`（fontmin） | 内置 `fonts:subset`（subset-font） |
| 特有系统 | 全屏壁纸、樱花特效、看板娘(pio)、PicFlow、canvas 文章、flashcards | HCT 动态配色（M3 Expressive）、背景纹理系统、FAB、moments（即刻/日记）、Swup 视图过渡 |

两个主题同出 Fuwari 系且同一作者（matsuzaka-yuki），Shirone 的 `src/data/friends.ts` 注释明确写着"结构与 Mizuki 同款，便于互相迁移"，迁移路径是被上游设计过的，整体风险可控。

---

## 2. 兼容性预检结论（已验证）

1. **文章 frontmatter 基础字段兼容**：Shirone 的 posts schema 覆盖 `title / published / updated / pinned / draft / comment / description / image / tags / category / lang` 及加密字段，与现有 22 篇文章完全兼容。Mizuki 特有字段中，`aiLevel / author / sourceLink / licenseName / licenseUrl` 处于**活跃使用**状态（详见 §3.4 魔改移植方案，需移植）；`priority / canvas / date / pubDate` 零文章使用，被 Zod 静默剥离即可。
2. **文章 URL 不变**：无任何文章使用 `permalink:` / `alias:`（已 grep 全量确认）；两边同为 Astro glob loader 默认 slugify，`/posts/<目录名>/` 结构保持。
3. **封面相对路径兼容**：现有文章封面写作 `image: "./cover.jpg"`，Shirone 的 `ImageWrapper` 通过 `entry.filePath` 作为 `basePath` 解析相对路径（`src/pages/posts/[...slug].astro:80,186`），并自动生成 AVIF/WebP 响应式候选。
4. **正文内相对图片兼容**：`![alt](image.png)` 同目录引用由 Astro content collections 原生处理。
5. **⚠️ glob 差异坑（需处理）**：Mizuki 只收录 `**/index.md`，Shirone 收录 `**/*.{md,mdx}`。存在一个漏网文件 `src/content/posts/简单的端口查询Lab/什么是Proc.md`——它在当前站点**不渲染**，直接拷过去会被 Shirone 当成新文章发布。迁移时须删除或改名合并（见 Phase 2）。
6. **友链数据零改动**：`src/data/friends.ts` 的 `FriendItem` 接口两边完全一致，整文件直接拷贝即可。
7. **`.canvas` 文件**（Obsidian 白板，3 处）不匹配 `*.md`，不会被收录，可保留亦可顺手清理。

---

## 3. 迁移范围清单

### 3.1 保留并迁移

| 内容 | 来源 | 去向 |
|---|---|---|
| 22 篇文章及目录内图片 | `src/content/posts/*` | 原样拷贝（处理 §2.5 所述例外） |
| 关于页 | `src/content/spec/about.md` | Shirone `src/content/spec/about.md`，文中"博客由 mizuki 构建"及 `::github{repo}` 指向改为 Shirone |
| 友链 | `src/data/friends.ts` | 原样拷贝 |
| 站点内容数据 | `src/data/{anime,projects,skills,timeline,devices}.ts`、`bangumi-data.json` | 拷贝 / 重跑快照（见 §5 anime 说明） |
| 横幅图集 | `public/assets/{desktop,mobile}-banner/` | 拷贝；有精力可移入 `src/assets/images/banner/` 以启用构建期 AVIF/WebP 优化（Shirone siteConfig 推荐） |
| Logo / 头像 / home 图 | `public/assets/home/`、`public/favicon/` | 拷贝 |
| 自定义字体 | `public/assets/font/MapleMono-*.ttf`（2 个，共 4 个 ttf 按需） | 拷贝 + 在 `fontConfig.ts` 配置（ZenMaruGothic、萝莉体若仍需要一并拷） |
| 站点配置 | `src/config.ts` | 按 §4 映射表改写为 `src/config/*` |
| RSS/Atom CORS | `public/_headers` | 原样拷贝 |

### 3.2 明确丢弃（不迁移）

- **页面**：`chongqing.astro`、`pages/daily/`（daily RSS）、`flashcards.astro`、`pages/canvas/`、`pages/og/`、`hub.astro`、`latex.astro` + `spec/latex.md`、`pretext-editorial-lab` 相关。
- **数据**：`src/data/chongqing.ts`、`src/data/flashcards.ts`。
- **public**：`public/chongqing/`、`public/rss-daily/`、`public/pio/`（看板娘）、`sakura.png`、`scroll-protection.js`。
- **脚本**：`sync-content.js`、`init-content-repo.js`（未启用内容分离，直接砍）、`update-anime/bangumi/bilibili.mjs`（被 `anime:sync` 取代）、`compress-fonts.js`（被 `fonts:subset` 取代）、`indexnow-submit.js`（SEO 提交，暂不带）、`parse-flashcards.mjs`。
- **配置块**：`fullscreenWallpaperConfig`、樱花/波浪特效、PicFlow、`pageScaling`、Mizuki 的 navbarTitle 模式（Shirone 用 profileConfig/logo 体系）。

### 3.3 默认关闭/视 决策项处理

- `diary.astro` + `src/data/diary.ts`：Shirone 对应物是 **moments**（`src/content/moments/*.md`，frontmatter：published/mood/tags/images）。若要保留需做一次数据格式转换；默认**不迁移**（见 §7 决策项 D1）。
- `devices` 页：当前 config 中本就关闭（`devices: false`），Shirone 有 `devicesConfig`，保持关闭、仅拷贝数据文件备查。

### 3.4 自定义魔改移植方案（对 upstream Mizuki 全量 diff 核实）

> 方法：`git diff <初始导入 commit> master -- src/`，已逐文件核对。魔改共 38 个文件，剔除实验类（canvas/chongqing/flashcards/hub/latex 及配套 i18n key）后，核心魔改分三组：**移植（5 项）/ 不移植（已被 Shirone 原生覆盖）/ 丢弃**。

#### A. 移植项

| # | 魔改 | 使用面 | 移植方式（目标文件均在 Shirone 侧） |
|---|---|---|---|
| A1 | **AI 参与度标识**（`AiParticipation.astro` 42 行 + `aiLevel` schema 字段 + 文章页渲染块） | 7 篇文章 | ① Shirone `src/content.config.ts` posts schema 加 `aiLevel: z.number().int().min(0).max(3).optional()`；② 组件整文件拷贝——已验证其依赖全部满足：图标 `material-symbols:auto-awesome-rounded`（Shirone 有该图标集）、CSS 变量 `--license-block-bg / --btn-regular-bg / --btn-content / --line-divider / --primary`（已确认存在于 Shirone `variables.styl`，8 处匹配）；③ 在 Shirone `src/pages/posts/[...slug].astro` 正文区（封面渲染之前）插入与 Mizuki 相同的 3 行条件渲染 |
| A2 | **增强版 GitHub Alerts 解析器**：`[!type]+/-` 折叠标记、行内自定义标题、未知类型容错（如 `[!danger]`） | 12 篇用 alerts，其中 3+ 篇用折叠标记/自定义标题，存在 `[!danger]`、`[!Tip]` 等大小写与非标准类型 | 改造 Shirone `src/plugins/markdown/remark-admonitions.mjs`（仅 109 行，是 Shirone 自己的插件，非 npm 包）：① regex 类型白名单放开，未知类型回退 note 样式 + 首字母大写标题（`danger` 建议映射 `caution` 配色）；② 识别 `[!type]+` / `[!type]-` → 输出 `admonition-details` 指令——Shirone 的 `markdown-processor.mjs:90` 已注册 `admonition-details` → 渲染为**原生 `<details>/<summary>`，零 JS**；③ 行内标题与大小写不敏感 Shirone 已原生支持（`{title="..."}`），无需处理 |
| A3 | **文章级 License/作者信息**（`author / sourceLink / licenseName / licenseUrl` frontmatter + License 组件展示） | 5+ 篇设置 `licenseName: CC BY 4.0 / MIT`、`author: imicola` | Shirone 的 License 只有站点级（`licenseConfig`）。① schema 加 4 个 optional 字段；② 参考现 `src/components/misc/License.astro`（props：author/sourceLink/licenseName/licenseUrl，回退站点级配置）扩展 Shirone 的 License 组件；③ 文章页调用处透传 |
| A4 | **umami 统计脚本**（Layout.astro `<head>` 内一行，website-id `08c978b1-650d-45ef-ac92-9e4ea0a0ff90`） | 全站 | 加到 Shirone `src/layouts/Layout.astro` 的 `<head>`（约 85 行处），defer + `is:inline` 保持一致 |
| A5 | **MapleMono 字体 @font-face**（main.css 内 MapleMono-SC-NF-Regular / MapleMono-NF-CN-Medium 声明） | 全站 | Shirone 用 `fontConfig.ts` + `fonts:subset` 体系，不走 main.css @font-face；拷 ttf 后在 fontConfig 按其注释配置 |

#### B. 不移植（已被 Shirone 原生覆盖或验证后按需）

| 魔改 | 结论 |
|---|---|
| **ImageWrapper 相对路径修复**（`/src/` 前缀 glob key，修上游 filePath 解析 bug） | Shirone 在**调用侧**已修复同一问题（`posts/[...slug].astro:80` 用 `path.relative` 归一化 basePath），封面相对路径原生可用。不主动移植；Phase 4 若遇封面解析失败，套用你的修复（3 行改动，你已在 Mizuki 验证过） |
| **admonition-collapse.js**（107 行前端折叠 JS）+ **markdown-extend.styl**（31 行折叠样式） | 由 A2 映射到 Shirone 原生 `<details>` 后**整组不需要**——原生语义无需 JS 与额外样式 |
| **TOC 滚动修复**（max-height calc，5 行 CSS） | Shirone TOC 已重写（`SidebarTOC.astro`），问题大概率不存在；Phase 4 验证溢出再移植 |
| **posts glob 收窄 `**/index.md`** | 保持 Shirone 原生 `**/*.{md,mdx}` + 删除漏网文件（§2.5 / Phase 2 已列） |
| `alias / permalink / priority / canvas` frontmatter 字段及 `[permalink].astro` 页面 | 零文章使用（已全量 grep），Shirone 亦无此页面，不带 |
| i18n 新增 key（19 个，全为 canvas/latex 服务） | 属丢弃实验，不带 |

#### C. 魔改维护约定（新增风险应对）

A1–A5 共触及 Shirone 源码 6 个文件（`content.config.ts`、`remark-admonitions.mjs`、License 组件、`posts/[...slug].astro`、`Layout.astro`、`fontConfig.ts`）。日后 `git merge upstream/main` 跟进主题升级时这些文件可能冲突，因此在仓库根维护 **`PATCHES.md`**：记录每个魔改文件的改动摘要与 Mizuki 侧原始 diff 来源，升级时按清单逐个重放/复核。

---

## 4. 配置迁移映射表（Mizuki `src/config.ts` → Shirone `src/config/`）

| 当前配置（src/config.ts） | 值 | Shirone 目标文件 | 备注 |
|---|---|---|---|
| title / subtitle | `imicola` / `人,进来` | `siteConfig.ts` | subtitle 进 banner.homeText 或 profile |
| siteURL | `https://blog.imicola.com/` | `siteConfig.ts` 的 `site` | astro.config sitemap 联动 |
| lang | `zh_CN` | `siteConfig.ts` 的 `lang` | |
| themeColor.hue | 345 | `siteConfig.ts` themeColor（hue 345） | Shirone 新增 style/spec 选项，默认值即可 |
| banner 图集 + homeText（标题"imicola的猫咖"+ 4 条副标题打字机） | — | `siteConfig.ts` banner | desktop/mobile 数组照搬；homeText.typewriter 对应迁移 |
| toc（enable/sidebar/depth 2） | — | `siteConfig.ts` toc | |
| favicon | 默认 | `siteConfig.ts` favicon | 拷 `public/favicon/` 后按需填 |
| profile（头像/社交链接） | — | `profileConfig.ts` | |
| navBarConfig.links（Home、Archive、Links 菜单→GitHub/Bilibili、My 菜单→Anime/Diary/Gallery…） | — | `navBarConfig.ts` | LinkPresets 机制相同；**剔除 Diary/实验页入口** |
| 侧栏 widget 编排 | — | `sidebarConfig.ts` | 参考 `docs/sidebar-system.md` 重新编排 |
| postListLayout（list 默认、允许切换） | — | `postListConfig.ts` | |
| 字体 MapleMono-SC-NF / MapleMono-NF-CN + 压缩 | — | `fontConfig.ts` + `public`→fonts 目录 | 拷 ttf，开启 subset |
| expressive-code 明暗主题 | — | `expressiveCodeConfig.ts` | |
| bangumi.userId=1002911 / bilibili.vmid=307453935 / anime.mode="bangumi" | — | `animeConfig.ts` | 改用 **snapshot 模式**：填 userId → `source: { kind: "snapshot", provider: "bangumi" }` → 本地跑一次 `pnpm anime:sync --provider bangumi` 生成 `src/data/anime-snapshots/`。**构建时不再请求外网，CF 不再需要 BILI_SESSDATA** |
| featurePages 开关 | anime/friends/projects/skills/timeline/albums: true | 各自 `*Config.ts` 的 `enable` | diary→看 moments 决策 |
| 评论 CommentConfig | （当前未启用则） | `commentConfig.ts` | 保持关闭即"零额外负担" |
| 音乐 MusicPlayerConfig | — | `musicConfig.ts` | 按需 |
| 版权/License | 文章级 licenseName | `licenseConfig.ts`（站点级） | Shirone 无文章级 license 字段，改站点级声明 |
| announcement | — | `announcementConfig.ts` | 按需 |

---

## 5. 迁移策略：同仓库分支替换 + CF Pages 预览灰度

在**当前仓库**内操作，保留 Shirone 上游历史以便日后跟进主题更新：

```
upstream = https://github.com/matsuzaka-yuki/Shirone
分支模型：
  master            生产分支（CF Pages 生产部署指向它，不动）
  shirone-migration 新分支 = upstream/main 基座 + 本站内容/配置（推送后 CF 自动生成 preview 部署）
  tag mizuki-final  升级前存档，回滚锚点
```

为何保留上游历史：Shirone 处于 alpha，后续升级只需在 `shirone-migration`（合并进 master 后即 master）上 `git fetch upstream && git merge upstream/main` 即可平滑跟进。

---

## 6. 分阶段执行步骤

### Phase 0 — 准备与存档
1. 处理当前未提交修改（`src/config.ts`、`src/pages/chongqing.astro` 处于 modified 状态）：作为 Mizuki 最终状态提交到 master（内容是重庆页收尾，随旧架构一起存档）。
2. `git tag mizuki-final && git push origin master --tags`。
3. 本地确认 Node 版本：`node -v` ≥ 22.12（可用 nvm/fnm 切换）。

### Phase 1 — 建立新分支基座
```bash
git remote add upstream https://github.com/matsuzaka-yuki/Shirone.git
git fetch upstream main
git checkout -b shirone-migration upstream/main
```
清理 Shirone 自带演示内容：
- `src/content/posts/` 下全部示例文章（markdown.md、guide/、*-demo 等）
- `src/content/moments/` 示例（若决策不迁移 moments）
- `src/data/*.ts` 示例数据（friends/projects/skills/timeline/devices/anime/music/compass）
- `public/` 内示例资源（按需）；保留 `_headers` 类基础设施
- 记下基座 commit：`git rev-parse upstream/main`（写入 README 备注或计划附录，alpha 版本锚点）

### Phase 2 — 内容迁移
```bash
# 从 mizuki-final 分支拷贝（--prefix 视当前仓库路径调整）
git checkout mizuki-final -- src/content/posts src/content/spec/about.md
git checkout mizuki-final -- src/data/friends.ts src/data/projects.ts src/data/skills.ts src/data/timeline.ts src/data/devices.ts
git checkout mizuki-final -- public/assets public/favicon public/images public/_headers
```
然后逐项处理：
1. **删除** `src/content/posts/简单的端口查询Lab/什么是Proc.md`（保持线上现状，避免意外发布）。
2. （可选）删除 3 个 `index.canvas`。
3. 重写 `src/content/spec/about.md`：主题名与 `::github{repo="..."}` 指向 Shirone。
4. 字体：拷 `MapleMono-SC-NF-Regular.ttf`、`MapleMono-NF-CN-Medium.ttf`（及仍需要的 `ZenMaruGothic-Medium.ttf`/`萝莉体 第二版.ttf`）到 Shirone 约定的字体目录，改 `fontConfig.ts`（§3.4 A5）。
5. 横幅图集拷入；（可选增强）移到 `src/assets/images/banner/` 并把 `siteConfig.banner.src` 改为相对路径以启用 AVIF/WebP。

### Phase 3 — 配置迁移
按 §4 映射表逐文件改写 `src/config/*`，要点：
- `siteConfig`：site/title/lang/hue 345/banner/homeText（"imicola的猫咖"+4 条副标题+打字机）/toc depth 2。
- `navBarConfig`：Home、Archive、自定义 Links 菜单（GitHub https://github.com/imicola 、Bilibili https://space.bilibili.com/307453935 ）；My 菜单只留 Shirone 存活的子页。
- `animeConfig`：snapshot + bangumi（userId 1002911），本地执行 `pnpm anime:sync --provider bangumi`，提交生成的 `src/data/anime-snapshots/`。
- `profileConfig / sidebarConfig / postListConfig / fontConfig / licenseConfig` 按表。
- `astro.config.mjs` 确认 `site` 取自新 siteConfig。

### Phase 3.5 — 魔改移植（§3.4 移植项 A1–A5）
1. A1：aiLevel schema + `AiParticipation.astro` 拷贝 + 文章页渲染块。
2. A2：改造 `remark-admonitions.mjs`（折叠标记 → `admonition-details`、未知类型容错）。
3. A3：License 组件与 schema 扩展（文章级 author/license）。
4. A4：umami 脚本注入 Layout。
5. A5：字体已在 Phase 2 拷贝，此处完成 fontConfig 配置。
6. 建立根目录 `PATCHES.md` 登记以上全部改动（§3.4 C）。

### Phase 4 — 本地验证
```bash
pnpm install          # pnpm 9.14.4 由 packageManager 字段自动接管
pnpm check            # astro check，要求 0 error 0 warning
pnpm type-check
pnpm build            # 含 icons/moment 缩略图/字体子集/pagefind 全流程预演
pnpm preview          # http://localhost:4321
```
本地验收清单：
- [ ] 首页横幅（桌面/移动）、标题打字机、主题色 345
- [ ] 22 篇文章全部可打开，URL 与旧站一致（抽查带空格/括号目录：`计算机网络 | 自顶向下方法`、`命令行的艺术(上)`）
- [ ] 文章封面（`./cover.jpg` 相对路径）与正文内图片正常，AVIF/WebP 生效
- [ ] **AI 参与度卡片**：7 篇 aiLevel 文章显示正确等级（Lv.0–3）
- [ ] **增强 alerts**：抽查 `简单利用 Docker 进行开发`（`[!note]+ 自定义标题`）、`基础知识`（`[!tip]-`）、含 `[!danger]` 的文章——折叠面板可开合（原生 details）、自定义标题正确、未知类型有样式而非裸 blockquote
- [ ] **文章级 License**：`命令行的艺术(上)` 等文章显示 CC BY 4.0 与作者，未设置的文章回退站点级声明
- [ ] **umami**：查看页面源码含统计脚本，umami 后台收到事件
- [ ] 归档/分类/标签页、about、friends
- [ ] RSS `/rss.xml`、Atom `/atom.xml`、`/sitemap-index.xml`、robots.txt
- [ ] Pagefind 搜索中文关键词
- [ ] 番剧页（快照数据）、明暗模式、移动端视口
- [ ] **确认无**重庆/daily/flashcards 等页面出现在导航或 sitemap

### Phase 5 — Cloudflare Pages 灰度与上线
1. 推送分支：`git push origin shirone-migration` → CF Pages 自动产出 **preview 部署**（非生产分支自动构建），用预览域名完整回归一遍 Phase 4 清单。
2. CF 项目设置核对（生产分支 master 不变）：
   - Build command：`pnpm build`；Build output：`dist`（不变）
   - 环境变量**新增** `NODE_VERSION=22`（Astro 7 需 ≥22.12，CF 默认 Node 版本不满足，这是最容易翻车的点）
   - 环境变量**清理**：`BILI_SESSDATA`（快照模式不再需要）、`ENABLE_CONTENT_SYNC`/`CONTENT_REPO_URL`（如曾配置）、`INDEXNOW_*`（脚本未迁移）
3. 预览验收通过后：`git checkout master && git merge shirone-migration && git push origin master` → 生产自动部署。
4. 生产域名冒烟：首页、3 篇随机文章、RSS、搜索、番剧页。

### Phase 6 — 收尾
1. 更新仓库 README（改为 Shirone 说明 + 记录基座 commit）、AGENTS.md（命令表换为 Shirone 的 biome/check:manifest 体系）。
2. 删除本计划文件或移入 `docs/` 存档。
3. 保留 `tag mizuki-final` 至少一个季度，作为内容兜底来源。
4. （可选）为下线的实验 URL 配置 `public/_redirects` 301（如 `/chongqing/ / 301`），避免搜索引擎死链。

### 回滚方案（任一时刻可用）
- 合并前发现问题：直接丢弃 `shirone-migration` 分支，master 毫发无损。
- 合并后发现问题：`git revert -m 1 <merge-commit>` 或将 master 重置到 `mizuki-final` 重推；CF Pages 亦可在部署历史里一键回退到旧构建（Production deployment → Rollback）。

---

## 7. 决策项（执行前需拍板）

| # | 问题 | 推荐 |
|---|---|---|
| D1 | 日记（diary.ts → moments）是否迁移？需写一次格式转换（diary 数据 → moments md + 缩略图脚本） | 先不迁，上线稳定后作为增强单独做 |
| D2 | `priority / canvas / date / pubDate` 等仍会被剥离的 frontmatter 字段是否清理？（`aiLevel / author / licenseName` 已定移植，不在清理范围） | 建议顺手清理这 4 个零使用字段，避免误导 |
| D3 | 文章级版权（licenseName "CC BY 4.0"）→ 扩展 Shirone License 组件保留文章级粒度（§3.4 A3） | 已按保留文章级制定方案，如接受站点级统一声明可砍掉 A3 |
| D4 | 折叠 alerts 映射到 Shirone 原生 `<details>`（视觉风格随 M3E 主题）而非复刻 Mizuki 的 JS 折叠交互 | 接受原生方案（少 138 行 JS+样式，语义更佳） |
| D5 | IndexNow SEO 提交是否需要在 Shirone 上重建 | 暂不需要，观察收录情况再说 |
| D6 | 下线页面是否配 301 | 建议配（一行一条，成本极低） |

---

## 8. 风险登记

| 风险 | 等级 | 缓解 |
|---|---|---|
| Shirone 处于 alpha，API 可能变动 | 中 | 锁定基座 commit；升级走显式 merge，不盲跟 main |
| CF Pages Node 版本不满足 Astro 7 | 高（但一行配置解决） | `NODE_VERSION=22` 环境变量；预览部署先行验证 |
| 构建时长增加（封面 AVIF/WebP + 字体子集） | 低 | CF 静态构建无超时硬限制；首构较慢属预期 |
| 中文目录 slug 在新 Astro 版本下 slugify 规则微调 | 低 | Phase 4 已列入 URL 抽查项；如有个别漂移，用 CF `_redirects` 补 301 |
| 上游 `friends.ts` 等数据接口字段微调 | 低 | 同作者互迁设计，拷贝后 `pnpm check` 即可暴露 |
| 魔改 6 文件与 upstream 后续更新冲突（§3.4 C） | 中 | `PATCHES.md` 清单化管理，升级时逐个重放；魔改点均小且集中 |

---

## 9. 工作量预估

- Phase 0–3.5（机械迁移 + 配置改写 + 魔改移植）：约 0.75 天
- Phase 4–5（双端验收 + 灰度）：约 0.5 天
- 合计 1.5 个工作日内可完成上线，另留半天缓冲处理 alpha 版本与魔改适配的小坑。
