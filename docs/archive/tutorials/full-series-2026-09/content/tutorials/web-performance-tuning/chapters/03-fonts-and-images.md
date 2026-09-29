---
order: 3
title: 字体与图片加载
est_read_minutes: 14
---

# 字体与图片加载

把一个真实网页的首屏字节分布画成饼图，结果大概是这样：

- 图片：50–60%
- 字体：10–20%
- HTML + CSS + JS：20–30%

也就是说，如果你不动图片和字体，整体优化空间就被锁死在 30%。本章把这两类资源单独拿出来讨论。

## 图片：选对格式

图片格式的选择，影响往往是 2–5 倍的体积差。

**WebP**：支持透明度、压缩比比 JPEG 高 25–35%。所有现代浏览器都支持（覆盖率 > 96%）。首选。

**AVIF**：压缩比比 WebP 再高 30%，但编码慢、浏览器支持稍弱（>90%）。值得对 hero 图等关键资源做特别优化。

**JPEG**：照片类的次选。绝对不要再用 PNG 存照片。

**PNG**：仅在需要无损 + 透明度的极少数场景使用（如 logo、图标）。

**SVG**：所有矢量图、图标、简单插图都应该是 SVG。

推荐配置：用 `<picture>` 元素做格式回退：

```html
<picture>
  <source type="image/avif" srcset="/hero.avif">
  <source type="image/webp" srcset="/hero.webp">
  <img src="/hero.jpg" alt="..." width="1600" height="900">
</picture>
```

浏览器从上到下选第一个能解码的格式。这种"渐进 enhancement"让现代浏览器吃到最大压缩比，旧浏览器仍能用 JPEG 兜底。

## 图片：用对尺寸

同一张图片在桌面（1600px 宽）和手机（375px 宽）上应该用不同的尺寸文件。否则手机用户会下载 5 倍他实际需要的像素。

用 `srcset` + `sizes`：

```html
<img
  src="/photo-800.jpg"
  srcset="/photo-400.jpg 400w,
          /photo-800.jpg 800w,
          /photo-1600.jpg 1600w"
  sizes="(max-width: 600px) 100vw, 800px"
  alt="..."
  width="1600" height="900">
```

`sizes` 告诉浏览器图片在不同视口下显示多宽；浏览器结合设备像素比，从 `srcset` 选择最合适的版本下载。

构建这些尺寸用什么工具？Next.js 的 `<Image>`、Astro 的 `<Image>`、Cloudinary / imgix / Cloudflare Images 都能做。一份成熟项目里这种"图片管线"应该是基础设施级别的。

## 图片：延迟加载

不在首屏出现的图片，应该延迟加载：

```html
<img src="/below-fold.jpg" loading="lazy" alt="...">
```

`loading="lazy"` 是浏览器原生支持的 attribute。它让图片在接近可视区域时才开始下载。

**注意**：首屏的关键图片（特别是 LCP 候选元素）**不要**加 lazy——会让浏览器延迟下载这张图，反而拖累 LCP。一种保守做法：第一张大图加 `fetchpriority="high"`，所有 below-the-fold 的图加 `loading="lazy"`。

## 图片：避免 CLS

上一章讲过 CLS，这里再强调一次：图片必须指定 `width` 和 `height` 属性。即使你的图片是响应式的（用 CSS 设宽度为 100%），HTML 上还是必须有原始宽高：

```html
<img src="/photo.jpg" width="1600" height="900"
     style="width: 100%; height: auto;" alt="...">
```

浏览器会用 `width / height` 算出 aspect ratio，提前预留空间。这一行不到 30 字符的改动，就能让 CLS 显著下降。

## 字体：子集化

中文字体的体积常常是 5–10MB。如果整字体直接下载，首屏完全没救。

字体子集化（subsetting）的核心思想：**只打包当前页面真正用到的字符**。

```bash
# 用 fonttools 做子集
pip install fonttools

pyftsubset SourceHanSans-Regular.otf \
  --unicodes='U+4E00-9FFF,U+3000-303F,U+FF00-FFEF' \
  --flavor=woff2 \
  --output-file=source-han-subset.woff2
```

