---
order: 5
title: 生产部署与备份
est_read_minutes: 13
---

# 生产部署与备份

本地能跑的 Strapi 距离生产可用还有很长的路。本章把这条路上的几个关键步骤讲清楚：数据库选型、部署平台、环境变量、备份策略。

## 数据库选型：从 SQLite 切到 PostgreSQL

`pnpm create strapi --quickstart` 默认用 SQLite。开发期完全够用，但生产**几乎一定要切到 PostgreSQL**。

为什么不用 SQLite 上生产：

1. **并发写入瓶颈**：SQLite 在并发写入下性能急剧下降；
2. **不支持远程**：所有读写必须在同一个文件系统上；
3. **备份不方便**：要做 hot backup 需要额外工具。

PostgreSQL 是 Strapi 推荐、社区主流、且免费开源的选择。MySQL 也可以，但 PostgreSQL 在 JSON 字段、数组、时区处理上更现代。

切换步骤：

1. 启动一个 PostgreSQL（本地用 Docker、云端用 RDS / Supabase / Neon）；
2. 修改 `config/database.ts`：

```ts
import path from 'path';

export default ({ env }) => {
  const client = env('DATABASE_CLIENT', 'postgres');
  return {
    connection: {
      client,
      connection: {
        host: env('DATABASE_HOST', '127.0.0.1'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', 'strapi'),
        ssl: env.bool('DATABASE_SSL', false) && {
          rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
        },
      },
      pool: { min: env.int('DATABASE_POOL_MIN', 2), max: env.int('DATABASE_POOL_MAX', 10) },
    },
  };
};
```

3. 在 `.env.production` 配置：

```
DATABASE_CLIENT=postgres
DATABASE_HOST=...
DATABASE_PORT=5432
DATABASE_NAME=strapi
DATABASE_USERNAME=strapi
DATABASE_PASSWORD=...
DATABASE_SSL=true
```

4. 重启 Strapi，从空数据库重新建一遍 Content Types（或迁移数据，见下文）。

## 从 SQLite 迁移数据到 PostgreSQL

如果你已经在 SQLite 上录入了数据，要迁移过去：

```bash
# 1. 把 SQLite 数据导出
pnpm strapi export --no-encrypt --file backup-from-sqlite

# 2. 切换 .env 到 PostgreSQL，启动 Strapi 让它创建 schema
pnpm develop  # 看到 "Welcome back!" 就 Ctrl+C 退出

# 3. 导入数据
pnpm strapi import --file backup-from-sqlite.tar.gz
```

Strapi 内置的 import/export 是数据库无关的——它导出的是逻辑数据，不是 SQL dump。这让数据库迁移变得相对无痛。

## 部署平台的选择

部署 Strapi 有几条主流路径：

**1. Render / Railway / Fly.io**
- 适合：小到中型项目；
- 优势：一键部署、内置 PostgreSQL、价格友好；
- 限制：免费 plan 经常 sleep；

**2. DigitalOcean / Linode / Vultr 上自建**
- 适合：中到大型项目；
- 优势：成本可控、完全自主；
- 限制：要自己管 nginx、SSL、监控、备份；

**3. Docker + Kubernetes**
- 适合：已经有 K8s 基础设施的团队；
- 优势：与已有架构集成；
- 限制：配置复杂；

**4. Strapi Cloud**
- 适合：不想运维的团队；
- 优势：托管、自动备份、CDN；
- 限制：收费（基础版约 $15/月起）；

如果你是从零起步，**Render 或 Railway 是性价比最高的起点**。一年内项目长大到不够用，再考虑迁出。

## 一份典型的 docker-compose

如果你选了自建路径，下面是一份能直接用的 docker-compose：

```yaml
version: '3'
services:
  strapi:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./:/app
    command: sh -c "pnpm install --frozen-lockfile && pnpm build && pnpm start"
    env_file: .env.production
    ports:
      - "1337:1337"
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: ${DATABASE_USERNAME}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
      POSTGRES_DB: ${DATABASE_NAME}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  pgdata:
```

配 nginx 做 SSL 终止 + 反向代理，这套就是一份"生产级最小骨架"。

## 环境变量：必须正确处理的几个

