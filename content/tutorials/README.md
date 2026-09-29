# 技术教程：五个主题，七个章节

本轮整理于 2026-09-30。保留原有五个 slug，按入门到上线的顺序编排。第一个教程先完成三章，其余各完成第一章；均标为「更新中」，后续按需继续补充。网站页面从 Strapi 读取已发布正文。

## 阅读目录

| 顺序 | 教程 | 已写章节 | 源文件 |
| --- | --- | --- | --- |
| 1 | 从零搭建 React + Vite + TypeScript 项目 | 第一章：开发环境与第一个页面 | [01-environment.md](react-vite-setup/01-environment.md) |
| 1 | 同上 | 第二章：组件与 CSS Modules | [02-components.md](react-vite-setup/02-components.md) |
| 1 | 同上 | 第三章：搜索、已读切换与空结果 | [03-state.md](react-vite-setup/03-state.md) |
| 2 | 用 Strapi 5 搭建 Headless CMS 后端 | 第一章：内容模型与公开 API | [01-content-api.md](strapi-headless-cms/01-content-api.md) |
| 3 | 前后端联调与数据加载状态 | 第一章：真实接口与四种状态 | [01-real-data.md](frontend-backend-integration/01-real-data.md) |
| 4 | 用 React Router 实现详情页与路由 | 第一章：列表、详情与章节目录 | [01-detail-route.md](routing-and-detail-pages/01-detail-route.md) |
| 5 | 部署上线：从本地构建到发布验收 | 第一章：构建、配置与发布验收 | [01-release.md](deploy-to-production/01-release.md) |

React 三章使用独立的 `reading-lab` 练习项目；其余教程返回本站仓库操作，章节开头会指出前提。练习用的三条阅读项只解释 UI 状态，网站教程本身使用真实中文正文。

## 编辑与同步

1. 在对应 slug 目录中修改章节 Markdown，每个文件只写一个一级标题，正文从三级小节开始。
2. 新增章节时将文件名追加到 [catalog.json](catalog.json) 的 `chapters` 数组；数组顺序即阅读顺序。不要重排已分享的章节，以保持 `#chapter-N` 锚点含义稳定。
3. 修改标题或摘要也在 catalog 中完成。教程 `order` 独立于章数，必须唯一；已有 slug 尽量不改。
4. 在仓库根目录运行 `pnpm tutorials:check`，验证清单、文件、重复标识与教程互链。
5. 停止本地 Strapi，运行 `pnpm tutorials:sync`，然后 `pnpm backend:dev` 重启。进入首页和每篇详情确认内容。

同步脚本把章节组成一篇 Markdown/HTML 混合正文，生成可点击目录及章节 ID。网页仍使用现有安全 Markdown 渲染，暂未增加独立章节路由。`chapters` 从实际章节文件数计算，避免卡片显示章数却没有对应正文。

同步仅接受默认本地 `backend/.tmp/data.db`，先创建数据库备份，再按 slug 更新并发布；已有 documentId 保持不变。后台临时编辑会在下次同步时被源稿覆盖。只同步教程不会更改随笔或工具，也不会删除清单之外的后台教程。线上内容同步需另行安排，不会随 Git 推送自动发布。

## 技术基线与英文来源

本站以锁文件为准：React 18、Vite 5、React Router 7、Strapi 5.37.1，Node.js 24。资料用于核对 API 和机制，正文与练习结合本站重新编写，并非对单篇英文文章的全文翻译。引用放在对应章节段落旁，以下为维护时的汇总。

| 官方来源 | 用途 |
| --- | --- |
| [React：Thinking in React](https://react.dev/learn/thinking-in-react) | 组件边界、props、最少状态 |
| [React：useEffect](https://react.dev/reference/react/useEffect) | 异步结果清理与开发环境 Effect 行为 |
| [Vite 5：Getting Started](https://v5.vite.dev/guide/) | 练习项目初始化 |
| [Vite 5：Features](https://v5.vite.dev/guide/features#css-modules) | CSS Modules |
| [Vite 5：Env Variables and Modes](https://v5.vite.dev/guide/env-and-mode) | 客户端变量与构建时机 |
| [Strapi：REST API](https://docs.strapi.io/cms/api/rest) | Strapi 5 响应结构 |
| [Strapi：Filters](https://docs.strapi.io/cms/api/rest/filters) | slug 精确筛选 |
| [Strapi：Draft & Publish](https://docs.strapi.io/cms/features/draft-and-publish) | 草稿与公开内容 |
| [Strapi：Document Service](https://docs.strapi.io/cms/api/document-service) | 同步时保留文档身份 |
| [Strapi：Deployment](https://docs.strapi.io/cms/deployment) | 后端构建与运行 |
| [Strapi：Database configuration](https://docs.strapi.io/cms/configurations/database) | 数据库和 SSL 参数 |
| [React Router：Declarative Routing](https://reactrouter.com/start/declarative/routing) | 声明式路由与参数 |
| [Vercel：Rewrites](https://vercel.com/docs/routing/rewrites) | 静态托管路径回退 |

官方文档会继续更新；遇到版本差异先检查仓库依赖，不要直接把文档最新默认版本套到旧项目上。分章前的稿件保存在 [旧稿归档](../../docs/archive/tutorials/before-chapters-2026-09/README.md)，不参与导入。
