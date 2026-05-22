---
order: 4
title: 构建与产物分析
est_read_minutes: 12
---

# 构建与产物分析

dev server 跑得再快，最终用户看到的是**生产构建产物**。本章把构建配置、产物分析、性能预算这条流水线串起来。

## Vite build 默认做了什么

跑 `pnpm build` 时，Vite 在底层做了：

1. **类型检查**（如果配置了 `tsc -b`）；
2. **用 Rollup 打包**——esbuild 只负责快速转换，最终打包用 Rollup，因为 Rollup 在 tree-shaking 和 chunk 切分上更成熟；
3. **CSS 提取**——每个 chunk 对应的 CSS 提取到独立文件；
4. **资源处理**——图片、字体、SVG 加上 hash；
5. **生成 HTML**——把所有需要的 link / script 标签注入 index.html；
6. **输出到 dist/**。

整套流程默认产物已经相当不错。但有几个值得显式配置的地方。

## manualChunks：合理切分

默认情况下，Vite 会把所有 node_modules 合并成一个 vendor chunk。这在小项目里没问题，但项目变大后会让 vendor chunk 膨胀到 1MB+，每次业务版本更新用户都要重新下载这一坨。

显式划分 vendor chunks：

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'data-vendor': ['axios', '@tanstack/react-query'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

这种切分让 React 这类几乎不变的包独立 chunk，业务发版时浏览器缓存仍然命中。

## sourcemap：开还是关

生产环境是否生成 sourcemap 一直有争议。

**开**的好处：生产事故时能定位到原始代码；前端监控工具（Sentry）能给出有意义的 stack trace。

**开**的坏处：构建慢一点；可能泄露源代码意图。

我的偏好：**开，但用 hidden 模式**：

```ts
build: {
  sourcemap: 'hidden',  // 生成但不在 HTML 引用
},
```

这样 sourcemap 文件存在 dist/，CI 流程把它上传到 Sentry，但 HTML 里没有 sourceMappingURL，普通用户的浏览器不会主动下载。

## 资源 inline 阈值

小图片（< 4KB）默认会被 inline 成 data URL，避免额外的 HTTP 请求。但 4KB 这个默认值有时候不够好：

```ts
build: {
  assetsInlineLimit: 8192,  // 8KB 以下 inline
},
```

调高一点能减少首屏请求数，但会让 JS 包稍大。两者权衡看项目。

## bundle 可视化：rollup-plugin-visualizer

每次 build 后生成一份可视化报告：

```bash
pnpm add -D rollup-plugin-visualizer
```

```ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

跑完 build 后用浏览器打开 `dist/stats.html`，能看到每个 chunk 里每个模块的体积——按 raw / gzip / brotli 三种压缩方式分别展示。

这份报告是性能 review 的最直接素材：

- **意外的大依赖**：发现某个不知道为什么这么大的包；
- **重复依赖**：同一个库的两个版本被打了进来；
- **应该 lazy 的模块**：发现某个只在某条 route 用的库被打进了主 chunk。

每两周扫一次 stats.html，能挡掉很多"无声膨胀"。

## 体积预算与 CI

光有报告还不够，要让"体积超标"在 PR 阶段被自动拦截。

用 [size-limit](https://github.com/ai/size-limit)：

```bash
pnpm add -D size-limit @size-limit/preset-app
```

```json
// package.json
{
  "scripts": {
    "size": "size-limit",
    "ci": "pnpm typecheck && pnpm test:run && pnpm build && pnpm size"
  },
  "size-limit": [
    {
      "name": "Main bundle",
      "path": "dist/assets/index-*.js",
      "limit": "200 KB"
    },
    {
      "name": "Vendor",
      "path": "dist/assets/react-vendor-*.js",
      "limit": "180 KB"
    }
  ]
}
```

CI 跑 `pnpm size`，任何超标都让构建失败。这条规则就是项目长期不膨胀的护城河。

## 类型检查与 build 的关系

前面提过：Vite 的开发模式**不做类型检查**。这意味着 dev 跑通的代码可能 build 失败。

解决方法是把 `tsc -b` 显式加在 build 前：

```json
{
  "scripts": {
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b --noEmit"
  }
}
```

`tsc -b` 是 TypeScript 的"项目模式"，能并行处理 monorepo。即便不是 monorepo，它也比单纯的 `tsc` 略快。

## ESLint：要不要在 build 里跑

我的偏好：**不要**。

把 ESLint 放在 build 前会让构建变慢一倍。更好的位置是：

- 提交前：lint-staged 只检查变更文件；
- CI：单独跑一遍全量 lint，并行于 build。

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "ci": "pnpm typecheck && pnpm lint && pnpm test:run && pnpm build"
  }
}
```

## 一份完整的 CI 流水线

把本章所有建议合在一起，一份完整的 CI 步骤大概是：

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:run
      - run: pnpm build
      - run: pnpm size
```

5–6 个步骤，每个步骤的成功与否都有明确含义。这是一份能撑起团队信心的最小 CI。

## 部署：把 dist/ 推到任何静态托管

Vite 的产物是纯静态的——一组 HTML/CSS/JS/资源文件。它可以推到任何静态托管：

- **Vercel**：`pnpm dlx vercel deploy --prod`
- **Netlify**：`pnpm dlx netlify deploy --prod --dir=dist`
- **Cloudflare Pages**：连仓库即可
- **GitHub Pages**：把 dist/ 推到 gh-pages 分支
- **自己的 nginx**：cp dist/ 到目录

部署不是本章重点，但 Vite 产物的可移植性是它一个被低估的优势。

## 本章小结

生产构建是用户视角的真实产物。把它做对的核心是：合理切分 vendor chunks、把 sourcemap 设成 hidden、用 visualizer 做体积可视化、在 CI 里加体积预算门禁。这套流水线一旦立起来，项目长期不会无声膨胀。

至此本系列四章完结。从"为什么选 Vite"、到"目录与别名"、到"样式方案"、到"构建与产物"——你已经拥有了一份能直接用在新项目上、每一行都能解释清楚的脚手架。希望它能帮你节省下若干个晚上的"为什么这样配"的纠结。

## 一份发版前的核对清单

最后留一份每次发版前可以照着走一遍的核对清单，帮你避免常见低级错误：

1. **typecheck 通过**：`pnpm typecheck` 退出码 0；
2. **lint 通过**：`pnpm lint`，warning 数 0；
3. **测试通过**：`pnpm test:run`，failed = 0；
4. **build 成功**：`pnpm build`，dist/ 目录生成完整；
5. **体积预算未超**：`pnpm size`，所有 bundle 在 limit 内；
6. **本地预览过**：`pnpm preview` 在浏览器里手动点一遍主流程；
7. **环境变量已配**：检查 `.env.production` 与部署环境的变量一致；
8. **sourcemap 已上传**（如果用 Sentry）；
9. **CHANGELOG 已更新**：人能读的变更说明，至少一行。

这份清单不长，但它能挡掉过去三年里我亲眼看见过的所有"上线一秒就回滚"的事故。
