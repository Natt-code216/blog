---
order: 4
title: 乐观更新与重试
est_read_minutes: 13
---

# 乐观更新与重试

到这里你已经掌握了 Server State 的核心——Service 层、四态 UI、缓存机制。本章讲两个让"应用从能用升级到流畅"的高级模式：**乐观更新**与**自动重试**。

## 乐观更新：UI 先于服务器

普通写操作的流程：

1. 用户点击"标记为已读"；
2. UI 显示 loading；
3. 等服务端返回成功；
4. UI 切换为"已读"状态。

这个流程在网络好的情况下大约 200–500ms，用户能感觉到延迟。

乐观更新把这个流程改成：

1. 用户点击"标记为已读"；
2. UI **立刻**切换为"已读"状态；
3. 后台发送请求；
4. 如果成功，无事发生；
5. 如果失败，UI 回滚并提示。

这种"先信任后验证"的策略让常见操作几乎瞬时响应。前提是失败率足够低——否则用户体验是"看起来成了又失败了"。

## TanStack Query 的乐观更新模板

```ts
const queryClient = useQueryClient();

const { mutate } = useMutation({
  mutationFn: (id: string) => api.markArticleRead(id),

  onMutate: async (id) => {
    // 1. 取消正在进行的查询，避免它们覆盖我们的乐观结果
    await queryClient.cancelQueries({ queryKey: ['articles'] });

    // 2. 备份当前缓存（用于失败时回滚）
    const previous = queryClient.getQueryData<Article[]>(['articles']);

    // 3. 乐观地更新缓存
    queryClient.setQueryData<Article[]>(['articles'], (old) =>
      old?.map(a => a.id === id ? { ...a, read: true } : a) || []
    );

    // 4. 把备份传给 onError（context）
    return { previous };
  },

  onError: (err, _id, context) => {
    // 5. 失败时回滚
    if (context?.previous) {
      queryClient.setQueryData(['articles'], context.previous);
    }
    toast.error('标记失败，已回滚');
  },

  onSettled: () => {
    // 6. 无论成功失败，最终都从服务端拉一次确认
    queryClient.invalidateQueries({ queryKey: ['articles'] });
  },
});
```

这一段是 TanStack Query 乐观更新的标准模板。逐项展开：

- **`onMutate`**：在 mutate 函数实际执行之前调用。这里做乐观更新。
- **`cancelQueries`**：必须先取消相关查询，否则在乐观更新和服务端返回之间，如果有别的查询完成，可能会覆盖你的乐观结果。
- **`setQueryData`**：直接改缓存，所有订阅这个 queryKey 的组件立刻看到变化。
- **`onError` 中的 context**：onMutate 返回的对象会作为 context 传给 onError——用来回滚。
- **`onSettled`**：成功或失败都触发，用来"用服务端真值对齐"。

## 何时**不**做乐观更新

乐观更新不是免费午餐。下面这些场景应该避免：

1. **高失败率的操作**：如支付、复杂表单提交——失败回滚的用户体验比"等一下成了"更糟。
2. **依赖服务端计算的响应**：如"创建订单"返回订单号——客户端无法乐观预测订单号。
3. **跨多张表的复杂副作用**：如"删除一个用户引起评论级联更新"——客户端无法精确模拟所有副作用。

经验法则：乐观更新适合**简单的、本地可预测的、失败影响小的**操作。点赞、收藏、标记已读、切换开关——这些是它的舒适区。

## 自动重试：处理网络抖动

网络环境永远不稳定。一个看似简单的 GET 请求可能因为：

- 用户进电梯了；
- 蜂窝网络切换；
- 服务端短暂过载；
- DNS 抖动；
- 跨地区路由波动。

而失败。这类错误绝大多数是**瞬时的**——立刻重试一次往往就成了。

