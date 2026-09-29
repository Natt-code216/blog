---
slug: react-vite-setup
title: 从零搭建 React + Vite + TypeScript 项目
description: 抛弃 CRA，用 ESM 原生 + esbuild 预构建搭一份既快又干净的现代脚手架。
level: A_level
status: A更新中
icon: code
chapters: 4
---

# 从零搭建 React + Vite + TypeScript 项目

本系列面向"刚走出 CRA 时代"的开发者。Create React App 在 2023 年被官方宣布不再推荐，社区共识转向了基于 ESM + esbuild 的工具——Vite 是其中最成熟、最稳定的选择。

我们用 4 章把一个生产级 React + Vite + TypeScript 项目讲完整：

1. **为什么选 Vite**——和 CRA / webpack 的差别到底在哪里？
2. **目录与别名**——一个能跑过三年的目录结构应该长什么样。
3. **CSS Module 与 PostCSS**——样式方案的选型与最小配置。
4. **构建与产物分析**——把发版前的产物体检流程立起来。

读完之后你会拿到一份可以直接复用的脚手架配置——不是从 GitHub 抄的"awesome-list"模板，而是每一行都能解释清楚的最小集合。

## 阅读门槛

- 至少写过半年 React；
- 用过任意一个旧脚手架（CRA / Next.js / 自定义 webpack）；
- 对 TypeScript 有基础认识。

不要求懂 Vite，不要求懂 esbuild 内部。
