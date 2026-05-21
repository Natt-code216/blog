# 教程五 · 部署上线全流程

> 等级：C_level（高级）
> 章节：5 / 5
> 状态：B已完结

## 一、上线前的清单

写到第五章，前四章的成果还都跑在 `localhost`，对自己以外的任何人都不可见。这一章把它推上互联网，并且讲清楚每个环节为什么这么选——网上"五分钟部署"教程很多，但部署完后某天出问题，你得知道该去哪儿排查。

上线之前我会过一遍这张清单：

- [ ] 前端 `.env` 里的 `VITE_API_URL` 不再指向 localhost
- [ ] 后端的 `APP_KEYS`、`JWT_SECRET` 等密钥**重新生成**，不能用开发环境那套
- [ ] 数据库从 SQLite 切换到 Postgres
- [ ] 上传文件不再写本地磁盘，改 S3 或同类对象存储
- [ ] 仓库 `.gitignore` 里确认有 `.env`、`backend/.tmp/`、`node_modules/`
- [ ] 跑一遍 `pnpm build` 看有没有 TypeScript 报错

> 踩坑：Strapi 开发环境的 SQLite 数据是不会自动同步到生产的。生产环境的内容需要在线后台重新录入，或者用 Strapi 的 transfer 命令迁移。

## 二、前端部署到 Vercel

Vercel 对前端项目几乎是零配置体验，免费额度对个人博客也绰绰有余。

**步骤一：把仓库推到 GitHub**

```bash
git remote add origin git@github.com:yourname/blog.git
git push -u origin main
```

**步骤二：在 Vercel 导入项目**

登录 vercel.com → New Project → Import Git Repository → 选 blog 仓库。

Vercel 会自动识别 Vite 项目，但有几个字段需要手动确认：

- **Framework Preset**：Vite
- **Root Directory**：`./`（如果你的前端代码在 `frontend/` 子目录，要改成 `frontend/`）
- **Build Command**：`pnpm build`
- **Output Directory**：`dist`
- **Install Command**：`pnpm install`

**步骤三：设置环境变量**

这是新手最容易翻车的地方。在 Project Settings → Environment Variables 里加：

```
VITE_API_URL=https://api.your-blog.com/api
```

> 注意：环境变量改完后**必须重新部署一次**才会生效。Vercel 不会自动触发构建，要去 Deployments 页面点 Redeploy。

**步骤四：自定义域名**

在 Project → Settings → Domains 里添加你的域名 `blog.example.com`，Vercel 会给出一条 CNAME 记录（形如 `cname.vercel-dns.com`），把它配到你的 DNS 服务商即可。HTTPS 证书 Vercel 自动签发，不用操心。

## 三、Netlify 方案（备选）

如果不想用 Vercel，Netlify 的体验类似。差别在于 Netlify 推荐用配置文件 `netlify.toml` 管理构建参数。在项目根目录建：

