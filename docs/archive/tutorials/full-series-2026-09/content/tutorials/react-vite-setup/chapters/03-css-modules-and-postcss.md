---
order: 3
title: CSS Module 与 PostCSS
est_read_minutes: 12
---

# CSS Module 与 PostCSS

样式方案是 React 生态里最分裂的话题。CSS-in-JS、CSS Module、Tailwind、Sass、vanilla-extract、unocss——每个阵营都有大量信徒。本章不打架，只回答："如果你不想为这件事多想"，应该用什么？

我的答案是：**CSS Module + PostCSS**。

本章解释为什么，以及怎么配置。

## CSS Module 的核心承诺

CSS Module 做了一件极其朴素的事——给每个 CSS 类名加一个**模块级前缀**，让它在全局空间里不再可能重名。

```css
/* Card.module.css */
.card {
  padding: 16px;
  border-radius: 8px;
}
```

```tsx
// Card.tsx
import styles from './Card.module.css';

export function Card({ children }: { children: React.ReactNode }) {
  return <div className={styles.card}>{children}</div>;
}
```

在浏览器里，最终的 class 名会变成类似 `Card_card__a3f7b`。这意味着：

- 不会和别的组件的 `.card` 冲突；
- 一目了然能看出 class 来自哪个模块；
- 删掉 Card.module.css 后 grep `Card_card` 能找到所有引用。

## 为什么不是 CSS-in-JS

CSS-in-JS（styled-components、Emotion）在 2018–2022 年是主流，但 2023 年之后社区开始降温。原因：

1. **运行时成本**：每次渲染都要计算样式字符串、注入 stylesheet，对性能影响 5–10%；
2. **SSR 复杂度**：需要 stylesheet 收集、注水，配置非平凡；
3. **样式与组件强绑定**：UI 改版时整组件文件都要重写。

对**性能敏感**或**预算紧张**的项目，CSS-in-JS 不再是默认选择。

如果你确实想要 CSS-in-JS 的 DX 又不要运行时，可以用 vanilla-extract / Pigment CSS——它们在构建时完成样式生成，运行时零成本。但配置稍复杂，新项目不推荐第一选。

## 为什么不是 Tailwind

Tailwind 在 2024 年依然非常流行，且性能优秀。如果你团队已经认同它，那它是好选择。

但 Tailwind 的代价是：

1. **学习曲线**：要记一套自己的 utility 命名；
2. **JSX 嘈杂**：`<div className="flex items-center justify-between p-4 rounded-lg ...">` 这种行宽 200 字符的 className 在团队中接受度参差不齐；
3. **不易抽象**：相同的视觉模式要复制粘贴，除非引入 `@apply` 或组件抽象。

如果你不确定团队接受度，CSS Module 是更稳的起点。后续若决定换 Tailwind，迁移成本不高。

## 为什么是 CSS Module

CSS Module 的优势是：

1. **零运行时成本**：构建时已经处理完，浏览器看到的就是普通 CSS；
2. **学习成本几乎为零**：就是 CSS，唯一额外语法是 `:global` / `:local`；
3. **作用域天然隔离**：不会"我的 class 名被别人覆盖"；
4. **跨工具迁移容易**：Vite / Next.js / Remix / 任何打包工具都原生支持；
5. **与 PostCSS 完美配合**：可以用嵌套、变量、自动前缀等现代 CSS 特性。

## Vite 中启用 CSS Module

