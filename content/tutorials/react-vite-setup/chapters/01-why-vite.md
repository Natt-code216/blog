---
order: 1
title: 为什么选 Vite
est_read_minutes: 12
---

# 为什么选 Vite

React 生态的脚手架变化非常快。从 Create React App (2016) 到 Next.js、Remix、Vite，每一代都对前一代的痛点做了根本性的回应。本章不写"工具大战"，只回答一个问题：当你 2025 年开始一个新项目，**为什么 Vite 是最稳的选择**。

## CRA 时代的问题

CRA 在 2016 年是革命性的——它把 webpack 的复杂配置封装成一行 `create-react-app my-app`。在两三年内，所有 React 开发者的入门体验都被它统一。

但 CRA 的根本架构在 2020 年之后开始过时：

1. **冷启动慢**：项目变大后，CRA 的 webpack dev server 启动要 30s–2min；
2. **HMR 慢**：一个组件改动后，重新编译需要 3–10s；
3. **不可定制**：所有配置被锁在 react-scripts 里。要改？只能 eject，eject 之后就再也回不来了；
4. **生态滞后**：CRA 长期停留在 webpack 4，社区新工具难以集成。

到 2023 年 Facebook 官方在 React 文档里删除了 CRA 的推荐，明确指向"使用 Vite、Next.js、Remix 这类基于 ESM 的工具"。

## Vite 的核心想法

Vite 的革命性想法是：**开发时不打包**。

传统的 webpack 在 dev 模式下，仍然会把所有模块打包成一个或多个 bundle，再让浏览器执行。这意味着：

- 项目变大 → bundle 变大 → 打包时间变长 → 冷启动慢；
- 一个文件变化 → 重新计算依赖图 → 重新打包受影响的 chunk → HMR 慢。

Vite 利用了一个浏览器在 2018 年后才稳定支持的能力——**原生 ESM**。

浏览器现在可以直接 `import` ESM 模块，不需要打包工具把它们合并成一个 bundle。Vite 的 dev server 做的事极其朴素：

1. 浏览器请求 `<script type="module" src="/src/main.tsx">`；
2. dev server 拦截这个请求，把 `.tsx` 实时转换成可执行的 JS（用 esbuild，速度比 babel 快 10–100 倍）；
3. 浏览器解析 main.tsx 里的 import，发起新的请求，比如 `import App from './App.tsx'`；
4. dev server 再拦截、再转换、再返回。

整个过程里**没有"打包"这一步**。每个文件被独立处理，浏览器自己组装依赖图。

这种架构带来的体验：

- **冷启动**：几乎是常量时间——300ms 启动一个项目，无论它有多大；
- **HMR**：单文件粒度，几十毫秒内反映到浏览器。

第一次用 Vite 的人，最常见的反应是"这怎么可能"。但它确实就是这样。

## 与 Next.js 的选择

Vite 和 Next.js 不在同一个层面。

Next.js 是一个**框架**——它带着路由、SSR、API routes、image 组件、layout 系统等一整套东西。它的预设很多，自由度低一些，但适合"做产品站、做电商、做内容驱动的应用"。

Vite 是一个**工具链**——它只管 dev server + 构建。路由、状态管理、数据获取你都自己选。它的预设很少，自由度高，但适合"做单页应用、做内部工具、做有特殊架构需求的项目"。

经验法则：

- 如果你的项目**强依赖 SSR / SEO / 服务端渲染**——选 Next.js；
- 如果你的项目主要是**纯前端 SPA / 内部工具 / 中后台**——选 Vite；
- 如果你想**最大化自由度并接受多搭一些基础设施**——选 Vite。

## 与 Remix / TanStack Start 的选择

Remix 与 TanStack Start 都是更新的"全栈框架"。它们的定位类似 Next.js，但理念有差异——更强调 web standards（Form、Action、Loader）。

对今天大多数中小型项目，这些框架都过重了。如果你的需求只是"一个 React + TypeScript 项目"，Vite 的轻量和稳定是无可替代的优势。

## 第一次启动 Vite

```bash
pnpm create vite@latest my-app -- --template react-ts
cd my-app
pnpm install
pnpm dev
```

四条命令，30 秒之后浏览器里就有了一个跑起来的 React + TS + Vite 项目。

打开生成的 `package.json`：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.x",
    "@types/react-dom": "^18.3.x",
    "@vitejs/plugin-react": "^4.x",
    "typescript": "^5.x",
    "vite": "^5.x"
  }
}
```

这一份初始 package.json 极其干净。没有 react-scripts、没有 eslint-config-react-app、没有几十个隐藏依赖。所有你需要的都在表面，所有不需要的都不在。

## Vite 的代价

诚实地说，Vite 也有代价。

**1. 开发与生产的产物不同**：
- 开发用 esbuild 转 TS / JSX，但不做完整的类型检查；
- 生产用 Rollup 打包。

开发期间 TypeScript 错误**不会阻塞编译**。这意味着你必须在 IDE 或 CI 里单独跑 `tsc --noEmit` 做类型检查。这是新人最常踩的坑——开发跑得好好的，build 时崩了。

**2. 浏览器要支持 ESM**：
- Chrome 61+、Firefox 60+、Safari 11+；
- IE 全系列完全不支持。

如果你的目标用户里有大量 IE 用户，Vite 不合适。但 2025 年仍坚持用 IE 的人，已经接近"考古"级别。

**3. SSR 需要额外搭建**：Vite 默认不带 SSR。要做 SSR，要么用社区方案（vite-plugin-ssr / vike），要么自己写 server。

## 本章小结

Vite 的核心想法是"开发时不打包"。这个想法让 dev server 的体验比传统脚手架快一到两个数量级，且配置极简。代价是必须接受 ESM + 单独跑类型检查 + SSR 需要自己搭。

对绝大多数"React 单页应用 / 内部工具 / 中后台"项目，Vite 是 2025 年的默认选择。下一章我们讨论项目目录怎么组织，以及如何用 path alias 让 import 路径变得可读。

## 关于 Rspack / Turbopack / Rolldown

最后简短提一下 2024–2025 年崛起的新工具——Rspack（字节跳动）、Turbopack（Vercel）、Rolldown（Vite 团队下一代打包工具）。

它们都用 Rust 重写了打包内核，目标是把构建速度推到极限。

短期内（2025 年）这几个工具仍处于"非常快但生态不全"的阶段。如果你的项目对构建速度极端敏感（每天几十次发布的大型应用），可以做局部测试；如果只是"想要更快的开发体验"，Vite 配合 esbuild 已经够快，没必要追新。

Rolldown 计划在 Vite 下一个主版本里内置，那时候 Vite 用户会自动迁移到新打包内核——你今天写的 Vite 配置不需要任何改动。这种"工具升级不破坏用户代码"的兼容性是 Vite 团队最值得称赞的工程文化。
