# 工具迁移映射表

`mini-tools/` 下扁平的 11 个 HTML 工具已迁移至 `public/tools/{slug}/index.html`。

| 源文件 | 目标 slug | 处理方式 |
|---|---|---|
| mini-tools/base64.html | url-codec | 迁移 + 扩展（URL/Base64/HTML 三类编解码） |
| mini-tools/csv-json.html | csv-json | 迁移（追加工具） |
| mini-tools/image-compressor.html | image-minifier | 迁移（§4.6 计划名额） |
| mini-tools/image-to-pdf.html | image-to-pdf | 迁移（追加工具） |
| mini-tools/json-formatter.html | json-formatter | 迁移（§4.5 计划名额） |
| mini-tools/markdown-html.html | markdown-editor | 迁移 + 扩展（双栏、本地保存） |
| mini-tools/pdf-merger.html | pdf-merger | 迁移（追加工具） |
| mini-tools/pdf-splitter.html | pdf-splitter | 迁移（追加工具） |
| mini-tools/qrcode.html | qrcode | 迁移（追加工具） |
| mini-tools/timestamp.html | timestamp-converter | 迁移（§4.7 计划名额） |
| mini-tools/word-counter.html | word-counter | 迁移（追加工具） |

**新建工具**（§4.1–4.4，不在迁移名额内）：
- `analytics-dashboard`（§4.1）
- `color-palette`（§4.2）
- `regex-visualizer`（§4.4）

合计 8 个计划工具 + 6 个追加工具 = 14 个最终上线工具。

配色统一使用 `blog.html` 基线 CSS 变量：
- `--bg-base: #050505`
- `--text-primary: #fcfcfc`
- `--text-secondary: #888`
- `--border-light: rgba(255,255,255,0.08)`

字体：`'Playfair Display'`（标题） + `'Inter'`（正文）。
