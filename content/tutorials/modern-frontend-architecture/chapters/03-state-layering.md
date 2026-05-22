---
order: 3
title: 状态分层与跨层通信
est_read_minutes: 14
---

# 状态分层与跨层通信

前端项目里 80% 的"耦合问题"，都不是组件之间的耦合，而是**状态之间的耦合**。一个本应只在表单里活的临时状态，被提到了全局；一个本应缓存的服务端数据，被反复 setState 进了组件 state；一个本应只是 UI 模态控制的 boolean，被关联进了 Redux 的 action 流。

这些都是"分层不清"的具体表现。一旦把状态正确分层，跨组件通信的复杂度可以直接砍掉一半。

## 三种状态，三种生命周期

我习惯把前端状态分为三类。这个划分不是我发明的，社区里有许多类似版本（TanStack Query 的作者 Tanner Linsley 用的是 server / client 二分；Mark Erikson 在 Redux 风格指南里用的是 server / ui / form 三分）。我倾向于三分版本，因为它对应了**三种完全不同的生命周期**：

| 类型 | 生命周期 | 来源 | 同步问题 |
|---|---|---|---|
| Server State | 跟随服务端 | 远端 | 必须考虑过期、并发、重新拉取 |
| UI State | 跟随会话或组件 | 本地 | 只需要本地一致 |
| Form State | 跟随单次表单 | 用户输入 | 提交完即丢弃 |

把它们混在同一个 store 里，是大多数项目"难改"的核心原因。

## Server State：根本不属于"前端状态"

最值得一开始就分清楚的是 Server State。它的本质是**服务端数据在前端的一份缓存**。

把它当成"前端状态"管理，会立刻撞上三个问题：

1. **过期**：用户切到别的页面再回来，缓存的数据已经过期了；
2. **并发**：两个组件同时请求同一份数据，会发两次请求、各自维护一份副本；
3. **失效**：用户做了写操作后，相关查询需要重新拉取——你需要手工写这条失效链。

这三个问题用普通的 `useState` + `useEffect` 解决，每一次都要重写一遍。这就是为什么社区最后趋同到一个共识：**Server State 应该用专门的库管理**——TanStack Query、SWR、Apollo、Relay 都在做这件事。

它们的核心抽象都是一样的：

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['orders', { status: 'pending' }],
  queryFn: () => api.getOrders({ status: 'pending' }),
  staleTime: 60_000,  // 1 分钟内不重新拉取
});
```

这一行代码背后做的事：
- 用 `queryKey` 做唯一标识，多个组件请求同一份数据只发一次；
- 自动管理 loading / error / data 三态；
- 支持过期重拉、聚焦重拉、网络恢复重拉；
- 写操作可以指定 invalidate 哪些查询，自动重拉。

下一章我们专门讲这套缓存模型的细节。这一章的核心是：**把 Server State 从你的 store / context / state 中剥离出来**——这一步价值最大，回报最快。

## UI State：本地优先，能不上提就不上提

UI State 是真正"属于前端"的状态——菜单是否打开、当前选中的 tab、模态框的可见性、表格的展开行。

它的生命周期通常很短：一次会话、一个页面、甚至一个组件实例。

**第一个原则：能放在组件内部就放在组件内部**。

新人最常见的错误，是看到一个状态可能"被多个地方用到"，就立刻提到全局。但"被多个地方用到"和"必须全局"是两回事。大多数时候，把它放在最近的公共父组件里，用 props / context 往下传，就够了。

```tsx
// 不要这样：
const isModalOpen = useGlobalStore(s => s.isModalOpen);

// 优先这样：
function OrderPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <OrderTable onRowClick={() => setIsModalOpen(true)} />
      <OrderDetailModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
```

**第二个原则：真正全局的 UI State，用最小工具**。

真正全局的 UI State 是哪些？基本只有这几类：
- 主题（dark / light）
- 当前用户身份（虽然这部分混着 Server State，但身份本身常驻）
- 全局通知 / Toast 队列
- 国际化 locale

这些用 Zustand 或 Jotai 这种轻量工具就够了，不必上 Redux 全套：

```ts
// stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>(set => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));
```

简洁、可测、不引入 action / reducer 的额外仪式。

## Form State：用专门的库，不要写在普通 state 里

Form State 是被很多团队低估的领域。一个看似简单的"登录表单"，背后藏着：
- 字段值；
- 字段的 touched 状态（是否被聚焦过）；
- 字段的 dirty 状态（是否被修改过）；
- 字段级与表单级的 validation；
- 异步校验（如"用户名是否被占用"）；
- submitting 状态、错误回填、reset 行为。

用普通 `useState` 写这套，最后总会变成一团乱麻——条件分支爆炸、字段间联动靠 useEffect、submit 时的统一校验靠手工调用。

社区已经收敛到几个成熟方案：React Hook Form、Formik、TanStack Form。我个人偏向 React Hook Form，因为它的 re-render 性能最好：

```tsx
import { useForm } from 'react-hook-form';

function LoginForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{
    email: string;
    password: string;
  }>();

  const onSubmit = handleSubmit(async (data) => {
    await api.login(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <input {...register('email', { required: '必填', pattern: /\S+@\S+/ })} />
      {errors.email && <span>{errors.email.message}</span>}
      <input type="password" {...register('password', { minLength: 8 })} />
      <button disabled={isSubmitting}>登录</button>
    </form>
  );
}
```

关键是：**Form State 不要进全局 store**。它的生命周期只在这次表单填写过程中存在，提交完就丢弃。把它放进全局 store 不仅多余，还会带来一系列"返回页面后表单残留"的问题。

## 跨层通信：当确实需要跨层时

把三类状态分清之后，跨层通信的场景其实少得多。剩下确实需要跨层的情况，主要是：

- 子组件需要触发父组件的某个动作 → 用 callback prop；
- 远房表亲组件之间需要协调 → 上提到公共父，或用 context；
- 不同 feature 之间需要通信 → 严格走 Server State（通过 invalidate）或事件总线（极少数情况）。

要警惕一种常见的反模式：用全局 store 当**事件总线**。这种用法表面上工作得不错，实际上把数据流变成了一张乱七八糟的有向图——任何一处改 store 都可能触发任何一处订阅，最终调试就是噩梦。

## 本章小结

状态分层的本质是承认"不同来源、不同生命周期的状态需要不同的工具"。强行用同一种工具处理所有状态，结果就是项目里到处都是"看似合理但很难维护"的耦合。

下一章我们深入 Server State 的世界：缓存键设计、并发与取消、乐观更新、错误重试。这一类问题处理好之后，前端代码里至少有 30% 的杂质会自动消失。
