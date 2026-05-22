# content/ 目录说明

本目录承载随笔（essays）与教程（tutorials）的源 Markdown，作为唯一可信源（single source of truth）。
经由 `scripts/sync-content.mjs` 同步到 Strapi。

## 目录结构

```
content/
  essays/
    {slug}/
      index.md          # 正文 + YAML frontmatter
      references.md     # 采集到的网络资料、引用来源清单（可空但必须存在）
      outline.md        # 撰稿前的提纲（可保留作历史）
  tutorials/
    {slug}/
      index.md          # 教程总览 / 引言
      chapters/
        01-xxx.md
        02-xxx.md
      references.md
public/
  tools/
    {slug}/
      index.html        # 单文件工具入口
      README.md         # 工具说明 + 功能列表 + 已知限制
scripts/
  sync-content.mjs      # 把 content/ 同步进 Strapi
  lint-content.mjs      # frontmatter / 字数 / 占位符校验
```

## 文件格式

### essay frontmatter

```yaml
---
slug: tech-and-humanity
title: 技术与人性的平衡
category: ESSAY            # ESSAY | THOUGHTS | LIFESTYLE
excerpt: 一句话摘要（70 字以内）
date: 2026-05-23
tags: [技术哲学, 注意力]
---
```

### tutorial index frontmatter

```yaml
---
slug: modern-frontend-architecture
title: 现代前端架构指南
description: 一句话描述
level: B_level             # A_level | B_level | C_level | ALL
status: A更新中            # A更新中 | B已完结
icon: code                 # code | layers | zap
chapters: 6
---
```

### chapter frontmatter

```yaml
---
order: 1
title: 章节标题
est_read_minutes: 12
---
```

### tool README frontmatter

```yaml
---
slug: color-palette
title: 色彩调和引擎
icon: droplet
features: [快速生成调色板, 导出 CSS 变量]
status: usable             # planning | wip | usable
---
```

## 风格基线

- 文风对齐 `blog.html` 的克制、极简、第一人称基调。
- 单篇随笔正文 1200–2200 字；不堆砌定义，先给具体的观察或场景，再升华。
- 教程每章 1500–3500 字，含至少 1 段可运行代码或图示伪代码。
- 工具页配色严格遵循 `blog.html` 的 CSS 变量（`--bg-base #050505` / `--text-primary #fcfcfc` / `--border-light`）。
- 所有产出不堆砌 emoji；工具页可有少量功能性 SVG 图标。

## 引用与版权

- 单次引用原文 ≤ 30 词（中文 ≤ 60 字），用 markdown 引用块标注并在 `references.md` 列出来源 URL。
- 释义而非翻译；命题与论据必须经过自己的重组与举例。
- 工具页若调用第三方 CDN 库，必须在 README 注明 License。

## 写作流程

1. 采集：把 ≥3 篇网络参考写入 `references.md`（URL + 作者 + 一句核心观点）。
2. 提纲：在 `outline.md` 写 3–4 个核心论点与个人视角。
3. 初稿：写 `index.md`，含 frontmatter，达到字数下限。
4. 自查：删空话/套话；保留可被引用的句子。
5. lint：`pnpm run lint:content` 通过。
