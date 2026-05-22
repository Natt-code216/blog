---
slug: analytics-dashboard
title: 数据洞察视图
icon: barChart
features: [CSV/JSON 拖拽导入, 自动识别列, 柱状图与折线图, PNG 导出]
status: usable
---

# 数据洞察视图

把 CSV / JSON 数据快速可视化为图表，全部本地处理。

## 功能

- 拖拽 CSV 或 JSON 文件即可解析。
- 自动识别数值列与分类列。
- 一键切换柱状图 / 折线图。
- 导出图表为 PNG。
- 内置示例数据按钮。

## 已知限制

- 单文件 ≤ 5 MB 为最佳体验。
- 仅支持一层 JSON 对象数组。

## 第三方依赖

- [Chart.js](https://www.chartjs.org/) v4 — MIT License（CDN：`https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.js`）
