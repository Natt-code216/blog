---
order: 3
title: 模板字面量类型
est_read_minutes: 12
---

# 模板字面量类型

TypeScript 4.1 引入了模板字面量类型——它让你能在**类型层面**做字符串拼接、解析、变换。这件事在 4.1 之前几乎是不可想象的。

本章把这套机制讲清楚，并展示几个真实场景。

## 基本语法

模板字面量类型用 `` ` ` `` 反引号包裹，和 JS 的模板字符串完全一样：

```ts
type Greeting = `Hello, ${string}`;

const a: Greeting = 'Hello, World'; // OK
const b: Greeting = 'Hi';           // ❌
```

`${string}` 是一个占位符，可以匹配任何字符串。

如果用字面量联合替换 `string`，就能精确枚举：

```ts
type Direction = 'top' | 'bottom' | 'left' | 'right';
type Edge = `padding-${Direction}`;
// 'padding-top' | 'padding-bottom' | 'padding-left' | 'padding-right'
```

注意这个"分发"行为——和条件类型一样，TS 自动把每个联合分支独立处理。

## 笛卡尔积

两个联合相乘，得到所有组合：

```ts
type Size = 'sm' | 'md' | 'lg';
type Color = 'red' | 'blue';
type ClassName = `text-${Color}-${Size}`;
// 'text-red-sm' | 'text-red-md' | 'text-red-lg' | 'text-blue-sm' | ...
```

这是模板字面量类型最让人惊叹的地方——一行代码生成数十个精确字面量。

实际项目里这种用法可以让 utility class 命名变成 type-safe：

```ts
type Spacing = 0 | 1 | 2 | 3 | 4 | 5;
type Direction = 't' | 'b' | 'l' | 'r' | 'x' | 'y';
type SpacingClass = `p${Direction}-${Spacing}` | `m${Direction}-${Spacing}`;

function applyClass(cls: SpacingClass) { /* ... */ }

applyClass('pt-2');   // OK
applyClass('px-5');   // OK
applyClass('pt-9');   // ❌
applyClass('hello');  // ❌
```

Tailwind 风格的 utility class 完全可以这样 type-safe 化。

## infer 与模板字面量

模板字面量类型与 `infer` 结合，能做字符串**解析**：

```ts
type ExtractName<T> = T extends `Hello, ${infer Name}` ? Name : never;

type A = ExtractName<'Hello, World'>;  // 'World'
type B = ExtractName<'Hi, World'>;     // never
```

这一段做的事：

1. 检查 T 是否匹配 `Hello, ${infer Name}` 模式；
2. 如果匹配，把 `${infer Name}` 那部分捕获并命名为 `Name`；
3. 返回 `Name`。

## 实战一：CSS 单位

把 CSS 值的解析做成 type-safe：

```ts
type CSSUnit = 'px' | 'em' | 'rem' | '%';
type CSSValue = `${number}${CSSUnit}`;

type ExtractUnit<T> =
  T extends `${number}${infer U}`
    ? U extends CSSUnit ? U : never
    : never;

type U1 = ExtractUnit<'12px'>;    // 'px'
type U2 = ExtractUnit<'1.5rem'>;  // 'rem'
type U3 = ExtractUnit<'10'>;      // never
```

## 实战二：路径参数提取

很多框架（如 React Router）允许定义动态路径 `/users/:id/posts/:postId`。我们可以在类型层面把参数名提取出来：

```ts
type ExtractParams<P> =
  P extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : P extends `${string}:${infer Param}`
      ? Param
      : never;

type P1 = ExtractParams<'/users/:id'>;
// 'id'

type P2 = ExtractParams<'/users/:id/posts/:postId'>;
// 'id' | 'postId'
```

然后让 `navigate` 函数 type-safe：

```ts
function navigate<P extends string>(
  path: P,
  params: Record<ExtractParams<P>, string>
) { /* ... */ }

navigate('/users/:id', { id: '42' });                       // OK
navigate('/users/:id/posts/:postId', { id: 'a', postId: 'b' }); // OK
navigate('/users/:id', { id: '42', foo: 'bar' });           // ❌ foo 不是 :id 的参数
navigate('/users/:id', {});                                  // ❌ 缺 id
```

这个 30 行代码的类型工具，能让你整个项目的路由跳转变成 type-safe。React Router 6.6+ 已经内置了类似机制。

## 内置工具：Capitalize / Uppercase / Lowercase / Uncapitalize

