# 内容与工具集建设 · 任务清单

> 本清单为可被 LLM 自动化执行的任务列表。每一个 `- [ ]` 都是独立、可断点的最小任务单元；
> 完成后将 `[ ]` 改为 `[x]` 即视为完成。**不要批量勾选**，必须确认产物存在且符合"完成判据"才能勾选。

---

## 0. 总体约定（执行前先读）

### 0.1 目录结构
所有产物按如下路径落地（路径相对仓库根 `E:\Claude_code\blog\`）：

```
content/
  essays/
    {slug}/
      index.md          # 正文 + YAML frontmatter
      references.md     # 采集到的网络资料、引用来源清单（可空但必须存在）
  tutorials/
    {slug}/
      index.md          # 教程总览 / 引言
      chapters/
        01-xxx.md
        02-xxx.md
        ...
      references.md
public/
  tools/
    {slug}/
      index.html        # 单文件工具入口（可以内联 css/js，也可拆分）
      README.md         # 工具说明 + 功能列表 + 已知限制
scripts/
  sync-content.mjs      # 把 content/ 同步进 Strapi 的脚本（Phase 4 创建）
```

### 0.2 文件格式约定
- 所有 Markdown 必须以 YAML frontmatter 开头：

  **essay frontmatter:**
  ```yaml
  ---
  slug: tech-and-humanity
  title: 技术与人性的平衡
  category: ESSAY            # ESSAY | THOUGHTS | LIFESTYLE
  excerpt: 一句话摘要（70 字以内）
  date: 2026-05-23           # ISO 日期，使用撰稿当日（请勿照抄此处示例值）
  tags: [技术哲学, 注意力]
  ---
  ```

  **tutorial index frontmatter:**
  ```yaml
  ---
  slug: modern-frontend-architecture
  title: 现代前端架构指南
  description: 一句话描述
  level: B_level             # A_level | B_level | C_level | ALL
  status: A更新中            # A更新中 | B已完结
  icon: code                 # code | layers | zap
  chapters: 6                # 以 chapters/ 目录下实际章节数为准；定稿前回填
  ---
  ```

  **chapter frontmatter:**
  ```yaml
  ---
  order: 1
  title: 章节标题
  est_read_minutes: 12
  ---
  ```

  **tool README frontmatter:**
  ```yaml
  ---
  slug: color-palette
  title: 色彩调和引擎
  icon: droplet
  features: [快速生成调色板, 导出 CSS 变量]
  status: usable             # planning | wip | usable
  ---
  ```

### 0.3 风格基线
- 文风对齐 `blog.html` 的克制、极简、第一人称基调。
- 单篇随笔正文 **1200–2200 字**；不堆砌定义，先给具体的观察或场景，再升华。
- 教程每章 **1500–3500 字**，含至少 1 段可运行代码或图示伪代码。
- 工具页配色严格遵循 `blog.html` 的 CSS 变量（`--bg-base #050505` / `--text-primary #fcfcfc` / `--border-light` …），字体使用 Inter + Playfair Display。
- 所有产出 **不要堆砌 emoji**；仅在工具页中允许极少量功能性图标（SVG）。

### 0.4 完成判据（DoD）通用项
1. 文件按上面路径存在；
2. frontmatter 字段齐全且合法；
3. 内容长度满足下限；
4. 没有占位符（如 `TODO`、`lorem ipsum`、`xxxxx`）；
5. 工具类任务还需在浏览器（双击打开 `index.html`）能渲染、核心功能可点击使用。

