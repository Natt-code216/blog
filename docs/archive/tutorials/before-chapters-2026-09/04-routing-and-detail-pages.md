# 教程四 · 用 react-router 实现详情页与路由

> 等级：B_level（中级）
> 章节：4 / 5
> 状态：A更新中

## 一、为什么必须有详情页

到第三章为止，整个博客其实只有一个"长长的首页"——文章、教程、工具全部以卡片网格的形式铺在一屏里。这种风格在视觉上很爽，但在两件事情上吃亏：

第一，**SEO**。Google 抓取页面时，看到的是同一个 URL 下塞了 30 段不相关的内容，权重被稀释。每一篇随笔、每一个教程都应该有自己独立的 URL，独立的 `<title>` 和 `<meta description>`，搜索引擎才能给到它应得的排名。

第二，**阅读体验**。一篇 3000 字的随笔，如果只能在卡片里展示前 100 字，剩下的内容就等于没写。读者点开卡片后，期望的是一个安静的阅读环境，而不是回到那个嘈杂的网格里。

所以这一章要做的事情很明确：给 essays 和 tutorials 各自加一套详情页，URL 形如 `/essays/why-i-blog`、`/tutorials/react-vite-setup`。

> 顺嘴一提：详情页路由设计好之后，分享链接到微信、Twitter 时才能预览出对应内容；如果整站只有一个 `/`，分享卡片永远是同一张图。

## 二、安装 react-router-dom v6

社区里有 wouter、TanStack Router 等替代品，但 react-router 依然是事实标准，文档齐全、生态成熟。我选 v6，因为它的 API 比 v5 简洁很多——`<Switch>` 没了，嵌套路由变成对象树。

```bash
pnpm add react-router-dom
```

> v6 和 v5 的写法差别大到几乎是两个库，搜资料时务必看清版本号。看到 `<Switch>` 或 `component={Foo}` 这种写法的，基本是 v5 教程。

安装完后看看 `package.json`，应该是 `"react-router-dom": "^6.x.x"`。

## 三、最小可用的路由骨架

先把整个应用包到 `<BrowserRouter>` 里。改 `src/main.tsx`：

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

然后改 `App.tsx`，把原先一整页的内容拆成首页组件 `<Home />`，再加上详情页路由：

```tsx
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { EssayDetail } from './pages/EssayDetail';
import { TutorialDetail } from './pages/TutorialDetail';
import { NotFound } from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/essays/:slug" element={<EssayDetail />} />
      <Route path="/tutorials/:slug" element={<TutorialDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

几点说明：

- `:slug` 是路径参数，组件里用 `useParams` 取
- `path="*"` 必须放在最后，作为兜底的 404 路由
- v6 的 `element` 接收 JSX 元素而不是组件类型，注意 `<Home />` 不是 `Home`

## 四、路由结构怎么设计

URL 本身就是一种 API，乱了以后再改是要付出兼容成本的。我大体按这个思路：

| 路径 | 说明 |
| --- | --- |
| `/` | 首页（Hero + 卡片网格） |
| `/essays` | 随笔列表页（可选） |
| `/essays/:slug` | 单篇随笔 |
| `/tutorials` | 教程列表页（可选） |
| `/tutorials/:slug` | 单篇教程 |
| `/tools/:slug` | 工具详情（可选） |
| `/about` | 关于页 |
| `*` | 404 |

为什么用 slug 而不是 id？因为 `/essays/3` 这种 URL 完全不可读，分享出去也没人愿意点。slug 是 Strapi 后台手动维护的 URL 友好字符串，比如 `why-i-started-blogging`，搜索引擎也喜欢。

> 踩坑：Strapi 默认不带 slug 字段，要在 Content-Type Builder 里给每个集合加一个 UID 类型的字段，并设置 target field 为 title，这样标题改了 slug 才会自动生成。

## 五、useParams 取参数，调用 API

详情页组件大致长这样。先以随笔为例，`src/pages/EssayDetail.tsx`：

```tsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '@/services/api';
import type { Essay } from '@/types';

export function EssayDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [essay, setEssay] = useState<Essay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getEssayBySlug(slug)
      .then((data) => {
        if (!data) {
          setError('not_found');
        } else {
          setEssay(data);
        }
      })
      .catch(() => setError('fetch_failed'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <EssaySkeleton />;
  if (error === 'not_found') return <NotFound />;
  if (error) return <ErrorBox message="加载失败，请刷新重试" />;
  if (!essay) return null;

  return (
    <article className="essay-detail">
      <Link to="/" className="back-link">← 返回首页</Link>
      <h1>{essay.title}</h1>
      <time>{essay.date}</time>
      <div
        className="essay-content"
        dangerouslySetInnerHTML={{ __html: essay.content }}
      />
    </article>
  );
}
```

对应的 `api.getEssayBySlug` 我加在第三章的 `ApiService` 里：

```ts
async getEssayBySlug(slug: string): Promise<ApiEssay | null> {
  const response = await axios.get(`${API_URL}/essays`, {
    params: {
      'filters[slug][eq]': slug,
      'populate': '*',
    },
  });
  const list = response.data.data || [];
  return list[0] || null;
}
```

注意我用的是 `filters[slug][eq]` + 取第一项，而不是 `/essays/${slug}`。因为 Strapi 默认按 id/documentId 取，slug 不是主键，得通过 filter 查询。

## 六、加载、404、骨架屏

详情页的网络请求至少 200ms，慢的话 1 秒。这中间页面如果一片空白，用户会以为站点崩了。骨架屏（Skeleton）是当下最不打扰的方案：

```tsx
function EssaySkeleton() {
  return (
    <article className="essay-detail">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-meta" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line short" />
    </article>
  );
}
```

CSS 配一段呼吸动画：

```css
.skeleton {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04),
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.04)
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s ease-in-out infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

