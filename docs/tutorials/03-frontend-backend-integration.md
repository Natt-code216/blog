# 教程三 · 前后端联调与数据加载状态

> 等级：B_level（中级）
> 章节：3 / 5
> 状态：A更新中

## 一、把 API URL 放进环境变量

硬编码 `http://localhost:1337` 是入门陷阱，部署到 Vercel 时就要全文替换。Vite 提供 `import.meta.env`：

```ts
// src/services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1337/api';
```

然后在项目根写 `.env`：

```
VITE_API_URL=http://localhost:1337/api
```

生产部署时换成 `VITE_API_URL=https://api.your-blog.com/api`。**注意 Vite 要求环境变量以 `VITE_` 开头，否则不会暴露给客户端代码。**

## 二、定义 API 类型

TypeScript 的价值就在这里——把后端结构变成第一公民：

```ts
export interface ApiTutorial {
  id: number;
  documentId: string;
  title: string;
  description: string;
  level: 'A_level' | 'B_level' | 'C_level' | 'ALL';
  status: 'A更新中' | 'B已完结';
  chapters: number;
  icon: 'code' | 'layers' | 'zap';
  slug: string;
  createdAt: string;
  updatedAt: string;
}
```

## 三、封装 API Service

我用了一个简单的类，而不是一堆零散的函数，原因是：未来加 Token、加拦截器都集中一处：

```ts
class ApiService {
  async getTutorials(): Promise<ApiTutorial[]> {
    const response = await axios.get(`${API_URL}/tutorials`, {
      params: {
        'filters[published][eq]': true,
        'sort[0]': 'createdAt:desc',
      },
    });
    return response.data.data || [];
  }
}

export const api = new ApiService();
```

`filters[published][eq]` 是 Strapi 的查询语法，只取已发布内容。`|| []` 是兜底，万一接口返回 `null` 也不会让后续 `.map` 崩。

## 四、数据转换层

后端字段往往跟前端展示不一致。比如 `level: 'A_level'` 要变成"入门"。这种转换不该污染组件，单独抽到 `src/utils/transformData.ts`：

```ts
const levelMap = {
  A_level: '入门',
  B_level: '中级',
  C_level: '高级',
  ALL: '通用',
};

export function transformTutorials(apiData: ApiTutorial[]): Tutorial[] {
  return apiData.map((item) => ({
    id: item.documentId,
    title: item.title,
    description: item.description,
    level: levelMap[item.level],
    status: item.status?.startsWith('A') ? '更新中' : '已完结',
    chapters: item.chapters,
    icon: item.icon,
    link: `/tutorials/${item.slug}`,
  }));
}
```

这一层做了三件事：枚举翻译、字段重命名、URL 拼装。组件层就拿到纯净的展示数据。

## 五、自定义 Hook 统一加载状态

每个板块都要处理 loading / error / empty 三种状态。重复三次会非常啰嗦，所以抽成 `useApiFetch`：

```ts
export function useApiFetch<T>(fetchFn: () => Promise<T[]>): FetchState<T> {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRef.current()
      .then((result) => { if (!cancelled) { setData(result); setLoading(false); }})
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); }});
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
```

**关键点**：
- 用 `useRef` 持有最新 `fetchFn`，让 `useEffect` 的依赖数组可以为空，避免重复请求
- `cancelled` 标志位防止组件卸载后 `setState`，React 18 严格模式下会报警告

## 六、组件里只剩声明式渲染

```tsx
export function Tutorials() {
  const { data, loading, error } = useApiFetch(() =>
    api.getTutorials().then(transformTutorials)
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} />;
  if (data.length === 0) return <EmptyState />;

  return (
    <section>
      {data.map((t) => <TutorialCard key={t.id} {...t} />)}
    </section>
  );
}
```

组件只关心"如何展示"，业务逻辑都在 Service / Utils / Hook 里。

## 七、调试 CORS

如果前端跑在 5173、后端跑在 1337，浏览器会因为跨域而拒绝请求。Strapi 默认允许，但如果你改了 `config/middlewares.ts`，要确保 `strapi::cors` 仍然启用：

```ts
export default [
  'strapi::cors',
  // ...
];
```

可选地配置允许的 origin：

```ts
{
  name: 'strapi::cors',
  config: {
    origin: ['http://localhost:5173', 'https://your-blog.com'],
  },
},
```

## 下一章

第四章会讲如何添加文章详情页和路由系统，让访客能点进去看完整内容。
