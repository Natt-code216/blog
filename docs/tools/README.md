# 工具集说明

本博客 Tools 板块展示了我日常会用、并且愿意推荐给读者的小工具。每个工具的卡片信息存在 Strapi 的 `Tool` collection 中。

## 当前工具卡片

| 标题 | 图标 | 用途 |
|------|------|------|
| Analytics Dashboard | barChart | 个人数据可视化面板 |
| Color Palette | droplet | 配色方案生成器 |
| Markdown Editor | fileText | 带预览的 Markdown 写作工具 |
| Search Engine | search | 站内搜索（规划中） |

## 字段约定

| 字段 | 类型 | 说明 |
|------|------|------|
| title | string | 工具名称 |
| description | text | 一两句话介绍 |
| icon | enum | barChart / droplet / fileText / search |
| url | string | 跳转地址（外链或站内路由） |
| slug | uid | URL 友好的标识 |

## 添加新工具

1. 进入 Strapi 管理后台 `http://localhost:1337/admin`
2. Content Manager → Tool → Create new entry
3. 填写字段，注意 `icon` 必须从枚举中选
4. 保存并发布
5. 刷新前端页面即可看到

如果需要新增图标类型，要同时更新：
- `backend/src/api/tool/content-types/tool/schema.json` 的 `enum` 列表
- `src/components/Tools/index.tsx` 的 `iconMap`
- `src/services/api.ts` 的 `ApiTool` 接口
