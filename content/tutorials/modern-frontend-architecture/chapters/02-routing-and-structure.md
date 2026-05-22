---
order: 2
title: 路由与目录组织
est_read_minutes: 14
---

# 路由与目录组织

如果说上一章在解释"为什么需要架构"，这一章就要落到第一个具体决定：**项目的目录怎么组织**。

这个问题听起来简单，几乎所有 React / Vue 项目的第一份目录结构都长得差不多——`components/`、`pages/`、`hooks/`、`utils/`、`api/`。我们把这种结构叫做**按类型分类**（type-based）。它在前一百个文件里表现极好，但到第五百个文件就会开始崩。

本章讨论为什么会崩、应该怎么改、怎么从旧结构平滑过渡到新结构。

## 按类型分类（type-based）：从哪里开始坏的

按类型分类的目录大致长这样：

```
src/
├── components/
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── OrderTable.tsx          ← 业务组件混在通用组件里
│   ├── ProductCard.tsx
│   ├── UserAvatar.tsx
│   └── ... 大约 80 个
├── hooks/
│   ├── useDebounce.ts
│   ├── useOrderList.ts          ← 通用 hook 与业务 hook 混在一起
│   ├── useUser.ts
│   └── ... 大约 40 个
├── utils/
├── api/
└── pages/
```

它的初始体验非常好：
- 入门成本低（每个新人都能猜到 `components/` 里是组件）；
- 工具默认（脚手架生成的目录都是这样）；
- 单文件视图友好（你想找一个组件，文件名搜索就够了）。

但它的成本是**滞后**的：

**1. 业务边界看不见**
打开 `components/`，无法判断哪些是订单相关、哪些是商品相关、哪些是通用 UI。你必须读文件名，甚至读内容才能知道。

**2. 改动放大**
要给"订单"加一个新功能，你要同时在 `components/`、`hooks/`、`api/`、`store/`、`utils/` 各加一个文件。这五处文件没有共同的目录归属，任何一处遗漏都不会有人提醒你。

**3. 删除困难**
"订单"模块下线了，要把所有相关代码删干净，必须在每个目录里手工识别。删错了不会立刻报错，要等到运行时才知道。

**4. 复用边界模糊**
`OrderTable` 是否可以被"采购"模块复用？理论上可以，但实际操作中没人敢——它跟订单的数据结构耦合得很深。这种隐性耦合在按类型分类的结构里是不可见的。

## 按业务切片（feature-based）：另一种结构

成熟的中大型项目，几乎都会逐步演化到一种叫"按业务切片"的结构。它的核心是：**每一个业务领域是一个独立的、自包含的目录**。

```
src/
├── features/
│   ├── order/
│   │   ├── components/
│   │   │   ├── OrderTable.tsx
│   │   │   └── OrderStatusBadge.tsx
│   │   ├── hooks/
│   │   │   └── useOrderList.ts
│   │   ├── api/
│   │   │   └── orderApi.ts
│   │   ├── types.ts
│   │   └── index.ts            ← 对外契约入口
│   ├── product/
│   │   └── ... 同样结构
│   └── user/
│       └── ... 同样结构
├── shared/
│   ├── components/             ← 真正通用的 UI 原子（Button, Modal）
│   ├── hooks/                  ← 真正通用的 hook（useDebounce）
│   └── utils/
├── app/                        ← 路由、布局、全局 provider
└── pages/                      ← 仅做路由 → feature 入口的胶水
```

这种结构的核心好处可以一句话总结：**业务边界与目录边界一致**。

- 找一个功能，从根目录走到 `features/<name>/`，所有相关代码都在那里；
- 删一个功能，整个目录删掉，不会有遗骸；
- 引入限制，可以用 lint 规则禁止 `features/order/` 引用 `features/product/`，强制跨业务通信走显式 API。

## 一条关键的 lint 规则

按业务切片不是把目录换个名字就完了。它需要一条**可被工具校验**的边界规则：

```js
// .eslintrc 中（使用 eslint-plugin-import 或 boundaries 插件）
'import/no-restricted-paths': ['error', {
  zones: [
    {
      target: './src/features/order/**',
      from: './src/features/!(order)/**',
      message: 'order feature 不应直接引用其他 feature。请通过 index.ts 暴露的公开 API。'
    },
    // 类似地为每个 feature 加一条
  ],
}]
```

这条规则把"边界"从口头约定变成了 lint 失败。它是按业务切片落地最关键的一步——没有这条规则，开发者只是把代码"放在了 features/order 文件夹里"，但其实仍然在到处随意 import。

## index.ts：feature 的公开契约

每个 feature 都应该有一个 `index.ts`，它是这个 feature 对外的**唯一**入口。

```ts
// features/order/index.ts
export { OrderTable } from './components/OrderTable';
export { useOrderList } from './hooks/useOrderList';
export type { Order, OrderStatus } from './types';

// 注意：OrderStatusBadge 没有导出，因为它只在 OrderTable 内部使用
// useOrderListInternal 也没有导出，因为它是实现细节
```

外部代码只能从 `features/order` 引用，不能 `features/order/components/OrderStatusBadge`。这条 lint 规则也可以强制：

```js
'import/no-internal-modules': ['error', {
  forbid: ['features/*/**'],   // 禁止深入 feature 内部
}]
```

这一步带来的好处巨大：feature 的内部实现可以自由重构，只要对外 export 不变；feature 的演进路径自然形成。

## 从按类型迁移到按业务：怎么不一次性翻车

如果你已经有一个按类型分类的项目，迁移不是一次大爆炸式重写。下面是一条相对安全的路径：

1. **建 `features/` 目录但先空着**——不强制使用。
2. **下一次有新业务模块的时候**，把它直接建在 `features/<name>/` 里，并写好 `index.ts`。
3. **下一次有旧模块的大改动时**，借势把它整理进 `features/`。
4. **每次评审 PR 时，把"是否进了 features/"列入评审项**。
5. 半年到一年后，大部分活跃模块自然完成迁移。

这种"借势迁移"比集中式重构便宜得多。它的代价是过渡期内两种结构并存——但只要 lint 规则只对 `features/` 内的代码生效，过渡期是无痛的。

## 本章小结

按业务切片不是审美选择，是结构选择。它把"业务边界"从开发者头脑里的模糊知识，变成可见的、可被工具校验的目录形态。代价是要养成一套配套的纪律——`index.ts` 公开契约、跨 feature 引用限制、共享代码上沉到 `shared/`。

下一章我们讨论 feature 内部的另一条主线：**状态分层**。把"哪些状态属于哪一类"想清楚，组件之间的通信复杂度可以直接砍掉一半。

## 关于"feature 之间不能直接互相引用"

最后再补充一条经常被新人误解的规则。按业务切片之后，最容易出现的误用是——A feature 直接 import B feature 的某个 hook 来用。

这种用法乍看合理：复用嘛。但它会让 A 与 B 之间形成隐式耦合，B 的任何内部重构都可能打破 A。更好的做法有三种：

1. **真正通用的逻辑，上沉到 `shared/`**——这是默认选择。
2. **跨 feature 的数据通信，走 Server State**——通过同一个 query key，自然共享缓存，不需要直接引用。
3. **如果 A 必须依赖 B，明确把 B 的相关 API 在 B/index.ts 里暴露出来**——这种引用是显式契约，可被工具校验。

总之，feature 之间的关系应该是稀疏的，不是稠密的。稠密关系最后会让"按业务切片"退化回"换了名字的按类型分类"。
