# Strapi 后端集成指南

## 🎯 目标

为前端博客项目搭建 Strapi 后端，提供：
- ✅ 内容管理（随笔、教程、工具）
- ✅ 媒体管理（图片上传、媒体库）
- ✅ 用户交互（评论、点赞等）

## 📋 技术栈

- **Strapi v5**: 开源无头 CMS
- **SQLite**: 数据库（开发环境）
- **Node.js 24+**: 运行环境

## 🚀 手动初始化步骤

### 1. 创建后端项目

由于脚本创建遇到交互问题，请手动创建：

```bash
cd E:\Claude_code\blog

# 使用 npm 创建 Strapi 项目
npx create-strapi-app@latest backend --quickstart
```

执行后会提示：
- "Please log in or sign up" - 按 **↓ 键** 选择 **Skip**
- 等待依赖安装完成

### 2. 验证项目结构

创建成功后，检查 `backend` 目录：

```
backend/
├── src/
│   ├── admin/          # 管理面板配置
│   ├── api/            # 内容类型 API
│   ├── extensions/     # 扩展
│   ├── plugins/        # 插件
│   ├── services/       # 服务
│   ├── config/         # 配置
│   └── index.js        # 入口文件
├── public/             # 静态文件
├── package.json
├── .env                # 环境变量
└── README.md
```

### 3. 启动 Strapi 开发服务器

```bash
cd backend

# 第一次启动（自动初始化）
npm run develop

# 或使用 pnpm
pnpm develop
```

首次启动会提示创建管理员账户：
- Email: `admin@example.com`
- Password: 请设置安全密码
- 确认后自动打开管理面板

### 4. 访问管理面板

浏览器打开：`http://localhost:1337/admin`

## 🗂️ 内容类型设计

### 1. 随笔 (Essays)

在管理面板创建以下内容类型：

**字段定义**:
```
- category (Enum): 'ESSAY', 'THOUGHTS', 'LIFESTYLE'
- title (Text, required): 标题
- excerpt (Text): 摘要
- content (Rich Text): 完整内容
- date (Date, default: today): 发布日期
- featuredImage (Media - Single Image): 封面图
- slug (UID): URL 友好标识
- published (Boolean, default: true): 是否发布
```

**关系**:
- 与 **评论** (Comments) 一对多

### 2. 教程 (Tutorials)

```
- title (Text, required): 标题
- description (Text): 描述
- level (Enum): '初级', '中高级', '全阶段', '高阶'
- status (Enum): '更新中', '已完结'
- chapters (Integer): 章节数
- icon (Enumeration): 'code', 'layers', 'zap'
- content (Rich Text): 完整内容
- coverImage (Media - Single Image): 封面图
- slug (UID)
- published (Boolean)
```

### 3. 工具 (Tools)

```
- title (Text, required)
- description (Text)
- icon (Enumeration): 'barChart', 'droplet', 'fileText', 'search'
- url (URL): 工具链接
- coverImage (Media)
- slug (UID)
```

### 4. 评论 (Comments)

```
- authorName (Text): 评论者
- content (Text, required)
- email (Email, optional): 邮箱（用于通知）
- rating (Integer, 1-5): 评分
- approved (Boolean, default: false)
```

### 5. 关系配置

**Essays (随笔)** → 与 Comments (评论) 一对多
**Tutorials (教程)** → 与 Comments 一对多

## 🌐 API 端点设计

### 随笔相关

```bash
# 获取所有随笔（公开）
GET http://localhost:1337/api/essays?populate=featuredImage

# 按分类筛选
GET http://localhost:1337/api/essays?filters[category][$eq]=ESSAY

# 获取单个随笔
GET http://localhost:1337/api/essays/{slug}

# 创建评论
POST http://localhost:1337/api/comments
{
  "data": {
    "content": "很好的文章",
    "authorName": "Jack",
    "essay": 1  # 关联的随笔 ID
  }
}
```

### 教程相关

```bash
# 获取所有教程
GET http://localhost:1337/api/tutorials?populate=coverImage

# 按状态筛选
GET http://localhost:1337/api/tutorials?filters[status][$eq]=已完结

# 按难度筛选
GET http://localhost:1337/api/tutorials?filters[level][$eq]=中高级
```

### 工具相关

```bash
# 获取所有工具
GET http://localhost:1337/api/tools?populate=coverImage
```

### 评论相关

```bash
# 获取某随笔的所有评论
GET http://localhost:1337/api/comments?filters[essay][slug][$eq]=my-essay-slug

# 获取某教程的所有评论
GET http://localhost:1337/api/comments?filters[tutorial][slug][$eq]=my-tutorial-slug
```

## 🔐 权限配置

### 公开权限（无需认证）

1. 进入 **Settings → Users & Permissions Plugin → Roles**
2. 点击 **Public** 角色
3. 配置以下权限：

**Essays**:
- ✅ Find
- ✅ Find one

**Tutorials**:
- ✅ Find
- ✅ Find one

