---
order: 5
title: 判别联合与状态机
est_read_minutes: 12
---

# 判别联合与状态机

到目前为止本系列讲的都是"形状变换"——对类型做计算、加工、组合。本章换一个角度：用类型表达**流程**。

"流程"在代码里最常见的载体是状态机：从 idle 到 loading、loading 到 success 或 error、success 后可重新 idle……这些状态转移如果只用 boolean 标志位表达，代码很快会变成一锅粥。判别联合（Discriminated Unions, DU）是解决它的最干净方式。

## 经典反模式：boolean 标志位

新人写"加载状态"经常是这样：

```ts
interface State {
  isLoading: boolean;
  data: User | null;
  error: Error | null;
}
```

看起来简单，但它允许大量**不可能的状态组合**：

- `isLoading: true, data: { ... }, error: null`  → 加载中却有数据？
- `isLoading: false, data: { ... }, error: { ... }` → 既有数据又有错？
- `isLoading: true, error: { ... }` → 加载中却有错？

每一种组合在运行时都需要 if 判断处理。代码里到处是 `if (loading && data) { ... }` 这种自相矛盾的检查。

## 判别联合：让坏状态不可表达

把 `State` 改成判别联合：

```ts
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };
```

现在每一个状态都明确：

- `idle`：没有 data，没有 error；
- `loading`：没有 data，没有 error；
- `success`：必有 data，没有 error；
- `error`：没有 data，必有 error。

不可能的状态（"loading 且有 data"、"error 且 success"）在编译期就不存在。

`status` 这个字段是**判别字段**（discriminator），TS 用它来区分联合的不同分支。

## TS 自动窄化

```ts
function render(state: State) {
  switch (state.status) {
    case 'idle':
      return <div>请点击加载</div>;
    case 'loading':
      return <div>加载中...</div>;
    case 'success':
      // 这里 state.data 类型是 User，不是 User | null
      return <UserCard user={state.data} />;
    case 'error':
      // 这里 state.error 类型是 Error
      return <div>出错了：{state.error.message}</div>;
  }
}
```

注意：在 `case 'success'` 分支里，`state.data` 的类型是 `User`，不需要任何 null 检查——因为类型系统已经保证了"如果 status 是 success，data 必然存在"。

这是 DU 最大的回报：**用类型替代了大量运行时检查**。

## 与穷尽性检查结合

DU 的另一个伟大配合是穷尽性检查：

```ts
function render(state: State) {
  switch (state.status) {
    case 'idle':    return ...;
    case 'loading': return ...;
    case 'success': return ...;
    case 'error':   return ...;
    default:
      const _exhaustive: never = state;
      return _exhaustive;
  }
}
```

如果将来 `State` 加了一个 `'cancelled'` 状态，但 render 函数没改，`default` 分支里的 `state` 类型就会是 `{ status: 'cancelled' }`，不是 `never`。`_exhaustive: never = state` 会编译失败，强制你补上 case。

这就是用类型保证流程完备性的关键模式。

## 用 DU 表达状态机的转移

一个完整的状态机不只是状态，还包括**合法的转移**。可以用 DU 表达它：

```ts
type State =
  | { kind: 'idle' }
  | { kind: 'loading'; attempt: number }
  | { kind: 'success'; data: User }
  | { kind: 'error'; error: Error; canRetry: boolean };

type Event =
  | { type: 'LOAD' }
  | { type: 'RETRY' }
  | { type: 'SUCCESS'; data: User }
  | { type: 'ERROR'; error: Error }
  | { type: 'RESET' };

function transition(state: State, event: Event): State {
  switch (state.kind) {
    case 'idle':
      if (event.type === 'LOAD')
        return { kind: 'loading', attempt: 1 };
      return state;

    case 'loading':
      if (event.type === 'SUCCESS')
        return { kind: 'success', data: event.data };
      if (event.type === 'ERROR')
        return { kind: 'error', error: event.error, canRetry: state.attempt < 3 };
      return state;

    case 'error':
      if (event.type === 'RETRY' && state.canRetry)
        return { kind: 'loading', attempt: 1 };
      if (event.type === 'RESET')
        return { kind: 'idle' };
      return state;

    case 'success':
      if (event.type === 'RESET')
        return { kind: 'idle' };
      return state;
  }
}
```

