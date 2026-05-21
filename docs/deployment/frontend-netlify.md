# 前端部署到 Netlify

## 前置条件

- 代码已推送到 Git 仓库
- 后端已部署并可公开访问
- 根目录已存在 `netlify.toml`

## 步骤

### 1. 创建站点

1. 登录 [Netlify](https://app.netlify.com)，点击 **Add new site → Import an existing project**。
2. 选择 Git 提供商并授权，选择本仓库。
3. Branch 选择 `main`。

### 2. 构建配置

`netlify.toml` 已声明：

```toml
[build]
  command = "pnpm build"
  publish = "dist"
```

Netlify 会自动识别。UI 中的 Build command / Publish directory 留空即可（以文件为准）。

### 3. 启用 pnpm

Netlify 默认使用 npm。需要让其识别 pnpm：

- 方法 A（推荐）：`netlify.toml` 已通过 `PNPM_VERSION` 环境变量声明。
- 方法 B：在 **Site settings → Build & deploy → Environment** 添加 `PNPM_VERSION = 8`。

如果构建报 `pnpm: command not found`，确认 Node 版本为 20（`NODE_VERSION = 20`，已在 `netlify.toml` 中声明），Netlify 自带 corepack 会激活 pnpm。

### 4. 环境变量

**Site settings → Environment variables** 添加：

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `https://your-strapi.example.com` |

修改后点击 **Trigger deploy → Clear cache and deploy site**。

### 5. SPA 路由

`netlify.toml` 中的 `[[redirects]]` 已经把所有路径回退到 `/index.html`，无需额外配置。

### 6. 自定义域名

1. **Domain management → Add custom domain**。
2. 在 DNS 服务商添加 `CNAME` 指向 `your-site.netlify.app`，或将 NS 托管给 Netlify。
3. 启用 **HTTPS**，Netlify 自动签发 Let's Encrypt 证书。

### 7. 部署预览

开启 **Deploy Previews**：每个 PR 会得到独立的预览链接，便于评审。

## 常见问题

- **构建超时**：免费版 15 分钟。可以在 Netlify UI 关闭无关插件或拆分构建。
- **路由 404**：确保 `netlify.toml` 中的 redirect 状态码是 `200`（rewrite，不是 301）。
- **环境变量未生效**：Vite 的 `import.meta.env.VITE_*` 在构建时被静态替换，改完需要重新构建。
