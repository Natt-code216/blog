---
order: 4
title: Mapped Types
est_read_minutes: 12
---

# Mapped Types

Mapped Types 是 TS 类型系统里最优雅的设计之一。它允许你对一个对象类型的**每个字段**做变换，得到一个新的对象类型。

`Partial<T>`、`Required<T>`、`Readonly<T>` 这些内置工具的实现，本质上都是 Mapped Types。本章把它讲清楚，并展示一组真实用法。

## 基本语法

Mapped Types 的核心语法：

```ts
type MapOver<T> = {
  [K in keyof T]: T[K];
};
```

`[K in keyof T]` 这种语法读法：

- `keyof T` 是 T 的所有键的联合；
- `K in keyof T` 遍历这个联合；
- `T[K]` 取 T 中对应键的值类型。

合在一起：对 T 的每一个键 K，新类型有同样的键 K，值类型也是 T[K]。这就是恒等映射。

## 内置工具的实现

`Partial<T>`：每个字段变可选：

```ts
type Partial<T> = {
  [K in keyof T]?: T[K];
};

type User = { name: string; age: number };
type PartialUser = Partial<User>;
// { name?: string; age?: number }
```

`Required<T>`：每个字段变必选：

```ts
type Required<T> = {
  [K in keyof T]-?: T[K];
};
```

`-?` 是"移除可选标记"的语法。`+?` 是"添加可选标记"（默认）。

`Readonly<T>`：每个字段变只读：

```ts
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

类似地有 `-readonly` 移除只读。

## 常用变体：DeepPartial

`Partial` 只处理一层。如果想递归处理所有层级：

```ts
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? DeepPartial<T[K]>
    : T[K];
};

type Config = {
  api: { url: string; timeout: number };
  ui: { theme: string; lang: string };
};

type PC = DeepPartial<Config>;
// {
//   api?: { url?: string; timeout?: number };
//   ui?: { theme?: string; lang?: string };
// }
```

这种 DeepPartial 在合并配置、做"局部覆盖"的场景里非常实用。

## as 重命名键

TS 4.1 引入了 `as` 子句，允许在 Mapped Type 中重命名键：

```ts
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type User = { name: string; age: number };
type UserGetters = Getters<User>;
// {
//   getName: () => string;
//   getAge: () => number;
// }
```

这是非常强大的特性。它把"自动生成 getter 类型"这种过去要靠代码生成的事，变成了纯类型计算。

## 过滤字段

利用 `as never` 让某些字段从结果中消失：

```ts
type FilterByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

type Mixed = {
  name: string;
  age: number;
  isAdmin: boolean;
  email: string;
};

type StringFields = FilterByType<Mixed, string>;
// { name: string; email: string }
```

这种"按值类型过滤字段"在做 ORM 时极其有用——例如"找出所有 string 字段做 LIKE 搜索"。

## 反向：根据另一个类型映射

```ts
type FromArray<Keys extends readonly string[], V> = {
  [K in Keys[number]]: V;
};

type Status = FromArray<['pending', 'paid', 'cancelled'], boolean>;
// { pending: boolean; paid: boolean; cancelled: boolean }
```

`Keys[number]` 是把数组类型转成元素联合的常用技巧。

## 与条件类型结合

Mapped Types 内部可以用条件类型，对每个字段做不同处理：

```ts
type Nullable<T> = {
  [K in keyof T]: T[K] extends Function ? T[K] : T[K] | null;
};

type User = {
  name: string;
  age: number;
  greet: () => void;
};

type N = Nullable<User>;
// {
//   name: string | null;
//   age: number | null;
//   greet: () => void;  ← 函数不被加 | null
// }
```

这种"对字段值有选择地变换"是大量真实工具的核心。

## 一个综合例子：React Props

React 组件的 Props 经常需要这样的处理：

- 把所有 callbacks 标记为可选；
- 把 children 单独处理；
- 把 ref 单独处理。

可以用 Mapped Types 表达：

```ts
type IsFunction<T> = T extends (...args: any[]) => any ? true : false;

