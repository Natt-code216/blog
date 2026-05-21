# Strapi 后端部署到 Render

## 前置准备

与 [Railway 文档](./backend-railway.md) 相同的三大前提：

1. 数据库切到 Postgres（Render 提供托管 Postgres）。
2. 重新生成 `APP_KEYS` / `API_TOKEN_SALT` / `ADMIN_JWT_SECRET` / `JWT_SECRET` / `TRANSFER_TOKEN_SALT` / `ENCRYPTION_KEY`。
3. 上传文件用 S3 / Cloudinary，Render 磁盘不是持久卷（除非购买 Disk 加挂）。

代码侧改动（`backend/config/database.ts`、`backend/config/plugins.ts`）参考 Railway 文档对应章节。

## 步骤

### 1. 创建 Postgres

1. 登录 [Render](https://dashboard.render.com)，**New + → PostgreSQL**。
2. 名称如 `blog-db`，Region 选离用户近的（如 Singapore）。
3. Plan 选 Free 或 Starter。
4. 创建后记录 **Internal Database URL**（同区域服务用这个，速度快、免费）。

### 2. 创建 Web Service

1. **New + → Web Service**，连接 GitHub 仓库。
2. 配置：
   - **Name**：`blog-strapi`
   - **Region**：与 Postgres 同区域
   - **Branch**：`main`
   - **Root Directory**：`backend`
   - **Runtime**：Node
   - **Build Command**：`npm install && npm run build`
   - **Start Command**：`npm run start`
   - **Plan**：Starter 起步（Free 会冷启动，Strapi 启动慢容易超时）

### 3. 环境变量

**Environment → Add Environment Variable**：

```
NODE_ENV=production
HOST=0.0.0.0
PORT=10000
DATABASE_CLIENT=postgres
DATABASE_URL=<粘贴 Internal Database URL>
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
APP_KEYS=xxx,xxx,xxx,xxx
API_TOKEN_SALT=xxx
ADMIN_JWT_SECRET=xxx
JWT_SECRET=xxx
TRANSFER_TOKEN_SALT=xxx
ENCRYPTION_KEY=xxx
```

> Render 注入的 `PORT` 默认是 10000，Strapi 会读它；不要写死端口。

### 4. 健康检查

**Settings → Health Check Path** 设为 `/_health`（Strapi 5 自带）。如果用 Strapi 4 可以设为 `/admin` 或留空。

### 5. 部署

点击 **Manual Deploy → Deploy latest commit**。首次构建约 5-10 分钟。

部署完成后访问 `https://blog-strapi.onrender.com/admin` 创建管理员。

### 6. 自动部署

Render 默认每次 `main` push 都会触发部署。如需关闭，**Settings → Build & Deploy → Auto-Deploy → No**。

### 7. CORS

在 `backend/config/middlewares.ts` 中将前端域名加入 `strapi::cors` 的 `origin`。

### 8. 自定义域名

**Settings → Custom Domains → Add Custom Domain**，按提示添加 `CNAME` 即可。Render 自动续期证书。

## 常见问题

- **冷启动慢**：Free 计划 15 分钟无请求会休眠。生产请用 Starter+。
- **构建被 OOM kill**：Starter 是 512MB；升级到 Standard（2GB）。
- **数据库 SSL 报错**：必须设置 `DATABASE_SSL=true` 且 `DATABASE_SSL_REJECT_UNAUTHORIZED=false`。
- **管理后台样式丢失**：确认 build 步骤完整执行，Render Logs 里能看到 `Building admin panel`。