### 0.5 LLM 执行约定
- **一次只做一个**最小任务。完成后立刻把对应 `[ ]` 改为 `[x]`，写一行 commit-style 短摘要附在该任务行末（用 ` — done: 简短说明`）。
- 引用网络资料必须写到对应 `references.md`，列出 URL + 抓取关键点；不允许"伪造来源"。
- 不要修改本文件除"勾选"和"附短摘要"以外的内容；如发现需要新增任务，**在文末"补充任务"区追加**，不要插入到已编号小节中间。
- 跨任务公用工具（如 `scripts/sync-content.mjs`）一旦写好，后续任务直接复用，不要重复实现。
- **Git 检查点**：每完成一个 phase（§1 / §2 / §3 / §4 / §5 / §6）或每完成 ≥10 个最小任务，必须 `git add -A && git commit -m "content: …"` 一次，**避免大块未提交工作丢失**。提交信息使用中文一行式（与仓库现有风格一致）。绝不 `--no-verify`。
- **slug upsert 提示**：本清单中的 essay/tutorial/tool slug 与 `backend/src/seed-data.ts` **完全重合**；同步脚本会按 slug 覆盖现有种子数据的 `content` 字段——这是预期行为，不是误删。

### 0.7 引用与版权规范（重要）
- "采集网络资料 → 重构"必须**释义而非翻译**：
  - 单次引用原文 ≤ 30 词（中文 ≤ 60 字），且必须用 markdown 引用块标注并在 `references.md` 列出来源 URL。
  - 不允许整段照抄/机翻；命题与论据必须经过自己的重组与举例。
  - 同一来源在正文 + references.md 中均需出现。
- 代码片段若直接复用第三方仓库示例（含教程类）必须保留原作者与来源链接（注释或脚注）。
- 工具页若调用第三方 CDN 库（Chart.js / marked.js / browser-image-compression 等），必须在 README 注明 License（MIT / Apache-2.0 等）。

