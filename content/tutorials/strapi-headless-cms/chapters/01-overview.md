---
order: 1
title: Strapi 5 概览
est_read_minutes: 12
---

# Strapi 5 概览

本章把 Strapi 这个项目的脉络快速过一遍——它解决什么、和别的 CMS 怎么对比、5.0 版本带来了哪些值得关注的变化。读完之后你应该能判断：这套工具适不适合放进你的技术选型。

## 什么是 Headless CMS

传统 CMS（WordPress、Drupal）的特点是**前后端绑定**——后台 UI 和前台主题来自同一个程序，编辑一篇文章后前台立刻渲染。

Headless CMS 的核心理念是**只做后端**：

- 提供 Admin UI 给编辑使用；
- 提供 REST / GraphQL API 给开发者使用；
- 完全不管前端怎么渲染——你可以用 React / Vue / Next.js / Astro / 静态站点生成器 / 移动 App，甚至同一份内容驱动多个渠道。

这种解耦的回报是：内容是数据，UI 是消费者。同一份内容可以被多个端复用，UI 可以独立演进。

## Strapi 的核心定位

Strapi 在 Headless CMS 阵营里的位置是：

- **完全开源**（MIT，自托管不收费）；
- **TypeScript / Node.js 技术栈**（如果你团队是 Node 背景，无缝衔接）；
- **强插件生态**（i18n、Email、S3 上传等都有官方或社区插件）；
- **可扩展**（controller / service / route 都可以覆盖，几乎任何业务逻辑都能写进去）。

主要替代品：

- **Directus**：UI 更精致，更适合"对现有数据库做包装"。
- **Payload**：原生 TS，schema 用代码定义，更适合开发者主导的项目。
- **Sanity / Contentful**：SaaS，免运维但需要付费且数据托管在他们那里。

如果你的项目"开发者多、运营少、想自托管"，Strapi 是非常稳的选择。

## Strapi 5 与 v4 的关键差异

如果你之前用过 Strapi v4，下面这些变化值得知道：

**1. Document Service API 取代 Entity Service API**

v4 用的 API 是这样的：

```ts
strapi.entityService.findMany('api::article.article', { populate: '*' });
strapi.entityService.create('api::article.article', { data: { title: 'X' } });
```

v5 改成了：

```ts
strapi.documents('api::article.article').findMany({ populate: '*' });
strapi.documents('api::article.article').create({ data: { title: 'X' }, status: 'published' });
```

差异看似浅，背后逻辑变化大——Strapi 5 引入了 **documents** 的概念。每条内容现在有一个 stable 的 `documentId`，与"草稿 vs 发布"的副本独立。这让"发布工作流"变成一等公民。

**2. 草稿/发布机制更彻底**

v4 里草稿是同一条记录的 `publishedAt` 字段；v5 里草稿和发布版是两条独立的记录，但共享 `documentId`。

```ts
// 查所有内容（包括草稿）
strapi.documents('api::article.article').findMany({ status: 'draft' });

// 只查发布
strapi.documents('api::article.article').findMany({ status: 'published' });

// 把某文档发布
strapi.documents('api::article.article').publish({ documentId: 'abc123' });
```

这种独立性带来一个非常重要的副作用：**默认 REST API 只返回 published**。如果你测试时看到列表是空的，很可能是没 publish 过——不是数据没插进去。

**3. UI 重做**

Admin 面板视觉做了一次大改，更清晰，但默认主题仍是浅色。深色主题需要在用户设置里手工切。

**4. TypeScript 类型自动生成**

`pnpm run build` 会自动生成 `types/generated/contentTypes.d.ts`，可以在自定义 controller 里直接用强类型。

## 第一次启动

```bash
pnpm create strapi@latest my-cms --quickstart --no-cloud
cd my-cms
pnpm develop
```

`--quickstart` 让 Strapi 用内置的 SQLite，零配置启动。开发期完全够用；生产再换 PostgreSQL（下一章会展开）。

启动后访问 `http://localhost:1337/admin`，第一次进入会要求注册超级管理员账号。这个账号只在本机有效，不会被同步到任何远端。

## 一个最小 Content Type

进入 Admin 后，第一件事是建一个 Content Type。点 "Content-Type Builder" → "Create new collection type"：

- Display name: `Article`
- API ID: `article`（自动生成）

加几个字段：

- `title`: Text (Short) — required
- `slug`: UID — based on `title`
- `content`: Rich text
- `cover`: Media (single image)
- `published`: Boolean — default false

保存后 Strapi 会自动重启。

之后到 "Content Manager" → "Article" → "Create new entry"，填一篇文章。点 "Save" 进入草稿，点 "Publish" 才会让它出现在公开 API 里。

## API 暴露

默认情况下 Strapi 把所有 Content Type 的 API 都**关闭**。要让 `/api/articles` 公开返回，需要：

- "Settings" → "Users & Permissions Plugin" → "Roles" → "Public"
- 勾选 `article` 的 `find` 和 `findOne` 权限
- "Save"

然后访问 `http://localhost:1337/api/articles?populate=*` 就能拿到 JSON：

```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123def456",
      "title": "Hello",
      "slug": "hello",
      "content": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "publishedAt": "...",
      "cover": { "url": "/uploads/...", "alternativeText": null }
    }
  ],
  "meta": { "pagination": {...} }
}
```

注意几个细节：

- `documentId` 是 Strapi 5 引入的稳定 ID；
- `populate=*` 把所有关系字段展开（生产中应该用更具体的 populate，避免拉过多数据）；
- 默认只返回 `published` 的内容。

## 本地开发的几个常用命令

```bash
pnpm develop      # 启动 dev server（带热重载）
pnpm build        # 构建 admin UI
pnpm start        # 生产模式启动
pnpm strapi console # 进入交互式控制台，可用 strapi.documents() 调试
```

`strapi console` 是非常有价值的工具——它启动一个 REPL，给你访问完整 `strapi` 对象的能力。调试 API、批量改数据、试 query 都可以在这里做。

## 本章小结

Strapi 5 是一个"用 Node.js 写的 Headless CMS"。它解决的是"前后端解耦、运营 / 开发独立演进"的问题。和 v4 相比，最显著的变化是 Document Service API 和草稿 / 发布机制的重做。

下一章我们深入到 Content Type 设计——schema 设计的原则、字段类型选型、生命周期里最容易踩的坑。这一步设计得好不好，决定了项目六个月后是否需要痛苦的 schema 迁移。

## 关于 GraphQL

最后补一个常被问到的话题：Strapi 也提供 GraphQL 支持，要不要用？

- **REST 是 Strapi 的一等公民**：默认开启、文档最全、社区最熟悉；
- **GraphQL 需要单独装插件**：`pnpm add @strapi/plugin-graphql`，装完之后 `/graphql` 端点可用；
- **优势**：客户端可以精确控制字段、避免过 fetch；
- **代价**：一层额外的复杂度、N+1 风险更高、缓存策略更难做。

我的建议是：**默认用 REST**。除非你的项目里有"前端需要从多个 Type 拼接出复杂视图"的强烈需求，REST 是更轻、更熟悉、更易缓存的选择。GraphQL 在 Strapi 里更像锦上添花，不是必选。
