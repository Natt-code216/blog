---
order: 1
title: 基础回顾
est_read_minutes: 12
---

# 基础回顾

本章把后续所有类型体操的"零件"过一遍：`never`、`unknown`、`any` 的差异、类型守卫、字面量类型、类型断言。如果你对这些都熟悉，可以快速扫读；如果不熟悉，请耐心读完——后续章节会反复用到它们。

## any vs unknown vs never

这三个看起来都很"特殊"的类型，含义完全不同：

**`any`**：放弃类型检查。一旦一个值是 `any`，TS 不会对它做任何检查——它可以被赋给任何变量，调用任何方法。`any` 是 TS 的逃生舱，**应该极少使用**。

**`unknown`**：知道这是个值，但不知道是什么。它比 `any` 严格——你不能直接调用它的方法或赋给其他类型，必须先做类型守卫。

**`never`**：永远不会出现的值。函数永远抛异常（不返回）的返回类型；穷尽性检查中"不可能到达"的分支。

```ts
let a: any;
a.foo();          // 编译通过（即便 a 其实是 undefined）
a = 1; a = 'x';   // 任何赋值都行

let b: unknown;
b.foo();          // ❌ 编译错误：必须先窄化类型
if (typeof b === 'object' && b !== null && 'foo' in b) {
  // 这里 b 被窄化为更具体的类型，可以安全访问
}

function fail(msg: string): never {
  throw new Error(msg);
}
```

**经验法则**：
- 用 `unknown` 而不是 `any`，逼自己写类型守卫；
- 用 `never` 表达"这段逻辑不可能到达"，是穷尽性检查的核心；
- `any` 只在边界处（如对接 JS 库）短暂使用，并立即转 `unknown`。

## 字面量类型

字面量类型是把"具体值"当作类型用：

```ts
type Status = 'pending' | 'paid' | 'cancelled';
type Direction = 'up' | 'down' | 'left' | 'right';
type HttpCode = 200 | 201 | 400 | 401 | 404 | 500;
```

它们看起来朴素，但能让运行时的"魔法字符串"变成编译期的有限集合。任何拼错都会立刻报错：

```ts
const status: Status = 'pendng'; // ❌ Type '"pendng"' is not assignable...
```

这是 TS 用得最频繁、最值得普及的特性之一。任何"有限取值"的字段都应该用字面量联合，而非 string。

## 类型守卫

类型守卫是把"宽类型"窄化为"窄类型"的方式。TS 有几种内置的守卫：

```ts
// 1. typeof
function len(x: string | string[]): number {
  if (typeof x === 'string') {
    return x.length; // 这里 x 是 string
  }
  return x.length;   // 这里 x 是 string[]
}

// 2. instanceof
class A { a() {} }
class B { b() {} }
function call(x: A | B) {
  if (x instanceof A) x.a();
  else x.b();
}

// 3. in 操作符
type Cat = { meow: () => void };
type Dog = { bark: () => void };
function speak(x: Cat | Dog) {
  if ('meow' in x) x.meow();
  else x.bark();
}

// 4. 自定义类型守卫
function isString(x: unknown): x is string {
  return typeof x === 'string';
}
function process(input: unknown) {
  if (isString(input)) {
    input.toUpperCase(); // input 在这里是 string
  }
}
```

自定义类型守卫（`x is T` 这种返回值类型）是非常强大的工具——可以把任意复杂的运行时检查"翻译"成类型窄化。

## 穷尽性检查

把字面量联合和 `never` 结合，可以做"穷尽性检查"：

```ts
type Status = 'pending' | 'paid' | 'cancelled';

function describe(s: Status): string {
  switch (s) {
    case 'pending': return '待付款';
    case 'paid':    return '已付款';
    case 'cancelled': return '已取消';
    default:
      const _exhaustive: never = s; // ← 如果上面漏了某个 case，这里报错
      return _exhaustive;
  }
}
```

如果将来给 Status 加了一个 `'refunded'`，但忘了在 switch 里处理，`_exhaustive` 那一行会编译失败——TS 会告诉你"`'refunded'` is not assignable to never"。

这是 TS 一个特别值得记住的模式。每次写 switch 在最末尾加一个 `default` 分支做穷尽性检查，能在维护期挡掉大量遗漏。

## 类型断言：尽量避免

类型断言（`as`）是告诉 TS"我比你更知道这是什么"：

```ts
const el = document.getElementById('app') as HTMLDivElement;
const config = JSON.parse(json) as Config;
```

它本质上是**关闭了对那一行的类型检查**。所以应该极少使用。任何 `as` 都意味着你正在背叛 TS——它要么是真的不可避免（如解析 JSON），要么是你偷懒了。

更好的替代：

```ts
// 不用 as
const el = document.getElementById('app');
if (el instanceof HTMLDivElement) {
  // el 是 HTMLDivElement
}

// 不用 as
function parseConfig(json: string): Config | null {
  const obj = JSON.parse(json);
  if (isConfig(obj)) return obj;  // 用类型守卫
  return null;
}
```

## 数组与元组

数组是同类型元素的集合；元组是固定长度、每个位置类型不同的集合：

```ts
type StringArray = string[];
type Pair = [string, number];      // 元组
type Triple = [string, number, boolean];

const a: StringArray = ['a', 'b'];
const p: Pair = ['x', 1];
// p[0] 是 string，p[1] 是 number
```

元组在解构和返回多个值时特别有用：

```ts
function range(start: number, end: number): [number, number] {
  return [start, end];
}
const [s, e] = range(0, 10);
```

## 可选属性与默认值

```ts
interface User {
  name: string;
  age?: number;            // 可选
  role: 'admin' | 'user';
}

// 默认值通过参数解构
function greet({ name, age = 0 }: User): string {
  return `Hello ${name}, age ${age}`;
}
```

可选属性的隐性事实：`age?: number` 等价于 `age: number | undefined`。意味着你访问 `user.age` 时拿到的可能是 `undefined`，必须做 narrow。

## 函数重载

```ts
function reverse(s: string): string;
function reverse<T>(a: T[]): T[];
function reverse(arg: string | unknown[]): unknown {
  if (typeof arg === 'string') return arg.split('').reverse().join('');
  return [...arg].reverse();
}

const r1 = reverse('abc');     // r1 是 string
const r2 = reverse([1, 2, 3]); // r2 是 number[]
```

重载允许同一个函数对不同输入返回不同类型。但要小心：重载签名和实现签名是分开校验的，只有重载签名对外可见。

## 本章小结

本章过完了类型体操的"零件"：`unknown` 替代 `any`、字面量联合、类型守卫、`never` 与穷尽性检查、类型断言的克制、元组、可选属性、函数重载。

下一章开始进入真正的"体操"——**条件类型**。它让类型系统从"标注"升级为"计算"。

## 关于 satisfies 操作符

最后补一个 TS 4.9 引入的 `satisfies` 操作符——它是类型断言（`as`）的更安全替代。

```ts
const routes = {
  home: '/',
  user: '/user',
  about: '/about',
} satisfies Record<string, string>;

routes.home; // 类型是字面量 '/' ，不是 string
```

`satisfies` 做两件事：

1. **校验**：检查值是否满足某个类型；
2. **保留**：保留值的具体字面量类型，不做窄化。

这是 `as Record<string, string>` 做不到的——`as` 会把字面量类型抹平成 string。任何时候你想"既校验又保留窄类型"，用 `satisfies` 不用 `as`。
