# 第一章 · 从内容模型到一条可读取的教程 API

前一个教程里的阅读清单在浏览器内保存状态。真正的博客需要把标题、正文和发布状态放在服务端，作者能编辑，读者只能读取。Strapi 在这里承担内容后台：它保存内容并提供 HTTP API，页面样式仍由 React 决定。

**本章完成标志**：本地后台启动，五篇仓库教程已同步，公开 API 可以读取已发布内容。预计用时 40 分钟。操作目录切回本站仓库，后续路径均相对此目录。

### 1. 启动仓库已有的后台

不需要在 `backend/` 里再次生成 Strapi 项目。先安装已经锁定的依赖：

```bash
npm ci --prefix backend
```

首次配置时，将 `backend/.env.example` 复制为 `backend/.env`。已有环境文件时直接编辑，保留已有密钥。按示例中的字段填入独立随机值，至少包含 `APP_KEYS`、`API_TOKEN_SALT`、`ADMIN_JWT_SECRET`、`TRANSFER_TOKEN_SALT` 和 `JWT_SECRET`。可在本地终端多次运行以下命令分别生成；`APP_KEYS` 使用多个值以逗号分隔：

```bash
openssl rand -base64 32
```

本地数据库保持 `DATABASE_CLIENT=sqlite` 和 `DATABASE_FILENAME=.tmp/data.db`，其余设置对照 `backend/config/database.ts`。启动后台：

```bash
npm run develop --prefix backend
```

打开 `http://localhost:1337/admin`，首次启动时创建本地管理员。管理账号用于进入后台，并不等于给访客开放写权限。

### 2. 先读模型，再编辑内容

本项目的教程模型保存在 `backend/src/api/tutorial/content-types/tutorial/schema.json`。在 Content-Type Builder 中可以看到对应结构，无需重复创建另一个 Tutorial。

| 字段 | 例子 | 作用 |
| --- | --- | --- |
| `title` | 从零搭建 React 项目 | 读者看到的标题 |
| `slug` | `react-vite-setup` | 详情 URL 的稳定标识 |
| `description` | 三章完成阅读清单 | 首页摘要 |
| `content` | Markdown 正文 | 详情页内容 |
| `chapters` | `3` | 已写出的章数，不是教程序号 |
| `order` | `1` | 学习顺序，数值小的在前 |
| `level` | `A_level` | 前端映射成「入门」 |
| `status` | `A更新中` | 教程的编辑进度 |
| `published` | `true` | 本项目自定义的展示开关 |

`status` 字段表示教程是否继续更新，与 Strapi 的草稿/发布状态是两回事。当前模型启用了 Draft & Publish：后台保存草稿后，还需要 Publish 才会成为已发布版本。本站同时筛选自定义的 `published=true`，因此公开显示需要满足两项条件。机制可参考 [Strapi：Draft & Publish](https://docs.strapi.io/cms/features/draft-and-publish)。

修改标题时尽量保留 slug，避免已有书签失效。Strapi 5 还返回 `documentId`；脚本更新已有内容时使用它关联同一个文档，不能把数据库数字 `id` 当成长期稳定的文档身份。

### 3. 将仓库章节同步到本地后台

当前稿件按教程目录保存，`content/tutorials/catalog.json` 决定顺序和章节文件。同步器会把章节合并为正文、生成目录锚点，并按 slug 更新已有教程。

先回到后台终端按 Ctrl+C 停止服务，再在仓库根目录执行：

```bash
pnpm tutorials:check
pnpm tutorials:sync
npm run develop --prefix backend
```

这只操作默认的本地 SQLite 库，不会把内容发布到远程站点。同步前会备份数据库，已有教程保留 documentId；教程专用命令不改随笔正文。下次编辑仓库稿件后重复同样流程即可。

如果你想手动体验编辑，在 Content Manager 的 Tutorial 中打开已有记录，在正文末尾加一段自己的学习笔记并 Publish。再次运行同步会以仓库稿件覆盖该教程字段，因此要长期保留的文字也应写回对应 Markdown 文件。

### 4. 只为访客开放读取

进入 Settings → Users & Permissions plugin → Roles → Public，为 Tutorial 勾选 `find` 和 `findOne` 后保存。同步脚本会为本地教程补齐这些读取权限，手动配置时同样只需要这两项。

在终端验证公开列表：

```bash
curl -g 'http://localhost:1337/api/tutorials?filters[published][$eq]=true&sort[0]=order:asc'
```

再验证一个精确的 slug：

```bash
curl -g 'http://localhost:1337/api/tutorials?filters[slug][$eq]=react-vite-setup&filters[published][$eq]=true'
```

单引号防止 shell 展开 `$eq`，`-g` 防止 curl 把方括号当作 URL 范围语法。Strapi 的筛选格式见 [REST Filters](https://docs.strapi.io/cms/api/rest/filters)。返回的 `data` 应是数组，里面直接有 `title`、`slug`、`content` 等字段；这里使用的是 Strapi 5 的扁平响应，不再从 `data.attributes` 读取。[REST API 文档](https://docs.strapi.io/cms/api/rest)给出了响应结构。

### 5. 理解两种「读取不到」

HTTP 403 通常意味着请求被权限规则拒绝；HTTP 200 且 `data: []` 则意味着请求成功，但没有符合发布状态或筛选条件的记录。它们在前端应对应不同状态，不应该统统显示「暂无文章」。

| 现象 | 排查顺序 |
| --- | --- |
| 连接被拒绝 | 服务是否启动，端口是否为 1337 |
| 403 | Public 的 Tutorial `find` 是否已保存 |
| 列表为空 | 是否 Publish、自定义 `published` 是否为 true、slug 是否拼对 |
| 总是返回第一篇 | 查询中是否遗漏 `$eq`，不要只检查页面标题 |
| Markdown 改了页面没变 | 是否重新同步；写入仓库文件不会自动写入 CMS |

### 6. 本章练习与验收

打开 `react-vite-setup` 的响应，确认标题正确、`chapters` 为 3，正文同时包含三章标题。再用一个不存在的 slug 查询，应得到空数组。

在后台临时将这篇教程取消发布，用公开接口确认它消失；重新 Publish 后应再次出现。这样你验证的是完整的编辑和发布流程，而不仅是「后台能打开」。

下一章进入 [前后端联调](/tutorials/frontend-backend-integration)，把这条真实 API 接到 React 页面。本教程后续可继续扩展图片、关联内容和后台角色管理。
