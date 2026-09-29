---
order: 6
title: 用类型表达业务不变量
est_read_minutes: 13
---

# 用类型表达业务不变量

本系列的最后一章把前面所有零件——条件类型、模板字面量、Mapped Types、判别联合——合在一起，做一件更高阶的事：**用类型表达业务不变量**。

什么是业务不变量？比如：

- "已发货的订单不能取消"；
- "付款金额必须严格等于订单金额"；
- "草稿状态的文章不能有 publishedAt"；
- "管理员才能删除任何用户的评论"。

这些规则如果只靠运行时检查表达，会到处出现 if-then-return-error。如果用类型表达，它们就在编译期被强制——不可能写出违反规则的代码。

## 让不可能的状态不可表达

Scott Wlaschin 在《Domain Modeling Made Functional》里反复强调一句话：**make illegal states unrepresentable**。

举个简化的例子。一个订单的状态有：

- placed：刚下单，未付款；
- paid：已付款；
- shipped：已发货；
- delivered：已送达；
- cancelled：已取消。

业务规则：
- 只有 `placed` 状态可以被 `cancelled`；
- 只有 `paid` 状态可以被 `shipped`；
- 一旦 `shipped`，必须有 `trackingNumber`；
- 一旦 `delivered`，必须有 `deliveredAt` 时间戳。

如果用普通 interface：

```ts
interface Order {
  id: string;
  status: 'placed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  deliveredAt?: Date;
  paymentReceipt?: string;
}
```

这种类型允许许多坏状态：`status: 'placed'` 配 `trackingNumber: 'XXX'`、`status: 'shipped'` 配 `trackingNumber: undefined`、`status: 'cancelled'` 配 `deliveredAt: ...`，全都合法。

改用 DU：

```ts
type Order =
  | { id: string; status: 'placed' }
  | { id: string; status: 'paid'; paymentReceipt: string }
  | { id: string; status: 'shipped'; paymentReceipt: string; trackingNumber: string }
  | { id: string; status: 'delivered'; paymentReceipt: string; trackingNumber: string; deliveredAt: Date }
  | { id: string; status: 'cancelled'; cancelledAt: Date };
```

现在所有"坏状态"在编译期不可能。任何 `Order` 实例必然是这五种合法形态之一。

## 状态转移函数：把规则做成 API

定义合法的状态转移：

```ts
type Order =
  | { id: string; status: 'placed' }
  | { id: string; status: 'paid'; receipt: string }
  | { id: string; status: 'shipped'; receipt: string; trackingNumber: string }
  | { id: string; status: 'delivered'; receipt: string; trackingNumber: string; deliveredAt: Date }
  | { id: string; status: 'cancelled'; cancelledAt: Date };

function pay(order: Order & { status: 'placed' }, receipt: string): Order & { status: 'paid' } {
  return { id: order.id, status: 'paid', receipt };
}

function ship(order: Order & { status: 'paid' }, trackingNumber: string): Order & { status: 'shipped' } {
  return { ...order, status: 'shipped', trackingNumber };
}

function deliver(order: Order & { status: 'shipped' }, at: Date): Order & { status: 'delivered' } {
  return { ...order, status: 'delivered', deliveredAt: at };
}

function cancel(order: Order & { status: 'placed' }): Order & { status: 'cancelled' } {
  return { id: order.id, status: 'cancelled', cancelledAt: new Date() };
}
```

注意每个函数的输入类型——它**只接受合法的来源状态**。试图 `cancel` 一个 paid order 在编译期就报错。

调用方：

```ts
let o: Order = { id: '1', status: 'placed' };
o = pay(o, 'receipt-001');      // ❌ Type Order is not assignable...

// 必须用类型守卫
if (o.status === 'placed') {
  o = pay(o, 'receipt-001');    // OK，o 现在是 paid
}
```

这种 API 让调用方**必须**在转移前确认当前状态——类型系统不会让你跳过。

## 用品牌类型（Branded Types）表达约束

业务里经常有"这个字符串不只是 string，它必须经过某种校验"。比如：

- `UserId` 必须是合法的 UUID 格式；
- `Email` 必须是合法邮箱；
- `PositiveNumber` 必须 > 0。

这些用普通 string 表达会丢失约束。用品牌类型可以保留：

```ts
type Brand<T, B> = T & { readonly __brand: B };

type UserId = Brand<string, 'UserId'>;
type Email = Brand<string, 'Email'>;
type PositiveNumber = Brand<number, 'PositiveNumber'>;

function createUserId(s: string): UserId {
  if (!/^[0-9a-f-]{36}$/.test(s)) throw new Error('Invalid UUID');
  return s as UserId;
}

function createEmail(s: string): Email {
  if (!s.includes('@')) throw new Error('Invalid email');
  return s as Email;
}

function sendInvite(userId: UserId, to: Email) { /* ... */ }

const uid = createUserId('abc-123-...'); // 经过校验
const em = createEmail('a@b.com');       // 经过校验

sendInvite(uid, em);                      // OK
sendInvite('raw-string', 'x@y');          // ❌ string 不能直接传
```

