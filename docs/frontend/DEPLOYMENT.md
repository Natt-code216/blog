# 🌐 部署指南

本文档将指导您如何部署本项目。

## 目录

- [前端部署](#前端部署)
- [后端部署](#后端部署)
- [域名配置](#域名配置)
- [环境变量](#环境变量)
- [CI/CD](#cicd)

---

## 前端部署

### 构建生产版本

```bash
pnpm build
```

构建产物将输出到 `dist/` 目录

### 部署到 Vercel (推荐)

1. 安装 Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. 登录:
   ```bash
   vercel login
   ```

3. 部署:
   ```bash
   vercel
   ```

4. 生产部署:
   ```bash
   vercel --prod
   ```

### 部署到 Netlify

1. 拖拽 `dist/` 目录到 Netlify
2. 或使用 Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify deploy
   ```

### 部署到 GitHub Pages

1. 安装 `gh-pages`:
   ```bash
   npm install --save-dev gh-pages
   ```

2. 在 `package.json` 中添加脚本:
   ```json
   {
     "scripts": {
       "deploy": "pnpm build && gh-pages -d dist"
     }
   }
   ```

3. 部署:
   ```bash
   pnpm deploy
   ```

---

## 后端部署

### 构建管理面板

```bash
cd backend
pnpm build
```

### 部署到 Railway

1. 安装 Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. 登录:
   ```bash
   railway login
   ```

3. 初始化项目:
   ```bash
   railway init
   ```

4. 部署:
   ```bash
   railway up
   ```

### 部署到 Heroku

1. 安装 Heroku CLI
2. 登录:
   ```bash
   heroku login
   ```

3. 创建应用:
   ```bash
   heroku create your-app-name
   ```

4. 部署:
   ```bash
   git push heroku main
   ```

### 部署到 DigitalOcean App Platform

1. 创建 App Platform 应用
2. 连接 GitHub 仓库
3. 配置环境变量
4. 部署

---

## 域名配置

### 配置自定义域名

1. 购买域名 (如 Namecheap, GoDaddy)
2. 在 DNS 服务商添加 CNAME 记录
3. 在部署平台配置自定义域名

### SSL 证书

大多数平台 (Vercel, Netlify, Railway) 自动提供 SSL 证书。

手动配置:
```bash
# 使用 Let's Encrypt
certbot certonly --manual -d yourdomain.com
```

---

## 环境变量

### 前端环境变量

创建 `.env.production` 文件:

```env
VITE_API_URL=https://your-api-domain.com
VITE_APP_NAME=My Blog
```

在代码中使用:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

### 后端环境变量

创建 `backend/.env.production` 文件:

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_NAME=your-db-name
DATABASE_USERNAME=your-username
DATABASE_PASSWORD=your-password

JWT_SECRET=your-jwt-secret
API_TOKEN_SALT=your-api-token-salt

ADMIN_JWT_SECRET=your-admin-jwt-secret
```

---

## CI/CD

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Deploy to Vercel
        run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

### GitLab CI/CD

创建 `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - deploy

build:
  stage: build
  script:
    - pnpm install
    - pnpm build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  script:
    - vercel --prod --token $VERCEL_TOKEN
```

---

## 性能优化

### 前端优化

1. **代码分割**:
   - Vite 自动处理

2. **图片优化**:
   ```bash
   npm install vite-plugin-imagemin
   ```

3. **懒加载**:
   ```typescript
   const Essays = lazy(() => import('./components/Essays'))
   ```

### 后端优化

1. **数据库索引**:
   - 为常用查询字段添加索引

2. **缓存**:
   ```bash
   npm install @strapi/plugin-cache
   ```

3. **CDN**:
   - 使用 Cloudflare 或 AWS CloudFront

---

## 监控和日志

### 前端监控

- **Sentry**: 错误追踪
- **Google Analytics**: 访问统计
- **Plausible**: 轻量级分析

### 后端监控

- **Strapi Admin**: 内置日志
- **PM2**: 进程管理
- **New Relic**: 性能监控

---

## 待完善

- [ ] 添加更多部署平台示例
- [ ] 添加详细的环境变量说明
- [ ] 添加数据库迁移指南
- [ ] 添加备份和恢复指南

---

**© 2026 部署指南**
