# 第三章 · 加入搜索、已读切换与空结果

前两章做出了静态列表。现在让用户能够搜索文章、切换已读状态，并清楚知道搜索没有结果时发生了什么。继续使用 `reading-lab` 中已有的类型和样式。

**本章完成标志**：输入搜索词立即筛选，点击卡片按钮更新计数，找不到文章时可以清空搜索。预计用时 35 分钟。

### 1. 只保存不能从现有数据算出的状态

这个页面需要记住两件事：当前输入的搜索词、每篇文章是否已读。筛选后的列表和已读数量都能由这两项计算，不需要再分别放进 state。否则很容易出现「按钮已经变化，统计数字还停留在旧值」的不同步问题。

这一取舍对应 React 官方 [Thinking in React](https://react.dev/learn/thinking-in-react) 中寻找最少状态的思路；下面的阅读清单是针对本系列编写的独立练习。

### 2. 让卡片把用户意图交回页面

将 `src/components/ReadingCard.tsx` 替换为：

```tsx
import type { ReadingItem } from '../types';
import styles from './ReadingCard.module.css';

interface Props {
  item: ReadingItem;
  onToggle: (id: string) => void;
}

export function ReadingCard({ item, onToggle }: Props) {
  return (
    <article className={styles.card}>
      <p className={styles.meta}>{item.category} · {item.minutes} 分钟</p>
      <h2 className={styles.title}>{item.title}</h2>
      <button type="button" aria-pressed={item.read} onClick={() => onToggle(item.id)}>
        {item.read ? '已读，点击标为未读' : '标为已读'}
      </button>
    </article>
  );
}
```

按钮负责报告「用户切换了哪条记录」，页面负责修改列表。使用真正的 `button`，键盘用户可以通过 Tab 聚焦并按 Enter 或空格操作。`aria-pressed` 同时提供切换状态，避免只靠颜色传递信息。

### 3. 完成有状态的页面

将 `src/App.tsx` 替换为下面的完整代码：

```tsx
import { useState } from 'react';
import { ReadingCard } from './components/ReadingCard';
import { initialReadings } from './data';
import './index.css';

export default function App() {
  const [items, setItems] = useState(initialReadings);
  const [query, setQuery] = useState('');
  const keyword = query.trim().toLocaleLowerCase();
  const visibleItems = items.filter(item =>
    `${item.title} ${item.category}`.toLocaleLowerCase().includes(keyword)
  );
  const readCount = items.filter(item => item.read).length;

  function toggleRead(id: string) {
    setItems(previous => previous.map(item =>
      item.id === id ? { ...item, read: !item.read } : item
    ));
  }

  return (
    <main className="page">
      <header>
        <p>READING LAB</p>
        <h1>我的阅读清单</h1>
        <p aria-live="polite">已读 {readCount} / {items.length} 篇</p>
      </header>
      <div className="search">
        <label htmlFor="reading-search">按标题或分类搜索</label>
        <input id="reading-search" type="search" value={query}
          onChange={event => setQuery(event.target.value)} placeholder="例如 React" />
      </div>
      {visibleItems.length > 0 ? (
        <section className="grid" aria-label="文章列表">
          {visibleItems.map(item => (
            <ReadingCard key={item.id} item={item} onToggle={toggleRead} />
          ))}
        </section>
      ) : (
        <div role="status">
          <p>没有找到匹配的文章，试试更短的关键词。</p>
          <button type="button" onClick={() => setQuery('')}>清空搜索</button>
        </div>
      )}
    </main>
  );
}
```

在 `src/index.css` 末尾追加：

```css
.search { display: grid; gap: 8px; margin-bottom: 24px; }
.search input { width: 100%; padding: 10px 12px; border: 1px solid #859580; border-radius: 8px; }
button { padding: 8px 12px; border: 1px solid #859580; border-radius: 8px; background: #fff; color: #243324; }
button[aria-pressed="true"] { background: #dcebd4; }
button:focus-visible, input:focus-visible { outline: 3px solid #397032; outline-offset: 3px; }
```

### 4. 追踪一次点击发生了什么

假设点击第一张卡片。`onToggle` 把该项的 `id` 传给 `toggleRead`，`setItems` 根据上一次列表生成新数组，只复制并修改匹配的对象。React 随后重新执行页面函数，重新计算已读数和筛选结果，再更新按钮与统计文字。

这里不要写 `item.read = true` 后再把原数组交回去；直接修改共享对象会让数据来源变得难以追踪。函数式更新 `setItems(previous => ...)` 则明确表示「本次结果依赖前一次状态」。

输入框同时设置 `value` 和 `onChange`：前者读取当前状态，后者报告用户的新输入。只写 `value` 会让它表现得像只读输入框。

刷新页面后，阅读状态会恢复初始值，因为本章只使用内存状态。跨刷新保存可以留作下一步练习，不要把当前行为误认为服务器已经保存成功。本章不需要 Effect：搜索与统计都能在渲染过程中直接算出。

### 5. 用行为验收，而不只看截图

| 操作 | 预期结果 |
| --- | --- |
| 搜索 `react` | 只显示分类或标题包含该词的文章，不区分英文大小写 |
| 在搜索词前后加空格 | 筛选结果不变 |
| 搜索一段不存在的文字 | 出现空结果说明和「清空搜索」按钮 |
| 清空搜索 | 恢复全部文章 |
| 连续切换同一篇的已读状态 | 已读数先增后减，其他文章不受影响 |
| 使用 Tab 与空格操作按钮 | 焦点可见，切换行为与鼠标一致 |

最后运行 `pnpm exec tsc --noEmit` 与 `pnpm build`。若提示缺少 `onToggle`，检查是否还有使用旧版 `ReadingCard` 的调用位置。

### 下一步

你已经完成了环境、组件与样式、状态交互三个基础章节。接下来进入 [Strapi 内容后台教程](/tutorials/strapi-headless-cms)，把注意力从界面内部的数据移到真正保存、编辑和发布内容的服务。
