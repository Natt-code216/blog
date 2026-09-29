# 本地启动与网站调试计划

记录日期：2026-09-30。本计划针对当前 React + Vite 主站、11 个浏览器工具和 Strapi 5 后端，使用本地 SQLite 调试；不涉及生产部署。

## 当前可运行状态

- 前端：`http://localhost:5173/`，工具目录 `/mini-tools/index.html`。
- 后端：`http://localhost:1337/`，公开 API 位于 `/api`，管理入口 `/admin`。
- 默认 SQLite 已通过 `backend/scripts/seed-local-content.mjs` 同步 3 篇重写随笔与 5 篇教程。随笔重复同步会更新同一 documentId，移出内容目录的旧文保留为未发布草稿。
- 根目录类型检查、83 项测试和生产构建通过；构建产物校验覆盖 13 个页面入口与 11 个工具链接。浏览器已检查首页、随笔与教程详情、搜索、JSON 格式化、跨页主题保持及 390px 手机布局。

### 本轮随笔验收

- 修复 Strapi 精确匹配参数：`filters[slug][$eq]`，详情页同时校验返回 slug 和发布状态，避免任意地址显示第一篇。
- 逐张点击三张卡片，确认《桌上留一块空地》《换工具之前》《写到第二句的时候》的地址、标题和正文各自对应，返回列表正常；搜索仅保留这三篇随笔。
- 旧文地址 `art-of-slowing-down` 显示 404；API 验证另外四篇下线文章和未知 slug 均不返回文章。
- 连续执行两次同步，确认三篇已发布、五篇保留为草稿，正文与 Markdown 一致，documentId 不变，没有重复记录。同步前的本地数据库备份保存在忽略目录 `backend/.tmp/`。

## 从零复现

准备 Node.js 24、pnpm 10.34.6。分别使用两个终端：

```bash
# 终端一：前端
pnpm install --frozen-lockfile
test -e .env.local || cp .env.example .env.local
pnpm dev --host localhost
```

```bash
# 终端二：后端
npm ci --prefix backend
test -e backend/.env || cp backend/.env.example backend/.env
# 为 backend/.env 中各密钥设置独立随机值
node backend/scripts/seed-local-content.mjs
npm run develop --prefix backend
```

后端种子脚本只用于默认本地 SQLite。前端 `.env.local` 中的 `VITE_API_URL` 应为 `http://localhost:1337/api`。后端启动后，检查 `/api/essays` 返回 3 篇、`/api/tutorials` 返回 5 篇，再刷新首页。管理后台首次使用需创建本地管理员；浏览文章和工具无需登录。后续只同步随笔可执行 `pnpm essays:sync`。

## 调试顺序与验收

| 优先级 | 工作 | 完成标准 |
| --- | --- | --- |
| P0 已完成 | 修复后端锁文件、内容预览与详情筛选 | 首页显示 3 篇随笔、5 篇教程；不同卡片分别打开各自正文，未知或下线 slug 显示 404 |
| P1 | 修复评论公开读取和提交的服务端流程；邮箱设为私有字段，仅返回审核通过的评论，提交后等待审核 | 无邮箱泄露、未审核评论不公开；页面能加载空评论并正确提示待审核 |
| P1 | 确定正式内容同步流程，避免本地 SQLite 与线上 Strapi 内容分叉 | 按 slug 幂等同步正文、元数据；有发布与回滚步骤，真实后台验收通过 |
| P2 | 整理教程卡片摘要与章节数，使其与正文一致 | 5 篇卡片摘要简短无 Markdown 语法；详情页标题、章节数正确 |
| P2 | 覆盖所有工具在桌面和手机的主要输入、错误提示、导出结果 | 11 个工具各完成一次成功路径及关键失败路径；无横向溢出 |
| P2 | 生产前检查 CORS、环境变量、路由回退和 sitemap | 线上域名可访问深层链接，公开接口权限最小化，站点地图包含已发布文章 |

目前随笔详情的评论读取会返回 403。未修复邮箱私有字段和审核过滤前，不直接开放评论 Public 权限。教程内容仍是早期实现示例，应按当前架构逐篇复核。
