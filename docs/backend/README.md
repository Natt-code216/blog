# 个人博客网站 - React + TypeScript + Vite

一个极简深色风格的个人博客/作品集网站，使用现代化前端技术栈构建。

## 🌟 特性

- **极简设计**: 深色主题，克制的视觉语言
- **响应式布局**: 在各种设备上都有良好表现
- **流畅动画**:
  - 滚动揭示动画 (Scroll Reveal)
  - 导航栏滚动透明度变化
  - 卡片/按钮悬停效果
- **类型安全**: 使用 TypeScript 构建
- **高性能**: 基于 Vite 的快速开发与构建

## 📂 项目结构

```
blog/
├── index.html              # HTML 入口
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript 配置
├── vite.config.ts          # Vite 配置
├── src/
│   ├── main.tsx            # 应用入口
│   ├── App.tsx             # 根组件
│   ├── App.css             # 全局样式
│   ├── components/
│   │   ├── Navbar/         # 导航栏组件
│   │   ├── Hero/           # 首页 Hero
│   │   ├── Essays/         # 随笔板块
│   │   ├── Tutorials/      # 教程板块
│   │   ├── Tools/          # 工具集板块
│   │   ├── Footer/         # 页脚组件
│   │   └── ScrollReveal/   # 滚动动画包装组件
│   ├── hooks/
│   │   ├── useScrollSpy.ts       # 导航高亮逻辑
│   │   └── useIntersectionObserver.ts  # 滚动揭示动画
│   └── types/
│       └── index.ts        # 类型定义
└── blog.html               # 原始 HTML (保留)
```

## 🎨 设计风格

- **字体**:
  - 标题: Playfair Display (优雅衬线)
  - 正文: Inter (现代无衬线)
- **配色方案**:
  - 背景: #050505 (深色)
  - 文字: #fcfcfc (浅色)
  - 边框: rgba(255, 255, 255, 0.08)
- **布局**:
  - 最大宽度: 1200px
  - 固定导航栏: 80px
  - 响应式网格系统

## 🛠️ 技术栈

- **React 18**: UI 组件框架
- **TypeScript 5**: 静态类型检查
- **Vite 5**: 构建工具
- **CSS**: 原生 CSS (CSS Modules + Global CSS)
- **Google Fonts**: 字体加载

## 🚀 开发指南

### 前置要求

- Node.js 18+
- pnpm (推荐) 或 npm

### 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 启动开发服务器

```bash
# 使用 pnpm
pnpm dev

# 或使用 npm
npm run dev
```

开发服务器将运行在 `http://localhost:5173`

### 构建生产版本

```bash
# 使用 pnpm
pnpm build

# 或使用 npm
npm run build
```

构建产物将输出到 `dist/` 目录

### 预览生产构建

```bash
# 使用 pnpm
pnpm preview

# 或使用 npm
npm run preview
```

## 📦 项目命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm preview` | 预览生产构建 |
| `pnpm lint` | 代码检查 (如有配置) |

## 🌐 页面结构

1. **首页 (Hero)**: 个人简介与导航入口
2. **随笔板块**: 三列卡片网格，展示思考与感悟
3. **教程板块**: 列表视图，展示系统化学习内容
4. **工具集板块**: 玻璃态网格，展示实用工具
5. **页脚**: 社交链接与版权信息

## 🎯 自定义

### 修改内容

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

## 📝 类型定义

项目使用 TypeScript，所有类型定义在 `src/types/index.ts`：

- `Essay`: 随笔数据类型
- `Tutorial`: 教程数据类型
- `Tool`: 工具数据类型
- `NavItem`: 导航项类型

## 🔄 迁移说明

本项目从单文件 HTML (`blog.html`) 重构为 React + TypeScript + Vite 架构：

**保持不变**:
- 所有视觉效果和动画
- 响应式布局
- 字体和配色方案
- 交互逻辑

**改进**:
- 组件化结构
- 类型安全性
- 开发体验 (HMR)
- 代码可维护性

## 📄 许可证

本项目仅供个人使用。

## 👨‍💻 开发者

- **设计灵感**: 极简深色风格
- **技术选型**: React + TypeScript + Vite
- **字体**: Playfair Display + Inter (Google Fonts)

---

**© 2025 Crafted with intention. All rights reserved.**
