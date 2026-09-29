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
