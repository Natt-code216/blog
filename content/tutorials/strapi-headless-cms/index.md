---
slug: strapi-headless-cms
title: 用 Strapi 5 搭建 Headless CMS 后端
description: 从零起一个 Strapi 5 项目，覆盖 schema 设计、权限、关系、媒体、部署。
level: B_level
status: A更新中
icon: layers
chapters: 5
---

# 用 Strapi 5 搭建 Headless CMS 后端

Headless CMS 解决一个非常具体的问题：让"内容编辑"和"产品开发"两件事各自演进，互不绑架。运营 / 编辑可以通过 Admin UI 修改内容，开发者通过 API 拉数据渲染。

Strapi 是开源 Headless CMS 里最成熟的方案之一。2024 年发布的 5.0 版本带来了 Document Service API、新的草稿 / 发布机制、以及一系列 DX 改进。

本系列从零起一个 Strapi 5 项目，覆盖五章：

1. **Strapi 5 概览**——它解决什么、与 v4 有什么差异、Document Service API 是什么。
2. **Content Type 设计**——schema 的设计原则与常见陷阱。
3. **权限与 API Token**——公开 API、角色管理、token 范围控制。
4. **关系字段与媒体**——一对多、多对多、媒体库的正确使用。
5. **生产部署与备份**——数据库选型、生产上线、备份策略。

## 阅读门槛

- 写过 Node.js（不必精通）；
- 用过任意一种关系型数据库；
- 对"前端调 API"这件事有基本经验。

## 写在前面：Strapi 是否适合你

Strapi 不是银弹。它最适合：

- 内容**结构相对稳定**、改 schema 频率低于每月 1 次；
- **运营 / 编辑团队**真实存在，会用 Admin UI 编辑内容；
- **API 消费方**是一个或多个前端（Web、App、小程序）；
- 团队希望**自托管**而非用 SaaS（Strapi 也有云版，但本系列只讲自托管）。

不适合：

- schema 每周都在变的高频迭代项目；
- 只有开发者、没有运营的"纯技术内容"站点（直接 Markdown + Git 更轻）；
- 需要复杂工作流（多级审批、定时发布、协作冲突）——Strapi 默认支持有限。

如果你的项目落在"适合"区间，Strapi 是 2025 年最值得起步的开源 Headless CMS。
