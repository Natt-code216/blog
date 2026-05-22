---
slug: csv-json
title: CSV ↔ JSON 互转
icon: fileText
features: [CSV→JSON, JSON→CSV, 自动识别表头, 大文件支持]
status: usable
---

# CSV ↔ JSON 互转

CSV 与 JSON 之间双向无损互转，全程在浏览器内本地完成。

## 功能

- CSV → JSON：自动识别首行为表头，支持引号包裹与转义。
- JSON → CSV：对象数组自动展开为表格，缺失字段补空。
- 支持拖拽文件或粘贴文本。
- 一键复制 / 下载结果。

## 已知限制

- 不处理嵌套 JSON（仅一层对象数组转 CSV）。
- 单文件 ≤ 10 MB 体验最佳。

## 第三方依赖

无外部依赖，纯原生 JavaScript 实现。
