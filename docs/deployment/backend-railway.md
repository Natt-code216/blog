# Strapi 后端部署到 Railway

## 重要前提

生产环境**必须**做以下三件事，否则会丢数据或无法上线：

1. **数据库换成 Postgres**，不要继续用 SQLite（容器重启即丢）。
2. **重新生成所有密钥**（`APP_KEYS` 等），不要复用开发值。
3. **上传文件用对象存储**（S3 / Cloudinary / R2），容器本地磁盘不持久。

## 步骤

### 1. 准备 Postgres

如果 `backend/package.json` 还没有 `pg`，本地先安装：

```bash
cd backend
npm install pg
```

修改 `backend/config/database.ts` 让生产环境读 Postgres：

```ts
import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    postgres: {
      connection: {
        connectionString: env('DATABASE_URL'),
        host: env('DATABASE_HOST'),
        port: env.int('DATABASE_PORT'),
        database: env('DATABASE_NAME'),
        user: env('DATABASE_USERNAME'),
        password: env('DATABASE_PASSWORD'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
    sqlite: {
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
```

### 2. 生成生产密钥

在本地执行（每条单独跑）：

```bash
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

至少需要：

| 变量 | 用途 |
| --- | --- |
| `APP_KEYS` | 4 个 base64，逗号拼接 |
| `API_TOKEN_SALT` | API token 加盐 |
| `ADMIN_JWT_SECRET` | 管理后台 JWT |
| `JWT_SECRET` | Users-permissions JWT |
| `TRANSFER_TOKEN_SALT` | 数据迁移 token |
| `ENCRYPTION_KEY` | 内容加密（Strapi 5） |

### 3. 在 Railway 创建项目

1. 登录 [Railway](https://railway.app)，**New Project → Deploy from GitHub repo**。
2. 选择本仓库。
3. **Settings → Root Directory** 设为 `backend`。
4. **Settings → Build Command** 设为 `npm install && npm run build`。
5. **Settings → Start Command** 设为 `npm run start`。

### 4. 添加 Postgres 插件

1. 项目面板点 **+ New → Database → Add PostgreSQL**。
2. Railway 自动注入 `DATABASE_URL` 到同项目下的服务。
3. 在 Strapi 服务的 **Variables** 中确认 `DATABASE_URL` 已存在。

### 5. 配置环境变量

在 Strapi 服务的 **Variables** 添加：

```
NODE_ENV=production
HOST=0.0.0.0
PORT=1337
DATABASE_CLIENT=postgres
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
APP_KEYS=xxx,xxx,xxx,xxx
API_TOKEN_SALT=xxx
ADMIN_JWT_SECRET=xxx
JWT_SECRET=xxx
TRANSFER_TOKEN_SALT=xxx
ENCRYPTION_KEY=xxx
```

### 6. 配置上传到对象存储

推荐 Cloudinary（免费额度大）或 AWS S3。安装 provider：

```bash
cd backend
npm install @strapi/provider-upload-cloudinary
# 或
npm install @strapi/provider-upload-aws-s3
```

新建 `backend/config/plugins.ts`：

```ts
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'cloudinary',
      providerOptions: {
        cloud_name: env('CLOUDINARY_NAME'),
        api_key: env('CLOUDINARY_KEY'),
        api_secret: env('CLOUDINARY_SECRET'),
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
```

并在 `backend/config/middlewares.ts` 中放行 Cloudinary 域名（`img-src` / `media-src` 加入 `res.cloudinary.com`）。

### 7. 暴露公网域名

**Settings → Networking → Generate Domain**，得到 `*.up.railway.app` 地址。这就是前端 `VITE_API_URL` 要填的值（不带 `/api` 后缀）。

### 8. 配置 CORS

在 `backend/config/middlewares.ts` 的 `strapi::cors` 段加入前端域名：

```ts
{
  name: 'strapi::cors',
  config: {
    origin: ['https://your-frontend.vercel.app', 'https://blog.example.com'],
  },
},
```

### 9. 首次部署后

1. 访问 `https://your-strapi.up.railway.app/admin` 创建第一个管理员。
2. **Settings → API Tokens** 创建只读 Token，给前端使用（如需）。
3. 在 **Content-Type Builder** 检查内容模型已正确同步。

## 常见问题

- **数据库连接失败**：确认 `DATABASE_SSL=true` 且 `DATABASE_SSL_REJECT_UNAUTHORIZED=false`（Railway Postgres 自签证书）。
- **构建 OOM**：Railway 默认 512MB，升级到 Hobby 计划获得 8GB。
- **管理后台 404**：确认 build 成功执行（Strapi 5 必须 `npm run build` 生成 `dist/`）。