TanStack Query 默认有重试机制：

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30_000),
    },
  },
});
```

这套默认配置做的事：

- 失败时最多重试 3 次；
- 重试间隔：第一次等 1s，第二次等 2s，第三次等 4s——**指数退避**；
- 上限 30 秒。

指数退避是非常重要的策略——它让"短暂抖动"很快恢复（前两次重试都在 3 秒内），又避免"持续故障"被无意义地连续重试。

## 不该重试的错误

但并非所有错误都应该重试。下面这些**不要**重试：

- **4xx 错误**（除了 408 / 429）——业务错误，重试结果一样；
- **请求被取消**（用户切走了）；
- **业务约束违反**（如"评论字数超限"）。

```ts
useQuery({
  queryKey: ['articles'],
  queryFn: ...,
  retry: (failureCount, error: any) => {
    if (error?.response?.status >= 400 && error?.response?.status < 500) {
      return false;  // 4xx 不重试
    }
    return failureCount < 3;
  },
});
```

把"哪些错误重试"的判断写进 retry 函数，能避免大量浪费。

## 重试的另一面：去抖与节流

某些场景下用户会快速触发多个相同操作（如反复点击"发送"）。这时候**不该重试**，而是**该去抖**：

```ts
import { useDebouncedCallback } from 'use-debounce';

const debouncedSubmit = useDebouncedCallback((data) => {
  mutate(data);
}, 300);
```

去抖 300ms：用户连续点击 5 下"发送"，只发一次真正的请求。这种模式在搜索框、自动保存这类场景下是默认配置。

## 重试的副作用：幂等性

任何会被重试的请求都必须是**幂等**的——重试 N 次和重试 1 次的结果必须相同。

幂等的：
- GET 请求；
- 用业务 ID（如 idempotency-key）保护的 POST 请求；
- "标记已读"这种"达到某个状态"的操作。

不幂等的：
- 没有 idempotency-key 的 POST（重试会创建多份资源）；
- "余额减一"这种增量操作。

如果你的后端不提供 idempotency-key 机制，对**非幂等**的 mutation 应该**禁用重试**：

```ts
useMutation({
  mutationFn: createOrder,
  retry: 0,  // 显式禁用
});
```

否则用户点一下"下单"可能创建三个订单。

## 网络恢复时自动重新拉取

TanStack Query 还有一个非常贴心的默认行为：当浏览器从离线恢复在线时，自动重新拉取所有失败的查询。

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnReconnect: true,  // 默认开启
      refetchOnWindowFocus: true, // 用户切回 tab 时自动重新拉
    },
  },
});
```

这两个默认让用户"切走再切回"、"网络中断再恢复"这种常见场景下，数据自动新鲜。

但要注意：`refetchOnWindowFocus` 在某些场景下会带来过多请求（特别是开发期一直切 tab 切 DevTools）。如果你的接口对成本敏感，可以关掉它，改用 staleTime 控制刷新频率。

## 错误上报：让重试不掩盖真实问题

自动重试有个副作用：**它可能掩盖真实的服务端问题**。一个出 bug 的接口本来应该立刻被发现，但因为前端在背后重试 3 次，开发者直到很久之后才察觉。

应对：把每次失败都上报到监控系统，即便重试最终成功：

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      onError: (error) => {
        if (process.env.NODE_ENV === 'production') {
          Sentry.captureException(error, { level: 'warning' });
        }
      },
    },
  },
});
```

这样重试帮用户兜底，但开发者能从监控里看到接口的真实失败率。

## 一段完整的"乐观 + 重试"模板

把本章的所有要点合在一起，一个真实的"切换收藏"操作大概长这样：

```ts
function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (articleId: string) => api.toggleFavorite(articleId),
    retry: (count, err: any) => {
      if (err?.response?.status >= 400 && err?.response?.status < 500) return false;
      return count < 2;
    },
    onMutate: async (articleId) => {
      await queryClient.cancelQueries({ queryKey: ['articles'] });
      const previous = queryClient.getQueryData<Article[]>(['articles']);
      queryClient.setQueryData<Article[]>(['articles'], (old) =>
        old?.map(a => a.id === articleId ? { ...a, favorited: !a.favorited } : a) || []
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['articles'], context.previous);
      toast.error('操作失败，已回滚');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}
```

读起来稍长，但每一行都有明确目的——乐观更新让 UI 即时响应、retry 让网络抖动透明、回滚保证一致性、最终 invalidate 对齐服务端真值。

## 本章小结

乐观更新和自动重试是高质量交互体验的两个隐性引擎。它们让用户感觉到的"流畅度"远超纯粹的"等待 - 完成"模式。前提是：理解每种模式的适用边界（乐观更新适合简单可预测、重试适合幂等请求），并配上错误上报作为兜底。

至此本系列四章完结。从 Service 层 + env、到四态 UI、到缓存与并发、到乐观更新与重试——你已经完整地掌握了前端数据层的核心模式。下一个项目里再不必"用 useState + useEffect 撑起整个数据请求"了。
