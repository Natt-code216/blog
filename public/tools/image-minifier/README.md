---
slug: image-minifier
title: 图片极简压缩
icon: droplet
features: [PNG/JPG/WebP 压缩, 质量滑杆, 压缩前后对比, 批量下载]
status: usable
---

# 图片极简压缩

在浏览器本地压缩图片，不上传任何文件。

## 功能

- 支持 PNG / JPG / WebP。
- 质量滑杆 0–100。
- 显示压缩前后文件大小对比。
- 批量处理与下载。

## 第三方依赖

- 浏览器原生 Canvas API + `HTMLCanvasElement.toBlob()`。
- 可选 [browser-image-compression](https://github.com/Donaldcwl/browser-image-compression) — MIT License。
