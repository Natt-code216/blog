---
order: 4
title: 数据获取与缓存
est_read_minutes: 14
---

# 数据获取与缓存

上一章我们把 Server State 从其他状态里剥离出来，强调它本质上是**服务端数据在前端的一份缓存**。这一章把这个抽象继续拆开：缓存键、stale-while-revalidate、并发去重、失效链、乐观更新。

这部分内容如果用普通的 `fetch + useEffect` 自己实现，大概要写两千行代码并维护一年。社区已经把它打包成几个成熟方案——TanStack Query、SWR、RTK Query、Apollo、Relay。它们核心抽象的差异其实不大，本章以 TanStack Query 为例展开，但你可以把同样的心智模型迁移到其他库。

## 核心抽象：query key

TanStack Query 的核心是一个简单的键值缓存。每个查询用 `queryKey` 标识：

```ts
useQuery({
  queryKey: ['orders', { status: 'pending', page: 1 }],
  queryFn: () => api.getOrders({ status: 'pending', page: 1 }),
});
```

`queryKey` 是数组形式，因为它要支持**层级失效**——`['orders']` 可以一次性使所有以 'orders' 开头的查询失效，无论它们的 params 是什么。

这个设计非常关键。它把"失效一类数据"的语法从"在六个 useEffect 里挨个清"简化成一行。

## stale-while-revalidate：默认行为

新接触这类库的人最常困惑的是：为什么我离开页面再回来，组件先显示了旧数据，然后才更新成新数据？

这不是 bug，是默认策略——stale-while-revalidate（缩写 SWR）。它的逻辑是：

1. 查询第一次发生时，缓存为空，正常 loading；
2. 查询第二次发生时（同一个 key），先把上次的缓存返回给 UI，**同时**在后台重新拉取；
3. 拉取完成后再更新 UI。

这种策略的好处是：用户在 80% 的常规切换场景下感觉不到 loading。坏处是：开发者必须意识到"我看到的可能是旧数据"。

如果你不希望 SWR，可以调整两个参数：

- `staleTime`：在多久内认为缓存"还新鲜"，期间不重新拉取；
- `gcTime`（旧版叫 `cacheTime`）：缓存在组件卸载后保留多久才被回收。

```ts
useQuery({
  queryKey: ['userProfile'],
  queryFn: () => api.getProfile(),
  staleTime: 5 * 60_000,   // 5 分钟内不重新拉取
  gcTime: 30 * 60_000,     // 30 分钟内不回收
});
```

合理的 `staleTime` 是性能和新鲜度的最重要权衡。它没有银弹——对"用户资料"可以是 5 分钟，对"购物车"应该是 0（即每次回来都拉取），对"国家列表"可以是 24 小时。

## 并发去重

当一个组件树里多处同时请求同一个 key，普通 fetch 会发出多个 HTTP 请求。TanStack Query 会自动合并：第一个请求触发，后续的等待同一个 promise，请求返回后所有订阅者一起拿到数据。

这点在新人眼里几乎是魔法。其实它的实现非常朴素——查询前先看一下 in-flight map 里有没有同 key 的 promise。但这个朴素的事如果让每个团队自己写一遍，几乎没人能写对。

## 失效链：mutation 之后

数据写操作之后，相关查询要重新拉取。这条链如果手工维护，是项目"难改"的另一个重要来源。

```ts
const { mutate } = useMutation({
  mutationFn: (newOrder: NewOrder) => api.createOrder(newOrder),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
  },
});
```

这两行 `invalidateQueries` 写在 `onSuccess` 里，是显式的失效声明。它把"新订单创建之后需要重新拉哪些数据"这个业务知识，从开发者的头脑里搬进了代码——任何一个看代码的人都能立刻看到这个映射。

注意 invalidate 是**层级**的：`['orders']` 会失效所有以 orders 开头的查询，包括 `['orders', { status: 'pending' }]` 和 `['orders', { status: 'completed' }]`。这是 query key 设计成数组的根本原因。

## 乐观更新：一次轻量的状态机

某些写操作我们希望立即反映到 UI 上，而不是等服务端确认。这种就是"乐观更新"。

```ts
const { mutate } = useMutation({
  mutationFn: (id: string) => api.markOrderRead(id),
  onMutate: async (id) => {
    // 取消正在进行的查询，避免覆盖我们的乐观结果
    await queryClient.cancelQueries({ queryKey: ['orders'] });

    // 备份当前缓存
    const previous = queryClient.getQueryData<Order[]>(['orders']);

    // 乐观地更新缓存
    queryClient.setQueryData<Order[]>(['orders'], (old) =>
      old?.map(o => o.id === id ? { ...o, read: true } : o)
    );

    return { previous };
  },
  onError: (_err, _id, context) => {
    // 失败时回滚
    if (context?.previous) {
      queryClient.setQueryData(['orders'], context.previous);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  },
});
```

这是一段标准的乐观更新模板。它本质是一个微型状态机——开始时备份、乐观写入、失败时回滚、最终用服务端结果对齐。

把这个模板看清楚之后，前端"对操作响应即时"的体验就有了基础设施。

## 错误处理：让组件简洁

很多团队的 try/catch 写在每个组件里，最后组件里 90% 的代码都在处理错误。其实大部分错误处理应该上沉。

TanStack Query 提供 `QueryClient` 级别的 `defaultOptions`：

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.response?.status === 404) return false; // 404 不重试
        return failureCount < 3;
      },
      staleTime: 30_000,
    },
    mutations: {
      onError: (error: any) => {
        toast.error(error?.message || '操作失败');
      },
    },
  },
});
```

这一段把"重试策略"、"全局错误 toast"放在了一个地方。组件里只需要写 happy path，错误处理由基础设施兜底。

## 何时**不**用查询库

不是所有数据获取都需要这类库。这些场景应该绕开：

- 一次性的导出 / 下载操作 → 直接 fetch；
- WebSocket 长连接 → 用专门的 socket 客户端；
- 不会被多个组件复用的极简 GET → 直接 fetch 也行。

工具的选择是按需的。这类库的价值在于"有缓存、有失效、有并发"，缺一不可。三者都用不上的场景，直接 fetch 反而更轻。

## 本章小结

Server State 这一层的核心抽象，是把"缓存、并发、失效、重试"从每个组件里抽离出来，集中到一个声明式的 API 里。一旦这一层做对，前端代码里至少 30% 的复杂度会消失——loading state 管理、错误处理样板、重复请求、状态同步全部不用手工写。

下一章我们讨论另一个维度的边界：**模块边界与代码分割**。它决定了一个项目能不能"按需加载"，能不能让首屏只下载它真正需要的 JS。
