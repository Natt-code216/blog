---
order: 1
title: Web Vitals 心智模型
est_read_minutes: 12
---

# Web Vitals 心智模型

Web 性能优化里有几十个指标。FCP、LCP、TTI、TBT、INP、CLS、FID……新人面对这堆缩写常常一头雾水：到底盯哪个？

Google 在 2020 年提出了 Core Web Vitals 概念，把这堆指标收敛到三个最能反映用户感知的核心维度——**加载、交互、视觉稳定**。对应到具体指标：

- **LCP (Largest Contentful Paint)**：最大内容绘制时间。代表"加载快不快"。
- **INP (Interaction to Next Paint)**：交互到下一次绘制的时间。代表"点了之后有没有反应"。
- **CLS (Cumulative Layout Shift)**：累计布局偏移。代表"页面有没有跳来跳去"。

这三个指标几乎能覆盖 80% 的用户感知问题。本章把它们逐一拆开。

## LCP：用户什么时候"看到了"

LCP 测量的是"最大可视内容元素首次完成渲染的时间点"。这个"最大元素"通常是：

- 首屏的 hero 图；
- 大块的标题文字；
- 视频海报帧；
- 大背景图。

Google 给出的好阈值：**LCP ≤ 2.5 秒**（在 75% 用户上）。

理解 LCP 的关键是知道它**不是**首字节时间（TTFB），也**不是**首次像素时间（FCP），更不是页面"完全加载"的时间。它是用户"觉得这个页面已经显示出来了"的那个瞬间。

优化 LCP 的常见手段：

1. **加快 LCP 元素本身的下载**——预加载 hero 图、使用 CDN、压缩 / 选对格式（AVIF/WebP）。
2. **减少阻塞 LCP 元素渲染的资源**——关键 CSS 内联，非关键 CSS 异步加载，移除阻塞的同步 JS。
3. **减少 LCP 元素之前的 DOM 复杂度**——首屏 HTML 不要塞 200 个组件，让浏览器尽快算出最大元素是谁。

```html
<!-- hero 图预加载 -->
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">

<!-- 关键 CSS 内联 -->
<style>/* critical CSS for above-the-fold */</style>

<!-- 非关键 CSS 异步 -->
<link rel="stylesheet" href="/app.css" media="print" onload="this.media='all'">
```

注意 `fetchpriority="high"` 这个属性——它是 2023 年才广泛支持的，能让浏览器把这个资源优先级提到最高，对 LCP 的实测提升非常显著。

## INP：交互到底有没有反应

INP 在 2024 年 3 月正式取代了 FID（First Input Delay），成为 Core Web Vitals 第三项。它测量的是用户**任何一次交互**（点击、输入、tap）到**下一次界面绘制**的时间间隔。

好阈值：**INP ≤ 200ms**。

INP 比 FID 严苛得多。FID 只看第一次交互，且只看"事件队列等待的时间"；INP 看整个会话期间所有交互的最差延迟，且包含完整的"输入 → 处理 → 渲染"链路。

INP 的杀手往往是：

1. **过大的 JS 主线程任务**——某个 onClick 处理函数跑了 300ms，期间界面无响应；
2. **频繁的 setState 引发的连续渲染**——一次点击触发了 4 次重新渲染，每次都跑 100ms；
3. **同步执行的复杂计算**——比如在 onChange 里跑了一个 O(n²) 的查找。

优化方向：

- **拆分长任务**：用 `requestIdleCallback` 或 `scheduler.yield()` 把长任务切片；
- **去抖与节流**：高频事件（输入、滚动、resize）必须 debounce / throttle；
- **重计算搬到 Web Worker**：长时间的计算（如 markdown 渲染、复杂图表生成）放到主线程之外；
- **优化重渲染**：React 里用 `useMemo`、`React.memo`、状态结构合并。

```ts
// 一段把长任务切片的例子
async function processLargeList(items: Item[]) {
  for (let i = 0; i < items.length; i++) {
    process(items[i]);
    if (i % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0)); // 让出主线程
    }
  }
}
```

## CLS：页面有没有"跳"

CLS 测量的是页面加载过程中**意外的布局偏移**累计量。

最经典的例子：你正打算点击一个按钮，结果上面突然加载出一张广告图，页面下沉 50px，你的点击落到了"删除账户"按钮上。

好阈值：**CLS ≤ 0.1**。

CLS 的常见根源：

1. **图片不指定尺寸**——浏览器在图片加载前不知道占多大空间，于是文字先排版，图片加载完再撑开，挤动后续内容；
2. **广告 / 嵌入内容不预留空间**——同上；
3. **Web 字体加载导致文字回流**——FOUT（Flash of Unstyled Text）和 FOIT（Flash of Invisible Text）；
4. **动态注入的横幅**（如顶部通知条）。

修复方式都很机械：**提前预留空间**。

```html
<!-- 图片：显式 width / height -->
<img src="/photo.jpg" width="800" height="450" alt="...">

<!-- 即使要响应式，aspect-ratio 也能保留空间 -->
<style>
  .photo { width: 100%; aspect-ratio: 16 / 9; }
</style>

<!-- 字体：font-display: swap + size-adjust -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/inter.woff2') format('woff2');
    font-display: swap;
    size-adjust: 100%;
  }
</style>
```

`aspect-ratio` 是 CSS 一个被严重低估的属性。它能在图片 / 视频还没加载时就锁定容器尺寸，CLS 直接归零。

## 真实用户数据 vs 实验室数据

测 Web Vitals 有两种途径：

- **Lab data（实验室）**：用 Lighthouse、PageSpeed Insights 跑出来的数据。可重复、可对比、但不一定反映真实用户。
- **RUM (Real User Monitoring)**：用 `PerformanceObserver` 等 API 在生产环境收集真实用户的数据。

两者**都要看**。Lab data 用于 CI/PR 流程的回归门禁；RUM 用于真实用户感受的衡量与告警。

```js
// 一段最小的 LCP 上报
import { onLCP } from 'web-vitals';

onLCP((metric) => {
  navigator.sendBeacon('/api/metrics', JSON.stringify({
    name: 'LCP',
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    delta: metric.delta,
    id: metric.id,
  }));
});
```

`web-vitals` 这个库（Google 官方）只有几 KB，但能上报所有 Core Web Vitals。任何中大型生产项目都应该接入。

## 本章小结

Web Vitals 不是一组随机的指标，而是 Google 多年观察后凝练出的"用户感知三件套"。LCP 看加载、INP 看交互、CLS 看稳定——任何性能优化都应该首先回答这三个问题。

下一章我们深入到"为什么 LCP 慢"的根本原因——**关键渲染路径**，看浏览器从拿到 HTML 到画出第一帧之间究竟在做什么。

## 关于 TTFB 与 INP 的关系

最后补充一条经常被忽视的关联。INP 看起来是"交互"的事，但它的根因经常出在"加载"——具体说是 TTFB（Time to First Byte）。

如果你的服务端响应慢（TTFB 超过 800ms），即便 LCP 和 CLS 都很好，用户在加载期间任何点击都会进入"长任务等待"状态。INP 也会因此被记为 poor。

所以优化 INP 时，第一件事不是看主线程任务，而是看 TTFB。任何超过 600ms 的 TTFB 都值得专门修——它会同时拖累 LCP、INP 和用户主观体验。