404 页面则要简洁，不要试图在 404 页上塞营销内容，那只会让人更烦：

```tsx
export function NotFound() {
  return (
    <main className="not-found">
      <h1>404</h1>
      <p>这里什么都没有，可能这篇内容被我删了，也可能你拼错了链接。</p>
      <Link to="/">回到首页</Link>
    </main>
  );
}
```

> 注意：从 Strapi 取数据时，"内容存在但未发布"和"内容不存在"返回结果其实是一样的（空数组）。如果想区分，得在后端层做手脚。对大多数博客而言，统一当作 404 就够了。

## 七、Link 和 a 标签的区别

这是新手最容易忽略的点。看下面两段代码：

```tsx
// 错误：触发整页刷新，丢失所有 React 状态
<a href="/essays/why-i-blog">阅读</a>

// 正确：客户端路由跳转
<Link to="/essays/why-i-blog">阅读</Link>
```

`<a>` 标签会让浏览器发起一个全新的 HTTP 请求，整个 SPA 重新挂载，bundle 重新解析，Hero 动画重新播放——非常糟糕的体验。`<Link>` 内部其实也是渲染一个 `<a>`，但它会拦截点击事件，调用 `history.pushState`，只更新当前匹配到的路由组件。

外链当然还是用 `<a>`，并且记得加 `rel="noopener noreferrer"`：

```tsx
<a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
```

## 八、路由切换后滚动重置

这是一个隐藏的坑：用 `<Link>` 跳转后，浏览器并不会自动滚动回顶部。如果你在首页滚到 80% 处点了一个文章卡片，跳到详情页时滚动条还停在 80%——读者看到的是文章中段，体验非常诡异。

解决方案是写一个空组件挂在 App 顶层，监听 `pathname` 变化：

```tsx
// src/components/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
```

然后在 `App.tsx` 加进去：

```tsx
export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ... */}
      </Routes>
    </>
  );
}
```

`behavior: 'instant'` 表示无动画直接跳到顶部。如果你喜欢平滑滚动，可以换成 `'smooth'`，但我个人觉得跳转时的滑动很迷惑——用户希望立刻看到新页面，不是被强行滑一段。

> 踩坑：有些教程会写 `window.scrollTo(0, 0)`，老 API，对 Safari 上的某些版本会失效。统一用对象写法更稳。

## 九、代码切分：让首屏更轻

到这里所有页面组件都是直接 import 进 App.tsx 的，意味着首页加载时，详情页的代码、404 页的代码都一起打包进了初始 bundle。对一个个人博客来说差别不大，但养成习惯总归是好的。

`React.lazy + Suspense` 是官方推荐的 Code Splitting 方案：

```tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home'));
const EssayDetail = lazy(() => import('./pages/EssayDetail'));
const TutorialDetail = lazy(() => import('./pages/TutorialDetail'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/essays/:slug" element={<EssayDetail />} />
        <Route path="/tutorials/:slug" element={<TutorialDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
```

注意两件事：

1. `lazy(() => import(...))` 接受的是一个返回 Promise 的函数，**懒加载的组件必须 export default**。这跟我前面推崇的命名导出冲突——所以详情页这种文件我破例用 default。
2. `<Suspense>` 的 `fallback` 是组件级 loading，跟详情页内部的 skeleton 是两套东西。这里的 fallback 是在 JS chunk 下载期间显示的。

打包后跑 `pnpm build`，dist 目录会看到多个 `EssayDetail-abc123.js` 之类的独立文件，浏览器只在访问对应路由时才下载它们。

```bash
pnpm build

# 输出大致是：
# dist/assets/index-d3f5c8.js          120 kB
# dist/assets/Home-9a8b2c.js           18 kB
# dist/assets/EssayDetail-7e1d9f.js    9 kB
# dist/assets/TutorialDetail-c2b4a1.js 9 kB
```

## 十、与 Strapi 配合的最后一步

为了让详情页真正工作，需要确认后端三件事：

1. Essay 和 Tutorial 都有 slug 字段（UID 类型）
2. slug 在 API 返回的字段中（默认就有，不用动）
3. 公开访问权限里允许 `find` 和 `findOne`（Settings → Roles → Public）

如果你已经按第二章配置过，这里只需要加 slug 字段即可。改了 schema 后 Strapi 会重启，已有数据需要手动补 slug 值（后台 Content Manager 里编辑每一篇）。

```json
// backend/src/api/essay/content-types/essay/schema.json 节选
{
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": {
      "type": "uid",
      "targetField": "title",
      "required": true
    }
  }
}
```

> 踩坑：UID 字段一旦 required 之后，旧数据如果没填会让 API 报错。建议先不 required，把所有老数据补完再加上约束。

## 下一章

到这里，整个站点已经具备生产环境的雏形：内容能改、页面能跳、链接能分享。下一章我们来把它真正部署上线——Vercel + Railway + Cloudflare 三件套，配上一点点 CI/CD，从 localhost 走到全世界。
