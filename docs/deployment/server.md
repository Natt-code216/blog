# 自建服务器部署

- 网站：https://www.blog.offerready.cn
- 后台：https://www.blog.offerready.cn/cms/admin
- API：https://www.blog.offerready.cn/cms/api
- 服务器：102.134.52.187（Ubuntu 24.04）
- 运行方式：Nginx 静态前端 + systemd Strapi + PostgreSQL 16。
- Node.js：24.21.0，安装在 `/opt/blog-node`。

## 服务器目录

| 路径 | 用途 |
| --- | --- |
| `/opt/blog/current` | 指向当前发布目录的软链接 |
| `/opt/blog/releases/` | 历次构建，含 frontend、backend、content |
| `/opt/blog/shared/backend.env` | 生产环境及数据库凭据 |
| `/opt/blog/shared/uploads/` | 持久化上传文件 |
| `/opt/blog/shared/admin-credentials.local` | 首次生成的后台登录凭据 |
| `/etc/nginx/sites-available/blog` | 博客专用站点配置 |
| `/etc/systemd/system/blog.service` | Strapi 开机自启及故障重启 |

后台账号默认登录名 `admin@offerready.cn`，此邮箱仅作为初始登录标识，不代表已配置邮件发送。初始密码保存在服务器凭据文件和本机 `deploy/admin-credentials.local`，均不应提交到 Git。登录后可在个人资料中调整邮箱及密码。

Nginx 将 Strapi 登录 Cookie 的 `/admin` 路径重写为 `/cms/admin`，以支持管理后台刷新登录状态。初始数据库备份位于 `/opt/blog/shared/backups/initial-20260930.dump`。

## 构建与发布

### 常规更新（版本化发布）

本机安装 Node.js 24，依照锁文件安装前后端依赖后，先提交本地修改，再从仓库根目录运行：

```bash
python3 deploy/release.py
```

脚本使用 SSH 连接 `root@102.134.52.187`，可用 `BLOG_SSH_HOST` 覆盖。不会记录服务器密码，也不会自动推送 GitHub。

每次发布依次执行类型检查、全部前端测试、前后端生产构建、上传校验、线上备份、内容同步、版本切换及公网验收。工作区或 Git 提交在构建过程中变化时中止发布。版本格式为 `UTC时间-Git提交短码`；成功后创建本地 Git 标签 `deploy/版本号`，可通过 `git push origin 标签名` 单独推送。

- `/opt/blog/releases/版本号/release.json`：提交、源码树、构建时间、锁文件和 schema 校验信息。
- 同目录 `source.tar.gz`：此提交的完整已跟踪源码；`SHA256SUMS`：上传内容的校验和（运行时创建环境软链接之前）。
- `/version.json`：当前网站的发布版本。
- `/opt/blog/previous`：上次运行的发布目录。
- `/opt/blog/shared/releases.log`：成功、失败和回滚记录。
- `/opt/blog/shared/backups/发布事件/`：切换前数据库、上传文件及 Nginx/systemd 配置。不会自动删除旧版或备份。

运行时环境、管理员、上传文件及生产 PostgreSQL 数据库持续复用。仓库中的随笔和教程按 slug 更新正文和元数据并发布，保留 documentId；不删除 CMS 中额外添加的条目。源码包含的文章是这些同名条目的来源，后台对同名正文的编辑应先写回仓库。收藏和工具目录随前端构建发布。不会用本地 SQLite 覆盖生产数据库。

部署前备份时会短暂停止后端。健康检查或内容校验失败时，脚本恢复切换前的数据库和代码；若数据库恢复失败则保留停止状态并报错，备份仍在原目录。

### 查看与回滚

在服务器执行：

```bash
bash /opt/blog/current/deploy/server-release.sh status
cat /opt/blog/shared/releases.log
# 后端 API/schema 相同时：只回退代码，保留最新数据
bash /opt/blog/current/deploy/server-release.sh rollback 目标版本号
# API/schema 有变化时：使用日志里此次发布对应的备份，回退代码及数据
bash /opt/blog/current/deploy/server-release.sh restore 目标版本号 /opt/blog/shared/backups/此次发布事件
```

