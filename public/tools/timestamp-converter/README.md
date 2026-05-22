---
slug: timestamp-converter
title: 时间戳与时区转换器
icon: barChart
features: [Unix↔ISO↔本地时区, 当前时间常驻, 批量转换, IANA 时区列表]
status: usable
---

# 时间戳与时区转换器

在 Unix 时间戳、ISO 8601、本地时区之间无缝互转。

## 功能

- 自动识别输入格式（秒 / 毫秒 / ISO 字符串）。
- 同时显示 UTC、本地、自选时区结果。
- 顶部常驻当前时间。
- IANA 时区下拉。

## 第三方依赖

无外部依赖，使用浏览器原生 `Intl.DateTimeFormat`。
