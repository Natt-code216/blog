# Mini Tools · 办公小工具集

> 一组纯前端的单文件 HTML 小工具，**全部在浏览器本地运行**，文件不会上传到任何服务器。

## 使用方式

不需要任何构建，不需要 Node，也不需要后端：

- 方式一：在文件管理器里**双击** `mini-tools/index.html` 即可使用全部工具。
- 方式二：用 `python -m http.server`、Live Server 或任何静态服务器托管 `mini-tools/` 目录。
- 方式三：把整个 `mini-tools/` 文件夹拖到 Vercel / Netlify / GitHub Pages 部署成在线静态站点。

每个工具都是一个独立的 `.html` 文件，可以单独分发使用，与其他工具互不依赖。

## 工具清单

### 文件转换

| 工具 | 文件 | 说明 |
|------|------|------|
| PDF 合并 | `pdf-merger.html` | 多个 PDF 合并成一份，可调整顺序 |
| PDF 拆分 | `pdf-splitter.html` | 按页码范围抽取页面 |
| 图片转 PDF | `image-to-pdf.html` | JPG/PNG/WebP → PDF，可设页面尺寸 |
| 图片压缩 / 转换 | `image-compressor.html` | JPG/PNG/WebP 互转，质量与尺寸可调 |

### 文本与数据

| 工具 | 文件 | 说明 |
|------|------|------|
| JSON 格式化 | `json-formatter.html` | 格式化、压缩、校验 |
| CSV ↔ JSON | `csv-json.html` | 表格数据双向互转 |
| Markdown → HTML | `markdown-html.html` | 实时预览并导出 HTML |
| Base64 编解码 | `base64.html` | 文本与文件双向，支持中文 |

### 日常实用

| 工具 | 文件 | 说明 |
|------|------|------|
| 二维码生成 | `qrcode.html` | 文本/链接 → QR，可定制颜色 |
| 文本字数统计 | `word-counter.html` | 中英文字数、阅读时长 |
| 时间戳转换 | `timestamp.html` | Unix 时间戳 ↔ 日期，含时区 |

## 隐私

所有工具都**只在你的浏览器内运行**：

- PDF 处理用 [pdf-lib](https://pdf-lib.js.org/)，全部在本地完成。
- 图片处理用浏览器内置 Canvas API。
- 二维码用 [qrcode.js](https://github.com/soldair/node-qrcode)。
- Markdown 用 [marked](https://github.com/markedjs/marked) + [DOMPurify](https://github.com/cure53/DOMPurify) 防 XSS。

CDN 资源在首次访问后会被浏览器缓存，离线也可继续使用。

## 设计

- 与博客主站保持一致的**暗色极简**风格
- 字体：标题 Playfair Display（serif），正文 Inter
- 主色：背景 `#050505`，文字 `#fcfcfc`，边框 `rgba(255,255,255,0.08)`
- 完全响应式，手机也能用

## 添加新工具

复制任意一个工具的 HTML 文件作为模板，按照同样的色卡、字体和布局结构修改逻辑即可。
然后在 `index.html` 的对应分组里加一张卡片链接到它。

---

返回 [博客主站](../)