这一段定义了一个完整的请求状态机。每个状态只接受"它合法的事件"，其他事件直接忽略。这种结构在大型表单、复杂交互流程里能让代码极度可读。

## 用判别字段做表单分支

表单经常需要"根据某个字段值显示不同字段"。DU 是这种场景的天然解：

```ts
type PaymentMethod =
  | { type: 'credit_card'; cardNumber: string; cvc: string }
  | { type: 'paypal'; email: string }
  | { type: 'bank_transfer'; accountNumber: string; bankName: string };

function PaymentForm({ method }: { method: PaymentMethod }) {
  switch (method.type) {
    case 'credit_card':
      // method 在这里是 CreditCard 那个分支
      return <CardForm cardNumber={method.cardNumber} cvc={method.cvc} />;
    case 'paypal':
      return <PaypalForm email={method.email} />;
    case 'bank_transfer':
      return <BankForm account={method.accountNumber} bank={method.bankName} />;
  }
}
```

注意每个分支里的字段访问都不需要 optional chaining——类型已经保证了字段一定存在。

## API 响应的判别联合

很多 API 响应是这样的形式：

```json
{ "ok": true, "data": { ... } }
{ "ok": false, "error": "..." }
```

把它建模成 DU：

```ts
type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function fetchUser(id: string): Promise<ApiResponse<User>> { /* ... */ }

const res = await fetchUser('123');
if (res.ok) {
  console.log(res.data);   // User
} else {
  console.error(res.error); // string
}
```

任何尝试访问 `res.data` 而没有先检查 `res.ok` 都会编译失败。

## tagged unions vs simple unions

需要区分两种联合：

- **Simple union**：没有共同判别字段，要靠 typeof / instanceof / in 来窄化（如 `string | number`）。
- **Tagged / discriminated union**：有共同判别字段（如 `status`、`type`、`kind`）。

DU 比 simple union 容易处理得多。**任何业务模型尽量做成 DU**。

## 判别字段的命名

社区常用的判别字段名：

- `type`：最常见，简洁；
- `kind`：在 React-like 项目里出现频率高；
- `status`：用于状态机；
- `tag`：偏函数式风格；
- `_tag`：避免和业务字段冲突。

选哪个不重要，关键是**项目内一致**。同一个项目里如果一会儿 type、一会儿 kind，会让所有人都困惑。

## 反模式：在 DU 上用 if 而非 switch

```ts
// 不推荐
if (state.status === 'success') {
  return state.data;
} else if (state.status === 'loading') {
  return ...;
}
// ↑ 没有穷尽性检查，加新分支时容易漏

// 推荐
switch (state.status) {
  case 'success': return state.data;
  case 'loading': return ...;
  default:
    const _: never = state;
    return _;
}
```

if/else 链条容易遗漏分支；switch 配合穷尽性检查能让漏分支的事在编译期被发现。

## 本章小结

判别联合是 TS 表达"流程"的核心工具。它让"不可能的状态"在编译期不存在，让大量 if/null 检查从运行时消失。与穷尽性检查配合，还能在添加新状态时强制更新所有处理逻辑。

下一章是本系列的收尾——**用类型表达业务不变量**。我们会看到，DU、Mapped Types、模板字面量类型合在一起，能让一份业务模型成为"自我文档化、自我保护的设计"。

## 与 XState 等状态机库的关系

最后顺带提一句：本章手工写的状态机如果变得复杂（如有并发状态、嵌套层级、副作用调度），可以借助 XState 这样的专门库。XState 的核心抽象与 DU 完全兼容——它的 state 也是判别联合，只是配套了更完整的转移描述、可视化工具、副作用管理。

小型流程手写 DU 足够；中大型流程考虑 XState。但无论用不用库，"用类型表达流程"的心智模型都是同一个。