这一段做的事：从 8MB 的思源黑体里只抽出常用中文字符 + 标点 + 全宽字符，结果通常只有 1–2MB。

更激进的做法：动态子集。用工具如 `fontmin` 在构建时分析项目所有源文件，只把实际出现的字符打包：

```js
import Fontmin from 'fontmin';
import fs from 'fs';

const sourceFiles = ['src/**/*.{js,jsx,ts,tsx,vue,html}'];
const text = collectText(sourceFiles);  // 收集所有源码中的文本

new Fontmin()
  .src('fonts/SourceHanSans-Regular.otf')
  .use(Fontmin.glyph({ text, hinting: false }))
  .use(Fontmin.ttf2woff2())
  .dest('public/fonts')
  .run();
```

经过动态子集，单个中文字体可以压到 100–300KB。

## 字体：font-display 与 size-adjust

上一章已经讲了 `font-display: swap`。这一章再补一个常被忽视的属性：`size-adjust`。

当 web 字体与 fallback 字体（如 system-ui）尺寸不一致时，字体切换瞬间会"跳一下"。`size-adjust` 能调整 web 字体的实际渲染尺寸，让它和 fallback 字体在视觉上对齐：

```css
@font-face {
  font-family: 'Inter';
  src: url('/inter.woff2') format('woff2');
  font-display: swap;
  size-adjust: 105%;  /* 让 Inter 在加载完后视觉尺寸与 system-ui 接近 */
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

这些值的精确数字可以用 Malte Ubl 写的 [font-overrides.glitch.me](https://font-overrides.glitch.me) 计算。一旦匹配好，FOUT 的"跳变"几乎肉眼不可见。

## 字体：自托管而非 Google Fonts

很多项目用 `<link href="https://fonts.googleapis.com/css2?family=...">` 直接引用 Google Fonts。这种做法有两个隐性成本：

1. **额外的 DNS + 连接开销**：用户要建立到 fonts.googleapis.com 和 fonts.gstatic.com 的两次连接。
2. **不受你控制的字体版本变化**：Google 可能随时调整字体子集，影响渲染。

更稳的做法：把字体下载到本地，自己托管。结合子集化，体积通常比 Google Fonts 还小。

```html
<!-- 之前 -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700" rel="stylesheet">

<!-- 之后 -->
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter-400.woff2') format('woff2');
    font-weight: 400;
    font-display: swap;
  }
</style>
```

## CSS contain：让浏览器知道哪些区域稳定

最后补一个性能优化的小宝贝：CSS `contain` 属性。

它告诉浏览器某个元素的渲染**与其外部隔离**——元素内部的变化不会引起外部重绘 / 重排。

```css
.card {
  contain: layout style paint;
}

.list-item {
  contain: content;  /* 等价于 layout style paint */
}
```

对长列表、可独立卡片这类元素，加 `contain` 能让滚动性能显著提升——浏览器跳过对它们的重新计算。

## 本章小结

字体和图片是首屏体积的双重头号杀手。图片解决方案：选对格式（AVIF/WebP）+ 用对尺寸（srcset）+ 延迟加载 + 预留空间。字体解决方案：子集化 + font-display swap + size-adjust + 自托管。

下一章我们离开浏览器内部，进入网络层——**HTTP/3 与缓存**。看看协议升级和缓存策略能为页面性能再榨多少出来。

## 关于"图标字体"

最后顺手补一个常被忽略的反模式：用字体文件存图标（如 Font Awesome、iconfont）。

这种做法在 2014–2018 年很流行，但今天已经没有理由继续用。原因：

1. 整个图标字体动辄 100KB+，但你只用其中 5 个图标；
2. 浏览器对字体的渲染流水线与图像不同，图标字体在某些 OS 下会有微小的渲染偏移；
3. 无法用 currentColor 之外的方式做局部样式（如多色图标）。

替代方案：直接 inline SVG。每个图标几百字节，可以独立 tree-shake，可以用 CSS 自由控制颜色与尺寸。所有现代图标库（Heroicons、Lucide、Phosphor）都默认走 SVG。