type EnhancedProps<P> = {
  [K in keyof P as K extends 'children' | 'ref' ? never : K]:
    IsFunction<P[K]> extends true ? P[K] | undefined : P[K];
};
```

读法：

- 跳过 `children` 和 `ref`（通过 `as never` 过滤）；
- 对其他字段：如果是函数，加 `| undefined`；否则保留原类型。

## 实战：API 响应转 form 状态

经常需要把"API 数据形态"转成"表单字段形态"：API 返回 `User = { name: string; age: number }`，表单需要 `{ name: { value: string; touched: boolean; error?: string }; age: ... }`。

```ts
type Field<T> = {
  value: T;
  touched: boolean;
  error?: string;
};

type ToForm<T> = {
  [K in keyof T]: Field<T[K]>;
};

type User = { name: string; age: number };
type UserForm = ToForm<User>;
// {
//   name: Field<string>;
//   age: Field<number>;
// }
```

这种类型让"API 模型 → 表单模型"的样板代码直接消失。

## 工具类型回顾：所有内置 Mapped Types

TS 内置的常用 Mapped Types：

```ts
Partial<T>          // 所有字段可选
Required<T>         // 所有字段必选
Readonly<T>         // 所有字段只读
Pick<T, K>          // 挑出某些字段
Omit<T, K>          // 排除某些字段
Record<K, V>        // 用 K 当键、V 当值

Exclude<T, U>       // 联合中排除某项
Extract<T, U>       // 联合中保留某项

ReturnType<T>       // 函数返回值
Parameters<T>       // 函数参数（元组）
InstanceType<T>     // 类的实例类型
ConstructorParameters<T>

Awaited<T>          // 解开 Promise
```

每一个都值得熟悉。它们在真实代码中出现的频率，比你想象的高得多。

## Pick 与 Omit 的实现

来看 `Pick` 和 `Omit` 是怎么实现的：

```ts
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

`Pick` 只对 `K` 中的键做映射，所以结果只保留这些字段。`Omit` 用 `Exclude` 把不要的键去掉，剩下的传给 `Pick`。

这两个工具能组合的事情非常多：

```ts
type CreateUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateUser = Partial<Omit<User, 'id'>>;
type UserWithoutPassword = Omit<User, 'password'>;
```

## 何时**不**用 Mapped Types

Mapped Types 是强大工具，但有几个该警惕的场景：

1. **简单变换**直接写字面量类型更清晰；
2. **过度递归**会让 TS 编译变慢（特别是 DeepPartial、DeepReadonly）；
3. **错误信息可读性差**——一个映射类型的错误经常报出整张展开后的类型。

经验法则：**当你发现自己在写同一种字段变换三次以上时**，再用 Mapped Type 抽象。

## 本章小结

Mapped Types 让"对每个字段做变换"成为一类正交操作。配合 `as` 重命名键、条件类型分支、模板字面量类型，能表达几乎任何"形状变换"。一个 TS 项目里出现 5–10 处自定义 Mapped Types 是健康的，太多反而是设计过度。

下一章我们换一个视角——**判别联合与状态机**。它把类型的力量带到"流程"层面。

## 一个性能小建议

最后给一个性能小建议：复杂的 Mapped Types（特别是嵌套递归如 DeepPartial）会显著拖慢 TS 编译。如果你的 `tsc --noEmit` 跑超过 30 秒，且项目并不大，常见原因是某个泛型工具被滥用。

排查方法：在 `tsconfig.json` 里加 `"extendedDiagnostics": true`，重新跑 `tsc`，看哪些类型实例化次数最多。一般答案会是少数几个递归类型——把它们简化（如限制递归深度、用具体类型替代泛型）通常能让编译时间立刻砍半。

类型设计要权衡"表达力"与"编译性能"，特别是大型项目里。