### 0.6 沙盒约束（必须遵守）
- 所有文件读写仅限仓库根 `E:\Claude_code\blog\` 之内。**禁止**：
  - `npm install -g` / `pnpm add -g` / 改写全局 npm 配置；
  - 修改 `$PROFILE`、系统环境变量、注册表、防火墙、scheduled tasks；
  - 在仓库目录之外执行 `Remove-Item` / `rm` / `Move-Item` / 安装系统级软件；
  - 改写用户主目录下的任何 dotfile（`~/.gitconfig` `~/.ssh/*` 等）。
- 联网允许：WebSearch、WebFetch、Bash + `curl/Invoke-WebRequest` 调用第三方 HTTP API。
- 新增依赖：必须 `pnpm add <pkg>`(前端)或 `pnpm --filter backend add <pkg>`(后端)写进对应 workspace 的 `package.json`；**禁止 `npx <pkg>` 一次性临时跑后丢弃**(无版本固定,不可复现)；**禁止 `-g` 全局安装**。
- 工具页通过 CDN 引用第三方库时,**必须 pin major 版本**(例：`https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.js`,不要使用 `@latest`)。**强烈建议加 `integrity=...` SRI hash**。
- 涉密信息（API key、token）只读 `.env` / `backend/.env`，**禁止**回显到 stdout / 写进任何被 Git 追踪的文件（包括日志、注释、commit message）。
- 任何长时间运行的后台进程（`run_in_background`）退出前必须显式 `Stop-Process` 清理。

---

## 1. 基础设施（Phase 0）

- [x] **1.1** 创建目录骨架 `content/essays/`、`content/tutorials/`、`public/tools/`、`scripts/`（若已存在则跳过，并放置 `.gitkeep`）。 — done: mkdir + .gitkeep
- [x] **1.2** 在仓库根新增 `content/README.md`，说明本目录约定。 — done: 122 lines
- [x] **1.3** 确认 `content/` 与 `public/tools/` **不在 `.gitignore` 忽略名单**。 — done: check-ignore exit 1
- [x] **1.4** 新增 `scripts/lint-content.mjs`，并在 `package.json` 加 `"lint:content"`。 — done: script + script slot

---

## 2. 随笔重构（Phase 1 · 思考与感悟）

> 共 8 篇。对每篇先做"研究 → 提纲 → 初稿 → 打磨"四步,**纯文字**,本期不配图。
> 重构口径：参考 3–5 篇网络上较成熟的英文 / 中文长文（如 Paul Graham、阮一峰、少数派、Lenny's Newsletter、StackOverflow 博客、a16z 等），消化后**用自己的话与角度重写**，不允许逐句翻译或抄袭。

### 2.1 `tech-and-humanity` · 技术与人性的平衡 [ESSAY]
- [x] **2.1.1** 用 WebSearch 收集 3–5 篇关于"technology and attention / digital wellbeing / 技术异化"的资料，写到 `content/essays/tech-and-humanity/references.md`（每条含 URL、作者、核心观点 1 句）。
- [x] **2.1.2** 在同目录新建 `outline.md`，列出 3 个核心论点 + 1 个个人视角（区别于参考资料的新观点）。
- [x] **2.1.3** 撰写正文 `index.md`（含 frontmatter），≥1200 字；至少包含 1 个具体生活/工作场景。
- [x] **2.1.4** 自查：删除空话与套话；保留至少 1 句可被引用的"金句"。

### 2.2 `on-creativity` · 关于创造力的本源思考 [THOUGHTS]
- [x] **2.2.1** 采集参考资料 → `content/essays/on-creativity/references.md`（关键词：creativity origin、Steven Johnson《Where Good Ideas Come From》、Rick Rubin、长期主义）。
- [x] **2.2.2** 写 `outline.md`。
- [x] **2.2.3** 写 `index.md`，≥1200 字；至少举 1 个亲历/可验证的创造场景。
- [x] **2.2.4** 自查与定稿。

### 2.3 `art-of-slowing-down` · 慢下来的艺术与哲学 [LIFESTYLE]
- [x] **2.3.1** 采集（slow living、deep work、《深度工作》Cal Newport、《Four Thousand Weeks》Oliver Burkeman）→ `references.md`。
- [x] **2.3.2** 写 `outline.md`。
- [x] **2.3.3** 写 `index.md`，≥1200 字。
- [x] **2.3.4** 自查与定稿。

### 2.4 `signal-in-noise` · 在喧嚣中寻找信号 [ESSAY]
- [x] **2.4.1** 采集（information overload、attention economy、Cory Doctorow "enshittification"、Tristan Harris）→ `references.md`。
- [x] **2.4.2** 写 `outline.md`。
- [x] **2.4.3** 写 `index.md`，≥1200 字；至少展示 1 套个人筛选信息的"工作流"。
- [x] **2.4.4** 自查与定稿。

### 2.5 `craftsmanship-and-code` · 手艺与代码 [THOUGHTS]
- [x] **2.5.1** 采集（《The Pragmatic Programmer》、Pete Hodgson、Dan Abramov、craftsmanship movement）→ `references.md`。
- [x] **2.5.2** 写 `outline.md`。
- [x] **2.5.3** 写 `index.md`，≥1200 字；至少 1 段真实代码（≤30 行）。
- [x] **2.5.4** 自查与定稿。

### 2.6 `writing-as-thinking` · 写下来才算思考 [THOUGHTS]
- [x] **2.6.1** 采集（Paul Graham《Putting Ideas into Words》、Andy Matuschak、Tiago Forte BASB、Zettelkasten）→ `references.md`。
- [x] **2.6.2** 写 `outline.md`。
- [x] **2.6.3** 写 `index.md`，≥1200 字。
- [x] **2.6.4** 自查与定稿。

### 2.7 `tools-and-mind` · 工具与心智 [LIFESTYLE]
- [x] **2.7.1** 采集（McLuhan "the medium is the message"、Bret Victor、tool-thought 同构、Notion vs Obsidian 讨论）→ `references.md`。
- [x] **2.7.2** 写 `outline.md`。
- [x] **2.7.3** 写 `index.md`，≥1200 字。
- [x] **2.7.4** 自查与定稿。

### 2.8 `on-minimalism` · 关于"克制" [LIFESTYLE]
- [x] **2.8.1** 采集(Dieter Rams 十诫、原研哉、Jony Ive 访谈、Edward Tufte data-ink ratio) → `references.md`。
- [x] **2.8.2** 写 `outline.md`。
- [x] **2.8.3** 写 `index.md`，≥1200 字。
- [x] **2.8.4** 自查与定稿。

---

## 3. 教程重构（Phase 2 · 系统化学习）

> 共 7 个教程。对每个教程：先采集资料 → 设计章节结构 → 逐章撰写。**纯文字**,本期不配图。
> 章节数以"质量优先"为准,不强行凑数;首期最少 3 章、推荐 4–6 章。
> 每章必须有 ≥1 段可运行代码 / 配置 / 命令。

### 3.1 `modern-frontend-architecture` · 现代前端架构指南 [icon: code]
- [x] **3.1.1** 采集资料(参考: Patterns.dev、Kent C. Dodds Epic React、Lee Robinson、Vercel Edge 架构文章、React 官方 docs、Vue 官方 docs) → `content/tutorials/modern-frontend-architecture/references.md`。
- [x] **3.1.2** 在 `content/tutorials/modern-frontend-architecture/outline.md` 写完整章节规划(建议 6 章: ①为什么需要前端架构 ②路由与目录组织 ③状态分层与跨层通信 ④数据获取与缓存 ⑤模块边界与代码分割 ⑥架构演进与重构信号)。
- [x] **3.1.3** 写 `index.md`(教程总览,≥600 字 + 章节索引)。
- [x] **3.1.4** 写 `chapters/01-why-architecture.md`,≥1500 字。
- [x] **3.1.5** 写 `chapters/02-routing-and-structure.md`,≥1500 字。
- [x] **3.1.6** 写 `chapters/03-state-layering.md`,≥1500 字。
- [x] **3.1.7** 写 `chapters/04-data-fetching-and-caching.md`,≥1500 字。
- [x] **3.1.8** 写 `chapters/05-boundaries-and-splitting.md`,≥1500 字。
- [x] **3.1.9** 写 `chapters/06-evolution-and-refactor-signals.md`,≥1500 字。

### 3.2 `ui-ux-minimal-design` · UI/UX 美学与极简设计 [icon: layers]
- [x] **3.2.1** 采集资料(参考: Refactoring UI、Dieter Rams、Practical Typography、Material/Apple HIG、Vitaly Friedman) → `references.md`。
- [x] **3.2.2** 写 `outline.md`(建议 5 章: ①字重·行高·度量 ②色彩与对比度 ③留白与节奏 ④组件令牌化 ⑤暗色主题专题)。
- [x] **3.2.3** 写 `index.md`。
- [x] **3.2.4** 写 `chapters/01-typography-fundamentals.md`。
- [x] **3.2.5** 写 `chapters/02-color-and-contrast.md`。
- [x] **3.2.6** 写 `chapters/03-whitespace-and-rhythm.md`。
- [x] **3.2.7** 写 `chapters/04-design-tokens.md`。
- [x] **3.2.8** 写 `chapters/05-dark-theme-deep-dive.md`。

### 3.3 `web-performance-tuning` · Web 极致性能优化 [icon: zap]
- [x] **3.3.1** 采集(web.dev、Addy Osmani、Houssein Djirdeh、Core Web Vitals、Lighthouse 文档) → `references.md`。
- [x] **3.3.2** 写 `outline.md`(建议 5 章: ①Web Vitals 心智模型 ②关键渲染路径 ③字体与图片加载 ④HTTP/3 与缓存 ⑤Service Worker 与离线策略)。
- [x] **3.3.3** 写 `index.md`。
- [x] **3.3.4** 写 `chapters/01-web-vitals-model.md`。
- [x] **3.3.5** 写 `chapters/02-critical-rendering-path.md`。
- [x] **3.3.6** 写 `chapters/03-fonts-and-images.md`。
- [x] **3.3.7** 写 `chapters/04-http3-and-cache.md`。
- [x] **3.3.8** 写 `chapters/05-service-worker-strategies.md`。

### 3.4 `react-vite-setup` · 从零搭建 React + Vite + TypeScript 项目 [icon: code]
- [x] **3.4.1** 采集(Vite docs、React docs、tsconfig 最佳实践、Anthony Fu、Mark Erikson) → `references.md`。
- [x] **3.4.2** 写 `outline.md`(建议 4 章: ①为什么选 Vite ②目录与别名 ③CSS Module 与 PostCSS ④构建与产物分析)。
- [x] **3.4.3** 写 `index.md`。
- [x] **3.4.4** 写 `chapters/01-why-vite.md`。
- [x] **3.4.5** 写 `chapters/02-structure-and-aliases.md`。
- [x] **3.4.6** 写 `chapters/03-css-modules-and-postcss.md`。
- [x] **3.4.7** 写 `chapters/04-build-and-bundle-analysis.md`。

### 3.5 `strapi-headless-cms` · 用 Strapi 5 搭建 Headless CMS 后端 [icon: layers]
- [ ] **3.5.1** 采集(Strapi 5 官方 docs、Strapi 5 migration guide、Khalid Sookia 视频系列) → `references.md`。
- [ ] **3.5.2** 写 `outline.md`(建议 5 章: ①Strapi 5 概览 ②Content Type 设计 ③权限与 API Token ④关系字段与媒体 ⑤生产部署与备份)。
- [ ] **3.5.3** 写 `index.md`。
- [ ] **3.5.4** 写 `chapters/01-overview.md`。
- [ ] **3.5.5** 写 `chapters/02-content-types.md`。
- [ ] **3.5.6** 写 `chapters/03-permissions-and-tokens.md`。
- [ ] **3.5.7** 写 `chapters/04-relations-and-media.md`。
- [ ] **3.5.8** 写 `chapters/05-deploy-and-backup.md`。

### 3.6 `typescript-type-gymnastics` · TypeScript 类型体操与领域建模 [icon: zap]
- [ ] **3.6.1** 采集(type-challenges、Matt Pocock、Anders Hejlsberg 演讲、Domain Modeling Made Functional) → `references.md`。
- [ ] **3.6.2** 写 `outline.md`(建议 6 章: ①基础回顾 ②条件类型 ③模板字面量 ④Mapped Types ⑤判别联合与状态机 ⑥用类型表达业务不变量)。
- [ ] **3.6.3** 写 `index.md`。
- [ ] **3.6.4** 写 `chapters/01-recap.md`。
- [ ] **3.6.5** 写 `chapters/02-conditional-types.md`。
- [ ] **3.6.6** 写 `chapters/03-template-literals.md`。
- [ ] **3.6.7** 写 `chapters/04-mapped-types.md`。
- [ ] **3.6.8** 写 `chapters/05-discriminated-unions.md`。
- [ ] **3.6.9** 写 `chapters/06-business-invariants.md`。

### 3.7 `frontend-backend-integration` · 前后端联调与数据加载状态 [icon: code]
- [ ] **3.7.1** 采集(TanStack Query docs、SWR docs、Kent C. Dodds error boundaries、Lee Byron Relay 论文) → `references.md`。
- [ ] **3.7.2** 写 `outline.md`(建议 4 章: ①环境变量与 Service 层 ②加载/错误/空 三态 ③缓存、并发与取消 ④乐观更新与重试)。
- [ ] **3.7.3** 写 `index.md`。
- [ ] **3.7.4** 写 `chapters/01-env-and-service-layer.md`。
- [ ] **3.7.5** 写 `chapters/02-loading-error-empty.md`。
- [ ] **3.7.6** 写 `chapters/03-cache-concurrency-cancel.md`。
- [ ] **3.7.7** 写 `chapters/04-optimistic-and-retry.md`。

---

## 4. 工具集(Phase 3 · 实用工具集)

> 共 8 个工具。**仅前端**,每个工具一个独立文件夹下的 `index.html`(可附 css/js),无后端。
> 配色与字体遵循 `blog.html` 基线。所有工具必须在静态文件服务下可直接运行(不依赖构建)。
>
> **重要前置:已存在 `mini-tools/` 目录下 11 个扁平 HTML 工具**(base64 / csv-json / image-compressor / image-to-pdf / json-formatter / markdown-html / pdf-merger / pdf-splitter / qrcode / timestamp / word-counter)。本期策略为**迁移并合并**:把它们迁到 `public/tools/{slug}/index.html` 的规范结构下,统一套深色 blog 配色,然后补齐缺失的工具。

### 4.0 迁移基线(必须先做)
- [x] **4.0.1** 制定 slug 映射表:将 `mini-tools/*.html` 与 §4.1–§4.8 计划做对照,在 `public/tools/MIGRATION.md` 列出 `源文件 → 目标 slug → 处理方式(迁移/合并/新建)`。建议映射:`json-formatter.html→json-formatter`、`image-compressor.html→image-minifier`、`timestamp.html→timestamp-converter`、`base64.html→url-codec`(扩展为三类编解码)、`markdown-html.html→markdown-editor`(扩展为双栏编辑)。剩余 `csv-json` / `image-to-pdf` / `pdf-merger` / `pdf-splitter` / `qrcode` / `word-counter` 作为**追加工具**保留迁移,不在 §4.1–§4.8 的 8 个名额内。
- [x] **4.0.2** 把每个待迁移文件移到 `public/tools/{slug}/index.html`,**保留原作者注释/license**;统一注入 blog 配色 CSS 变量(`--bg-base #050505` / `--text-primary #fcfcfc` / `--border-light` 等)与 Inter 字体。DoD:本机 `http://localhost:5170/tools/json-formatter/index.html` 可访问且配色为深色。
- [x] **4.0.3** 删除 `mini-tools/` 旧目录 — done: 保留 README 改为重定向说明（按规范允许的方案）(确认迁移产物可访问后再删,**先 commit 再删**)。在 `mini-tools/README.md` 改为重定向说明:"已迁移至 `public/tools/`"。**或保留 README 仅作历史索引**。
- [x] **4.0.4** 为追加工具(csv-json / image-to-pdf / pdf-merger / pdf-splitter / qrcode / word-counter)各写 `public/tools/{slug}/README.md`(套用 §0.2 tool README frontmatter)。

### 4.1 `analytics-dashboard` · 数据洞察视图 [icon: barChart] [新建]
- [x] **4.1.1** 写 `public/tools/analytics-dashboard/README.md`: 列出 ≥3 项功能(最少含: CSV/JSON 文件拖入、列识别、自动出柱状图/折线图)。
- [x] **4.1.2** 写 `public/tools/analytics-dashboard/index.html`: 使用纯前端 + Chart.js(CDN) 实现拖入文件后可视化;包含示例数据按钮。
- [x] **4.1.3** 在浏览器中打开验证: 拖入示例 CSV 能看到至少一种图表;导出为 PNG 按钮可用。

### 4.2 `color-palette` · 色彩调和引擎 [icon: droplet] [新建]
- [x] **4.2.1** 写 `README.md`: 功能含基础色生成、互补/类似/三元色方案、对比度检测(WCAG AA/AAA 标记)、导出 CSS 变量。
- [x] **4.2.2** 写 `index.html`: 支持输入 hex / 拾色器、生成 5 种和谐方案、显示对比度评分、一键复制 CSS。
- [x] **4.2.3** 浏览器验证。

### 4.3 `markdown-editor` · Markdown 沉浸创作 [icon: fileText] [迁移+扩展自 markdown-html.html]
- [x] **4.3.1** 写 `README.md`: 功能含双栏所见即所得、本地持久化(localStorage)、导出 HTML/纯文本、字数统计。
- [x] **4.3.2** 写 `index.html`: 使用 marked.js(CDN) 渲染;左编辑右预览,自动保存草稿。
- [x] **4.3.3** 浏览器验证。

### 4.4 `regex-visualizer` · 正则可视化调试 [icon: search] [新建]
- [x] **4.4.1** 写 `README.md`: 功能含模式输入、测试串高亮匹配、分组解释、常用模板(邮箱/URL/手机号)。
- [x] **4.4.2** 写 `index.html`: 实时高亮匹配结果,附 flag 切换(g/i/m/s) 和性能耗时显示。
- [x] **4.4.3** 浏览器验证。

### 4.5 `json-formatter` · JSON 结构化对齐 [icon: fileText] [迁移+扩展自 json-formatter.html]
- [x] **4.5.1** 写 `README.md`: 功能含格式化、压缩、JSONPath 查询、树形折叠、双面板 diff。
- [x] **4.5.2** 写 `index.html`: 原生实现格式化与折叠树;diff 部分可用简单 LCS 行比较。
- [x] **4.5.3** 浏览器验证。

### 4.6 `image-minifier` · 图片极简压缩 [icon: droplet] [迁移自 image-compressor.html]
- [x] **4.6.1** 写 `README.md`: 功能含本地压缩 PNG/JPG/WebP、质量滑杆、压缩前后大小对比、批量下载 zip。
- [x] **4.6.2** 写 `index.html`: 使用 `<canvas>` + `toBlob()` 实现纯前端压缩;可选 browser-image-compression(CDN)。
- [x] **4.6.3** 浏览器验证。

### 4.7 `timestamp-converter` · 时间戳与时区转换器 [icon: barChart] [迁移自 timestamp.html]
- [x] **4.7.1** 写 `README.md`: 功能含 Unix↔ISO↔本地时区互转、当前时间常驻、批量转换、时区下拉(IANA 列表)。
- [x] **4.7.2** 写 `index.html`: 原生 `Intl.DateTimeFormat` 实现;输入框输入任意格式自动识别。
- [x] **4.7.3** 浏览器验证。

### 4.8 `url-codec` · URL 编解码工具 [icon: search] [迁移+扩展自 base64.html]
- [x] **4.8.1** 写 `README.md`: 功能含 URL / Base64 / HTML 实体三类编解码、自动识别、多行批量。
- [x] **4.8.2** 写 `index.html`: `encodeURIComponent`、`btoa/atob` 配合 `TextEncoder` 处理 UTF-8。
- [x] **4.8.3** 浏览器验证。

---

## 5. 同步与集成(Phase 4)

> 把 `content/` 与 `public/tools/` 的成果接回 Strapi,让前端列表 / 详情页可以读到。
>
> **架构决定:新增 `chapter` collection type**,与 `tutorial` 多对一关联,以支持单章 API 与单章路由。

- [x] **5.0** 在 `backend/src/api/chapter/` 新建 chapter content-type(`schema.json`):字段含 `title: string (required)`、`order: integer (required)`、`content: richtext`、`est_read_minutes: integer`、`slug: uid (targetField: title)`、`tutorial: relation manyToOne → api::tutorial.tutorial`,并在 `tutorial.schema.json` 加反向 relation `chapters: relation oneToMany mappedBy: tutorial`(注意会与现有 `chapters: integer` 字段重名 → 把现有整数字段重命名为 `chaptersCount` 或直接移除,前端 `Tutorials.tsx` 内对 `chapters` 数字的引用同步改名)。DoD:`pnpm --filter backend run develop` 启动无 schema 错误;Strapi Admin 可见 Chapter content-type。**这是破坏性 schema 改动,执行前先 commit 当前进度**。
- [ ] **5.1** 在 `scripts/sync-content.mjs` 写一个 Node 脚本:读取 `content/essays/*/index.md` 与 `content/tutorials/*/{index.md, chapters/*.md}`,按 slug upsert 到 Strapi(通过 backend bootstrap 钩子直接调 `strapi.documents()`,**避免依赖外部 API token**)。upsert 后必须 `publish()` 以使默认 `find` 可见(Strapi 5 `draftAndPublish=true` 默认 list 只返回 published)。DoD:执行 `node scripts/sync-content.mjs` 后调用 `GET /api/essays?filters[slug][eq]=tech-and-humanity` 返回的 `content` 字段与 `content/essays/tech-and-humanity/index.md` 的正文一致;`GET /api/chapters?filters[tutorial][slug][eq]=modern-frontend-architecture&sort=order` 返回有序章节列表。
- [ ] **5.2** **先备份**:`Copy-Item backend/src/seed-data.ts backend/src/seed-data.backup.ts`。然后修改 `backend/src/seed-data.ts`:去除硬编码 `content` 字段(或改为最小占位),改由 `scripts/sync-content.mjs` 在启动后接管。DoD:`seed-data.ts` 中的 `essaySeeds[].content` 字段全部为空字符串或被移除;`seed-data.backup.ts` 存在且与原文件一致。
- [ ] **5.3** 把每个 tool 在 Strapi 中的 `url` 字段从 `/tools/xxx` 改为 `/tools/{slug}/index.html`(同时在 `seed-data.ts` 中同步)。DoD:访问 `http://localhost:5170/tools/color-palette/index.html` 能打开工具页。
- [ ] **5.4** 前端 `Tools` 组件改造:点击工具卡片时新窗口打开对应静态 HTML(`target="_blank" rel="noopener"`)。DoD:列表点击行为正确;追加工具(§4.0.4 中的 6 个)也展示在工具列表里(通过 §5.1 同步)。
- [ ] **5.5** 教程详情页 (`TutorialDetail.tsx`) 增加章节列表展示:调用 `GET /api/chapters?filters[tutorial][slug][eq]={slug}&sort=order&fields=title,order,est_read_minutes` 渲染章节列表。DoD:访问 `/tutorials/modern-frontend-architecture` 可以看到 6 章列表 + 各章链接。
- [ ] **5.6** 新增路由 `/tutorials/:slug/chapters/:order` 渲染单章内容,通过 `GET /api/chapters?filters[tutorial][slug][eq]={slug}&filters[order][eq]={order}` 拉单章 markdown 并渲染。DoD:访问 `/tutorials/modern-frontend-architecture/chapters/1` 显示第 1 章正文;不存在的 order 显示 404。

---

## 6. 终态验证(Phase 5)

- [ ] **6.1** 运行 `pnpm run typecheck` 通过。
- [ ] **6.2** 运行 `pnpm run test:run` 通过(如有新增组件需补测试)。
- [ ] **6.3** 启动前后端,手工走查:随笔 8 篇 / 教程 7 篇 / 工具(§4 计划 8 个 + §4.0.4 追加 6 个 = 14 个)均可点击进入并展示真实内容。DoD:截图归档到 `docs/qa-screenshots/`。**必须使用 headed 浏览器**(headless Edge 之前踩过 IntersectionObserver 异步揭示不渲染的坑);若用 Playwright/CDP 截图,需先把 `prefers-reduced-motion` 设为 `reduce`,并 `await` 列表数据 fetch 完成后再截。
- [ ] **6.4** 在 `README.md` 顶部加一段"内容创作流程"短说明,指向本 `todolist.md` 与 `content/README.md`。

---

## 7. 补充任务(后续追加区,由 LLM 在此 append,不要插入到上面已编号节中)

<!-- 例:
- [ ] **7.1** 新增第 9 个工具 xxx。
-->

---

## 附录 A · 执行优先级建议

如果由 LLM 顺序执行,推荐顺序:

1. §1 基础设施(快,必须先做);随后 §1.4 lint 脚本要确保能跑。
2. §4.0 工具迁移基线(把 mini-tools/ 规范化,清除路径与风格债)。
3. §5.0 chapter content-type(破坏性 schema 改动,越早做越好,先于任何教程内容定稿)。
4. §4.1–§4.8 工具补齐(产物可被肉眼立刻验证,反馈最快)。
5. §2 随笔(单篇耗时较短,可并行触发多个子任务)。
6. §3 教程(每章耗时长,串行更稳妥)。
7. §5.1–§5.6 同步集成(必须在 §2/§3 至少各完成 1 篇之后才能跑通)。
8. §6 终态验证。

---

## 附录 B · 进度统计速查

| 阶段 | 总任务数 | 完成 | 备注 |
|---|---|---|---|
| §1 基础设施 | 4 | 0 | 增加 lint-content 脚本 |
| §2 随笔(8 篇 × 4 步) | 32 | 0 | 纯文字,不配图 |
| §3 教程(7 篇,合计) | 52 | 0 | 纯文字,不配图;章节数视质量可上下浮动 |
| §4 工具集(§4.0 迁移 4 步 + §4.1–§4.8 共 24 步) | 28 | 0 | 含 mini-tools/ 迁移合并 |
| §5 同步集成 | 7 | 0 | 含 chapter content-type 新增 |
| §6 终态验证 | 4 | 0 | 强制 headed 浏览器 |
| **合计** | **127** | **0** | |