TS 内置了四个字符串变换工具：

```ts
type A = Uppercase<'hello'>;     // 'HELLO'
type B = Lowercase<'HELLO'>;     // 'hello'
type C = Capitalize<'hello'>;    // 'Hello'
type D = Uncapitalize<'Hello'>;  // 'hello'
```

它们配合模板字面量类型可以做"自动生成方法名"：

```ts
type Getter<K extends string> = `get${Capitalize<K>}`;

type G = Getter<'name'>;  // 'getName'
type G2 = Getter<'firstName'>; // 'getFirstName'
```

这种"从字段名自动生成 getter 名"的技巧，在做 ORM、状态管理库时非常有用。

## 实战三：事件名解析

React 的事件名（如 `onClick`、`onMouseEnter`）有规律可循。我们可以做一个"事件名 → 原生事件类型"的映射：

```ts
type EventNameToType<T> = T extends `on${infer E}`
  ? Lowercase<E>
  : never;

type E1 = EventNameToType<'onClick'>;       // 'click'
type E2 = EventNameToType<'onMouseEnter'>;  // 'mouseenter'
```

或者反过来——从事件类型生成事件 prop 名：

```ts
type EventToProp<E extends string> = `on${Capitalize<E>}`;

type P1 = EventToProp<'click'>;      // 'onClick'
type P2 = EventToProp<'mouseenter'>; // 'onMouseenter'
```

## 字符串分割（递归类型）

把字符串按分隔符分割成元组：

```ts
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : [S];

type A = Split<'a,b,c,d', ','>;  // ['a', 'b', 'c', 'd']
type B = Split<'foo.bar.baz', '.'>; // ['foo', 'bar', 'baz']
```

注意这是**递归类型**。它在每一步把字符串拆成 "Head + Tail"，然后对 Tail 递归。TS 对递归类型有深度限制（默认 1000 层），所以不要对超大字符串做这种处理。

## Join：反向操作

把元组拼回字符串：

```ts
type Join<T extends string[], D extends string> =
  T extends [infer First extends string, ...infer Rest extends string[]]
    ? Rest extends []
      ? First
      : `${First}${D}${Join<Rest, D>}`
    : '';

type A = Join<['a', 'b', 'c'], '-'>; // 'a-b-c'
type B = Join<['foo', 'bar'], '.'>;   // 'foo.bar'
```

## 一个高阶用法：snake_case ↔ camelCase

```ts
type SnakeToCamel<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Head}${Capitalize<SnakeToCamel<Tail>>}`
    : S;

type A = SnakeToCamel<'user_first_name'>; // 'userFirstName'
type B = SnakeToCamel<'order_total'>;     // 'orderTotal'
```

这种类型在做 API 客户端时极其有用——后端用 snake_case，前端用 camelCase，类型层可以自动转换。

## 性能与限制

模板字面量类型虽然强，但也有限制：

1. **复杂度有上限**：太大的笛卡尔积（如 50×50×50）会让编译变慢甚至崩溃；
2. **递归深度限制**：默认 1000 层，超过会报错"Type instantiation is excessively deep"；
3. **可读性挑战**：复杂的模板字面量类型对新人很不友好。

经验法则：用它解决"字符串模式天然就有规律"的问题（路径、CSS 单位、事件名）；不要为了炫技把简单问题做成模板字面量。

## 本章小结

模板字面量类型让字符串成为类型计算的对象。它最有价值的场景是：路径参数、CSS 类名、事件名、命名变换——所有"字符串有可预测模式"的地方。

下一章我们看类型系统里的另一根支柱——**Mapped Types**。它和模板字面量类型结合时威力极大，是高级类型工具的核心。

## 一个 trick：把字符串变量当类型用

最后再补一个看似魔法的 TS 特性——`const` 断言：

```ts
const routes = ['home', 'user', 'about'] as const;
type Route = typeof routes[number];
// Route = 'home' | 'user' | 'about'
```

`as const` 让 routes 的类型从 `string[]` 变成 `readonly ['home', 'user', 'about']`。然后 `typeof routes[number]` 把元素类型抽出，得到字面量联合。

这种"定义一次，类型与值同步"的模式，能让你避免在两个地方维护同一份枚举。在配置表、路由表、状态列表等场景里反复出现。一旦掌握 `as const` + `typeof` + `[number]` 这三件套，许多看起来需要重复定义的枚举都可以收敛到一个地方。