Strapi 在生产里依赖几个关键环境变量：

```
NODE_ENV=production
HOST=0.0.0.0
PORT=1337

APP_KEYS=key1,key2,key3,key4     # 用于 session
API_TOKEN_SALT=...
ADMIN_JWT_SECRET=...
JWT_SECRET=...
TRANSFER_TOKEN_SALT=...

DATABASE_CLIENT=postgres
DATABASE_HOST=...
# ...其他 DB 配置
```

`APP_KEYS` 和各种 secret 都不能用默认值——任何带默认 secret 的生产 Strapi 都是定时炸弹。生成强随机值的命令：

```bash
node -e "console.log([1,2,3,4].map(() => require('crypto').randomBytes(16).toString('base64')).join(','))"
```

## 备份策略：至少三层

数据是最珍贵的东西。Strapi 项目的备份应该至少分三层：

**1. 数据库快照**
- 频率：每日；
- 方式：pg_dump 或云数据库自带的 snapshot；
- 保留：7 天每日 + 4 周每周 + 12 个月每月。

```bash
# crontab: 每天 3:00 跑
0 3 * * * pg_dump -h ... -U ... strapi | gzip > /backups/strapi-$(date +\%F).sql.gz
```

**2. 媒体文件备份**
- 频率：每周；
- 方式：S3 sync 或 rsync 到独立位置；
- 保留：至少 3 个月。

如果你已经用 S3 作为媒体存储，开启 S3 自带的"对象版本控制"也是一种轻量备份。

**3. 完整 strapi export**
- 频率：每月或每次重大变更前；
- 方式：`pnpm strapi export --file ...`；
- 保留：至少 1 年。

这种逻辑级备份独立于数据库格式，是最后的兜底。

## 升级 Strapi 版本

Strapi 升级（如 5.1 → 5.2）一般是平滑的：

```bash
pnpm update @strapi/strapi @strapi/plugin-users-permissions
pnpm install
pnpm develop
```

主版本升级（如 4.x → 5.x）需要专门的 migration guide——这是为什么本系列把版本明确写成 "Strapi 5"。每次主版本升级前必须：

1. **备份完整数据库 + 媒体**；
2. **在测试环境跑通迁移**；
3. **阅读官方 migration guide 的每一段**；
4. **生产升级时留出回滚时间**。

## 监控与告警

生产 Strapi 至少应该监控：

- **HTTP 错误率**（5xx 数量）；
- **数据库连接池**（占满会让所有请求挂起）；
- **磁盘空间**（媒体存储满了会让上传失败）；
- **CPU / 内存**（OOM 会让进程被 kill）。

工具选型可以是 Prometheus + Grafana、Datadog、New Relic 或简单的 UptimeRobot。

Strapi 默认有 `/api/health` 健康检查 endpoint，可以让监控工具每分钟探测：

```bash
GET /api/health
# 返回 204 No Content 即健康
```

## 本章小结

把一个 Strapi 项目推上生产并稳定运行，需要：PostgreSQL 取代 SQLite、合理的部署平台、强随机的环境变量、至少三层备份、监控与告警。这些工作大多是一次性投入，但任何一项缺失都可能导致严重事故。

至此本系列五章完结。从概览到 Content Type 设计、到权限、到关系与媒体、到生产部署——你已经具备搭一个生产级 Strapi 项目的能力。希望它能在你下一个 Headless 项目里省掉大量"踩坑 - 重试"的时间。

## 一份上线前的 checklist

最后留一份运维上线前 checklist：

1. 数据库已切换为 PostgreSQL；
2. 所有 secret 均为强随机值，没有用默认；
3. `.env.production` 不进 Git；
4. 媒体存储已切到 S3 / 对象存储；
5. 自动备份脚本已配置并跑过至少一次；
6. 健康检查端点已被监控系统接入；
7. SSL 证书已配置（Let's Encrypt 或 CDN 自带）；
8. Admin 入口（/admin）做了 IP 白名单或额外认证；
9. 至少两位团队成员有 Super Admin 账号（避免单点）；
10. Migration guide 与回滚计划已写好。

每一条都值得花 30 分钟落实。这十条 checklist 走完，你的 Strapi 上线就处于"可信"的状态了。
