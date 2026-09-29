# Natt · 个人网站

React + TypeScript + Vite 前端、Strapi 5 内容后台，以及 11 个浏览器工具。首页保留「创造者 / 思考者 / 探索者」与绿色星球，阅读页和工具页共用深浅配色及主题偏好。

文章仍从 Strapi 读取。仓库中的 `content/` 是稿件，不会自动发布；旧后台和数据库尚未接回。工具直接在浏览器处理文件和文本，无需运行 CMS。

## 开始开发

推荐 Node.js 24（`.nvmrc`），前端固定 pnpm 10.34.6。

```bash
pnpm install --frozen-lockfile
# 首次配置时执行；已有 .env.local 时编辑原文件
cp .env.example .env.local
pnpm dev
```

打开终端提示的开发地址，通常是 `http://localhost:5173`；工具集位于 `/mini-tools/index.html`。`VITE_API_URL` 需包含 `/api`，例如 `http://localhost:1337/api`。未运行后台时，文章显示可重试的连接失败状态，不影响本地工具。

后端独立安装与配置：

```bash
npm ci --prefix backend
# 首次配置时执行；已有密钥时保留原文件
cp backend/.env.example backend/.env
# 按 backend/README.md 填写密钥
pnpm backend:dev
```

后台入口为 `http://localhost:1337/admin`。启动空后台不会恢复原来的文章，需要接回旧数据库或另行迁移内容。详见 [后端说明](backend/README.md)。

## 改功能时去哪里

| 要修改的内容 | 入口 |
| --- | --- |
| 主站路由、404 | `src/app/App.tsx`、`src/pages/` |
| 首页星球、文章列表、工具推荐 | `src/features/home/`、`essays/`、`tutorials/`、`tools/Tools/` |
| 阅读布局、Markdown 排版 | `src/components/layout/ArticleLayout/`、`src/components/ui/MarkdownContent/` |
| 工具页面结构 | 根目录 `mini-tools/*.html`，共 12 个构建入口 |
| 工具处理逻辑、专属样式 | `src/features/tools/implementations/` |
| 工具页导航、表单、上传区等共用布局 | `src/features/tools/workbench/` |
| 工具名称、分类、地址 | `src/services/toolCatalog.ts`，首页、搜索、工具目录共用 |
| 深浅配色、主题行为 | `src/styles/tokens.css`、`src/app/theme.ts` |
| API 与内容稿 | `src/services/api.ts`、`content/`；稿件不等于已发布数据 |

前端并非两套独立站点：React 页面和工具 HTML 都交给根目录 Vite 构建。`public/` 只放无需编译的静态资源；**不要把工具放回 `public/`，也不要直接双击源 HTML 或只复制 HTML 发布**。完整产物是 `dist/`，工具地址继续使用 `/mini-tools/*.html`。

## 常用命令

| 命令 | 用途 |
| --- | --- |
| `pnpm dev` | 主站与全部工具的开发服务 |
| `pnpm typecheck` | TypeScript 检查 |
| `pnpm test:run` | 单元及组件测试 |
| `pnpm build` | 构建主站、工具 HTML 与依赖至 `dist/` |
| `pnpm preview` | 预览生产构建 |
| `pnpm backend:dev` | 启动 Strapi |
| `pnpm check:ports` | 手动诊断 5173 / 1337 端口 |
| `pnpm sitemap` | 构建后生成 sitemap，需 CMS 与 `SITE_URL` / `STRAPI_URL` |

前端使用 `pnpm-lock.yaml`，后端使用 `backend/package-lock.json`，不要混用。`pnpm-workspace.yaml` 配置构建脚本白名单，并未把项目拆成多包工作区。

## 文档

- [感悟随笔原稿](content/README.md#感悟随笔)：3 篇重写稿及其编辑记录。
- [架构与目录](docs/architecture/README.md) · [前端快速开始](docs/frontend/QUICKSTART.md)
- [本地启动与调试计划](docs/LOCAL_DEBUG_PLAN.md)：含本地内容预览与待修复项。
- [组件与路由](docs/frontend/COMPONENTS.md) · [样式与主题](docs/frontend/STYLING.md)
- [工具开发](docs/tools/README.md) · [改造记录与待办](docs/REFACTOR_PLAN.md)
- [文档导航](docs/README.md) · [部署说明](docs/deployment/README.md)
- [首页融合设计稿](docs/design/home-fusion.html)：已迁入正式首页，原稿仅作设计参考。

`docs/archive/`、`archive/blog.html` 保留历史资料，开发方法以当前文档为准。许可证：[MIT](LICENSE)。

远端此前的完整教程系列、工具原型和任务清单已按版本保存在 [历史资料目录](docs/archive/README.md)。当前页面使用 `content/tutorials/catalog.json` 中的教程清单和 `/mini-tools/` 工具入口。
