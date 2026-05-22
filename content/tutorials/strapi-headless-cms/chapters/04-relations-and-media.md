---
order: 4
title: 关系字段与媒体
est_read_minutes: 13
---

# 关系字段与媒体

Content Type 的"普通字段"（字符串、数字、日期）相对简单。真正容易出错的是**关系字段**与**媒体上传**这两类。它们在第一次配错时不会立刻报错，要到三个月后某次扩展才暴露出问题。

本章把这两件事说清楚。

## 关系字段的四种类型

Strapi 支持四种关系：

- **One-to-One**：一对一。例如 User ↔ UserProfile。
- **One-to-Many**：一对多。例如 User ↔ Articles（一个作者写多篇文章）。
- **Many-to-One**：多对一。在 Article 那端看，就是这个关系（多篇文章属于同一个作者）。
- **Many-to-Many**：多对多。例如 Article ↔ Tags（一篇文章多个标签，一个标签多篇文章）。

在 Content Type Builder 里选 relation 字段时，Strapi 会让你画一张关系图——选择"this side"和"other side"分别是什么。

## 双向 vs 单向

每种关系都可以是单向或双向。

- **单向**：A 知道 B，B 不知道 A；
- **双向**：A 能查到关联的 B，B 也能查到关联的 A。

例如：

- 单向 Many-to-One：Article 有 author 字段；User 没有 articles 字段。需要"某用户的所有文章"时，要从 Article 端反查。
- 双向 Many-to-One：Article 有 author 字段；User 也有 articles 字段（automatically inversed）。从两端都能直接查。

经验法则：**默认用双向，除非有明确理由用单向**。双向让从两端查询都简洁，且后续扩展也方便。

## 一个易踩坑：删除级联

关系字段的一个不显眼的属性是"删除时怎么处理"。

例如：User 有 articles 关系。当 User 被删除时：

- 它的 articles 字段会变成空？
- 还是相关的 Article 全部被删？
- 还是删除被阻止？

Strapi 默认行为是把关联设为 null——也就是"User 被删后，相关 Article 的 author 字段变成 null"。这通常不是你想要的——可能你希望"删 User 时也删它的 Article"（cascade），或者希望"不允许删有 Article 的 User"（restrict）。

可惜 Strapi 不提供 schema 级的 cascade / restrict 选项。要实现这个行为，需要在 lifecycle hook 里写：

```ts
// src/api/user/content-types/user/lifecycles.ts
export default {
  beforeDelete: async (event) => {
    const userId = event.params.where.id;
    const articles = await strapi.documents('api::article.article').findMany({
      filters: { author: { id: userId } },
    });
    if (articles.length > 0) {
      throw new Error(`Cannot delete user: they have ${articles.length} article(s).`);
    }
  },
};
```

这种"在 lifecycle hook 里做约束"的模式，在 Strapi 项目里非常普遍。

## populate：拉关系数据的关键

默认情况下，Strapi 的 API **不会**返回关联数据。

```bash
GET /api/articles
```

返回的是 articles 数组，但每条都没有 `author` 字段。

要拉作者，需要显式 populate：

```bash
GET /api/articles?populate=author
```

或者深层 populate：

```bash
GET /api/articles?populate[author][populate]=avatar
```

很多新人会图省事写 `populate=*`，这相当于"拉所有关系"。这在小数据量下没问题，但有几个隐患：

1. **响应体积巨大**：一篇文章带作者、作者的所有文章、所有文章的所有评论……可能拉出几 MB。
2. **N+1 风险**：Strapi 内部会对每个关系发独立查询，关系深的话会数十次查库。
3. **未来字段误暴露**：今天 Author 上只有 `name`，明天加了 `email` / `phone`，所有用 `populate=*` 的 API 都会泄露这些字段。

经验法则：**永远用具体的 populate 列表，不要用 `*`**。

Strapi 5 引入了一个新的语法：

```bash
GET /api/articles?populate[0]=author&populate[1]=cover&fields[0]=title&fields[1]=slug
```

`fields` 指定要返回的字段（白名单）。两者结合让 API 响应可被精确控制。

## 媒体字段：单个 vs 多个

