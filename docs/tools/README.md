# Mini Tools · 浏览器工具集

11 个工具由 Vite 与主站统一构建，处理文件和文本不依赖 Strapi。文件内容在浏览器内处理；页面资源仍需从网站加载，并不等于已经实现离线应用。

## 开发与使用

```bash
pnpm install --frozen-lockfile
pnpm dev
```

打开 `/mini-tools/index.html`。生产预览执行 `pnpm build`、`pnpm preview`，发布完整 `dist/`。源码不再是可单独分发的 HTML：不要双击源文件、只复制 `mini-tools/` 或用普通静态服务器直接托管源码。

`pnpm build` 最后自动运行 `scripts/verify-build.mjs`，核对全部入口、工具目录链接和本地资源。也可单独运行 `pnpm check:build` 检查已有构建产物。

## 目录与工具

| 工具 | HTML 入口 / 地址末段 | 类别 |
| --- | --- | --- |
| PDF 合并 | `pdf-merger.html` | 文件 |
| PDF 拆分 | `pdf-splitter.html` | 文件 |
| 图片转 PDF | `image-to-pdf.html` | 文件 |
| 图片压缩 / 转换 | `image-compressor.html` | 文件 |
| JSON 格式化 | `json-formatter.html` | 文本与数据 |
| CSV ↔ JSON | `csv-json.html` | 文本与数据 |
| Markdown → HTML | `markdown-html.html` | 文本与数据 |
| Base64 编解码 | `base64.html` | 文本与数据 |
| 二维码生成 | `qrcode.html` | 日常 |
| 文本字数统计 | `word-counter.html` | 日常 |
| 时间戳转换 | `timestamp.html` | 日常 |

HTML 入口放根目录 `mini-tools/`，地址始终为 `/mini-tools/<name>.html`。相关代码集中在 `src/features/tools/`：

- `workbench/init.ts`：公共导航、主题按钮、页脚、状态播报。
- `workbench/workbench.css`：公共表单、按钮、上传区域与响应式布局。
- `workbench/directory.ts`、`directory.css`：目录交互和布局。
- `implementations/<name>.js`、`.css`：该工具的处理逻辑和特有布局。
- `implementations/*-utils.js`、`text-helpers.js`：可测试的处理函数。

工具元信息统一维护在 `src/services/toolCatalog.ts`，首页、搜索和工具目录都读取它，不手动维护三份卡片。主题复用 `src/app/theme.ts` 和 `src/styles/tokens.css`，见 [主题说明](../frontend/STYLING.md)。

导航规则、返回时的筛选保留和回归场景见 [工具集跳转说明](navigation.md)。

## 依赖与安全渲染

处理库通过 npm 安装并由 Vite 打包：`pdf-lib@1.17.1`、`jszip@3.10.1`、`qrcode@1.5.4`、`marked@18.0.14`、`dompurify@3.4.16`，不再使用 CDN 脚本。图片处理使用浏览器 Canvas。

Markdown 工具与文章阅读共用 `src/utils/renderMarkdown.ts`：同步解析后消毒，移除脚本、危险链接、事件处理器、表单及内联样式。不要直接把用户输入或未经消毒的解析结果写入 `innerHTML`。输入文本、文件名和错误消息应使用 `textContent`。

## 新增工具

1. 在 `mini-tools/` 新增 HTML，沿用现有语义结构，引入 `/theme.js`、公共 `workbench/init.ts` 与本工具模块。
2. 在 `implementations/` 添加处理逻辑和必要的局部样式；提取需要边界测试的纯函数。
3. 在 `services/toolCatalog.ts` 登记名称、分类、描述与地址。Vite 会自动发现 HTML 入口。
4. 检查深浅主题、窄屏、键盘操作、空输入/非法输入、错误反馈、重置和下载；验证生产构建中的真实链接。

公共布局的问题在 `workbench/` 修复；只有单个工具需要的样式才放其专属 CSS。工具无需新增 React 路由或 CMS 条目。
