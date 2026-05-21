# 前端部署到 Vercel

## 前置条件

- 代码已推送到 GitHub / GitLab / Bitbucket
- 已有可访问的后端 API（参考 [backend-railway.md](./backend-railway.md) 或 [backend-render.md](./backend-render.md)）
- 根目录已存在 `vercel.json`

## 步骤

### 1. 导入项目

1. 登录 [Vercel](https://vercel.com)，点击 **Add New → Project**。
2. 选择本仓库，点击 **Import**。
3. Framework Preset 会自动识别为 **Vite**（因为 `vercel.json` 已声明）。
4. Root Directory 保持为仓库根目录。

### 2. 构建设置

`vercel.json` 已经配置好以下内容，无需在 UI 改动：

```json
{
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

如果 Vercel 默认使用 npm，可以在 **Settings → General → Node.js Version** 选择 20.x，并在 **Build & Development Settings** 中确认 `installCommand` 已被 `vercel.json` 覆盖。

### 3. 环境变量

在 **Settings → Environment Variables** 添加：

| Key | Value | 环境 |
| --- | --- | --- |
| `VITE_API_URL` | `https://your-strapi.example.com` | Production / Preview |

> Vite 只会注入以 `VITE_` 开头的变量到客户端。改完环境变量后必须 **Redeploy** 才生效。

### 4. 部署

点击 **Deploy**。首次构建完成后，Vercel 会分配 `*.vercel.app` 域名。后续 push 到 `main` 会触发生产部署，PR 会触发 Preview 部署。

### 5. 自定义域名

1. 进入 **Settings → Domains**。
2. 添加你的域名（如 `blog.example.com`）。
3. 按提示在 DNS 服务商添加 `CNAME` 记录指向 `cname.vercel-dns.com`，或 `A` 记录指向 `76.76.21.21`。
4. Vercel 自动签发并续期 Let's Encrypt 证书。

### 6. 验证

```bash
curl -I https://your-domain.example.com
# 应返回 200，且响应头包含 x-vercel-id
```

## 常见问题

- **路由 404**：检查 `vercel.json` 中的 `rewrites` 是否生效，SPA 必须回退到 `/index.html`。
- **API 跨域**：在 Strapi 的 `config/middlewares.ts` 的 `strapi::cors` 配置中加入你的 Vercel 域名。
- **pnpm 找不到**：确保 `package.json` 中没有锁死 `npm` 的 `packageManager` 字段，或在 Vercel UI 切换 Install Command。
