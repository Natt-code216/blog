# 组件与页面

`src/main.tsx` 挂载 React 并组合 Helmet、主题与 Router。`src/app/App.tsx` 负责导航、页脚、搜索、主题切换和路由。

## 页面入口

| 路径 | 入口 | 数据来源 |
| --- | --- | --- |
| `/` | `pages/HomePage.tsx` | 首页介绍、CMS 列表、本地工具目录 |
| `/essays/:slug` | `pages/EssayDetail.tsx` | 随笔 API；评论按 documentId 关联 |
| `/tutorials/:slug` | `pages/TutorialDetail.tsx` | 教程 API |
| 未匹配的主站路径 | `pages/NotFoundPage.tsx` | 明确 404，不回退成首页 |
| `/mini-tools/index.html` | `mini-tools/index.html` | `services/toolCatalog.ts` |
| `/mini-tools/<tool>.html` | 相应 HTML | 浏览器本地处理 |

工具属于 Vite 多页面入口，不属于 React Router。工具用普通 `<a>` 跳转，随笔与教程用 `<Link>`；不要把 `.html` 链接交给 Router。

## 模块归属

以下路径相对于 `src/`：

| 模块 | 职责 |
| --- | --- |
| `components/layout/Navbar/`、`Footer/` | 主站导航、锚点和页脚 |
| `components/layout/ArticleLayout/` | 阅读列、标题、元信息，以及加载/失败/404 状态 |
| `components/ui/MarkdownContent/` | 正文排版，表格与代码块局部滚动 |
| `utils/renderMarkdown.ts` | Markdown 解析与 HTML 消毒，阅读页和 Markdown 工具共用 |
| `pages/useArticle.ts` | 详情请求、重试、切换文章时忽略过期响应 |
| `features/home/Hero/` | 首页身份标题、绿色星球和暂停动效 |
| `features/essays/Essays/`、`tutorials/Tutorials/` | 列表与加载/失败/空状态 |
| `features/tools/Tools/` | 首页三色卡片、真实工具入口、可选 CMS 推荐 |
| `features/tools/workbench/` | 工具公用导航/主题按钮、表单/上传区、目录 |
| `features/tools/implementations/` | 工具业务处理和局部样式 |
| `features/comments/Comments/` | 评论表单、请求错误/重试/提交反馈，自己的 CSS Module |
| `features/search/SearchBar/` | Ctrl/Cmd + K 搜索、焦点管理、CMS 失败降级 |
| `app/theme.ts`、`app/providers/ThemeContext.tsx` | 共享主题状态与 React 订阅 |

首页列表使用 `hooks/useApiFetch.ts`；接口和 API 类型集中在 `services/api.ts`，必要的数据转换放 `utils/transformData.ts`。详情区分连接失败和内容不存在，返回链接始终回到对应列表。

评论 API 将后端 `authorName` 映射为界面的 `author`，提交时使用后端字段。加载失败不会被伪装成空列表，提交失败保留用户草稿。邮箱隐私与审核规则仍需后台验收；不要因界面可操作就宣称生产评论流程已完成。

搜索始终包含 `services/toolCatalog.ts` 的 11 个工具，CMS 数据按需加载；某类请求失败不隐藏其他来源。本地工具地址不依赖后台推荐列表。

## 新增或修改功能

先确定业务归属再选入口。新增工具需添加 HTML 入口、实现模块和目录项，见 [工具开发](../tools/README.md)。新增 API 放 `services/`；通用 UI 不应依赖具体路由页面。组件样式和测试与源码放在一起，重点覆盖请求状态、输入边界和真实渲染行为。
