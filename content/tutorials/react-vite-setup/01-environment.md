# 第一章 · 跑通开发环境与第一个页面

这一章从空文件夹做一个小型「阅读清单」。后面两章会在同一个练习项目里继续修改，最终得到可搜索、可标记已读的页面。你需要会写基本的 HTML、CSS 和 JavaScript；暂时不需要理解后端。

**本章完成标志**：修改标题后浏览器立即更新，TypeScript 检查与生产构建通过，能在本地预览构建结果。预计用时 25 分钟。

### 1. 先区分练习项目和本站源码

React 负责把数据渲染成界面，TypeScript 在开发时检查数据和调用是否匹配，Vite 提供开发服务与构建入口。本系列的练习项目只包含一页，方便观察这三部分如何配合。

本站则已经有路由、工具集和内容后台。阅读本站源码时请按仓库锁文件安装：前端是 React 18、Vite 5，后端是 Strapi 5.37.1。不要为了跟随教程把现有依赖全部升级。

先在终端确认 Node.js 和包管理器：

```bash
node --version
npm --version
```

本系列沿用仓库推荐的 Node.js 24。若使用 nvm，在本站根目录可执行 `nvm install`、`nvm use`，让版本匹配 `.nvmrc`。前端使用 `package.json` 中指定的 pnpm 10.34.6；尚未安装时执行：

```bash
npm install --global pnpm@10.34.6
pnpm --version
```

### 2. 在独立目录创建练习项目

在本站目录之外创建 `reading-lab`。这里固定 create-vite 的主版本以对应 Vite 5 教学环境；它是兼容已有仓库的练习，不是对新项目技术版本的推荐。正式项目使用本站锁文件，避免脚手架模板随时间变化。

```bash
pnpm create vite@5 reading-lab --template react-ts
cd reading-lab
pnpm install
pnpm dev
```

打开终端实际打印的 Local 地址。默认端口通常是 5173；若本站已占用它，练习项目可能使用下一个可用端口。后续接入 CMS 时应把实际前端来源加入 CORS 配置。

打开 `src/App.tsx`，将整个文件替换为：

```tsx
export default function App() {
  return (
    <main>
      <p>READING LAB</p>
      <h1>我的阅读清单</h1>
      <p>从一个能运行的页面开始。</p>
    </main>
  );
}
```

保存后，页面标题应自动更新。这里的标签是 JSX，它允许在 JavaScript 中描述界面。一个组件是返回 JSX 的函数，组件名首字母大写。`class` 在 JSX 中写作 `className`，表达式放在花括号里，例如 `<p>{1 + 2}</p>`。

暂时不要删 `src/main.tsx`。它通过 `createRoot` 找到 `index.html` 的挂载节点，并把 `App` 放进去。浏览器得到页面的大致顺序是：

```text
index.html → src/main.tsx → src/App.tsx → 页面内容
```

这四个位置足够帮助你判断「文件写了，页面为什么没变化」：页面是否加载了正确入口，入口是否引用了刚编辑的组件。

### 3. 认识需要维护的文件

| 文件 | 作用 | 初学时什么时候改 |
| --- | --- | --- |
| `package.json` | 依赖及运行命令 | 新增库或命令时 |
| `pnpm-lock.yaml` | 记录解析后的依赖版本 | 安装依赖时由工具更新 |
| `src/main.tsx` | 挂载 React | 增加全局 Provider 时 |
| `src/App.tsx` | 当前页面 | 编写练习界面时 |
| `src/index.css` | 全局样式 | 下一章设置背景和字体时 |
| `vite.config.ts` | 开发与构建配置 | 修改端口、插件、入口时 |

TypeScript 不会把接口定义变成浏览器中的校验逻辑。它能在编译前发现 `number` 被当成 `string` 使用，却不能保证服务器一定返回正确的 JSON；这也是后续联调需要检查真实响应的原因。

### 4. 试一次生产构建

保留开发服务，在另一个终端进入练习目录：

```bash
pnpm exec tsc --noEmit
pnpm build
pnpm preview
```

构建成功会生成 `dist/`。打开 preview 打印的地址，确认同样能看到标题。开发页能运行，不等于生产构建一定成功；未使用变量、导入路径大小写等问题可能在检查阶段出现。`preview` 用于本地验收构建结果，正式发布时上传 `dist/` 或交给托管平台构建。

如果你只想跑本站而不新建练习项目，在仓库根目录执行 `pnpm install --frozen-lockfile` 和 `pnpm dev` 即可。后端未启动时，本站教程区会显示连接失败，这是正常的独立服务边界，第二个教程会补齐它。

### 5. 本章练习与验收

把标题改成你自己的阅读主题，在标题下面增加当天的学习目标。检查三个结果：页面保存后更新；终端没有 TypeScript 错误；生产预览能看到同样的内容。

| 现象 | 先检查什么 |
| --- | --- |
| 提示找不到 `node` 或 `pnpm` | 安装后是否重开终端，版本是否能打印 |
| 页面还是脚手架默认内容 | 浏览器端口是否对应这个项目，编辑的是否为 `src/App.tsx` |
| 浏览器白屏 | 开发终端和浏览器 Console 的第一条错误，不要只刷新 |
| 提示端口被占用 | 使用终端给出的实际地址，或停止另一个开发服务 |

### 参考阅读

本章的练习围绕本站的依赖与入口自行编写，脚手架用法参考 [Vite 5：Getting Started](https://v5.vite.dev/guide/)。后续可对照本站的 `src/main.tsx` 阅读真实入口。
