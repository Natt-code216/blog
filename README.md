# 🌟 个人博客网站 - React + Strapi

一个现代化的个人博客/作品集网站，采用 React + TypeScript + Vite 前端技术栈和 Strapi 后端 CMS 系统构建。

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.2.2-007acc.svg)](https://www.typescriptlang.org/)
[![Strapi](https://img.shields.io/badge/strapi-latest-4945ff.svg)](https://strapi.io/)

## 🌈 特性

- **极简深色设计**: 深色主题，克制的视觉语言
- **响应式布局**: 在各种设备上都有良好表现
- **流畅动画**:
  - 滚动揭示动画 (Scroll Reveal)
  - 导航栏滚动透明度变化
  - 卡片/按钮悬停效果
- **类型安全**: 使用 TypeScript 构建
- **高性能**: 基于 Vite 的快速开发与构建
- **现代化架构**: React 18 + TypeScript + Strapi Headless CMS

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm (推荐) 或 npm
- [Strapi 后端已搭建](docs/backend/快速开始指南.md) (如需内容管理)

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 启动开发服务器

```bash
# 启动前端开发服务器
pnpm dev
```

开发服务器将运行在 `http://localhost:5173`

### 后端开发服务器

```bash
# 进入后端目录
cd backend

# 启动 Strapi 后端
pnpm develop
# 或
npm run develop
```

Strapi 后端将运行在 `http://localhost:1337/admin`

## 📂 项目结构

```
blog/
├── .gitignore              # Git 忽略文件
├── LICENSE                 # 项目许可证
├── README.md               # 项目总览文档
├── package.json            # 前端项目配置
├── pnpm-lock.yaml          # 依赖锁定文件
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 配置
├── index.html              # HTML 入口
├── src/                    # 前端源代码
│   ├── main.tsx            # 应用入口
│   ├── App.tsx             # 根组件
│   ├── App.css             # 全局样式
│   ├── components/         # 组件目录
│   │   ├── Navbar/         # 导航栏组件
│   │   ├── Hero/           # 首页 Hero
│   │   ├── Essays/         # 随笔板块
│   │   ├── Tutorials/      # 教程板块
│   │   ├── Tools/          # 工具集板块
│   │   ├── Footer/         # 页脚组件
│   │   └── ScrollReveal/   # 滚动动画包装组件
│   ├── hooks/              # React Hooks
│   ├── services/           # API 服务
│   ├── types/              # TypeScript 类型定义
│   └── utils/              # 工具函数
├── backend/                # Strapi 后端
│   ├── src/                # 后端源代码
│   ├── config/             # 配置文件
│   ├── public/             # 静态文件
│   └── package.json        # 后端项目配置
└── docs/                   # 项目文档
    ├── backend/            # 后端文档
    ├── frontend/           # 前端文档
    └── README.md           # 文档目录总览
```

## 🛠️ 项目命令

### 前端

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm preview` | 预览生产构建 |
| `npm run dev` | 使用 npm 启动开发服务器 |

### 后端 (进入 backend 目录)

| 命令 | 说明 |
|------|------|
| `pnpm develop` | 启动开发服务器 (带热重载) |
| `pnpm start` | 启动生产服务器 |
| `pnpm build` | 构建管理面板 |

## 📚 文档导航

### 后端相关

- [📚 后端文档目录](docs/backend/README.md)
  - [🚀 快速开始指南](docs/backend/快速开始指南.md)
  - [📖 完整搭建指南](docs/backend/01-完整搭建指南.md)
  - [🛠️ 后端设计说明](docs/backend/BACKEND_SETUP.md)
  - [🎯 内容类型配置](docs/backend/CONTENT_TYPE_SETUP.md)
  - [🔐 权限配置指南](docs/backend/PERMISSIONS_SETUP.md)
  - [🔌 前端集成示例](docs/backend/FRONTEND_INTEGRATION.md)

### 前端相关

- [✨ 前端快速开始](docs/frontend/QUICKSTART.md) (待完善)
- [📦 组件说明](docs/frontend/COMPONENTS.md) (待完善)

## 🎨 设计风格

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

## 🔄 开发流程

### 1. 前端开发

```bash
# 启动前端开发服务器
pnpm dev

# 在浏览器中访问 http://localhost:5173
```

### 2. 后端开发

```bash
# 进入后端目录
cd backend

# 启动 Strapi 后端
pnpm develop

# 在浏览器中访问 http://localhost:1337/admin
```

### 3. API 集成

前端通过 REST API 从 Strapi 后端获取内容数据。详见 [前端集成指南](docs/backend/FRONTEND_INTEGRATION.md)

## 🌐 部署

### 前端部署

构建生产版本并部署到静态托管服务 (如 Vercel, Netlify, GitHub Pages):

```bash
pnpm build
```

构建产物将输出到 `dist/` 目录

### 后端部署

Strapi 可以部署到多种云平台 (如 Railway, Heroku, AWS, DigitalOcean):

```bash
cd backend
pnpm build
pnpm start
```

详见 [Strapi 部署文档](https://docs.strapi.io/dev-docs/deployment)

## 📝 内容类型

项目包含 4 个主要内容类型：

1. **Essays (随笔)** - 8 个字段
2. **Tutorials (教程)** - 10 个字段
3. **Tools (工具集)** - 6 个字段
4. **Comments (评论)** - 7 个字段 + 关系

## 🛣️ 下一步

- [ ] 完善前端文档
- [ ] 添加单元测试
- [ ] 配置 CI/CD
- [ ] 添加博客文章管理功能
- [ ] 实现搜索功能
- [ ] 添加暗色/亮色主题切换

## 📄 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 👨‍💻 开发者

- **技术选型**: React + TypeScript + Vite + Strapi
- **字体**: Playfair Display + Inter (Google Fonts)
- **设计灵感**: 极简深色风格

---

**© 2026 Crafted with intention. All rights reserved.**
