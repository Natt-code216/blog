# 项目迭代 TodoList

> 目标：把这个 React + Strapi 个人博客项目搭建到接近"成品"水平。
> 起始：2026-05-22

---

## V1 · 基础搭建（已完成 · 2026-05-22）

- [x] **0.1** 将工作区改动 push 到 GitHub
- [x] **0.2** 通读项目结构，理解前后端意图
- [x] **0.3** 建立任务清单

### 启动与连通性

- [x] **1.1** 端口检查脚本 `scripts/check-ports.mjs`
- [x] **1.2** 校验前后端依赖
- [x] **1.3** 后台启动 Strapi（1337，API 返回 200）
- [x] **1.4** 后台启动 Vite（5173）
- [x] **1.5** 完善 `.env`、`.env.example`

### 内容补全

- [x] **2.1** 三篇教程文字稿（React+Vite / Strapi / 联调）
- [x] **2.2** 三篇随笔示例（克制 / 手艺 / 工具）
- [x] **2.3** 工具卡片说明
- [x] **2.4** Strapi 种子数据脚本 `backend/scripts/seed.js`

### 工程化（不改前端 UI）

- [x] **3.1** `predev` 自动端口检查
- [x] **3.2** `dev:all / check:ports / backend:*` 脚本
- [x] **3.3** `.env.example` 区分前后端
- [x] **3.4** `useApiFetch` ref 模式
- [x] **3.5** `api.ping()` 健康检查
- [x] **3.6** `.gitignore` 检查 OK

### 文档化

- [x] **4.1** `README.md` 加入迭代记录
- [x] **4.2** `docs/README.md` 加入教程索引

---

## V2 · 大版本迭代（已完成 · 2026-05-22）

### 路由与详情页

- [x] **5.1** 引入 `react-router-dom@7`、`react-helmet-async`
- [x] **5.2** 拆分 `src/pages/HomePage.tsx`，App 顶层接入 `<Routes>`
- [x] **5.3** 详情页：`EssayDetail`、`TutorialDetail`
- [x] **5.4** 通用样式 `DetailPage.module.css`（不修改原有 CSS Module）
- [x] **5.5** `<ScrollToTop>`：路由切换回顶部，hash 自动滚到锚点
- [x] **5.6** Navbar 在详情页用 `<Link to="/#xxx">` 跳回首页锚点
- [x] **5.7** Essays/Tutorials 卡片改用 `<Link>`，避免整页刷新

### 主题切换

- [x] **6.1** `ThemeContext` + `useTheme`，localStorage 持久化
- [x] **6.2** 浮动 `ThemeToggle` 按钮（右下角）
- [x] **6.3** 浅色主题 CSS 变量（追加在 `App.css` 末尾，不动原变量）

### 站内搜索

- [x] **7.1** `SearchBar` 浮动按钮 + 全屏对话框
- [x] **7.2** Ctrl/Cmd + K 快捷键
- [x] **7.3** 客户端跨随笔/教程/工具过滤

### 评论系统

- [x] **8.1** `api.getCommentsByEssay` / `api.postComment`
- [x] **8.2** `<Comments>` 组件嵌入 `EssayDetail`

### SEO

- [x] **9.1** `<Helmet>` 动态 title/meta/og
- [x] **9.2** `scripts/generate-sitemap.mjs`
- [x] **9.3** `public/robots.txt`

### 单元测试

- [x] **10.1** vitest + @testing-library + jsdom
- [x] **10.2** `transformData.test.ts` (9 tests)
- [x] **10.3** `useApiFetch.test.tsx` (5 tests)
- [x] **10.4** `api.test.ts` (9 tests)
- [x] **10.5** `pnpm test:run` → **23 passed**

### CI/CD + 部署

- [x] **11.1** `.github/workflows/ci.yml`
- [x] **11.2** `vercel.json`、`netlify.toml`
- [x] **11.3** `docs/deployment/` 四份部署文档（Vercel/Netlify/Railway/Render）
- [x] **11.4** `.github/PULL_REQUEST_TEMPLATE.md` 与 `ISSUE_TEMPLATE/*`

### 内容扩展

- [x] **12.1** 教程 04 · 详情页与路由
- [x] **12.2** 教程 05 · 部署上线
- [x] **12.3** 工程脚本：`typecheck`、`sitemap`、`ci`

### 验收

- [x] **13.1** `pnpm typecheck` 通过
- [x] **13.2** `pnpm build` 成功（CSS 16.94 kB / JS 257.67 kB）
- [x] **13.3** `pnpm test:run` 23/23 通过
- [x] **13.4** Sitemap 生成正常

---

## V3 · 未来路线（不在本轮）

- [ ] **14.1** 评论审核 / 反垃圾（Strapi 自定义中间件）
- [ ] **14.2** 文章正文 Markdown 完整渲染（marked + DOMPurify + highlight.js）
- [ ] **14.3** 评论分页与回复嵌套
- [ ] **14.4** RSS feed 生成
- [ ] **14.5** PWA 离线支持
- [ ] **14.6** Plausible / Umami 隐私友好统计
- [ ] **14.7** 标签 / 分类系统
- [ ] **14.8** i18n 多语言支持
- [ ] **14.9** Storybook 组件文档站
- [ ] **14.10** E2E 测试（Playwright）

---

## 约束与原则

1. **不改前端视觉样式**：所有原有 CSS Module 文件保持不变，新页面与浮动组件使用自有 CSS Module，避免污染。
2. 主题切换通过 `[data-theme="light"]` 选择器追加变量，**不动**默认深色调色板。
3. 端口检查 (`predev`) 自动前置，避免冲突。
4. 所有改动统一通过 README.md 的"迭代记录"章节记录。
