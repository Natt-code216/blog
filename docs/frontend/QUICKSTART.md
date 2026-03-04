# 🌟 前端快速开始

本文档将帮助您快速了解和使用本项目的前端部分。

## 🎯 快速启动

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发服务器

```bash
pnpm dev
```

浏览器将自动打开 `http://localhost:5173`

### 3. 访问项目

打开浏览器访问: `http://localhost:5173`

---

## 📂 前端项目结构

```
src/
├── main.tsx              # 应用入口
├── App.tsx               # 根组件
├── App.css               # 全局样式
├── components/           # 组件目录
│   ├── Navbar/           # 导航栏组件
│   ├── Hero/             # 首页 Hero
│   ├── Essays/           # 随笔板块
│   ├── Tutorials/        # 教程板块
│   ├── Tools/            # 工具集板块
│   ├── Footer/           # 页脚组件
│   └── ScrollReveal/     # 滚动动画包装组件
├── hooks/                # React Hooks
│   ├── useScrollSpy.ts           # 导航高亮逻辑
│   └── useIntersectionObserver.ts # 滚动揭示动画
├── services/             # API 服务
│   └── api.ts            # API 请求封装
├── types/                # TypeScript 类型定义
└── utils/                # 工具函数
```

---

## 🛠️ 开发指南

### 修改内容数据

所有内容数据都在各个组件文件中定义：

- **随笔**: `src/components/Essays/index.tsx`
- **教程**: `src/components/Tutorials/index.tsx`
- **工具**: `src/components/Tools/index.tsx`
- **导航**: `src/components/Navbar/index.tsx`
- **页脚**: `src/components/Footer/index.tsx`

### 修改样式

- **全局样式**: `src/App.css`
- **组件样式**: 对应的 `.module.css` 文件
- **颜色变量**: 在 `:root` 中定义的 CSS 变量

### 修改导航高亮

滚动高亮逻辑在 `src/hooks/useScrollSpy.ts` 中，可通过修改 `offset` 参数调整触发位置。

---

## 🔌 后端集成

前端通过 REST API 从 Strapi 后端获取内容数据。

### API 服务

API 服务位于 `src/services/api.ts`，封装了所有数据请求。

### 数据获取

- **随笔**: `GET /api/essays`
- **教程**: `GET /api/tutorials`
- **工具**: `GET /api/tools`

### 示例代码

```typescript
import api from '../services/api';

// 获取随笔数据
const essays = await api.getEssays();

// 获取教程数据
const tutorials = await api.getTutorials();

// 获取工具数据
const tools = await api.getTools();
```

详细集成代码请参考: [后端集成指南](../backend/FRONTEND_INTEGRATION.md)

---

## 🎨 样式定制

### 字体

- **标题**: Playfair Display (优雅衬线)
- **正文**: Inter (现代无衬线)

### 配色方案

- **背景**: `#050505` (深色)
- **文字**: `#fcfcfc` (浅色)
- **边框**: `rgba(255, 255, 255, 0.08)`

### 布局

- **最大宽度**: 1200px
- **固定导航栏**: 80px
- **响应式网格系统**

---

## 📦 项目命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm preview` | 预览生产构建 |

---

## 🌐 部署

### 构建生产版本

```bash
pnpm build
```

构建产物将输出到 `dist/` 目录

### 部署到静态托管

可部署到以下平台：

- **Vercel** (推荐)
- **Netlify**
- **GitHub Pages**
- **Cloudflare Pages**

---

## 📝 类型定义

项目使用 TypeScript，所有类型定义在 `src/types/index.ts`：

- `Essay`: 随笔数据类型
- `Tutorial`: 教程数据类型
- `Tool`: 工具数据类型
- `NavItem`: 导航项类型

---

## 🔧 配置文件

- **TypeScript 配置**: `tsconfig.json`
- **Vite 配置**: `vite.config.ts`
- **Package 配置**: `package.json`

---

## 📚 更多文档

- [项目总览](../../README.md)
- [后端快速开始](../backend/快速开始指南.md)
- [后端完整搭建](../backend/01-完整搭建指南.md)
- [组件说明](./COMPONENTS.md) (待完善)

---

**© 2026 前端开发文档**