`__brand` 字段是"虚拟"的——它在运行时不存在（`as` 断言），但在编译期让类型系统能区分 `string` 与 `UserId`。

这一招让"经过校验的字符串"和"未经校验的字符串"在类型层不可互换。是抵御"忘了校验"类 bug 的利器。

## 用条件类型表达"X 时必有 Y"

某些业务规则可以用条件类型表达：

```ts
type Article =
  & { id: string; title: string }
  & (
    | { status: 'draft'; publishedAt?: never }
    | { status: 'published'; publishedAt: Date }
  );

const a1: Article = { id: '1', title: 'X', status: 'draft' };                    // OK
const a2: Article = { id: '2', title: 'Y', status: 'published', publishedAt: new Date() }; // OK
const a3: Article = { id: '3', title: 'Z', status: 'draft', publishedAt: new Date() };     // ❌
const a4: Article = { id: '4', title: 'W', status: 'published' };                          // ❌ 缺 publishedAt
```

`publishedAt?: never` 是一个 trick——它声明"这个字段必须不存在"。在 draft 状态下不允许设 publishedAt；在 published 状态下必须设。

## 类型层面表达权限

```ts
type Role = 'admin' | 'editor' | 'reader';

type Permission =
  | { resource: 'article'; action: 'read' }
  | { resource: 'article'; action: 'write'; role: 'admin' | 'editor' }
  | { resource: 'comment'; action: 'delete'; role: 'admin' };

function can<P extends Permission>(role: Role, perm: P): boolean { /* ... */ }
```

这种用类型预先声明"哪些操作需要什么角色"的设计，能让权限漏洞在编译期被发现（如果配合 lint 规则）。

## 类型驱动设计的回报

把这些工具合起来，可以做出非常稳健的领域模型。一个典型的"类型驱动设计"项目，运行时代码会有这些特点：

1. **大量的 if-null 检查消失**——类型已经保证了字段存在；
2. **大量的"状态合法性检查"消失**——类型不允许传入非法状态；
3. **大量的字符串校验"调用点"消失**——品牌类型让校验只发生在边界；
4. **业务规则在类型里"自我文档化"**——读类型就知道规则。

代价是：**学习成本**。新人加入这种代码库，需要先熟悉这套类型表达方式。但只要团队稳定，这种成本是一次性的。

## 什么时候不该这么做

类型驱动设计很强，但不是万能。下面是几个该克制的场景：

1. **业务规则还在频繁变化**：每次规则变都要重写类型，反而拖慢迭代；
2. **团队 TS 水平参差**：太复杂的类型让初级成员不敢改代码；
3. **类型复杂度超过运行时代码本身**：类型应该服务于代码，不应该反过来。

经验法则：**先把核心业务模型类型化**（订单状态、用户角色、权限），其他地方按需。不要一开始就给整个项目做类型体操，那是负担不是资产。

## 一个综合例子：评论审核流

最后用一个相对完整的例子收尾——评论审核流：

```ts
type Comment =
  | { id: string; status: 'pending'; content: string; authorId: UserId }
  | { id: string; status: 'approved'; content: string; authorId: UserId; approvedAt: Date; approvedBy: UserId }
  | { id: string; status: 'rejected'; content: string; authorId: UserId; rejectedAt: Date; rejectionReason: string };

function approve(
  comment: Comment & { status: 'pending' },
  approver: { id: UserId; role: 'admin' | 'moderator' }
): Comment & { status: 'approved' } {
  return {
    ...comment,
    status: 'approved',
    approvedAt: new Date(),
    approvedBy: approver.id,
  };
}

function reject(
  comment: Comment & { status: 'pending' },
  approver: { id: UserId; role: 'admin' | 'moderator' },
  reason: string
): Comment & { status: 'rejected' } {
  return {
    ...comment,
    status: 'rejected',
    rejectedAt: new Date(),
    rejectionReason: reason,
  };
}
```

读这一段，整个业务规则一目了然：

- 评论只有三种状态；
- 每种状态必有特定字段；
- 只有 pending 评论可以被审核；
- 只有 admin / moderator 角色可以审核。

整个领域模型在 30 行代码里被精确表达。

## 本章小结

类型驱动设计的核心是用类型表达业务不变量——让坏状态在编译期不可能存在。判别联合、品牌类型、条件类型、Mapped Types 共同构成了表达不变量的工具箱。

至此本系列六章完结。从基础回顾、到条件类型、到模板字面量、到 Mapped Types、到判别联合、到业务不变量——你已经看到了 TS 类型系统的全貌，以及它如何从"标注工具"变成"设计工具"。

类型不是负担，是一种思考的形式。希望本系列能让你在下一个项目里，写代码之前先想清楚类型。