媒体字段配置时有两个选项：

- **multiple**：单个媒体（如文章封面）还是多个（如商品图册）；
- **allowedTypes**：images / videos / audios / files 中的一个或多个。

例如：

```yaml
cover:
  type: media
  multiple: false
  allowedTypes: [images]

attachments:
  type: media
  multiple: true
  allowedTypes: [files]
```

把 `allowedTypes` 限制紧一点是有好处的——"只允许图片"会让 Admin 编辑无法误传 PDF；"只允许 files" 会让 video 上传被阻止。

## 媒体存储：本地 vs S3

默认 Strapi 把上传的文件存在 `public/uploads/`。开发期没问题，生产环境**几乎一定不行**：

- 容器化部署时本地文件会随容器重启丢失；
- 多实例部署时文件不同步；
- 大文件托管效率低。

解决方法：用 S3 兼容的对象存储（AWS S3、Cloudflare R2、阿里云 OSS、腾讯云 COS）。

```bash
pnpm add @strapi/provider-upload-aws-s3
```

```ts
// config/plugins.ts
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          accessKeyId: env('AWS_ACCESS_KEY_ID'),
          secretAccessKey: env('AWS_ACCESS_SECRET'),
          region: env('AWS_REGION'),
          params: {
            Bucket: env('AWS_BUCKET'),
          },
        },
      },
    },
  },
});
```

迁移本地 → S3 的步骤：

1. 配置好 S3 provider；
2. 用脚本把 `public/uploads/` 下所有文件 sync 到 S3；
3. 用脚本更新数据库里的 url 字段；
4. 重启 Strapi。

第 3 步是最容易出错的——Strapi 数据库里存的不只是文件名，还有 hash、formats（缩略图）等元数据，都要相应更新。建议先在测试环境跑通迁移脚本。

## 缩略图配置

Strapi 上传图片时会自动生成多个尺寸（thumbnail / small / medium / large）。这些尺寸在 API 响应里都有：

```json
{
  "url": "/uploads/photo.jpg",
  "formats": {
    "thumbnail": { "url": "/uploads/thumbnail_photo.jpg", "width": 245, "height": 156 },
    "small":     { "url": "/uploads/small_photo.jpg",     "width": 500, "height": 318 },
    "medium":    { "url": "/uploads/medium_photo.jpg",    "width": 750, "height": 477 },
    "large":     { "url": "/uploads/large_photo.jpg",     "width": 1000, "height": 636 }
  }
}
```

前端可以根据视口选合适尺寸：

```html
<img
  srcset="
    /uploads/small_photo.jpg 500w,
    /uploads/medium_photo.jpg 750w,
    /uploads/large_photo.jpg 1000w
  "
  sizes="(max-width: 600px) 100vw, 800px"
  src="/uploads/medium_photo.jpg"
/>
```

这是 Strapi 与"现代图片优化"无缝对接的最重要细节——它把"做多尺寸"这件事从你的待办里删掉了。

## 关于 alt text

每个媒体都可以填 `alternativeText`（替代文字）。这对可访问性极其重要：

- 屏幕阅读器会读 alt；
- 搜索引擎会用 alt 索引图片；
- 图片加载失败时浏览器会显示 alt。

让运营养成"上传图片就填 alt"的习惯。Strapi 默认 alt 字段不 required，可以考虑在 Custom Field 或 lifecycle hook 里加上必填校验：

```ts
beforeCreate: (event) => {
  if (event.params.data.coverImage && !event.params.data.alt) {
    throw new Error('请为封面图填写替代文字 (alt)');
  }
};
```

## 本章小结

关系字段与媒体字段是 Content Type 里最复杂的两类。关系字段的核心是：默认双向、避免 `populate=*`、用 lifecycle hook 处理 cascade。媒体字段的核心是：限制 allowedTypes、生产用 S3、使用自动生成的多尺寸缩略图、强制 alt text。

把这些配对，项目从开发到生产的过渡会平滑很多。

下一章是本系列的最后一章：**生产部署与备份**。我们讲数据库选型、上线步骤、备份策略——把一个本地能跑的 Strapi 安全地推上生产。
