# Strapi 内容后端

当前锁定 Strapi 5.37.1；本目录是独立 npm 项目，使用 `package-lock.json`。仓库推荐 Node.js 24，符合本目录声明的 Node 20–24 范围。

```bash
# 在仓库根目录执行
npm ci --prefix backend
cp backend/.env.example backend/.env
```

先编辑 `backend/.env`，为 `APP_KEYS`、`API_TOKEN_SALT`、`ADMIN_JWT_SECRET`、`TRANSFER_TOKEN_SALT`、`JWT_SECRET` 等变量设置独立的随机值，不要提交真实环境文件。数据库按 `config/database.ts` 配置；本地可使用 SQLite。

```bash
npm run develop --prefix backend
```

首次访问 `http://localhost:1337/admin` 创建本地管理员。前端 `.env.local` 设置：

```dotenv
VITE_API_URL=http://localhost:1337/api
```

### 本地内容预览

如需在空的本地 SQLite 数据库中调试文章页面，先停止 Strapi，再从仓库根目录运行：

```bash
node backend/scripts/seed-local-content.mjs
```

脚本仅接受默认的 `backend/.tmp/data.db`，同步当前 3 篇随笔和 5 个教程。写入前自动在 `.tmp/before-content-sync-时间戳.db` 备份已有数据库。随笔按 slug 更新并保留 documentId，已移出内容目录的旧随笔会取消发布并保留为草稿；教程按 `content/tutorials/catalog.json` 和分章 Markdown 更新已有正文、学习顺序和章数，同样保留 documentId，不删除清单之外的教程。它只给随笔、教程和工具开放公开读取，不开放评论写入。随后重新启动后端并打开首页。此库和 `.env` 都被 Git 忽略，不会同步到 GitHub。

只同步随笔时执行 `pnpm essays:sync`（同样先停止 Strapi）。详情 API 的精确筛选格式为 `filters[slug][$eq]`；省略 `$` 会导致筛选失效。

只同步教程时执行 `pnpm tutorials:sync`，同样先停止 Strapi；它不修改随笔和工具，只补齐教程读取权限。可先运行 `pnpm tutorials:check` 校验稿件，此命令不启动 Strapi、不访问数据库。章节数从清单中实际列出的文件计算，目前为 3、1、1、1、1；首页按 `order` 升序显示。后续编辑与来源说明见 [教程维护指南](../content/tutorials/README.md)。后台手工改过的教程会被仓库稿件覆盖，需保留的改动请先写回源文件。

## 内容与目录

- `src/api/essay/`：随笔。
- `src/api/tutorial/`：教程。
- `src/api/tool/`：工具卡片。
- `src/api/comment/`：评论。
- `config/`：数据库、服务、安全和 CORS 配置。
- `scripts/seed.js`：可选示例数据写入脚本。
- `types/generated/`：Strapi 生成类型，随 schema 更新。

需要展示 CMS 内容时，为 Public 角色配置相应内容的 `find` / `findOne` 读取权限，并发布内容。评论的公开读取、审核及邮箱隐私仍需单独完成，详见 [本地调试计划](../docs/LOCAL_DEBUG_PLAN.md)；不要把“打开所有公共写权限”作为修复方法。

启动 Strapi 不会自动写入旧示例文章或清理现有记录。远端旧种子数据已保存在 `docs/archive/backend/`，当前内容请通过明确选择的同步命令导入。`api::chapter.chapter` 模型仍可读取已有独立章节；当前 5 个教程的章节合并在教程正文中。

种子脚本使用 `STRAPI_TOKEN` / `STRAPI_URL` 环境变量，仅在目标数据库明确且可写时手动运行 `pnpm backend:seed`。它不是幂等导入器，重复执行会尝试重复创建；当前不导入 `content/` 全文，也不会自动建立真实工具链接。

## 部署

```bash
npm run build --prefix backend
npm run start --prefix backend
```

部署前须按实际前端域名设置 `CORS_ORIGINS`，本地默认允许 `http://localhost:5173` 和 `http://localhost:5170`。数据库、上传文件持久化和托管说明见 [部署导航](../docs/deployment/README.md)。旧搭建过程保存在 [历史后端文档](../docs/archive/backend/README.md)，当前 schema 以 `src/api/` 为准。
