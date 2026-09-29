# QA 截图归档

本目录用于存放本次大版本上线前的手工走查截图。规范：

- 文件命名：`{section}-{slug}-{viewport}.png`，例如 `essay-tech-and-humanity-desktop.png`、`tutorial-modern-frontend-architecture-mobile.png`。
- 必须使用 **headed 浏览器** 截图（参见 todolist §6.3 的注释——headless Edge 之前踩过 IntersectionObserver 异步揭示不渲染的坑）。
- 若用 Playwright / CDP 截图，需先把 `prefers-reduced-motion` 设为 `reduce`，并 `await` 列表数据 fetch 完成后再截。

## 走查清单（14 张以上）

### 随笔（8 篇）
- [ ] /essays/tech-and-humanity
- [ ] /essays/on-creativity
- [ ] /essays/art-of-slowing-down
- [ ] /essays/signal-in-noise
- [ ] /essays/craftsmanship-and-code
- [ ] /essays/writing-as-thinking
- [ ] /essays/tools-and-mind
- [ ] /essays/on-minimalism

### 教程（7 篇 + 各章节抽样）
- [ ] /tutorials/modern-frontend-architecture
- [ ] /tutorials/modern-frontend-architecture/chapters/1
- [ ] /tutorials/ui-ux-minimal-design
- [ ] /tutorials/web-performance-tuning
- [ ] /tutorials/react-vite-setup
- [ ] /tutorials/strapi-headless-cms
- [ ] /tutorials/typescript-type-gymnastics
- [ ] /tutorials/frontend-backend-integration

### 工具（14 个 = §4 计划 8 个 + §4.0 追加 6 个）
- [ ] /tools/analytics-dashboard/index.html
- [ ] /tools/color-palette/index.html
- [ ] /tools/markdown-editor/index.html
- [ ] /tools/regex-visualizer/index.html
- [ ] /tools/json-formatter/index.html
- [ ] /tools/image-minifier/index.html
- [ ] /tools/timestamp-converter/index.html
- [ ] /tools/url-codec/index.html
- [ ] /tools/csv-json/index.html
- [ ] /tools/image-to-pdf/index.html
- [ ] /tools/pdf-merger/index.html
- [ ] /tools/pdf-splitter/index.html
- [ ] /tools/qrcode/index.html
- [ ] /tools/word-counter/index.html

## 已通过的自动检查

- `pnpm run typecheck` ✓（详见本次 commit）
- `pnpm run test:run` ✓（23 tests passed）
- `pnpm run lint:content` ✓（81 markdown files, 0 errors）

手工截图需要在本地启动前后端、运行 `node scripts/sync-content.mjs` 同步内容、再用 headed 浏览器走查并截图归档到本目录。
