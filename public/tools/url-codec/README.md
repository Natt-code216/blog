---
slug: url-codec
title: URL 编解码工具
icon: search
features: [URL 编解码, Base64 编解码, HTML 实体编解码, 自动识别, 多行批量]
status: usable
---

# URL 编解码工具

对 URL、Base64、HTML 实体进行批量编解码，支持自动识别与多行处理。

## 功能

- `encodeURIComponent` / `decodeURIComponent`。
- `btoa` / `atob` 配合 `TextEncoder` 处理 UTF-8。
- HTML 实体（`&amp;` / `&#65;` / `&#x41;`）编解码。
- 多行批量同时处理。

## 第三方依赖

无外部依赖，纯原生 JavaScript。