完整恢复仅允许回到该备份记录的上一版，会把数据库恢复到当时快照；上线后新增的数据不会保留在回退后的数据库中，但执行回退前也会再次备份当前数据库和上传文件。若首次旧版没有管理脚本，应先使用当前新版的脚本运行回滚命令。不要直接删除 `current`、`previous` 指向的版本目录。

### 手动构建参考

前端构建时设置 `VITE_API_URL=/cms/api`，后台构建时设置 `NODE_ENV=production`、`PUBLIC_URL=https://www.blog.offerready.cn/cms` 和 `TRUST_PROXY=true`：

```bash
VITE_API_URL=/cms/api pnpm build
cd backend
npm ci
NODE_ENV=production PUBLIC_URL=https://www.blog.offerready.cn/cms TRUST_PROXY=true npm run build
```

前后端在本机构建，避免 1 GB 服务器在构建管理界面时耗尽内存。将根目录 `dist/` 上传为新发布目录的 `frontend/`，将 backend 的 `package.json`、`package-lock.json`、`config/`、`src/`、`dist/`、`scripts/`、`public/` 和 `tsconfig.json` 上传为 `backend/`。不要上传本机 `.env`、`.tmp`、`node_modules` 或 `*.local`。

在服务器的新 backend 目录使用 `/opt/blog-node/bin` 下的 npm 执行 `npm ci --omit=dev`。将 `.env` 链接到 `/opt/blog/shared/backend.env`，将 `public/uploads` 链接到 `/opt/blog/shared/uploads`，目录属主设为 `blog:blog`。生产数据库为独立的 `blog` 数据库及角色。

首次上线时，在已加载生产环境变量且服务停止的情况下，执行 `node scripts/seed-production-content.mjs --initialize` 导入仓库的 3 篇随笔和 5 个教程。脚本仅新增缺少的 slug，不覆盖已有 CMS 内容。后台账号由 `node scripts/initialize-production-admin.mjs --initialize` 创建；已有账号时跳过。更新部署无需重复初始化。

切换 `/opt/blog/current` 到新目录后执行 `systemctl restart blog`，检查 `curl -f http://127.0.0.1:1337/_health`。若失败，把软链接切回上一个发布目录并重启；涉及数据库 schema 的更新应先备份数据库，代码回退不会自动回滚数据库。

## 日常管理

```bash
systemctl status blog
journalctl -u blog -n 100 --no-pager
systemctl restart blog
nginx -t
systemctl reload nginx
```

首次备份及后续手动备份可使用 `runuser -u postgres -- pg_dump -Fc blog > /root/blog-backup.dump`；上传文件同时备份 `/opt/blog/shared/uploads`。

## SSL

Let's Encrypt 证书路径为 `/etc/letsencrypt/live/www.blog.offerready.cn/`。Nginx 将 HTTP 重定向到 HTTPS，ACME 验证目录为 `/var/www/blog-acme`。`certbot.timer` 自动续期，`/etc/letsencrypt/renewal-hooks/deploy/blog-reload-nginx` 在续期成功后重新加载 Nginx。

```bash
systemctl list-timers certbot.timer
certbot renew --cert-name www.blog.offerready.cn --dry-run --run-deploy-hooks
```

本次部署仅配置 `www.blog.offerready.cn`，`blog.offerready.cn` 不包含在本证书中。项目现有评论功能尚未完成公开权限和审核配置，本次保留其关闭状态；随笔、教程、工具 API 已开放读取。

## 2026-09-30 上线验收

- 前后端生产构建成功，前端 22 个测试文件、105 项测试通过。
- HTTPS 首页、文章直达链接、教程和工具箱返回正常，浏览器已验证文章正文与工具目录。
- 后台登录、通过 Cookie 刷新 access token、读取当前管理员及退出均返回 200。
- `blog.service` 已启用，运行期间无异常重启。
- SSL 证书有效期至北京时间 2026-12-29 02:40；自动续期模拟与 Nginx 重载均通过。