Vite 对 CSS Module **零配置**。只要文件名包含 `.module.css`，自动开启。

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      // 可选：定义生成 class 名的格式
      generateScopedName: '[name]_[local]_[hash:base64:5]',
      // 默认 camelCase 化（这样可以 styles.cardWrap 而不是 styles['card-wrap']）
      localsConvention: 'camelCaseOnly',
    },
  },
});
```

`generateScopedName` 让 class 名既独特又可读。在 DevTools 里能立刻看到这个 class 来自哪个文件。

## PostCSS：现代 CSS 的标准前置

PostCSS 不是另一种语言，它是一个**插件管道**——让你用现代 CSS 写代码、由它把不兼容的部分转换成兼容的 CSS。

最值得配的几个插件：

```js
// postcss.config.js
export default {
  plugins: {
    'postcss-preset-env': {
      stage: 2,
      features: {
        'nesting-rules': true,         // CSS 原生嵌套
        'custom-media-queries': true,
        'oklch-function': true,
      },
    },
    autoprefixer: {},   // 自动加供应商前缀
  },
};
```

`postcss-preset-env` 是一个超级 polyfill——它让你用最新草案中的 CSS 特性，自动降级为旧浏览器可识别的写法。

## CSS 嵌套：原生支持后的写法

CSS 原生嵌套是 2023 年加入标准的特性，所有现代浏览器支持。它让样式不再需要 Sass 这种额外工具：

```css
/* Card.module.css */
.card {
  padding: 16px;
  border-radius: 8px;

  &:hover {
    background: var(--color-bg-hover);
  }

  .title {
    font-weight: 700;
  }

  @media (min-width: 768px) {
    padding: 24px;
  }
}
```

这一段在所有 2024 年之后的浏览器里原生工作。在更老的浏览器里，PostCSS 会自动把它降级成传统的非嵌套写法。

## 自定义属性（CSS 变量）作为 token

CSS 变量是 token 系统的天然载体：

```css
/* tokens.css */
:root {
  --color-bg: #050505;
  --color-text: #fcfcfc;
  --space-md: 16px;
  --space-lg: 24px;
}
```

```css
/* Card.module.css */
.card {
  padding: var(--space-md) var(--space-lg);
  background: var(--color-bg);
  color: var(--color-text);
}
```

主题切换只需要在某个外层加 `data-theme="dark"`，重新定义这些变量——整个 UI 自动跟随，无需任何 JS。这是 CSS-in-JS 做不到的简洁。

## 全局样式与重置

`src/styles/reset.css` 放一份现代化的重置，例如基于 modern-normalize：

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; padding: 0; }
html { font-size: 16px; line-height: 1.5; -webkit-text-size-adjust: 100%; }
body { font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
```

把它在 main.tsx 顶部统一导入：

```tsx
// src/main.tsx
import '@/styles/reset.css';
import '@/styles/tokens.css';
import '@/styles/global.css';

import { createRoot } from 'react-dom/client';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<App />);
```

## 暗色主题切换

把所有 token 在 `[data-theme="dark"]` 下重新定义：

```css
:root {
  --color-bg: #fafafa;
  --color-text: #171717;
}

[data-theme="dark"] {
  --color-bg: #0a0a0a;
  --color-text: #fafafa;
}
```

JS 端切换：

```ts
function setTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);
}
```

整套主题切换 30 行代码。

## 本章小结

CSS Module + PostCSS 是 React + Vite 项目里最稳的样式方案：零运行时、几乎零学习成本、与现代 CSS 完美配合。配合 CSS 变量做 token、`[data-theme]` 做主题切换，能撑起绝大多数项目的视觉需求，不再需要任何额外样式库。

下一章是本系列最后一章：**构建与产物分析**。我们讨论生产构建该怎么配、bundle 怎么分析、性能预算怎么落到 CI。

## 几个常用的 PostCSS 插件

最后再补一份额外推荐的 PostCSS 插件清单，每一个都给项目带来明确价值：

- **postcss-import**：让 CSS 文件能用 `@import` 引用别的 CSS（构建时被内联，运行时无开销）；
- **postcss-custom-properties**：把 CSS 变量降级为旧浏览器能用的形式（如果你的目标用户里仍有旧 iOS）；
- **postcss-logical**：自动处理 LTR / RTL 的逻辑属性（margin-inline-start 等）；
- **cssnano**：生产环境压缩 CSS（默认 Vite 已经内置）。

按需引入。一份典型的中型项目，PostCSS 配置最终大约会有 4–6 个插件，能覆盖 99% 的现代 CSS 需求。
