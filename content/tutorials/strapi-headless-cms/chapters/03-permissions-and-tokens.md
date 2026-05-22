---
order: 3
title: 权限与 API Token
est_read_minutes: 12
---

# 权限与 API Token

Strapi 的权限模型有两个相关又独立的系统：

1. **Roles & Permissions**——控制谁能在 Admin 里看 / 改 / 删什么内容；
2. **API Tokens**——控制外部调用方能访问哪些 REST / GraphQL endpoint。

这两个系统配错就会出现两类经典事故：一类是"运营动了不该动的字段"，一类是"前端 token 被泄露后整个 CMS 数据被读取"。本章把两个系统说清楚。

## 第一个系统：Roles & Permissions（Admin 层）

Strapi 在 Admin 端默认有几种角色：

- **Super Admin**：什么都能做。整个项目只应该有 1–2 个。
- **Editor**：可以编辑大部分内容，但不能改 schema / 设置。
- **Author**：只能管理自己创建的内容。

可以在 "Settings" → "Administration Panel" → "Roles" 创建自定义角色。

权限粒度可以非常细——精确到"某个 Content Type 的某个字段的某个操作"。例如：

- Editor 可以 `find` / `update` Article，但不能 `delete`；
- Editor 不能修改 Article 的 `publishedAt` 字段；
- Editor 只能 `publish` 自己写的 Article。

这套精细度对中型团队是金子：把"运营误删整张表"这类事故从根本上排除。

## 第二个系统：Users & Permissions（消费端）

Users & Permissions 插件管的是"公开 API 谁能调"。

它默认有两个角色：

- **Public**：未登录的访客；
- **Authenticated**：登录的最终用户。

每个角色都能配置"对每个 Content Type 的哪些操作可用"。

常见配置：

- 把 Article 的 `find` / `findOne` 开给 Public（任何人都能读文章）；
- 把 Comment 的 `create` 开给 Authenticated（登录用户才能评论）；
- Comment 的 `delete` 不开给任何角色（只能从 Admin 删）。

```
Public:
  article: find ✓, findOne ✓
  comment: find ✓
  
Authenticated:
  article: find ✓, findOne ✓
  comment: find ✓, create ✓
```

## API Tokens：第三种访问路径

除了 Public 和 Authenticated 这两种"普通用户"路径，Strapi 还提供 API Tokens——用于"服务到服务"的调用。

典型场景：

- 一个静态站点生成器在构建时调 Strapi 抓所有 Article；
- 一个 cron 任务每天同步数据进 Strapi；
- 一个移动 App 用 token 调高频接口（避免每次登录）。

到 "Settings" → "API Tokens" → "Create new API Token"：

- **Name**：描述性命名（如 "Astro Build Token"、"Sync Cron Token"）；
- **Token Duration**：unlimited / 7 days / 30 days / 90 days；
- **Token Type**：
  - **Read-only**：只能 find / findOne；
  - **Full access**：所有 CRUD；
  - **Custom**：精细配置每个 Type 的权限。

**强烈推荐用 Custom**。给"构建任务"的 token 只配 Read-only，给"同步任务"的 token 只配它需要的特定写入权限。Full access 这个选项几乎在所有真实项目里都不该出现。

## Token 的使用方式

```ts
const response = await fetch('https://cms.example.com/api/articles', {
  headers: {
    'Authorization': `Bearer ${process.env.STRAPI_TOKEN}`,
  },
});
```

或者用 axios：

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://cms.example.com/api',
  headers: {
    Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
  },
});
```

## Token 安全的几条铁律

1. **绝不放到前端代码里**。任何"在浏览器里能看到"的 token 都等于公开。
2. **绝不进 Git**。token 只通过环境变量传入，`.env` 加进 `.gitignore`。
3. **定期轮换**。给 token 设个 30/60/90 天的过期，定期重新生成。
4. **精细化权限**。给每个用例独立 token，权限只到刚好够。
5. **泄露后立刻吊销**。Strapi Admin 有"revoke token"按钮，秒级生效。

## 一个常被忽视的事：document permissions

Strapi 5 在权限层加入了"草稿 vs 发布"的额外维度。同一个 Type 的 `find` 权限可以分别配置：

- 能否读 published 内容；
- 能否读 draft 内容；
- 能否 publish；
- 能否 unpublish。

这意味着你可以做这样的配置：

- Public：能读 published Article，不能读 draft；
- Editor：能读 / 改 draft 和 published；
- Author：能读自己的 draft，能读所有 published；
- API Token (preview)：能读 draft（给"预览模式"用）。

这个 "API Token for preview" 是新版网站常见的需求——开发环境能预览未发布的内容，正式访问者不行。

## 自定义权限策略

Strapi 还允许你写自定义策略（policies）——一段 JS 代码决定是否放行请求。

```ts
// src/policies/is-owner.ts
export default async (ctx, config, { strapi }) => {
  const { user } = ctx.state;
  const { id } = ctx.params;
  if (!user) return false;
  const entity = await strapi.documents('api::article.article').findOne({ documentId: id });
  return entity?.author?.id === user.id;
};
```

在 route 中应用：

```ts
// src/api/article/routes/article.ts
export default {
  routes: [
    {
      method: 'PUT',
      path: '/articles/:id',
      handler: 'article.update',
      config: {
        policies: ['is-owner'],
      },
    },
  ],
};
```

这种 policy 让"用户只能改自己的文章"这类逻辑显式可被审计。

## 评论场景：一个真实例子

我自己博客的评论模型，权限配置长这样：

- **Public** 对 Comment：`create` ✓ （任何人都能评论）；
- **Public** 对 Comment：`find` ✓ （能读评论）；
- **Authenticated** 对 Comment：`update` / `delete` 只对**自己的评论**有效（通过 policy 限制）。

```ts
// policies/is-comment-author.ts
export default async (ctx) => {
  const { user } = ctx.state;
  const { id } = ctx.params;
  const comment = await strapi.documents('api::comment.comment').findOne({ documentId: id });
  return user && comment?.author?.id === user.id;
};
```

这种"细粒度策略 + 通用权限"的组合，是 Strapi 权限系统真正强大的地方。

## 本章小结

Strapi 权限模型有三条独立路径：Admin 用户的角色权限、消费端的 Roles & Permissions、服务到服务的 API Tokens。它们各自负责不同场景，配错任何一个都可能导致数据泄露或运营事故。

最重要的一条规则：**任何 Full access 都是过度授权**。一个项目里如果有 5 个 token，应该有 5 套不同的精细化权限。

下一章我们讨论 Content Type 设计里最复杂的一类字段——**关系字段与媒体**。这两件事配错的项目，迁移成本最高。

## 一份运维 checklist

最后留一份"上线前权限层面"的 checklist，照着走一遍能挡掉 90% 的事故：

1. Super Admin 账号 ≤ 2 个；
2. 每个团队成员有独立 Admin 账号，没有任何"shared admin"；
3. Public 角色权限只开 `find` / `findOne`，不开 `create` / `update` / `delete`；
4. 所有 API Token 都是 Custom 权限，不存在 Full access；
5. 给"build 任务"和"sync 任务"分别配独立 token；
6. 所有 token 至少有过期时间（推荐 90 天）；
7. 每个 token 的 name 写明用途，方便日后审计；
8. Admin 登录开启 2FA（"Settings" → "Profile"）；
9. 默认密码策略足够强（至少 12 位、含数字与符号）；
10. 把 `/admin` 路径放到带 IP 白名单的子域名（如 admin.cms.example.com）。

任何一条都值得花 5 分钟落实，每一条都能在事故发生后避免难以解释的责任。
