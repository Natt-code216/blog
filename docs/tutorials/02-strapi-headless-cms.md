# 教程二 · 用 Strapi 5 搭建 Headless CMS 后端

> 等级：B_level（中级）
> 章节：2 / 5
> 状态：A更新中

## 一、为什么选 Strapi

写博客网站时，我考虑过三条路：

1. **Markdown 文件 + 静态站点生成器**（Astro / Next.js）
2. **托管 CMS**（Contentful / Sanity）
3. **自托管 Headless CMS**（Strapi / Directus）

我最终选 Strapi，理由是：自托管、数据完全握在自己手里、内容模型可视化建模、自带 REST + GraphQL。代价是要自己运维一台 Node 服务器，但对个人博客这点成本可以接受。

## 二、创建项目

```bash
npx create-strapi-app@latest backend --quickstart --typescript
```

`--quickstart` 会用 SQLite 作为数据库，开发期完全够用。生产可以换 Postgres：

```bash
npx create-strapi-app@latest backend --dbclient=postgres
```

第一次启动会自动打开浏览器，引导你创建管理员账号。

## 三、四个核心 Collection

本博客需要四个内容类型：

| Collection | 用途 | 关键字段 |
|------------|------|---------|
| Essay | 随笔 | title, excerpt, content, category, date |
| Tutorial | 教程 | title, description, level, status, chapters, icon |
| Tool | 工具 | title, description, icon, url |
| Comment | 评论 | content, author, essay (关系) |

在 `Content-Type Builder` 中创建，或者直接在 `src/api/<name>/content-types/<name>/schema.json` 手写：

```json
{
  "kind": "collectionType",
  "collectionName": "tutorials",
  "info": {
    "singularName": "tutorial",
    "pluralName": "tutorials",
    "displayName": "Tutorial"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "title": { "type": "string", "required": true },
    "description": { "type": "text" },
    "level": {
      "type": "enumeration",
      "enum": ["A_level", "B_level", "C_level", "ALL"]
    }
  }
}
```

**Strapi 5 小坑**：枚举值不能以数字或下划线开头，所以是 `A_level` 而非 `1_level`，前端展示时再转回 "入门/中级/高级"。

## 四、开放 API 权限

Strapi 默认 API 全部需要 Token。对一个纯展示型博客，我们可以把 `find` / `findOne` 公开：

```
Settings → Users & Permissions Plugin → Roles → Public
  → essay: ✓ find, ✓ findOne
  → tutorial: ✓ find, ✓ findOne
  → tool: ✓ find, ✓ findOne
```

写操作（create/update/delete）保持关闭，只能通过管理后台或带 Token 的 API 调用。

## 五、API 调用速览

启动后端：

```bash
cd backend
pnpm develop
```

测试一下：

```bash
curl http://localhost:1337/api/tutorials
```

返回结构（Strapi 5 简化版，不再有冗余的 `attributes` 包裹）：

```json
{
  "data": [
    {
      "id": 1,
      "documentId": "abc123",
      "title": "React 入门",
      "level": "A_level",
      "createdAt": "...",
      "updatedAt": "...",
      "publishedAt": "..."
    }
  ],
  "meta": { "pagination": { ... } }
}
```

注意 **Strapi 5 与 Strapi 4 的差异**：v5 把 `data.attributes.xxx` 扁平化成了 `data.xxx`，迁移老项目时要全文搜索修改。

## 六、上传图片

封面图字段类型用 `media`：

```json
"coverImage": {
  "type": "media",
  "multiple": false,
  "allowedTypes": ["images"]
}
```

API 返回时是嵌套对象，前端要带 `populate` 参数才能拿到：

```
GET /api/tutorials?populate=coverImage
```

## 七、部署提示

- **数据库**：生产请换 Postgres，SQLite 在 PaaS 上会随实例重启而丢
- **上传文件**：默认存在 `public/uploads/`，生产建议接 S3 或七牛
- **环境变量**：`APP_KEYS`、`API_TOKEN_SALT`、`ADMIN_JWT_SECRET` 这些必须重新生成

## 下一章

第三章我们把 Strapi 真正接入前端，处理 loading / 错误 / 数据为空三种状态。
