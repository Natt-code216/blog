---
order: 5
title: 模块边界与代码分割
est_read_minutes: 13
---

# 模块边界与代码分割

前面四章都在讨论"代码怎么组织"的逻辑层。这一章下沉到一个物理层的问题：**这些代码怎么打包、怎么分发**。

具体来说，一个中型前端项目（大约 100 个路由、500 个组件）打出来的 JS 总量，往往会达到 5–15 MB。如果不做任何分割，用户在打开任何一个页面时，都要先下载完整 15 MB——这意味着 4G 网络下要等 10–20 秒才能看到第一帧。

代码分割（code splitting）是解决这件事的核心手段。

## 第一种切分：按路由

最直接、收益最大的切分方式是按路由切。每一个路由对应一个独立的 chunk，用户访问哪个路由才下载哪个 chunk。

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const OrderPage = lazy(() => import('@/features/order/pages/OrderPage'));
const ProductPage = lazy(() => import('@/features/product/pages/ProductPage'));
const UserPage = lazy(() => import('@/features/user/pages/UserPage'));

export function App() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <Routes>
        <Route path="/orders" element={<OrderPage />} />
        <Route path="/products" element={<ProductPage />} />
        <Route path="/users" element={<UserPage />} />
      </Routes>
    </Suspense>
  );
}
```

这一段做的事：

- `lazy()` 包装的组件不会被打包进主 chunk；
- 第一次渲染到 `<OrderPage />` 时，浏览器才会去拉对应的 chunk；
- 在 chunk 加载期间，`Suspense` 的 fallback 会显示。

按路由切分通常能把首屏 JS 砍掉 60–80%。如果你的项目还没做这一步，这是回报率最高的一次改动。

## 第二种切分：按交互

有些组件不属于"页面"，但属于"次级交互"——只在用户点击某个按钮后才出现。这些应该按需加载。

典型例子：
- 富文本编辑器（5MB+ 的 monaco / codemirror）；
- 图表库（Chart.js / ECharts）；
- 复杂的弹窗（数据导出向导、批量操作弹窗）。

```tsx
const [showEditor, setShowEditor] = useState(false);
const RichEditor = useMemo(
  () => lazy(() => import('@/shared/components/RichEditor')),
  []
);

return (
  <>
    <button onClick={() => setShowEditor(true)}>编辑</button>
    {showEditor && (
      <Suspense fallback={<div>编辑器加载中...</div>}>
        <RichEditor />
      </Suspense>
    )}
  </>
);
```

这种"按交互切分"对首屏体验影响巨大——如果一个用户从来不点击"编辑"按钮，他就不会下载那 5MB 的编辑器代码。

## bundle 预算：让人发现失控

代码分割只是手段。真正决定项目长期健康度的是**预算意识**——首屏 JS 不超过多少、关键路径不超过多少 KB。

具体做法：在 CI 里加入 bundle 大小检查。

```js
// vite.config.ts 配合 rollup-plugin-visualizer + size-limit
// .size-limit.json
[
  {
    "name": "main bundle",
    "path": "dist/assets/index-*.js",
    "limit": "200 KB"
  },
  {
    "name": "vendor",
    "path": "dist/assets/vendor-*.js",
    "limit": "300 KB"
  }
]
```

如果某个 PR 让 main bundle 超过 200 KB，CI 直接挂。这种约束的好处是**让失控被立刻发现**——而不是半年后某次性能审计才意识到首屏 JS 已经膨胀到 2 MB。

没有预算的项目，bundle 一定会无声地膨胀。每一次"再引一个库吧，反正只大 30K"累积起来，半年就是 5 MB。

## 第三种切分：vendor 切分

第三方库（React、TanStack Query、lodash 等）和你自己的业务代码应该分到不同 chunk。

理由：第三方库**变得慢**——一周可能没有任何 npm 更新；而你的业务代码**变得快**——可能一天发好几次。如果它们打在同一个 chunk 里，每次业务发版用户都要重新下载整个第三方库，浪费缓存。

Vite + Rollup 的默认配置已经基本做到这一点，但你可以更细：

```js
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'data-vendor': ['@tanstack/react-query', 'axios'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

这把 vendor 进一步细分。粒度看团队偏好——但至少 React 自己一份、数据层一份、UI 库一份，这种分法的回报很稳。

## 警惕：切分粒度过细的代价

代码分割不是越细越好。

切分得太细，会出现两个问题：

1. **每个 chunk 都要发一个 HTTP 请求**，HTTP/1.1 下并发连接有限，HTTP/2 也有 head-of-line 阻塞。一个页面如果要拉 30 个 chunk，加载体验反而更差。
2. **chunk hash 缓存失效更频繁**——每次某个组件改一个字符，对应的 chunk hash 就变了，用户得重新下载。

一个比较稳的经验值：**单个路由切分出的 chunk 不超过 5 个，每个 chunk 至少 30 KB**。低于这个体积的内容应该合并到上层 chunk 里。

## prefetch 与 preload：把延迟藏起来

按路由切分之后，用户点击导航到新页面时会有一个加载延迟（虽然短，但能感知到）。这个延迟可以用 `<link rel="prefetch">` 在用户点击之前提前加载。

React Router 6.4+ 提供了 loader 机制，你也可以手工触发：

```tsx
<Link
  to="/orders"
  onMouseEnter={() => import('@/features/order/pages/OrderPage')}
>
  订单
</Link>
```

鼠标悬停在链接上的瞬间，对应的 chunk 就开始下载。等用户真的点击时，chunk 已经在本地了。这种"预测式预加载"非常有效，因为悬停到点击之间一般有 200–500ms 的间隔。

## 本章小结

代码分割不只是性能优化技巧，它本身也是一种**边界**——它把"哪些代码必须同时被加载"这件事，从隐式约定变成了显式的 chunk 边界。一旦这个边界画好，性能预算就有了可执行的载体，bundle 失控也就有了可被工具发现的早期信号。

下一章是这个系列的收尾：**架构演进与重构信号**。我们讨论的不是"如何设计完美架构"，而是"如何在已经有缺陷的架构上，识别该改的时机和不该改的时机"。

## 一段补充：CSS 与图片的分割

本章一直在讲 JS 分割，但相同的逻辑也适用于其他静态资源。

- **CSS**：Vite 默认会把每个 chunk 对应的 CSS 拆出来。如果你用 CSS-in-JS（如 styled-components），需要确认它能跟随组件 lazy 加载，否则首屏 CSS 一样会膨胀。
- **图片**：大图应该放在 CDN，并按需 `import` 进对应组件——而不是把整个 `assets/` 目录默认打包。Vite 的 `import imageUrl from './hero.png'` 形式会自动按 chunk 切分。
- **字体**：自托管字体应该用 `font-display: swap` 加上 `<link rel="preload">`，让首屏文本不被字体加载阻塞。

代码分割是一种心智模型——一旦掌握，它适用于所有静态资源，不仅是 JS。
