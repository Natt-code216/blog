# Strapi 权限配置指南

## 🎯 配置目标

配置以下内容类型的公开访问权限:
- ✅ Essays (随笔) - 公开读取
- ✅ Tutorials (教程) - 公开读取
- ✅ Tools (工具集) - 公开读取
- ✅ Comments (评论) - 公开读取 + 创建

---

## 🔐 配置公开权限 (Public)

### 步骤 1: 进入权限设置

1. 登录管理面板: `http://localhost:1337/admin`
2. 点击左下角 **Settings** (设置图标)
3. 在左侧菜单找到 **Users & Permissions Plugin**
4. 点击 **Roles**

### 步骤 2: 配置 Public 角色

1. 点击 **Public** 角色
2. 你会看到所有可用的内容类型

### 步骤 3: 配置 Essays 权限

找到 **ESSAYS** 部分:

勾选以下权限:
- ✅ **find** - 获取所有随笔列表
- ✅ **findOne** - 获取单个随笔详情

**不要勾选**:
- ❌ create
- ❌ update
- ❌ delete

### 步骤 4: 配置 Tutorials 权限

找到 **TUTORIALS** 部分:

勾选以下权限:
- ✅ **find** - 获取所有教程列表
- ✅ **findOne** - 获取单个教程详情

**不要勾选**:
- ❌ create
- ❌ update
- ❌ delete

### 步骤 5: 配置 Tools 权限

找到 **TOOLS** 部分:

勾选以下权限:
- ✅ **find** - 获取所有工具列表
- ✅ **findOne** - 获取单个工具详情

**不要勾选**:
- ❌ create
- ❌ update
- ❌ delete

### 步骤 6: 配置 Comments 权限

找到 **COMMENTS** 部分:

勾选以下权限:
- ✅ **find** - 获取评论列表
- ✅ **create** - 允许创建评论（游客可以评论）

**不要勾选**:
- ❌ update
- ❌ delete

### 步骤 7: 保存配置

1. 滚动到页面底部
2. 点击 **Save** 按钮
3. 看到 "Role updated successfully" 提示即成功

---

## 🔒 可选: 配置认证用户权限

如果需要登录用户有更多权限（如编辑自己的评论），可以配置 **Authenticated** 角色。

### 配置 Authenticated 角色

1. 在 **Roles** 页面点击 **Authenticated**
2. 根据需要配置权限
3. 例如可以允许:
   - 更新自己的评论
   - 删除自己的评论
4. 点击 **Save**

---

## 📸 媒体库权限配置

### 步骤 1: 配置公开访问

在 **Public** 角色设置中:

1. 找到 **UPLOAD** 部分
2. 取消所有勾选（不允许公开上传）
3. 点击 **Save**

### 步骤 2: 配置管理员上传权限

媒体上传权限默认只有管理员有，无需额外配置。

---

## 🧪 测试权限配置

### 测试 1: 获取随笔列表

打开浏览器访问:

```
http://localhost:1337/api/essays
```

**预期结果**:
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "title": "技术与人性的平衡",
        "category": "ESSAY",
        "excerpt": "...",
        "date": "2025-03-03",
        "published": true
      }
    }
  ]
}
```

如果看到数据，说明配置成功 ✅

### 测试 2: 获取教程列表

```
http://localhost:1337/api/tutorials
```

### 测试 3: 获取工具列表

```
http://localhost:1337/api/tools
```

### 测试 4: 创建评论（无需认证）

使用 cURL 或 Postman:

```bash
curl -X POST http://localhost:1337/api/comments \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "authorName": "测试用户",
      "content": "这是一条测试评论",
      "essay": 1
    }
  }'
