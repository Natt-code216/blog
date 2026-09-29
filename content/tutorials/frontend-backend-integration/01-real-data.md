# 第一章 · 将真实接口接入页面，并处理四种加载状态

API 在终端中可读，只说明服务端工作正常。前端还需要处理网络等待、没有内容、请求失败以及用户离开页面后的旧请求。把这些情形分清，页面才不会在断网时误报「还没有教程」。

**本章完成标志**：本站首页展示五篇真实教程；关闭后台能看到错误与重试；恢复后台后点击重试能重新加载。预计用时 35 分钟。开始前完成 Strapi 教程并保持后台运行。

### 1. 确认浏览器真正请求哪个地址

在本站根目录的 `.env.local` 中配置：

```dotenv
VITE_API_URL=http://localhost:1337/api
```

末尾包含 `/api`，不要再加 `/tutorials`。保存后重新启动 `pnpm dev`。Vite 在启动时读取环境文件，并在生产构建时替换客户端变量，因此修改线上环境变量后需要重新构建。[Vite 环境变量文档](https://v5.vite.dev/guide/env-and-mode)说明了这个时机。

`VITE_` 前缀的内容会进入前端代码，这里只能放公开的 API 地址，不能放管理员 Token。当前教程接口通过 Public 读取权限访问，无需前端携带后台管理凭据。

打开浏览器 Network，筛选 `tutorials`，检查 Request URL、状态码和 Response。前端页面应该由 `http://localhost:5173` 打开；若换了端口或用了 `127.0.0.1`，需要相应修改 `backend/config/middlewares.ts` 的 CORS 来源。

### 2. 把服务请求集中到一个位置

本站的 `src/services/api.ts` 已有 `ApiTutorial` 类型与 `api.getTutorials()`。其核心逻辑是：

```ts
async getTutorials(): Promise<ApiTutorial[]> {
  const response = await axios.get(`${API_URL}/tutorials`, {
    params: {
      'filters[published][$eq]': true,
      'sort[0]': 'order:asc',
      'sort[1]': 'createdAt:desc',
    },
  });
  return response.data.data || [];
}
```

这一段是现有 Service 类中的方法，用来对照阅读，不需要另建第二套 API 服务。发布开关和排序集中在这里，首页和搜索调用同一方法，避免各写一份规则。`ApiTutorial` 是静态类型说明；若响应不符合预期，仍需查看 Network，而不是靠类型断言把错误藏起来。

不要在 `catch` 中直接返回 `[]`。那会让「服务器宕机」与「成功但没有文章」混在一起。这里让错误继续向上传递，由页面决定显示什么。

### 3. 用现有 Hook 管理请求过程

本站 `src/hooks/useApiFetch.ts` 返回 `data`、`loading`、`error` 和 `refetch`。下面是可供实验的完整组件；如需运行，新增 `src/features/tutorials/TutorialApiLab.tsx`，临时挂到 `HomePage` 中观察即可，验收后移除实验入口。

```tsx
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useApiFetch } from '../../hooks/useApiFetch';

export function TutorialApiLab() {
  const { data, loading, error, refetch } = useApiFetch(() => api.getTutorials());

  if (loading) return <p role="status">正在加载教程…</p>;
  if (error) return (
    <div role="alert">
      <p>暂时无法连接内容服务。</p>
      <button type="button" onClick={refetch}>重新加载</button>
    </div>
  );
  if (data.length === 0) return <p>还没有已发布的教程。</p>;

  return (
    <ul>
      {data.map(tutorial => (
        <li key={tutorial.documentId}>
          <Link to={`/tutorials/${tutorial.slug}`}>{tutorial.title}</Link>
          <span> · {tutorial.chapters} 章</span>
        </li>
      ))}
    </ul>
  );
}
```

检查顺序有意义：只有加载结束且没有错误时，空数组才表示「暂无内容」。重试时，Hook 清空旧错误并重新进入加载状态。

本站正式教程列表还经过 `src/utils/transformData.ts`，将 API 字段变成展示需要的结构，例如把 slug 拼成链接。这个转换层方便统一标签，但不会伪造教程正文或在请求失败后回填示例内容。

### 4. 为什么请求需要清理

阅读 `useApiFetch` 的 Effect 可以看到 `cancelled` 标记：开始请求时为 false；组件卸载或请求轮次改变时，清理函数把它置为 true；异步结果只有在它仍为 false 时才更新状态。

这不等于真正中止网络传输，而是阻止已经失效的结果写回界面。详情页另有 `src/pages/useArticle.ts`，切换 slug 时也使用同样的保护，避免先发出的慢请求覆盖后来打开的文章。React 官方 [useEffect 文档](https://react.dev/reference/react/useEffect)展示了通过清理来忽略失效响应的模式。

开发环境开启 StrictMode 时，Effect 可能经历额外的启动与清理，以暴露未正确处理的副作用。看到两次开发请求时先检查清理逻辑，不要立即删除 StrictMode。

### 5. 亲手触发四种状态

| 操作 | 预期页面 | Network 应看到什么 |
| --- | --- | --- |
| 正常打开首页 | 五篇教程，章数为 3、1、1、1、1 | 200，非空 `data` |
| 使用浏览器网络限速再刷新 | 请求完成前显示加载状态 | 请求处于等待中 |
| 停止 Strapi 后点击重试或刷新 | 错误说明与重试按钮 | 连接失败 |
| 后台恢复后点重试 | 恢复教程列表 | 新请求成功 |
| 在本地后台临时取消全部教程发布 | 「暂无内容」 | 200，`data: []` |

最后一种操作只在练习用本地库进行，验证后重新发布，或停服后执行 `pnpm tutorials:sync` 恢复仓库内容。

### 6. 本章排错与练习

若 curl 成功但浏览器失败，先看是否为 CORS；若 URL 出现两次 `/api`，检查环境变量与拼接；若 200 却始终空白，检查是否误用 Strapi 4 的 `attributes` 路径，以及控制台是否有渲染错误。

练习：在实验组件的成功分支增加每篇的 `description`。不改 Hook，不重新发第二个请求，说明你已把数据获取与展示分开。完成后运行 `pnpm typecheck`。

继续阅读 [路由与详情页](/tutorials/routing-and-detail-pages)，让每篇教程拥有可分享的地址。本教程后续可扩展分页、缓存和请求取消。
