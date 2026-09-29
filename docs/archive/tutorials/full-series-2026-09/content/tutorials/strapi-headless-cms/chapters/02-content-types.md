---
order: 2
title: Content Type 设计
est_read_minutes: 13
---

# Content Type 设计

Strapi 项目能不能稳定地长大，Content Type 设计是第一关。一份糟糕的 schema 会让运营崩溃、API 难用、未来迁移痛苦。本章讲一份清晰 schema 的设计原则。

## Collection Type vs Single Type vs Component

Strapi 里有三种"数据形状"：

- **Collection Type**：会有多条记录的内容（Article、Product、User）。最常用。
- **Single Type**：只会有一条记录的内容（SiteSettings、HomePage、AboutPage）。适合那种"全站只有一个"的配置。
- **Component**：可复用的字段组合，不能独立存在，必须作为某个 Type 的字段。例如"地址组件"包含 `street / city / zip` 三个字段，可以被 User 和 Order 复用。

选错会让 schema 看起来重复或不必要地复杂。判断标准：

- "这种内容会有多条吗？" → 多条用 Collection，单条用 Single。
- "这组字段会被多个 Type 用吗？" → 是用 Component，否就直接放字段。

## 字段类型速览

Strapi 5 内置的字段类型：

| 类型 | 适用 |
|---|---|
| Text (Short) | 短字符串 ≤ 255 |
| Text (Long) | 长字符串 |
| Rich Text | 富文本（带 markdown 编辑器） |
| Number | 整数 / 小数 |
| Boolean | 是否 |
| Email | 邮箱（带格式校验） |
| Date / DateTime / Time | 日期 |
| Enumeration | 枚举值 |
| UID | 唯一标识，常用于 slug |
| Media | 图片 / 视频 / 文件 |
| JSON | 任意结构化数据 |
| Relation | 关系（下一章详谈） |
| Component | 可复用字段组（上面提过） |
| Dynamic Zone | 动态内容块（如页面构建器） |
| Password | 密码（hash 存储） |

## 设计原则一：能用枚举不要用文本

如果一个字段的取值是有限的（如订单状态 pending / paid / cancelled），永远用 Enumeration 而非 Short Text。

- **数据一致性**：避免"pending"和"Pending"被存成两个值；
- **API 友好**：消费方知道完整取值集；
- **UI 友好**：Admin 自动渲染为下拉框，编辑不会拼错。

```yaml
status:
  type: enumeration
  enum: [pending, paid, cancelled]
  default: pending
```

## 设计原则二：日期字段用 DateTime，不用 Date

Date 类型只存年月日，但 99% 的"业务日期"实际上都需要时区和具体时刻。即使你现在不需要时分秒，未来也可能需要——而日期字段一旦上线后修改成 DateTime 是有迁移成本的。

经验法则：除非你**确定**这个字段永远不需要时分秒（如生日），都用 DateTime。

## 设计原则三：UID 一定要 targetField

UID 字段是 Strapi 用来做唯一标识的（常用于 slug）。最好和某个字段绑定，自动从那个字段生成：

```yaml
slug:
  type: uid
  targetField: title
```

这样编辑写完标题后，slug 会自动生成。可以手工调，但不会忘加。

## 设计原则四：把"展示用"和"业务用"字段分开

经常看到的反模式：

```yaml
title: string
displayTitle: string  # 用来展示，可以富一点
shortTitle: string    # 列表用的截断版
seoTitle: string      # SEO 用
```

这种设计让编辑要填 4 个标题。运营累，错也容易。

更合理的做法：保留**一个核心字段**，其他通过逻辑生成或在 API 层 transform。如果实在不同 渠道需要不同标题，至少让其中大部分能 default 到核心字段，编辑只在需要时覆盖。

## 设计原则五：避免 JSON 字段乱用

JSON 字段是"什么都能塞"的字段。新人会用它存"复杂业务对象"。但一旦塞进 JSON：

- **不能用 Strapi 的过滤 / 排序**；
- **不能从 Admin UI 友好编辑**；
- **schema 变化时没有迁移工具帮你**。

JSON 应该只在两种场景使用：

1. **真正非结构化的数据**（如第三方 API 返回的原始响应）；
2. **极少被查询、只是存档**的数据（如版本快照）。

如果一个字段会被过滤、被排序、被运营编辑——它就不该是 JSON。

## 命名约定

字段命名是个长期争议的话题。我倾向：

- **字段名小驼峰**：`firstName`, `coverImage`；
- **API ID 小驼峰**：与字段名一致，避免转换；
- **Collection 名单数**：`article`（Strapi 会自动复数化为 `articles`）；
- **关系字段语义化**：`author`（指向 User）、`relatedArticles`（指向自身集合）。

避免：

- `is_published`（蛇形）vs `isPublished`（驼峰）混用；
- 缩写命名（`desc` vs `description`）。一致更重要。

## 必填字段：克制使用

Strapi 允许每个字段标记 required。新人喜欢给所有"应该有的"字段都标 required。

但 required 是一把双刃剑：

- 标了 required 的字段，**Admin 必须填**才能保存；
- 也意味着**API 创建数据时必须传**。

如果某个字段对运营很重要，但对开发者初始化数据时不必要（如 `slug` 可以自动生成），标 required 会变成阻碍。

经验法则：只把**完全没法兜底**的字段标 required（如 `title`），其他能 default 的字段都给 default。

## 字段长度的隐性约束

Short Text 默认 255 字符，但 Strapi 不强制。如果你的运营会粘贴超长字符串，最好显式加 maxLength：

```yaml
title:
  type: string
  required: true
  maxLength: 80   # 标题超过 80 字基本不可能合理
```

这样 Admin 会显式提示编辑"超长了"。

## 一个真实 schema 示例

把上面所有原则合在一起，一份 Article schema 大概长这样：

```json
{
  "kind": "collectionType",
  "collectionName": "articles",
  "info": {
    "singularName": "article",
    "pluralName": "articles",
    "displayName": "Article"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "maxLength": 80
    },
    "slug": {
      "type": "uid",
      "targetField": "title"
    },
    "excerpt": {
      "type": "text",
      "maxLength": 200
    },
    "content": {
      "type": "richtext"
    },
    "category": {
      "type": "enumeration",
      "enum": ["ESSAY", "THOUGHTS", "LIFESTYLE"],
      "default": "ESSAY"
    },
    "cover": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "publishedAt": {
      "type": "datetime"
    },
    "author": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "plugin::users-permissions.user"
    }
  }
}
```

这一份 schema 涵盖：必填核心字段、自动生成的 slug、枚举类别、媒体、作者关系、长度约束。下一章我们会展开 relation 这个最常见的复杂字段。

## 本章小结

Content Type 设计是 Strapi 项目长期健康的根。原则可以总结为：枚举优于字符串、DateTime 优于 Date、UID 必绑 targetField、克制 required、避免 JSON 滥用、命名一致、字段不重复。

这些规则看起来朴素，但它们决定了运营六个月后是骂你还是夸你。

## 关于"加字段比删字段容易"

最后一条心法：在 Strapi 里**加字段是几乎零成本的**——schema 改了之后下一次启动就生效。但**删字段或改字段类型**有真实成本——数据库列要做 ALTER 操作，且已有数据可能不兼容。

所以新 schema 上线时倾向"先把肯定需要的字段建好"，后续按需添加。但不要预防性地建一堆"可能会用到"的字段——它们会占据 Admin UI 的位置，让编辑感到困惑。

经验法则：**当一个字段被 90% 以上的运营操作真实需要时，再建它**。
