---
order: 3
title: 缓存、并发与取消
est_read_minutes: 13
---

# 缓存、并发与取消

上一章我们处理了 UI 层面的状态完整性。但仅仅 loading / error / empty 还不够——一个 React 项目里数据请求的真实复杂度，主要在三个看不见的维度：

- **缓存**：什么时候用缓存、什么时候重新拉取；
- **并发**：多个组件同时请求时如何合并；
- **取消**：用户切走时如何停止已经发出的请求。

这三件事如果让每个团队自己实现，几乎一定会出错。本章用 TanStack Query 为例，把这些机制讲清楚。

## 缓存：从一份共享数据开始

TanStack Query 的核心抽象只有一个——**queryKey + queryFn**：

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['articles', { status: 'published' }],
  queryFn: () => api.getArticles({ status: 'published' }),
});
```

`queryKey` 是这份缓存的唯一标识。任何组件用相同的 queryKey 调用，都拿到同一份缓存。这就是"共享数据"的基础。

注意 queryKey 是**数组**形式。这看起来啰嗦，但带来一个关键能力——**层级失效**。

```ts
queryClient.invalidateQueries({ queryKey: ['articles'] });
// 失效所有以 'articles' 开头的查询：
// ['articles']
// ['articles', { status: 'published' }]
// ['articles', { status: 'draft' }]
// ['articles', 'detail', 'abc-123']
```

一次失效 + 层级匹配 = 让"哪些数据需要重新拉"这件事变成显式声明。

## staleTime：什么算"新鲜"

新人最常困惑的参数是 `staleTime`。默认值是 0——意味着每次 useQuery 触发都会重新拉取。这通常不是你想要的：

```ts
useQuery({
  queryKey: ['user'],
  queryFn: () => api.getCurrentUser(),
  staleTime: 5 * 60_000,   // 5 分钟内不重新拉
});
```

`staleTime` 内的数据被视为"新鲜"——即便组件 mount / unmount、即便用户切到其他 tab 再切回来，都不会触发重新请求。

不同数据应该有不同 staleTime：

- 用户基本信息：5 分钟（很少变）；
- 文章列表：30 秒（编辑可能更新）；
- 实时数据（如订单状态）：0 或 5 秒（变化频繁）；
- 静态数据（如国家列表）：1 小时甚至 1 天。

把 staleTime 配对，单独这一项就能砍掉一半的不必要请求。

## gcTime：什么时候被回收

`gcTime`（旧版叫 cacheTime）控制"组件卸载后缓存保留多久"。默认 5 分钟。

```ts
useQuery({
  queryKey: ['user'],
  queryFn: () => api.getCurrentUser(),
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
});
```

意思是：如果所有用 `['user']` queryKey 的组件都卸载了，缓存还保留 30 分钟。如果 30 分钟内有组件重新 mount，立刻拿到缓存；超过 30 分钟没人订阅，缓存被回收。

这个机制让"用户切走再切回"在大多数场景下是零延迟的——只要在 gcTime 内。

## 并发去重：多个组件同时请求

```tsx
function PageA() {
  const { data } = useQuery({ queryKey: ['user'], queryFn: getUser });
  // ...
}

function PageB() {
  const { data } = useQuery({ queryKey: ['user'], queryFn: getUser });
  // ...
}

function Layout() {
  return <><PageA /><PageB /></>;
}
```

这一段代码下，PageA 和 PageB 都需要 `['user']` 数据。如果用普通的 useEffect + fetch，会发两个请求。TanStack Query 自动合并——发现 in-flight 中已经有相同 queryKey 的请求，第二个组件订阅同一个 promise，请求返回后两者一起拿到数据。

这个能力让组件可以"自由地声明需要什么数据"，不需要担心重复请求。

## 取消：用户切走时

用户在 A 页面发起了一个请求，然后立刻切到 B 页面。如果 A 的请求继续，B 的渲染可能被 A 的 setState 干扰。

TanStack Query 自动处理取消：组件卸载时，发出的请求会被取消（如果 queryFn 支持取消信号）。

```ts
useQuery({
  queryKey: ['articles'],
  queryFn: async ({ signal }) => {
    return fetch('/api/articles', { signal }).then(r => r.json());
  },
});
```

注意 `queryFn` 的第一个参数解构出 `signal`——这是 AbortController 的 signal。把它传给 fetch / axios，浏览器就会真正取消请求。

如果你的 queryFn 不支持 signal，库会在组件卸载时忽略响应，但请求还是会到达服务端。对成本敏感的场景，应该总是把 signal 传透。

## 写操作：useMutation

读操作用 useQuery，写操作用 useMutation：

```ts
const { mutate, isLoading } = useMutation({
  mutationFn: (newArticle: NewArticle) => api.createArticle(newArticle),
  onSuccess: () => {
    // 写完之后失效 articles 查询，触发重新拉取
    queryClient.invalidateQueries({ queryKey: ['articles'] });
  },
});

