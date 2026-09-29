---
order: 2
title: 关键渲染路径
est_read_minutes: 13
---

# 关键渲染路径

上一章我们看到 LCP 是首屏性能的核心指标。但 LCP 之所以慢，根因往往不在网络，也不在 JS——而在**关键渲染路径**（Critical Rendering Path, CRP）的某个阻塞点上。

本章把浏览器从拿到 HTML 到画出第一帧的过程拆开看，并指出每一步可被优化的地方。

## 浏览器在做什么

简化版的 CRP 是这样的：

```
HTML下载 → HTML解析 → DOM构建 → 遇到 CSS → 等 CSS 下载完
                                          → CSSOM 构建
                                          → 合成 Render Tree
                                          → Layout（计算尺寸位置）
                                          → Paint（绘制像素）
                                          → Composite（合成到屏幕）
```

中间任何一步被阻塞，首帧就会被推迟。

CRP 优化的核心思想是：**让"画出第一帧"的依赖最少**。

## 阻塞 CRP 的两类资源

阻塞 CRP 的资源主要有两类：

**1. CSS：阻塞渲染**

浏览器不会用"半个 CSSOM"渲染——它会等到所有同步 CSS 下载并解析完，才合成 Render Tree。这意味着：

```html
<head>
  <link rel="stylesheet" href="/styles/everything.css">  <!-- 阻塞 -->
</head>
```

如果这个 CSS 文件 200KB，加载需要 800ms，那这 800ms 内首帧不会出现。

**优化方向**：

- **关键 CSS 内联**：把首屏需要的 CSS 直接 inline 到 HTML 里，不阻塞外部下载；
- **非关键 CSS 异步加载**：用 `media="print"` 小 trick 让浏览器异步下载，再用 onload 切换：

```html
<style>/* critical CSS, < 14KB */</style>

<link rel="stylesheet" href="/app.css" media="print"
      onload="this.media='all'">
```

- **使用 CSS @layer 与按需加载**：现代 CSS-in-JS 工具（如 vanilla-extract）能在构建时自动切分关键 CSS。

**2. JS：阻塞解析**

不带 `async` / `defer` 的 `<script>` 会阻塞 HTML 解析：

```html
<script src="/analytics.js"></script>  <!-- 阻塞解析 -->
```

**优化方向**：

- 默认给 `<script>` 加 `defer` 或 `async`；
- 区分两者：
  - `async`：下载不阻塞，但下载完会**立即执行**——可能打断 DOM 构建。适合**独立、无依赖**的脚本（如分析）。
  - `defer`：下载不阻塞，且会**等 HTML 解析完**才按顺序执行。适合**业务脚本**。

```html
<script src="/analytics.js" async></script>
<script src="/app.bundle.js" defer></script>
```

`defer` 在 99% 的业务脚本场景下都是正确选择。如果你的项目里有 `<script>` 没加 defer/async，那是非常值得修的低垂果实。

## 14KB 规则：第一次 TCP 往返

很多优化文章会提到一个数字：**14KB**。这是 TCP 慢启动的初始拥塞窗口大小——第一次 TCP 往返大约能传 14KB 数据。

意义是：如果你的 HTML + 关键 CSS + 关键 JS 总大小能塞进 14KB，那么用户在第一次网络往返结束时就能看到首帧。这是首屏最快的物理极限。

当然，今天大多数项目的首屏远超 14KB。但 14KB 提供了一个心理目标——**关键路径上的内容应该尽可能小**。

## 字体阻塞：FOIT / FOUT

字体是另一个常被忽视的 CRP 阻塞源。

默认情况下，浏览器看到 `<link rel="stylesheet">` 引用了一个 web 字体（@font-face），会在字体下载完成前**不显示使用该字体的文本**——这就是 FOIT (Flash of Invisible Text)。

如果你的 Inter 字体需要 800ms 才下载完，那这 800ms 里所有文本都是空白。LCP 会被严重拖累。

修复非常简单：

```css
@font-face {
  font-family: 'Inter';
  src: url('/inter.woff2') format('woff2');
  font-display: swap;  /* ← 这一行 */
}
```

`font-display: swap` 让浏览器先用系统 fallback 字体显示文本，等 web 字体加载完再切换。LCP 通常立刻提升 200–500ms。

唯一的副作用是**字体切换的瞬间会闪一下**（FOUT, Flash of Unstyled Text）。这可以用 `size-adjust` 和 fallback 字体的精细匹配缓解，但即便不缓解，FOUT 也比 FOIT 好得多——前者用户能立刻读到文字，后者用户看的是空白。

## 预连接与预加载

CRP 优化的另一组武器是 `<link rel="preconnect">` 和 `<link rel="preload">`。

```html
<!-- 预先建立连接 -->
<link rel="preconnect" href="https://api.example.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- 预先加载关键资源 -->
<link rel="preload" as="font" href="/inter.woff2" type="font/woff2" crossorigin>
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">
```

- **preconnect**：提前完成 DNS + TCP + TLS 握手。对跨域 API 或第三方字体能节省 100–300ms。
- **preload**：提前下载关键资源，无论它们在 HTML 中的位置。

注意：**不要滥用 preload**。如果你 preload 了 20 个文件，每个都"高优先级"，那等于没有优先级。一份页面里 preload 的数量应控制在 3–5 个以内。

## 一段完整的 head

把本章所有建议合在一起，一份理想的首屏 `<head>` 大概长这样：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">

  <!-- 预连接 -->
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  <!-- 预加载关键资源 -->
  <link rel="preload" as="image" href="/hero.webp" fetchpriority="high">
  <link rel="preload" as="font" href="/inter.woff2" type="font/woff2" crossorigin>

  <!-- 内联关键 CSS -->
  <style>
    /* 首屏需要的 14KB 内 CSS */
    :root { --bg: #050505; --fg: #fcfcfc; }
    body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.7 'Inter', sans-serif; }
    /* ... */
  </style>

  <!-- 非关键 CSS 异步 -->
  <link rel="stylesheet" href="/app.css" media="print" onload="this.media='all'">

  <!-- 业务 JS：defer -->
  <script src="/app.js" defer></script>

  <!-- 分析脚本：async -->
  <script src="/analytics.js" async></script>

  <title>首屏性能优化</title>
</head>
```

这一份 head 在主流浏览器里能把首帧时间压到极限附近。

## 本章小结

关键渲染路径是 LCP 的根因。优化它有四个核心动作：CSS 关键内联、JS 加 defer/async、字体 swap、关键资源 preload。每一个都不复杂，但合起来能让首帧时间减少一半以上。

下一章我们专门讨论首屏体积的两大头号杀手：**字体和图片**。它们贡献了 60% 以上的首屏字节数。

## 用 Chrome DevTools 实测

如果你想看自己项目的 CRP 长什么样，最直接的工具是 Chrome DevTools 的 Performance 面板。打开 Performance → Reload，会得到一份完整的渲染时间线，包括：

- HTML 下载与解析的时间段；
- CSS 与 JS 资源的下载阻塞；
- DOMContentLoaded、Load、FCP、LCP 几个里程碑事件的位置；
- 主线程任务的耗时分布。

把这张图与本章描述的 CRP 模型对照看，几次之后就能形成肌肉记忆——哪种"棒"是 CSS 阻塞，哪种"棒"是 JS 长任务，一眼就能认出。这种实测训练比任何文章都更能让你抓到真实问题。