**Tools**:
- ✅ Find

**Comments**:
- ✅ Find
- ✅ Create (允许游客评论)

### 认证权限（管理员）

**Authenticated** 角色可配置更多权限，如更新、删除等。

## 📦 媒体配置

### 上传设置

1. **Settings → Media Library**
2. 配置文件大小限制（建议 10MB）
3. 允许的文件类型：images, pdf, etc.

### 图片优化

安装图片优化插件（可选）：

```bash
cd backend
npm install @strapi/plugin-cloudinary
```

## 🔌 前端集成

### 1. 安装 Axios

在前端项目中安装 HTTP 客户端：

```bash
cd E:\Claude_code\blog
pnpm add axios
```

### 2. 创建 API 服务

创建 `src/services/api.ts`:

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:1337/api';

export const api = {
  // 随笔
  getEssays: () => axios.get(`${API_URL}/essays?populate=featuredImage`),
  getEssayBySlug: (slug: string) =>
    axios.get(`${API_URL}/essays?filters[slug][$eq]=${slug}&populate=featuredImage,comments`),

  // 教程
  getTutorials: () => axios.get(`${API_URL}/tutorials?populate=coverImage`),
  getTutorialBySlug: (slug: string) =>
    axios.get(`${API_URL}/tutorials?filters[slug][$eq]=${slug}`),

  // 工具
  getTools: () => axios.get(`${API_URL}/tools?populate=coverImage`),

  // 评论
  getComments: (essayId?: number, tutorialId?: number) => {
    const filter = essayId
      ? `filters[essay][id][$eq]=${essayId}`
      : `filters[tutorial][id][$eq]=${tutorialId}`;
    return axios.get(`${API_URL}/comments?${filter}`);
  },
  createComment: (data: any) => axios.post(`${API_URL}/comments`, { data }),
};
```

### 3. 使用示例

在 `src/components/Essays/index.tsx` 中：

```typescript
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import type { Essay } from '../../types';

export function Essays() {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEssays()
      .then(response => {
        setEssays(response.data.data.map((item: any) => ({
          id: item.id,
          category: item.attributes.category,
          date: item.attributes.date,
          title: item.attributes.title,
          excerpt: item.attributes.excerpt,
          link: `/essays/${item.attributes.slug}`,
        })));
        setLoading(false);
      })
      .catch(error => {
        console.error('获取随笔失败:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>加载中...</div>;

  return (
    <section id="essays" className={styles.section}>
      <div className="container">
        {/* ... */}
        <div className={styles.essaysGrid}>
          {essays.map((essay) => (
            <ScrollReveal key={essay.id}>
              <EssayCard essay={essay} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

## 🧪 测试 API

### 使用 cURL 测试

```bash
# 获取所有随笔
curl http://localhost:1337/api/essays

# 获取所有教程
curl http://localhost:1337/api/tutorials

# 创建评论
curl -X POST http://localhost:1337/api/comments \
  -H "Content-Type: application/json" \
  -d '{"data":{"content":"测试评论","authorName":"Test","essay":1}}'
```

### 使用 Postman/Thunder Client

1. 打开 VS Code 的 Thunder Client 扩展
2. 创建新请求
3. 测试各个端点

## 📦 部署准备

### 环境变量配置

创建 `.env` 文件：

```env
NODE_ENV=production
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=./data.db
ADMIN_JWT_SECRET=your-secret-key-change-this
API_TOKEN_SALT=your-api-token-salt
APP_KEYS=your-app-keys
```

### 构建生产版本

```bash
cd backend
npm run build
npm run start
```

## 🚨 常见问题

### Q1: 无法创建项目

**问题**: `create-strapi-app` 提示认证错误

**解决**: 手动执行命令并按 ↓ 选择 Skip

### Q2: 端口冲突

**问题**: 1337 端口被占用

**解决**: 修改 `backend/config/server.js`:

```javascript
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 3000), // 改为 3000
});
```

### Q3: CORS 错误

**问题**: 前端请求被阻止

**解决**: 配置 CORS:

```javascript
// backend/config/middlewares.js
module.exports = [
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

然后在 `backend/config/middlewares.js` 确保 CORS 配置正确。

## 📚 参考资源

- [Strapi 官方文档](https://docs.strapi.io/)
- [Strapi v5 迁移指南](https://docs.strapi.io/dev-docs/migration/v4-to-v5)
- [内容类型构建器](https://docs.strapi.io/user-docs/content-manager)

## ✅ 检查清单

- [ ] 后端项目创建成功
- [ ] Strapi 服务器启动成功
- [ ] 管理员账户创建完成
- [ ] 内容类型创建完成
- [ ] 权限配置正确
- [ ] 媒体库配置完成
- [ ] 前端可以成功获取数据
- [ ] 评论功能测试通过

---

**下一步**: 完成后端搭建后，更新前端代码从 Strapi API 读取数据，而不是硬编码的内容。
