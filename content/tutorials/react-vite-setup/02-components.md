# 第二章 · 用组件与 CSS Modules 组织阅读清单

上一章已经跑通入口。这一章把「一个大页面」拆成有明确输入的组件，并完成窄屏也能阅读的布局。继续使用 `reading-lab`，无需后端。

**本章完成标志**：页面显示三张文章卡片，同一个组件接收不同数据，样式不会依赖全站通用的 `.title` 名称。预计用时 35 分钟。

### 1. 先定义一条文章是什么

不要一开始就拆十几个组件。先观察页面：每条阅读项都有标题、分类、预计分钟数和已读状态，这些数据会一起变化，适合作为一个对象。

新增 `src/types.ts`：

```ts
export interface ReadingItem {
  id: string;
  title: string;
  category: string;
  minutes: number;
  read: boolean;
}
```

新增 `src/data.ts`：

```ts
import type { ReadingItem } from './types';

// 仅用于这个独立练习；本站教程正文由 CMS 提供。
export const initialReadings: ReadingItem[] = [
  { id: 'component', title: '理解组件的输入', category: 'React', minutes: 12, read: false },
  { id: 'layout', title: '让卡片适应窄屏', category: 'CSS', minutes: 8, read: true },
  { id: 'state', title: '追踪一次状态更新', category: 'React', minutes: 15, read: false },
];
```

固定的 `id` 代表数据身份。数组第几个元素只是当前位置；后面筛选或排序时位置会变化，因此渲染列表时用 `id` 作为 `key`。这份练习数据是为了隔离 UI 知识，后面的联调教程会改用真实接口。

### 2. 把一张卡片写成组件

创建 `src/components/ReadingCard.tsx`：

```tsx
import type { ReadingItem } from '../types';
import styles from './ReadingCard.module.css';

interface Props {
  item: ReadingItem;
}

export function ReadingCard({ item }: Props) {
  return (
    <article className={styles.card}>
      <p className={styles.meta}>{item.category} · {item.minutes} 分钟</p>
      <h2 className={styles.title}>{item.title}</h2>
      <p className={styles.meta}>{item.read ? '已读' : '未读'}</p>
    </article>
  );
}
```

`item` 是父组件传入的 props。这里的组件只展示它收到的数据；它不负责自己再创建一份文章列表。这样的职责划分让同一张卡片可以出现在搜索结果或收藏列表里。

创建 `src/components/ReadingCard.module.css`：

```css
.card {
  min-width: 0;
  padding: 22px;
  border: 1px solid #d9dfd6;
  border-radius: 16px;
  background: #fff;
}
.title {
  margin: 10px 0 16px;
  font-size: 1.2rem;
  overflow-wrap: anywhere;
}
.meta {
  margin: 0;
  color: #52634e;
  font-size: .9rem;
}
```

Vite 会识别 `.module.css` 后缀。导入得到的是类名映射，使用 `styles.title` 关联当前模块的样式，方便让另一个组件也定义自己的 `.title`。它解决的是类名命名冲突；全局选择器及继承仍可能影响组件，不应把它理解为完全隔离的 iframe。[Vite 5 的 CSS Modules 说明](https://v5.vite.dev/guide/features#css-modules)描述了这一导入方式。

### 3. 在页面组装组件

将 `src/App.tsx` 替换为：

```tsx
import { ReadingCard } from './components/ReadingCard';
import { initialReadings } from './data';
import './index.css';

export default function App() {
  return (
    <main className="page">
      <header>
        <p>READING LAB</p>
        <h1>我的阅读清单</h1>
        <p>先留下一小份真正想读的内容。</p>
      </header>
      <section className="grid" aria-label="文章列表">
        {initialReadings.map(item => <ReadingCard key={item.id} item={item} />)}
      </section>
    </main>
  );
}
```

将脚手架 `src/index.css` 的内容替换为下面这份全局样式，避免默认居中布局继续影响页面：

```css
:root {
  font-family: system-ui, sans-serif;
  color: #243324;
  background: #f4f6f1;
  line-height: 1.6;
}
* { box-sizing: border-box; }
body { margin: 0; }
button, input { font: inherit; }
button { cursor: pointer; }
.page { max-width: 960px; margin: 0 auto; padding: 48px 20px; }
.grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
header { margin-bottom: 28px; }
@media (max-width: 700px) {
  .grid { grid-template-columns: 1fr; }
  .page { padding-top: 28px; }
}
```

全局样式负责字体、页面宽度和布局；卡片模块负责卡片内部。在本站里，你会看到同样的分工：`src/styles/` 定义基础样式，业务组件放在 `src/features/`，可复用展示放在 `src/components/ui/`。

### 4. 通过变化判断组件拆得是否合适

给 `initialReadings` 增加第四条数据。若只改数据就能出现第四张卡片，说明组件输入已经够用。再把某条标题改得很长，缩小浏览器宽度，观察是否出现整页横向滚动。

不要为了复用把「文章列表」「弹窗」「后台请求」全塞进 `ReadingCard`。当一个组件需要知道页面全部状态才能工作，通常说明它的边界还不够清楚。React 官方的 [Thinking in React](https://react.dev/learn/thinking-in-react) 可以帮助你按界面和数据关系划分组件。

### 5. 本章练习与验收

新增一条 CSS 学习文章，并把卡片内的预计分钟数放到标题下面。检查：四条数据都有唯一 `id`；React 没有 key 警告；浏览器缩到 375px 后卡片变为一列；`pnpm build` 仍然成功。

若样式完全不生效，先检查文件名是否为 `.module.css`，组件是否写成 `className={styles.card}`。若全页仍然垂直居中，确认默认 `index.css` 已被替换，`App.tsx` 没有继续导入脚手架的 `App.css`。
