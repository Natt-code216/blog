# 教程一 · 从零搭建 React + Vite + TypeScript 项目

> 等级：A_level（入门）
> 章节：1 / 5
> 状态：A更新中

## 一、为什么选 Vite

回到 2020 年，Create React App（CRA）几乎是 React 项目的唯一起手式。但随着项目体积增长，CRA 在冷启动和热更新上的延迟变得难以忍受——一个中等规模的应用动辄 30 秒以上才能跑起来。

Vite 改变了这一切。它利用浏览器原生的 ESM 加载能力，把"打包"这个动作推迟到生产构建阶段，开发时几乎是秒级启动。本博客就采用 Vite + React 18 + TypeScript 这套组合。

## 二、初始化项目

```bash
# 使用官方模板
pnpm create vite@latest blog --template react-ts
cd blog
pnpm install
```

执行完后，目录结构是这样的：

```
blog/
├── index.html          # 入口 HTML（注意是放在根目录，不是 public/）
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx        # 应用入口
│   ├── App.tsx
│   └── ...
└── public/             # 静态资源（不会被处理）
```

值得注意：**`index.html` 在 Vite 中是项目入口**，而非 CRA 那样放在 `public/`。Vite 把它当作模块图的根节点处理。

## 三、配置 vite.config.ts

打开 `vite.config.ts`，可以做几件事：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
```

- `@` 别名：让 `import { Hero } from '@/components/Hero'` 这种写法生效
- `server.port`：固定开发端口
- `plugins: [react()]`：启用 React Fast Refresh

## 四、组件目录约定

我把组件按"一个文件夹一个组件"的方式组织：

```
src/components/Hero/
├── index.tsx           # 组件主文件
└── Hero.module.css     # CSS Module 样式
```

好处是：组件、样式、子组件、类型都在一起，重构时整个文件夹移动即可。

`index.tsx` 中导出命名组件而非 default，便于 IDE 自动补全：

```tsx
// 推荐
export function Hero() { ... }

// 不推荐
export default function Hero() { ... }
```

## 五、CSS Module 的选择

我没有用 Tailwind 也没有用 styled-components，而是用 CSS Module。原因有三：

1. **CSS 就是 CSS**：保留所有原生能力（伪类、@media、变量）
2. **类名局部作用域**：不用担心命名冲突
3. **TypeScript 支持**：`import styles from './X.module.css'`，`styles.foo` 有类型提示

代价是没有运行时主题切换的便利，但博客这种以排版为主的站点，CSS 变量已经足够。

## 六、字体与设计系统

在 `index.html` 中引入 Google Fonts：

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:wght@400;700&display=swap"
  rel="stylesheet"
/>
```

然后在 `App.css` 用 CSS 变量统一管理：

```css
:root {
  --font-serif: 'Playfair Display', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --bg: #050505;
  --text: #fcfcfc;
  --border: rgba(255, 255, 255, 0.08);
}
```

## 七、跑起来

```bash
pnpm dev
```

打开 `http://localhost:5173`，看到 Vite 默认页就成功了。

## 下一章

第二章我们会接入 Strapi 作为内容来源，把硬编码的数据换成真正的 API 数据。
