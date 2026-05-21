# 部署文档

本项目由两部分组成：

- **前端**：根目录的 React + Vite 应用，产出静态资源，可部署到任意静态托管平台。
- **后端**：`backend/` 目录的 Strapi 应用，需要 Node 运行时与数据库。

## 推荐组合

| 场景 | 前端 | 后端 |
| --- | --- | --- |
| 快速上线 | Vercel | Railway |
| 国际访问 | Netlify | Render |
| 自建 | Nginx + 静态文件 | Docker + Postgres |

## 文档索引

- 前端部署
  - [部署到 Vercel](./frontend-vercel.md)
  - [部署到 Netlify](./frontend-netlify.md)
- 后端部署
  - [部署到 Railway](./backend-railway.md)
  - [部署到 Render](./backend-render.md)

## 通用注意事项

1. 前端通过 `VITE_API_URL` 指向后端 API，构建时需注入此环境变量。
2. 后端生产环境**必须**使用 Postgres / MySQL，不要使用默认的 SQLite。
3. Strapi 的 `APP_KEYS`、`API_TOKEN_SALT`、`ADMIN_JWT_SECRET`、`JWT_SECRET`、`TRANSFER_TOKEN_SALT` 等密钥必须重新生成，不要复用开发环境的值。
4. 上传文件使用对象存储（S3 / Cloudinary / R2），不要依赖容器本地磁盘。
5. 后端 CORS 中需要加入前端的正式域名。
