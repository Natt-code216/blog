# 网站内容稿

`content/` 保存文章原稿：`essays/` 是感悟随笔，`tutorials/` 是技术教程，`tools/` 是工具文案。网站目前通过 Strapi REST API 读取已发布内容；把 Markdown 放进这里不会自动出现在网页上。可用[本地预览脚本](../backend/README.md#本地内容预览)填充默认的本地 SQLite 库；正式发布仍需单独安排内容同步与验收。

## 感悟随笔

当前保留 3 篇重新整理的随笔。每篇独立放在以 slug 命名的目录中：`index.md` 是正文与元数据，`outline.md` 记录编辑思路，`references.md` 说明引用情况。首页卡片、搜索与详情页共用各自唯一的 slug。

| 随笔 | 目录 |
| --- | --- |
| 桌上留一块空地 | [on-minimalism](essays/on-minimalism/index.md) |
| 换工具之前 | [tools-and-mind](essays/tools-and-mind/index.md) |
| 写到第二句的时候 | [writing-as-thinking](essays/writing-as-thinking/index.md) |

编辑后先停止本地 Strapi，再执行 `pnpm essays:sync`，然后重启后端。该命令按 slug 更新本地随笔，保留 documentId，并将已经移出 `content/essays/` 的旧文取消发布。修改标题不必修改 slug。

此前从 GitHub 取回的 8 篇 AI 旧稿保存在 [旧稿归档](../docs/archive/essays/ai-drafts-2026-05/README.md)，不参与导入与页面展示。更早的 3 篇短稿见 [历史随笔](../docs/archive/essays/README.md)。后续编辑以此处的 3 个 `index.md` 为准。

## 技术教程

[教程目录与维护指南](tutorials/README.md) 收录 5 个主题，共 7 章：React 基础 3 章，Strapi、前后端联调、路由详情、部署上线各 1 章。每章独立保存，包含步骤、代码、验收和参考资料；`tutorials/catalog.json` 管理标题、摘要、学习顺序和章节清单，章数由文件数计算。

编辑后先运行 `pnpm tutorials:check`，再停止本地 Strapi、执行 `pnpm tutorials:sync` 并重启后端。同步前自动备份本地数据库，按 slug 更新教程并保留 documentId，不影响随笔和工具。分章前旧稿保存在 [教程归档](../docs/archive/tutorials/before-chapters-2026-09/README.md)，不参与同步。

工具介绍稿位于 `tools/`。学习源码时请结合当前 [目录约定](../docs/architecture/README.md)。
