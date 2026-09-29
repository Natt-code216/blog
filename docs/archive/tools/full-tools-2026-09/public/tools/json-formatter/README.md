---
slug: json-formatter
title: JSON 结构化对齐
icon: fileText
features: [格式化, 压缩, JSONPath 查询, 树形折叠, 双面板 diff]
status: usable
---

# JSON 结构化对齐

格式化、压缩、校验 JSON，并支持基础 diff 与树形折叠。

## 功能

- 一键格式化（2 / 4 空格可调）。
- 一键压缩为单行。
- JSONPath 查询（`$.foo.bar[0]`）。
- 树形折叠浏览。
- 双面板行级 diff（LCS）。

## 已知限制

- 单文件 ≤ 5 MB 为最佳体验。
- diff 仅支持行级比较，不做语义对齐。

## 第三方依赖

无外部依赖，纯原生 JavaScript 实现。