```

**预期结果**:
```json
{
  "data": {
    "id": 1,
    "attributes": {
      "authorName": "测试用户",
      "content": "这是一条测试评论",
      "approved": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

如果创建成功，说明评论权限配置正确 ✅

---

## 🌐 跨域资源共享 (CORS) 配置

### 步骤 1: 编辑配置文件

打开文件: `backend/config/middlewares.js`

确保内容如下:

```javascript
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

### 步骤 2: 配置 CORS 详细设置

打开或创建文件: `backend/config/middlewares.js`

添加详细 CORS 配置:

```javascript
module.exports = [
  // ... 其他中间件
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      origin: ['http://localhost:5173', 'http://localhost:3000'], // 前端地址
    },
  },
  // ... 其他中间件
];
```

或者更简单的方式，在 `backend/config/server.js` 中:

```javascript
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
```

### 步骤 3: 重启服务器

```bash
# 在 backend 目录下
npm run develop
```

---

## 🖼️ 媒体库详细配置

### 步骤 1: 访问媒体库设置

1. **Settings** → **Media Library**
2. 配置以下选项:

### 步骤 2: 文件大小限制

- **Maximum file size**: `10` MB (建议)
- 这限制了上传文件的最大大小

### 步骤 3: 允许的文件类型

默认允许:
- ✅ Images (jpg, jpeg, png, gif, svg, webp)
- ✅ Videos (mp4, webm, etc.)
- ✅ Documents (pdf, doc, etc.)

### 步骤 4: 图片优化 (可选)

安装图片优化插件:

```bash
cd backend
npm install @strapi/plugin-cloudinary
```

然后在管理面板:
1. **Settings** → **Marketplace**
2. 搜索并安装 **Cloudinary**
3. 配置 Cloudinary API 密钥

---

## 🎨 高级权限配置

### 基于角色的内容过滤

可以创建自定义角色并配置特定权限:

1. **Settings** → **Users & Permissions Plugin** → **Roles**
2. 点击 **Add new role**
3. 输入角色名称 (如 "Editor")
4. 配置该角色的权限
5. 保存

### 字段级权限 (高级)

如需控制哪些字段可以被访问:

1. 编辑权限时点击某个内容类型
2. 会出现 **Advanced settings**
3. 可以配置:
   - 哪些字段可以读取
   - 哪些字段可以写入
   - 哪些字段被排除

---

## 🐛 常见问题排查

### 问题 1: 403 Forbidden 错误

**症状**: 访问 API 返回 403 错误

**解决**:
1. 检查 **Public** 角色是否配置了正确的权限
2. 确保勾选了 **find** 和 **findOne**
3. 重启 Strapi 服务器

### 问题 2: CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**解决**:
1. 检查 `middlewares.js` 中的 CORS 配置
2. 确保 `origin` 包含前端地址
3. 重启服务器

### 问题 3: 评论无法创建

**症状**: POST /comments 返回 403 错误

**解决**:
1. 检查 **Public** 角色的 Comments 权限
2. 确保勾选了 **create**
3. 检查请求体格式是否正确

### 问题 4: 图片无法上传

**症状**: 媒体库上传失败

**解决**:
1. 检查 `backend/public/uploads` 目录是否存在
2. 检查磁盘空间
3. 检查文件大小是否超过限制
4. 查看浏览器控制台的错误信息

---

## ✅ 配置检查清单

完成配置后，请检查:

- [ ] Public 角色已配置 Essays 的 find 和 findOne 权限
- [ ] Public 角色已配置 Tutorials 的 find 和 findOne 权限
- [ ] Public 角色已配置 Tools 的 find 和 findOne 权限
- [ ] Public 角色已配置 Comments 的 find 和 create 权限
- [ ] CORS 配置包含前端地址 (http://localhost:5173)
- [ ] 浏览器可以成功访问 /api/essays
- [ ] 浏览器可以成功访问 /api/tutorials
- [ ] 浏览器可以成功访问 /api/tools
- [ ] 可以成功创建评论 (无需认证)
- [ ] 媒体库可以上传图片

---

## 📚 下一步

权限配置完成后:

1. ✅ **测试所有 API 端点**
2. ✅ **集成前端代码** - 更新 React 组件从 API 读取数据
3. ✅ **创建真实内容** - 在管理面板添加实际的随笔、教程和工具

---

## 📖 参考资源

- [Strapi 权限文档](https://docs.strapi.io/dev-docs/configurations/roles-and-permissions)
- [CORS 配置](https://docs.strapi.io/dev-docs/configurations/middlewares)
- [用户认证指南](https://docs.strapi.io/dev-docs/authentication)

**配置完成后，您的 API 就可以被前端安全访问了！**
