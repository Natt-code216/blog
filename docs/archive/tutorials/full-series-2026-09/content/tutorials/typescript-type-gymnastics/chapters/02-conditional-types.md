---
order: 2
title: 条件类型
est_read_minutes: 12
---

# 条件类型

条件类型是 TypeScript 真正的"图灵完备"分水岭。它让类型系统从"标注"升级为"计算"——你可以写一段类型代码，让它根据输入产生不同的输出。

本章把条件类型的核心机制讲清楚：基本语法、`infer`、分布式条件类型。

## 基本语法：T extends X ? A : B

条件类型的形态非常像三元运算符：

```ts
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>; // true
type B = IsString<42>;      // false
```

这一段做的事：检查类型 `T` 能否赋给 `string`；能就返回 `true`，否则返回 `false`。

`extends` 在这里的语义是"是否兼容"，不是"是否继承"。任何 TS 的赋值兼容关系都可以用 `extends` 测。

## 真实例子：NonNull

`NonNull<T>` 移除 T 中的 null 和 undefined：

```ts
type NonNull<T> = T extends null | undefined ? never : T;

type X = NonNull<string | null>;       // string
type Y = NonNull<number | undefined>;  // number
type Z = NonNull<string | undefined | null>; // string
```

注意它能在联合类型上"逐项处理"——`string | null` 被拆成 `string` 和 `null`，分别走条件分支。这是**分布式条件类型**，下面会展开。

## infer：在条件中提取子类型

`infer` 是条件类型最强大的子能力——它在 `extends` 分支里**捕获并命名一个子类型**：

```ts
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type A = ReturnType<() => string>;         // string
type B = ReturnType<(x: number) => boolean>; // boolean
type C = ReturnType<number>;               // never（不是函数）
```

读法：T 是否兼容"接受任意参数、返回 R 的函数"？如果是，把那个 R 拿出来——这就是 ReturnType。

`infer` 不只用于函数返回值，可以用于几乎任何类型的"子部分提取"：

```ts
// 提取数组元素类型
type ElementOf<T> = T extends (infer E)[] ? E : never;
type N = ElementOf<number[]>; // number

// 提取 Promise 解决值类型
type Awaited<T> = T extends Promise<infer V> ? V : T;
type R = Awaited<Promise<string>>; // string
type R2 = Awaited<number>;         // number（不是 Promise 直接返回）

// 提取构造函数参数
type ConstructorParams<T> = T extends new (...args: infer P) => any ? P : never;
type P = ConstructorParams<typeof Date>; // [] | [string | number | Date]
```

`infer` 让"从一个复杂类型里抠出某一部分"变得几乎像写正则。

## 分布式条件类型

当条件类型作用在**联合类型**上时，TS 会把它**自动分发**到每一项：

```ts
type ToArray<T> = T extends any ? T[] : never;

type X = ToArray<string | number>;
// 等价于 ToArray<string> | ToArray<number>
// = string[] | number[]
```

注意它**不是** `(string | number)[]`，而是 `string[] | number[]`。这种"分发"是默认行为，对每个联合分支独立判断。

如果你不想要分布式行为，可以用 `[T]` 包起来：

```ts
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;

type Y = ToArrayNonDist<string | number>;
// = (string | number)[]
```

这个 `[T]` 的小 trick 让条件类型作为"整体"判断，而不是分发。

## Exclude 与 Extract：内置的分布式工具

TS 内置了几个非常有用的分布式条件工具：

```ts
type Exclude<T, U> = T extends U ? never : T;
type Extract<T, U> = T extends U ? T : never;

type A = Exclude<'a' | 'b' | 'c', 'a'>; // 'b' | 'c'
type B = Extract<'a' | 'b' | 'c', 'a' | 'd'>; // 'a'
```

`Exclude` 从联合中移除某些成员；`Extract` 保留交集。它们看起来朴素，但在实际项目里反复出现。

```ts
type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE';
type Mutating = Exclude<Methods, 'GET'>; // 'POST' | 'PUT' | 'DELETE'
type SafeMethods = Extract<Methods, 'GET' | 'HEAD'>; // 'GET'
```

