---
order: 2
title: 目录与别名
est_read_minutes: 12
---

# 目录与别名

一个项目能不能稳定地长大，目录结构是第一道门槛。本章给一份"够小、够清晰、能用三年"的初始目录，并讲清楚 path alias 怎么配。

## 一份开箱即用的初始结构

```
src/
├── main.tsx              # 入口，挂载 React
├── App.tsx               # 顶层应用：Router + Layout
├── app/                  # 全局基础设施
│   ├── router.tsx        # 路由配置
│   ├── providers.tsx     # 全局 Provider 组合
│   └── theme.ts          # 主题 token
├── features/             # 按业务切片（参考"现代前端架构"教程 §2）
│   └── ...
├── pages/                # 仅做"路由 → feature 入口"的胶水
│   ├── HomePage.tsx
│   └── ...
├── shared/               # 跨 feature 复用
│   ├── components/       # 通用 UI 原子（Button, Modal）
│   ├── hooks/            # 通用 hook（useDebounce）
│   ├── utils/            # 纯函数工具
│   └── types/            # 跨 feature 复用的类型
├── services/             # API client（axios / fetch 封装）
├── styles/               # 全局样式 + tokens
│   ├── tokens.css
│   ├── reset.css
│   └── global.css
└── vite-env.d.ts         # Vite 注入的类型
```

这套结构的特点：

- **app/ 是基础设施层**——路由、provider、theme。每个项目都需要。
- **features/ 是业务领域层**——所有业务代码都进这里。
- **pages/ 只是胶水**——一个文件 5–20 行，进路由、调 feature 入口。
- **shared/ 是真正的"通用"**——能不能放进 shared 的判断标准是"是否被 ≥3 个 feature 使用"。
- **services/ 是数据出口**——所有 fetch / axios 调用都从这里走。

注意 `pages/` 和 `features/` 的关系：pages 是路由表的最薄层，真正的代码都在 features 里。这样路由表始终保持简单、可一眼读完。

## 配置 path alias

`@/` alias 让 import 路径变可读：

```ts
// 之前
import Button from '../../../shared/components/Button';

// 之后
import Button from '@/shared/components/Button';
```

Vite 和 TypeScript 都要分别配置（它们彼此独立）。

**vite.config.ts**：

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**tsconfig.json**：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

两边都要配——Vite 用 resolve.alias 在打包时解析；TypeScript 用 paths 在类型检查时解析。漏掉任何一边，要么 build 失败，要么 IDE 报红线。

## 多个 alias：按层级而非按目录

新人常犯的错误是为每个目录都建一个 alias：`@components`、`@hooks`、`@utils`、`@services`。这种做法长期来看是个负担——alias 数量很快超过 10 个，维护成本陡升，且 IDE 自动补全变得混乱。

更稳的做法：只用一个 `@`，让目录结构本身去做表达：

```ts
import Button from '@/shared/components/Button';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { api } from '@/services/api';
import { OrderTable } from '@/features/order';
```

这种风格让 import 路径就是项目结构图——一眼能看出"这个东西来自项目的哪个层级"。

## 真正值得加的 alias

如果一定要加多个 alias，下面两个有真实价值：

```ts
'@': path.resolve(__dirname, './src'),
'#': path.resolve(__dirname, './node_modules'),
'~': path.resolve(__dirname, './public'),  // 比如引用 SVG
```

`@` 指向源码、`#` 指向依赖、`~` 指向公共资源。各司其职。但这种用法在生态里不算主流，加之前确认团队会接受。

## tsconfig 的几个关键选项

新人最容易跑错的就是 tsconfig。下面是一份够用的初始配置：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],

    "jsx": "react-jsx",
    "useDefineForClassFields": true,

    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,

    "isolatedModules": true,
    "skipLibCheck": true,

    "allowImportingTsExtensions": true,
    "noEmit": true,

    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,

    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

逐项说明几个关键的：

- **`strict: true`**：开启所有严格检查。这是不可妥协的，不开 strict 等于不用 TS。
- **`isolatedModules: true`**：保证每个文件可以独立被 esbuild 编译。Vite 必需。
- **`moduleResolution: "Bundler"`**：让 TS 用与 Vite 一致的模块解析规则。
- **`skipLibCheck: true`**：跳过对依赖包类型的检查。能让类型检查快 5–10 倍。
- **`noUncheckedSideEffectImports: true`**：禁止类似 `import './polyfill'` 这种没有显式声明副作用的导入。

## 别名 + 多模块项目（monorepo）

如果是 pnpm workspace + monorepo 结构，alias 要换成 workspace 引用：

```json
// package.json
{
  "dependencies": {
    "@org/shared": "workspace:*"
  }
}
```

```ts
import { Button } from '@org/shared';
```

这种做法把"共享代码"做成实际的 npm 包，每个 workspace 独立 lock 版本。比单一仓库的 `@/shared` 更适合多团队协作。

## 何时该重组目录

最后给一个判断标准：什么时候应该重新组织目录？

- 当 features/ 下出现超过 10 个目录，且需要分组（如按业务域分）；
- 当 shared/ 下的代码总量超过 features/ 任何一个，意味着"shared"已经不再 shared；
- 当新人入职前两周问的问题中，"X 应该放哪里"占据明显比例；
- 当某个 PR 涉及超过 30 个文件改动，且这些文件分散在 5 个以上目录。

任何一个信号都意味着目录结构开始失去自解释能力，值得重新设计。

## 本章小结

一份能用三年的目录结构核心是分层：app（基础设施）/ features（业务）/ pages（路由胶水）/ shared（通用）/ services（数据出口）/ styles（样式）。配合一个 `@` alias 和严格的 tsconfig，新项目可以在 30 分钟内搭出干净的初始骨架。

下一章我们讨论样式方案——为什么 CSS Module 在 Vite 生态里仍然是稳妥选择，以及 PostCSS 怎么配。

## 关于 barrel files（`index.ts` 重导出）

最后讨论一个长期有争议的小话题：要不要在每个目录里放一个 `index.ts` 做重导出？

```ts
// shared/components/index.ts
export { Button } from './Button';
export { Modal } from './Modal';
export { Input } from './Input';
```

好处：让外部 import 看起来更整洁——`import { Button, Modal } from '@/shared/components'`。

坏处也很现实：

1. **tree-shaking 风险**：barrel 让打包工具难以判断哪些导出真的被用到，可能让整个文件都被拉进 bundle；
2. **循环引用风险**：barrel 容易意外引入循环依赖；
3. **类型检查变慢**：TS 解析 barrel 的成本比直接 import 高。

我的偏好：**只在 features 的对外 index.ts 用 barrel**（作为"公开契约"，前一章已经说过），其他地方都直接 import 具体文件。这样既保留 barrel 在边界处的语义价值，又避免它带来的性能与维护成本。

## 关于 absolute import 的相对边界

最后再补一条经验：alias `@/` 的好处虽然多，但**同一个 feature 内部的 import 应该用相对路径**。

```ts
// features/order/components/OrderTable.tsx
import { useOrderList } from '../hooks/useOrderList';  // 推荐
// 不要写 import { useOrderList } from '@/features/order/hooks/useOrderList';
```

相对路径在 feature 内部让 import 表达"这是同一个领域的近邻"，移动 feature 整个目录时不需要修改任何 import。这是一种"在边界处用绝对、在边界内用相对"的微观品味。
