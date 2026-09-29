# 前端快速开始

在仓库根目录执行命令。推荐 Node.js 24，包管理器固定 `pnpm@10.34.6`；使用 nvm 时先执行 `nvm install`、`nvm use`，确认本地版本。

## 安装与启动

```bash
pnpm install --frozen-lockfile
# 首次配置时执行；已有 .env.local 时编辑原文件
cp .env.example .env.local
pnpm dev
```

开发地址以终端为准，通常为 `http://localhost:5173`。一个服务提供首页、详情和全部工具：

- 主站：`/`
- 工具目录：`/mini-tools/index.html`
- 例如 JSON 工具：`/mini-tools/json-formatter.html`

工具源 HTML 引用 npm 模块，必须通过 Vite 开发或构建，不能双击 HTML 使用。工具不依赖 CMS，也不从 CDN 加载处理库。

## 连接内容后台

`.env.local` 的公开 API 地址必须包含 `/api`：

```dotenv
VITE_API_URL=http://localhost:1337/api
```

首次设置后端：

```bash
npm ci --prefix backend
cp backend/.env.example backend/.env
# 按 backend/README.md 生成并填写密钥
pnpm backend:dev
```

已有后台配置时保留原密钥。进入 `http://localhost:1337/admin` 配置内容和读取权限，详见 [后端说明](../../backend/README.md)。前端只需要公开地址，不应写入管理令牌或后端密钥。

旧数据库尚未接回；启动空后台不会恢复历史文章。`content/` 里的 Markdown 是稿件，不会自动显示在首页。未连接后台时，文章区显示可重试的连接失败；API 成功返回空列表时才显示空内容。

## 验证与发布产物

```bash
pnpm typecheck
pnpm test:run
pnpm build
pnpm preview
```

`vite.config.ts` 收集根目录 `mini-tools/` 的 HTML，统一输出主站、工具页和依赖到 `dist/`。验证时访问预览服务的首页、工具目录、单工具及深层文章路径；切换主题后跨页面导航，检查手机尺寸。发布完整 `dist/`，不要只复制工具 HTML。

`pnpm check:ports` 用于手动诊断；`pnpm sitemap` 是需要 CMS 的独立步骤，不会随构建执行。生产环境变量与路由托管见 [部署说明](../deployment/README.md)。

下一步：[目录架构](../architecture/README.md) · [组件与页面](COMPONENTS.md) · [样式与主题](STYLING.md) · [工具开发](../tools/README.md)。