```toml
# netlify.toml
[build]
  command = "pnpm build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"
  PNPM_VERSION = "9"

# SPA 重写：所有未匹配的路径都返回 index.html
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**最后那段重写规则非常关键**。SPA 应用所有路由都靠前端 JS 处理，如果用户直接访问 `/essays/why-i-blog`，服务器找不到对应的物理文件，默认会返回 404。重写规则告诉 Netlify：找不到的路径都吐 index.html 出去，让前端路由接管。

> 踩坑：Vercel 的 Vite 模板默认就有这个 fallback，不用手动配。但 Netlify 不会自动加，缺了它详情页直接刷新就 404。

如果用 Vercel 又想显式声明，可以加 `vercel.json`：

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

## 四、后端部署到 Railway

Strapi 是个 Node.js 服务，需要长期运行的环境。常见的选择有 Railway、Render、Fly.io、自建 VPS。我选 Railway，原因是：连 GitHub 一键 deploy、自带 Postgres 插件、价格透明（每月起步 5 美元）。

**步骤一：创建项目**

Railway 后台 → New Project → Deploy from GitHub repo → 选博客仓库。

如果后端代码在 `backend/` 子目录，要在 Settings 里把 Root Directory 设为 `backend`。

**步骤二：加一个 Postgres 数据库**

Strapi 默认 SQLite 是为了开发方便，生产必须换。点 New → Database → Add PostgreSQL，Railway 会创建一个 PG 实例并自动注入连接环境变量。

接下来改 `backend/config/database.ts`，让它在生产用 Postgres：

```ts
// backend/config/database.ts
import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  const connections = {
    postgres: {
      connection: {
        host: env('DATABASE_HOST'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME'),
        user: env('DATABASE_USERNAME'),
        password: env('DATABASE_PASSWORD'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_SELF', false),
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

**步骤三：设置环境变量**

Railway → 项目 → Variables 里至少要有：

```
NODE_ENV=production
DATABASE_CLIENT=postgres
APP_KEYS=<生成一组用逗号分隔的随机字符串>
API_TOKEN_SALT=<随机字符串>
ADMIN_JWT_SECRET=<随机字符串>
JWT_SECRET=<随机字符串>
TRANSFER_TOKEN_SALT=<随机字符串>
```

生成随机字符串可以用：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> 踩坑：APP_KEYS 必须是**多个**用逗号分隔的字符串，比如 `key1,key2`，Strapi 启动时会校验。只填一个会启动失败但报错信息很隐晦。

`DATABASE_URL` 之类 Railway 会自动注入，但 Strapi 的 config 是按字段读的，建议在 Variables 里手动从 Postgres 服务里映射，或者改 config 改成读 `DATABASE_URL`。

**步骤四：上传文件改 S3**

Strapi 默认把图片存到本地磁盘 `public/uploads/`。在 Railway 这种平台，每次重新部署容器都会重建，本地文件全部丢失。必须接对象存储。

```bash
cd backend
pnpm add @strapi/provider-upload-aws-s3
```

```ts
// backend/config/plugins.ts
export default ({ env }) => ({
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        credentials: {
          accessKeyId: env('AWS_ACCESS_KEY_ID'),
          secretAccessKey: env('AWS_ACCESS_SECRET'),
        },
        region: env('AWS_REGION'),
        params: {
          Bucket: env('AWS_BUCKET'),
        },
      },
    },
  },
});
```

S3 也可以换成 Cloudflare R2（兼容 S3 API 但流量免费）、阿里云 OSS 等。

## 五、域名、HTTPS、Cloudflare

前后端各自部署完之后，URL 形如：

- 前端：`blog-xxxx.vercel.app`
- 后端：`backend-production-xxxx.up.railway.app`

把它们都套上自定义域名才像样：

- `blog.example.com` → 前端
- `api.example.com` → 后端

我倾向用 Cloudflare 管 DNS，原因有几个：

1. 免费
2. 自带 DDoS 防护和 WAF
3. Page Rules 灵活——可以给 `api.example.com/*` 单独配置缓存策略
4. CDN 把静态资源加速到全球节点

> 注意：如果开启 Cloudflare 的 "Proxy"（橙色云朵），SSL 模式要设成 "Full (strict)"，否则会和 Vercel/Railway 的证书冲突，出现 525 错误。

在 Cloudflare 加两条 CNAME：

```
blog    CNAME    cname.vercel-dns.com    Proxied
api     CNAME    backend-production-xxxx.up.railway.app    Proxied
```

## 六、CDN 与缓存策略

前端静态资源 Vercel 已经自动 CDN 化了，hash 文件名 + 强缓存。需要手动操心的是 API 响应。

对一个博客，绝大多数请求是只读的 GET，列表和详情完全可以缓存。两种思路：

**思路一：Cloudflare Page Rule**

给 `api.example.com/api/essays*` 配置 Cache Level: Cache Everything，Edge Cache TTL: 1 hour。后台编辑文章后用 Cloudflare API purge 一次。

**思路二：HTTP Cache 头**

在 Strapi 里加中间件，给特定接口加 `Cache-Control`：

```ts
// backend/src/middlewares/cache-control.ts
export default () => async (ctx, next) => {
  await next();
  if (ctx.method === 'GET' && ctx.path.startsWith('/api/')) {
    ctx.set('Cache-Control', 'public, max-age=60, s-maxage=300');
  }
};
```

`max-age=60` 是浏览器本地缓存 60 秒，`s-maxage=300` 是 CDN 缓存 5 分钟。对个人博客足够。

## 七、监控与日志：Sentry

线上跑起来就忘了它，是大多数博客挂掉用户先发现的根本原因。最低限度装一个 Sentry，前后端各装一份。

**前端：**

```bash
pnpm add @sentry/react
```

```ts
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

**后端：**

```bash
cd backend
pnpm add @sentry/node
```

```ts
// backend/src/index.ts
import * as Sentry from '@sentry/node';

export default {
  register() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
    });
  },
  bootstrap() {},
};
```

> 注意：Sentry 免费额度是每月 5000 事件，一个个人博客完全够用。但如果你不做采样，前端的每个 ResizeObserver 警告都会上报，几天就用光。务必设置 `tracesSampleRate` 和 `beforeSend` 过滤噪音。

Railway 自带日志查看器，但只保留 7 天。如果想更长，可以接 LogTail、Better Stack 之类的服务。

## 八、CI/CD：GitHub Actions

Vercel 和 Railway 都已经支持 push 即部署，但部署前应该跑测试和 lint，避免把红线代码推上线。

在仓库根新建 `.github/workflows/ci.yml`：

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm build
      - run: pnpm test --if-present

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
```

几个细节：

- `--frozen-lockfile` 强制按 lockfile 安装，避免线下线上版本飘移
- `pnpm test --if-present` 没写测试也不会报错
- 后端 build 只是确认 TypeScript 编译过，真正的部署交给 Railway

如果想在 CI 通过后再触发 Vercel 部署，可以在 Vercel 关掉自动部署，改用 Vercel CLI 在 workflow 末尾手动 deploy。但对个人项目来说，让 Vercel 自动跑、CI 失败时手动 revert 通常更省事。

## 九、上线之后

部署只是开始。我会定期做这些事：

- 每周看一次 Sentry 错误列表，挑重复出现的修
- 每月检查 Railway 和 Vercel 的用量，看有没有逼近免费额度
- 每季度跑一次 Lighthouse，看性能有没有退步
- 半年备份一次 Postgres（`pg_dump` 到本地）

> 注意：备份是真的重要。Railway 的 Postgres 有自动快照但只能恢复到最近几天。一次 `DROP TABLE` 误操作，没备份就只能从零再来。

## 结语

到这里，五章教程走完一整条路径——从空白文件夹开始，搭起 Vite + React 的前端、用 Strapi 做内容管理、把两端用 axios 接起来、加上路由让它像个真正的网站、再推到 Vercel 和 Railway 让全世界都看得到。

中间踩过的坑、做过的取舍，远不止文档里写出来的这些。但只要前面这条主线打通了，剩下的就是不断打磨——加上评论系统、加上 RSS、加上 dark/light 切换、加上 i18n——这些都是水到渠成的事。

写博客的最大收获不是流量，而是逼自己把"知道一点"的事说清楚。希望这五章对你也有同样的作用。
