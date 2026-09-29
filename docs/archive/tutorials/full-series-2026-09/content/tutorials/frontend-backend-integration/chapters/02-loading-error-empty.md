---
order: 2
title: 加载 / 错误 / 空 三态
est_read_minutes: 12
---

# 加载 / 错误 / 空 三态

数据加载相关的 UI bug，90% 来自三种状态没处理好：loading、error、empty。本章把这三种状态的细节讲清楚，并给出一个可复用的统一处理模板。

## 第一态：loading

加载状态在用户感知里非常关键——它告诉用户"系统在响应"。如果没有 loading 提示，用户会以为页面卡死。

### 三种 loading 写法

**1. 朴素 spinner**

```tsx
{loading ? <Spinner /> : <Content data={data} />}
```

最简单的实现。缺点：spinner 会让页面整个跳一下，且没有"形状预期"。

**2. 骨架屏（skeleton）**

```tsx
{loading ? <SkeletonList count={5} /> : <List items={data} />}
```

骨架屏长得像最终内容的轮廓——一组灰色矩形占位。这能让用户在数据返回前就知道"接下来会是一份列表"，心理上的等待时间感会减半。

**3. 渐进式（progressive disclosure）**

```tsx
{loading && !data && <Skeleton />}
{data && <List items={data} />}
{loading && data && <SubtleLoadingIndicator />}
```

第三种最精致——首次加载用骨架屏；后续刷新时保留旧数据，在角落显示一个细微的"刷新中"指示。这是 stale-while-revalidate 模式在 UI 上的最佳表达。

### 何时不显示 loading

如果一个数据请求在 200ms 内能返回，**显示 loading 反而让 UI 闪烁**。可以加一个最小延迟：

```tsx
const [showLoading, setShowLoading] = useState(false);
useEffect(() => {
  if (!loading) return;
  const t = setTimeout(() => setShowLoading(true), 200);
  return () => clearTimeout(t);
}, [loading]);

return showLoading ? <Spinner /> : null;
```

这种"延迟显示 loading"在快速响应场景里能显著减少 UI 抖动。

## 第二态：error

错误状态的处理常常被新人简化为"显示一行红字"。真实的错误处理要分三层：

### 1. 网络层错误

`fetch` 失败、超时、CORS 错误。

```tsx
{error?.code === 'ECONNABORTED' && (
  <div>请求超时，请检查网络后重试。<button onClick={retry}>重试</button></div>
)}
```

### 2. HTTP 层错误

4xx / 5xx 错误。

```tsx
{error?.response?.status === 404 && <div>没有找到相关内容</div>}
{error?.response?.status === 403 && <div>没有访问权限</div>}
{error?.response?.status >= 500 && <div>服务器暂时不可用</div>}
```

### 3. 业务层错误

API 返回 200 但 body 里有 `{ ok: false, error: '...' }`。

```tsx
if (response.data.ok === false) {
  throw new BusinessError(response.data.error);
}
```

这三层错误要分别对应不同的 UI 提示，而不是统一"出错了，请稍后再试"。

### 错误边界（Error Boundary）