// 触发
mutate({ title: 'New Article', content: '...' });
```

注意写操作和读操作的差异：

- 写操作**不会**被缓存（每次 mutate 都真正发请求）；
- 写操作的副作用通常是"使某些读操作的缓存失效"；
- 写操作通常不需要 staleTime / gcTime 这种概念。

## query key 设计原则

queryKey 的设计影响整个项目的缓存粒度。几条原则：

**1. 包含所有参数**

```ts
// 不好
useQuery({ queryKey: ['articles'], queryFn: () => api.getArticles({ status, page }) });
// 不同的 status / page 共享同一个缓存键！

// 好
useQuery({ queryKey: ['articles', { status, page }], queryFn: () => ... });
```

任何会影响请求结果的参数都必须进 queryKey，否则缓存会"挂错位置"。

**2. 用对象传参，不用拼字符串**

```ts
// 不好
useQuery({ queryKey: [`articles-${status}-${page}`], ... });
// 不好维护，且 invalidateQueries 不好层级匹配。

// 好
useQuery({ queryKey: ['articles', { status, page }], ... });
```

**3. 用一致的层级**

```ts
['articles', 'list', { status }]        // 列表
['articles', 'detail', { documentId }]  // 详情
['articles', 'count', { status }]       // 计数
```

这种层级让 `invalidateQueries(['articles'])` 能一次失效所有相关查询。

## 一个常见的反模式：把 queryKey 写进组件里

```tsx
// 不好
function ArticleList() {
  const { data } = useQuery({
    queryKey: ['articles', 'list', { status: 'published' }],
    queryFn: () => api.getArticles({ status: 'published' }),
  });
  // ...
}

function ArticleDetail({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ['articles', 'detail', id],
    queryFn: () => api.getArticleById(id),
  });
  // ...
}
```

queryKey 散落在每个组件里。如果将来想统一加 staleTime 或修改 queryKey 结构，要改很多地方。

**更好**：把 queryKey 和 queryFn 抽到 hook 里：

```ts
// hooks/useArticles.ts
export function useArticles(filters: ArticleFilters) {
  return useQuery({
    queryKey: ['articles', 'list', filters],
    queryFn: () => api.getArticles(filters),
    staleTime: 30_000,
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: ['articles', 'detail', id],
    queryFn: () => api.getArticleById(id),
    staleTime: 60_000,
    enabled: !!id,
  });
}
```

组件只调用 `useArticles()` / `useArticle(id)`，queryKey 的具体结构是实现细节。

## SSR 与水合（hydration）

如果你的项目是 SSR（如 Next.js）的，TanStack Query 也支持"服务端 prefetch + 客户端水合"：

```ts
// 服务端
const queryClient = new QueryClient();
await queryClient.prefetchQuery({ queryKey: ['articles'], queryFn: getArticles });
const dehydratedState = dehydrate(queryClient);
// 把 dehydratedState 序列化到 HTML

// 客户端
import { HydrationBoundary } from '@tanstack/react-query';
<HydrationBoundary state={dehydratedState}>
  <App />
</HydrationBoundary>
```

这种模式让"首屏数据已经在 HTML 里"——客户端水合后立刻能用，不需要再发请求。

## 本章小结

缓存、并发、取消是数据层的三大隐性能力。把它们交给专业的库（TanStack Query / SWR），你的组件代码可以专注于"这里要展示什么数据"，而不是"怎么管理这份数据的生命周期"。

下一章是本系列的最后一章——**乐观更新与重试**。这两件事让你的应用从"能用"升级到"流畅"。
