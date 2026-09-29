# 项目架构与目录约定

项目有两个独立安装边界：根目录前端和 `backend/` Strapi。前端同时包含 React 主站与 12 个工具 HTML 入口，由一个 Vite 配置统一开发、构建和发布；无需新增 monorepo。

## 目录职责

```text
index.html                       # React 入口
mini-tools/*.html                # 工具目录 + 11 个工具，Vite 多页面入口
src/
├── main.tsx                     # React 挂载、Router、Provider
├── app/
│   ├── App.tsx                  # 主站路由与外壳
│   ├── theme.ts                 # 主站/工具共用的主题状态与持久化
│   ├── providers/ThemeContext.tsx # React 订阅主题
│   └── ScrollToTop/             # 路由与锚点滚动
├── components/
│   ├── layout/                  # Navbar、Footer、ArticleLayout
│   └── ui/                      # MarkdownContent、ScrollReveal、ThemeToggle
├── features/
│   ├── home/ essays/ tutorials/ # 首页业务板块
│   ├── tools/
│   │   ├── Tools/               # 首页工具推荐
│   │   ├── workbench/           # 工具共用外壳、布局、目录渲染
│   │   └── implementations/     # 各工具逻辑/局部样式/处理函数
│   ├── comments/                # 评论界面及独立样式
│   └── search/                  # 全站搜索
├── pages/                       # 路由页与详情请求状态
├── services/                    # API、类型、共享工具目录
├── hooks/                       # 通用 hook
├── styles/                      # tokens.css 配色；global.css 主站基础样式
├── utils/                       # 转换函数、共享安全 Markdown 渲染
├── types/                       # 展示层类型
└── test/                        # 测试环境初始化
public/                          # 无需编译的资源、robots.txt、首屏 theme.js
backend/                         # Strapi 源码、schema、配置、独立 npm 锁文件
content/                         # 随笔/教程/工具介绍稿，不自动发布
scripts/                         # 端口诊断、sitemap
archive/                         # 原始静态原型
docs/                           # 当前说明；archive/ 内为历史记录
```

## 页面和数据如何连接

- `index.html → main.tsx → App.tsx → pages/` 装配 React 页面。首页模块请求 Strapi；详情按 slug 请求正文，并复用 `ArticleLayout` 与 `MarkdownContent`。
- `mini-tools/*.html → workbench/init.ts + implementations/<tool>.js` 加载共用外壳和本工具逻辑。目录页使用 `workbench/directory.ts`，不依赖 CMS。
- `services/toolCatalog.ts` 是工具元信息的唯一来源，服务首页、搜索、目录；新增工具时在这里登记，避免三个位置重复维护。
- `styles/tokens.css` 与 `app/theme.ts` 同时供 React 和工具使用。`public/theme.js` 只提前设置首屏颜色，详细行为见 [主题说明](../frontend/STYLING.md)。
- Markdown 先由 `utils/renderMarkdown.ts` 解析并消毒，再在阅读页或工具预览中展示，禁止直接注入原始 HTML。

`content/` 只是稿件。网站显示哪些文章，取决于 CMS 数据、发布状态与读取权限。克隆仓库不会带回旧数据库或上传文件；本轮没有把稿件作为离线文章发布。

## 构建和维护边界

`vite.config.ts` 自动收集根目录 `mini-tools/` 的 HTML，输出 `dist/mini-tools/`，保留既有 URL；所有依赖和共用模块打包进入 `dist/assets/`。工具的 npm 依赖不再从 CDN 加载。开发使用 `pnpm dev`，发布整个 `dist/`，不要复制源 HTML。

前端用 `pnpm@10.34.6` 与根锁文件；后端用自己的 npm 锁文件。推荐 Node.js 24。Strapi 的 `src/api/`、`config/` 保留框架约定。

路由页负责装配，业务组件归 `features/`，共享布局归 `components/layout/`，通用展示归 `components/ui/`。样式与测试就近放置，跨页面颜色只改 `tokens.css`；不要让业务组件反向导入 `pages/` 的样式。现有工具使用原生 DOM 脚本，主站使用 React，两者通过模块与设计变量复用，不混用挂载点。

入口见 [快速开始](../frontend/QUICKSTART.md)，尚未完成的后台与发布工作见 [改造记录](../REFACTOR_PLAN.md)。
