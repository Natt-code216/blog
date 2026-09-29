# 样式与主题

首页保留居中衬线身份标题、绿色轨道星球与绿/紫/蓝灰卡片；阅读页和工具工作台沿用同一配色。深浅主题必须一起修改和验证。

## 样式入口

| 文件或目录 | 职责 |
| --- | --- |
| `src/styles/tokens.css` | 全项目设计变量与深浅两套颜色；React 和工具均引用 |
| `src/styles/global.css` | 主站重置、容器、标题、滚动与基础交互 |
| 组件内 `*.module.css` | 主站组件的局部布局 |
| `components/layout/ArticleLayout/` | 760px 阅读列、文章标题和请求状态 |
| `components/ui/MarkdownContent/` | Markdown 标题、列表、表格、引用和代码块 |
| `features/comments/Comments/Comments.module.css` | 评论独立样式，不再借用页面 CSS |
| `features/tools/workbench/workbench.css` | 工具页公共外壳、控件、上传区、响应式布局 |
| `features/tools/implementations/*.css` | 工具特有布局，避免覆盖公共外壳 |

## 设计变量

| 变量 | 用途 |
| --- | --- |
| `--bg-base`、`--bg-surface`、`--bg-card` | 页面、表面、卡片背景 |
| `--text-primary`、`--text-secondary`、`--text-muted` | 文字层级 |
| `--border-light`、`--border-hover` | 边框 |
| `--accent`、`--on-accent` | 强调背景及其文字 |
| `--essay-*`、`--tutorial-*`、`--tool-*` | 各栏目表面、边框、强调色 |
| `--status-error`、`--status-error-bg` | 错误文字与背景 |
| `--status-success`、`--status-success-bg` | 成功文字与背景 |
| `--font-serif`、`--font-mono` | 衬线标题、等宽标签 |
| `--max-width`、`--nav-height` | 主站容器与导航高度 |

`tokens.css` 默认深色，`:root[data-theme='light']` 定义浅色。不要在业务组件中硬编码黑白文字或重新定义一套主题；Markdown 输入中的内联样式也会被消毒器移除，避免内容破坏布局和主题。

## 主题状态

`src/app/theme.ts` 是运行时主题来源，使用同源 localStorage 的 `blog-theme`，更新根元素 `data-theme`、`color-scheme` 与浏览器主题色。React 的 `ThemeContext` 订阅它；工具页 `workbench/init.ts` 直接使用同一模块。跨标签页变化通过 `storage` 同步，返回历史页面时通过 `pageshow` 重新读取。

所有 HTML 在样式加载前执行 `public/theme.js`，减少首次加载的颜色闪烁。该脚本仅做首屏预设，不承载独立主题状态。存储不可用时，当前页面仍可切换主题。

## 布局与验收

正文使用系统无衬线字体，标题使用本地宋体和衬线回退，不加载外部字体。文章标题、正文、评论统一行宽；长代码和表格在各自块内滚动，页面本身不应横向溢出。

修改后检查桌面与 390px 手机宽度，覆盖两套主题、键盘焦点、长文本、空/失败状态、文件上传区域与窄屏控件换行。固定导航和浮动按钮不能遮住主要操作。

`ScrollReveal` 支持焦点显示；`prefers-reduced-motion` 关闭动画并保持内容可见。首屏星球另有暂停按钮，正文阅读不依赖动画。工具页的全局规则仅作用在工具文档，不能引入主站组件选择器。