不要把所有错误都做成局部状态。React 提供了 ErrorBoundary——一种"在组件树某层捕获错误"的机制：

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <ErrorBoundary
      fallback={<div>这个区域出问题了。<button onClick={() => location.reload()}>刷新</button></div>}
      onError={(error, info) => {
        // 上报到 Sentry
        logError(error, info);
      }}
    >
      <UserDashboard />
    </ErrorBoundary>
  );
}
```

ErrorBoundary 抓的是"渲染期"抛出的错误（包括数据请求 hook 中抛的）。它让你不需要在每个组件里都手写 if (error) 分支。

## 第三态：empty

空状态是被最严重低估的状态。一个完成的功能在数据为空时如果显示 "" 或 "[]"，用户会以为页面坏了。

### 好的空状态包含三件事

1. **一段说明文字**——为什么这里空着；
2. **一个具体的行动建议**——用户接下来该做什么；
3. **一个可选的插图或图标**——视觉上区别于"加载中"。

```tsx
{data?.length === 0 && (
  <div className="empty-state">
    <Icon name="inbox" />
    <h3>暂无评论</h3>
    <p>这是第一次有人看到这篇文章，要不要留下第一条想法？</p>
    <button>写评论</button>
  </div>
)}
```

注意几个细节：

- 文字温和、有引导，不是干巴巴的"无数据"；
- 提供下一步操作，不是死胡同；
- 视觉上有空间，不挤；

### 不要把"未加载"显示成"空"

下面这种代码是常见 bug：

```tsx
{!data || data.length === 0 ? <Empty /> : <List items={data} />}
```

如果 `data` 在加载中是 `undefined`，这段代码会先显示空状态、等数据返回再切到 List——产生明显闪烁。

正确做法是先判 loading：

```tsx
{loading && <Skeleton />}
{!loading && error && <ErrorView error={error} />}
{!loading && !error && data?.length === 0 && <Empty />}
{!loading && !error && data && data.length > 0 && <List items={data} />}
```

写起来有点啰嗦，但每种状态都被明确处理。

## 统一处理模板

每个组件都写一遍上面这段会很累。可以抽象成一个组件：

```tsx
interface QueryViewProps<T> {
  loading: boolean;
  error: Error | null;
  data: T[] | null | undefined;
  renderLoading?: () => React.ReactNode;
  renderError?: (e: Error) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderData: (data: T[]) => React.ReactNode;
}

export function QueryView<T>({
  loading, error, data,
  renderLoading = () => <Skeleton />,
  renderError = (e) => <ErrorView error={e} />,
  renderEmpty = () => <Empty />,
  renderData,
}: QueryViewProps<T>) {
  if (loading) return <>{renderLoading()}</>;
  if (error) return <>{renderError(error)}</>;
  if (!data || data.length === 0) return <>{renderEmpty()}</>;
  return <>{renderData(data)}</>;
}
```

使用：

```tsx
<QueryView
  loading={loading}
  error={error}
  data={articles}
  renderData={(items) => (
    <ul>{items.map(a => <li key={a.id}>{a.title}</li>)}</ul>
  )}
/>
```

整个组件的"四态管理"被收敛到一个地方。新人不会忘漏任何一种状态。

## stale-while-revalidate UI

最后再讨论一种高级模式：当用户切回某个页面，**先显示旧数据，同时后台静默刷新**。这种体验在 SWR 和 TanStack Query 里是默认行为。

UI 上的表达：

```tsx
{data && <List items={data} />}                       // 有旧数据就显示
{loading && data && <SubtleSpinner />}                // 后台刷新时显示细微指示
{loading && !data && <Skeleton />}                    // 首次加载没有旧数据时显示骨架
{error && !data && <ErrorView error={error} />}       // 没有旧数据 + 出错 → 错误页
{error && data && <ErrorToast error={error} />}       // 有旧数据 + 后台刷新出错 → toast，不替换主内容
```

这种细致的状态处理让用户感知到的"切换页面体验"流畅得多。

## 本章小结

加载 / 错误 / 空三种状态的处理质量，决定了用户对产品"完成度"的感知。loading 要有骨架屏 + 延迟显示；error 要分三层处理 + 配 ErrorBoundary；empty 要有引导文案。把这套四态模板抽出来，组件里再不会忘漏任何一种状态。

下一章我们深入到数据请求库的内部——**缓存、并发与取消**。理解这些机制能让你少写 100 行业务代码。

## 关于 Suspense 与 React 19

最后补一个面向未来的方向：React 18+ 提供了 Suspense，React 19 进一步把它推到主流。Suspense 允许"在数据未到位时挂起组件渲染"，让加载 / 错误状态可以**声明式**地处理：

```tsx
<Suspense fallback={<Skeleton />}>
  <ErrorBoundary fallback={<ErrorView />}>
    <ArticleList />  {/* 内部用 use() 或 use*Query 挂起 */}
  </ErrorBoundary>
</Suspense>
```

TanStack Query 5+ 提供 `useSuspenseQuery`，把数据请求自动接入 Suspense。这种模式让组件代码里不再需要手动 if (loading) / if (error)——边界由父层声明。

它仍在快速演进，今天用 useQuery + 四态模板更稳；但 1–2 年内 Suspense + ErrorBoundary 很可能成为新主流。值得保持关注。