## 实战：把"或"翻译成"分发"

来看一个真实的工具：从 `Promise<X> | Y` 中"拨开" Promise，得到 `X | Y`：

```ts
type UnwrapPromise<T> = T extends Promise<infer V> ? V : T;

type A = UnwrapPromise<Promise<string>>;            // string
type B = UnwrapPromise<number>;                      // number
type C = UnwrapPromise<Promise<string> | number>;    // string | number
```

第三个例子最值得品。`Promise<string> | number` 是联合，条件类型分发到每一项：
- `UnwrapPromise<Promise<string>>` → `string`
- `UnwrapPromise<number>` → `number`
合起来得 `string | number`。

这种"对联合的每一项独立思考"是写复杂类型时最关键的心智模型。

## 条件类型的链式

条件可以嵌套：

```ts
type ToString<T> =
  T extends string ? T :
  T extends number ? `${T}` :
  T extends boolean ? `${T}` :
  T extends null ? 'null' :
  T extends undefined ? 'undefined' :
  string;

type A = ToString<42>;     // '42'
type B = ToString<true>;   // 'true'
type C = ToString<null>;   // 'null'
```

链式条件类型本质上就是一个"模式匹配"——按顺序尝试，第一个匹配的分支决定返回值。

## 一个高阶应用：函数柯里化

来看一个稍复杂的例子——把函数签名"柯里化"：

```ts
type Curried<F> =
  F extends (a: infer A, ...rest: infer R) => infer Ret
    ? R extends []
      ? (a: A) => Ret
      : (a: A) => Curried<(...args: R) => Ret>
    : never;

type Original = (a: number, b: string, c: boolean) => Date;
type C = Curried<Original>;
// = (a: number) => (b: string) => (c: boolean) => Date
```

这一段做的事：

1. 从原函数中 infer 出第一个参数 A、剩下参数 R、返回值 Ret；
2. 如果 R 为空，说明这是最后一个参数，返回 `(a: A) => Ret`；
3. 否则，返回 `(a: A) => Curried<...>`，递归处理剩下的参数。

读起来抽象，但它精确表达了"柯里化后的签名长什么样"——这种"用类型描述函数签名变换"是大型库（如 RxJS、io-ts）里大量使用的技巧。

## 何时**不**用条件类型

条件类型很强，但不是越多越好。下面是几个该克制的场景：

1. **能用普通泛型就别用条件类型**：`function map<T>(arr: T[]): T[]` 不需要写成条件类型；
2. **三层以上嵌套时停一停**：如果一个条件类型需要嵌三层，绝大多数情况下能拆成多个 helper 类型；
3. **错误信息可读性差时换思路**：当条件类型出错时报错信息常常很长。如果团队成员看不懂报错，可读性已经先于"巧妙"输了。

## 本章小结

条件类型让 TS 类型系统从"标注"变成"计算"。核心机制是 `extends` 三元、`infer` 子类型捕获、分布式联合。一旦理解这三件事，TS 内置的几乎所有工具类型（Exclude、Extract、ReturnType、Parameters、Awaited）都能自己写出来。

下一章我们看类型系统的另一个奇迹——**模板字面量类型**。它让字符串也变成可被类型计算的对象。

## 关于 distributive 与 non-distributive 的选择

最后留一个判断标准：什么时候应该让条件类型保持 distributive，什么时候用 `[T]` 抑制？

- **想要"逐项处理"语义** → 保持 distributive（如 NonNull、Exclude）；
- **想要"整体判断"语义** → 用 `[T]` 抑制（如判断"是否为联合类型"、"是否完全等价于某个类型"）。

```ts
// 判断 T 是否是联合类型
type IsUnion<T, U = T> = T extends U ? ([U] extends [T] ? false : true) : never;

type A = IsUnion<string | number>; // true
type B = IsUnion<string>;          // false
```

这种"利用 distributive 的副作用"是写复杂类型时的常见模式，值得理解。
