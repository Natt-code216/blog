---
order: 1
title: 环境变量与 Service 层
est_read_minutes: 12
---

# 环境变量与 Service 层

前后端联调的第一件事，是**怎么管 API 地址**——本地开发指向 localhost、测试环境指向某个测试域名、生产环境指向真实后端。如果这件事没做对，后续所有问题都会被它放大。

本章讲两件事：环境变量的正确管理；以及 Service 层（API client）的抽象。

## Vite 的 env 机制

Vite 项目里，所有以 `VITE_` 开头的环境变量会在构建时被注入到客户端代码。

```
# .env
VITE_API_BASE_URL=http://localhost:1337/api

# .env.development
VITE_API_BASE_URL=http://localhost:1337/api

# .env.production
VITE_API_BASE_URL=https://api.example.com/api

# .env.local（不进 Git）
VITE_API_TOKEN=local-only-token
```

代码里使用：

```ts
const baseUrl = import.meta.env.VITE_API_BASE_URL;
```

几条原则：

1. **任何 `VITE_` 开头的变量都会被打进客户端 bundle** —— 任何敏感信息**绝对不要**用 `VITE_` 前缀；
2. **`.env.local` 优先级最高且不进 Git** —— 每个开发者的私有覆盖放这里；
3. **生产构建用 `.env.production`** —— 默认 `pnpm build` 会读这个；
4. **类型化 env**：在 `vite-env.d.ts` 里给 env 加类型：

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_FEATURE_FLAGS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

这样 `import.meta.env.VITE_API_BASE_URL` 在 TS 里就有正确的类型，拼错变量名会编译失败。

## Service 层：为什么需要

最常见的反模式是组件里直接调 fetch：

```tsx
function UserList() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    fetch('http://localhost:1337/api/users')
      .then(r => r.json())
      .then(d => setUsers(d.data));
  }, []);
  return <ul>...</ul>;
}
```

这种代码乍看简单，但有几个隐患：

1. **URL 散落** —— 同一个 endpoint 在 N 个组件里出现，改起来要全局 grep；
2. **错误处理重复** —— 每个组件都要自己 try/catch；
3. **认证 header 重复** —— 每次都要手工加 Authorization；
4. **测试困难** —— 测试时要 mock fetch，且要 mock 整个 URL。

Service 层的核心想法是：**把所有 API 调用收敛到一个地方**，组件只调用业务方法，不直接接触 HTTP。

## 用 axios 实现一个最小 Service

```ts
// src/services/http.ts
import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10_000,
});

http.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 全局 401 处理：清登录态、跳登录页
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

这一段做了几件事：

- 集中配置 baseURL 和 timeout；
- 自动加 Authorization header；
- 自动处理 401（登录态失效）。

## 业务方法层

```ts
// src/services/api.ts
import { http } from './http';

export interface ApiUser {
  id: number;
  documentId: string;
  name: string;
  email: string;
}

export interface ApiArticle {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  content?: string;
}

class ApiService {
  async getUsers(): Promise<ApiUser[]> {
    const response = await http.get('/users');
    return response.data.data || [];
  }

  async getUserById(documentId: string): Promise<ApiUser | null> {
    const response = await http.get('/users', {
      params: { 'filters[documentId][eq]': documentId, 'pagination[limit]': 1 },
    });
    return response.data.data?.[0] || null;
  }

  async getArticles(): Promise<ApiArticle[]> {
    const response = await http.get('/articles', {
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

组件里调用：

```tsx
import { api } from '@/services/api';

const users = await api.getUsers();
```

注意几个细节：

1. **业务方法返回业务类型**，不是原始 axios response；
2. **空结果统一返回 `[]` 或 `null`**，组件不需要再判断 `data?.data`；
3. **TS 类型贯穿全程**，组件得到的是 ApiUser[]，不需要再断言。

## Mock 与开发体验

开发期经常需要"后端还没好但前端要先做"。一种轻量做法：用 MSW（Mock Service Worker）拦截 fetch / axios 请求。

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/articles', () => {
    return HttpResponse.json({
      data: [
        { id: 1, documentId: 'a1', title: 'Mock Article 1', slug: 'mock-1' },
        { id: 2, documentId: 'a2', title: 'Mock Article 2', slug: 'mock-2' },
      ],
    });
  }),
];
```

```ts
// src/main.tsx
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === '1') {
  const { worker } = await import('./mocks/browser');
  await worker.start();
}
```

MSW 的好处是**完全在浏览器里运行**，不影响生产构建，可以同时开发"用 mock"和"用真后端"两套体验。

## env 配置的几条铁律

1. **secret 永远不进 Git** —— `.env.local` 加 `.gitignore`；
2. **`.env.example` 进 Git** —— 让新人知道需要配哪些变量；
3. **任何 `VITE_` 都会进 bundle** —— 重要话说三遍，前端 token 永远是公开的；
4. **环境差异收敛到 env，不要在代码里写 if-else** —— 不要 `if (process.env.NODE_ENV === 'production')` 写不同 URL；
5. **类型化 env** —— `vite-env.d.ts` 必须维护。

## 不用 axios 行不行

完全可以。原生 fetch + 一层薄包装也能达成类似效果：

```ts
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem('auth_token');
  const response = await fetch(baseUrl + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new HttpError(response.status, await response.text());
  }
  return response.json();
}
```

但 axios 提供 interceptors / request cancellation / progress events 这些原生 fetch 需要自己实现的功能。对中大型项目，axios 仍是稍微更轻的选择。

## 何时不要 Service 层

如果你的项目只有一两个 API endpoint，且没有共享逻辑，Service 层是过度抽象——直接在 hook 里调 fetch 反而更清楚。

但只要项目里 endpoint 超过 5 个，Service 层就值得了。

## 本章小结

Service 层不是 OOP 教条，是为了把"HTTP 细节"和"业务逻辑"分开。env 管理的核心是"任何客户端可见的都不是 secret"——这条规则违反一次能让公司数据被任意拉取。

下一章我们讨论 UI 层的状态完整性——**加载 / 错误 / 空** 三种状态怎么处理。

## 关于 zod 与运行时校验

最后补一个高阶建议：API 响应应该在 Service 层做**运行时校验**，而不仅仅是 TS 类型注解。

TS 类型只在编译期生效——运行时拿到的 JSON 如果不符合声明的类型，TS 不会报错。这意味着如果后端返回的数据格式悄悄变了，你的前端可能跑到一半才崩。

zod 是一个流行的运行时校验库：

```ts
import { z } from 'zod';

const ArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  publishedAt: z.string().datetime().optional(),
});

export type Article = z.infer<typeof ArticleSchema>;

async function getArticles(): Promise<Article[]> {
  const res = await http.get('/articles');
  return z.array(ArticleSchema).parse(res.data.data);
}
```

`z.infer` 让一份 schema 同时定义"运行时校验规则"与"TS 类型"。这种"单一来源"的设计在中大型项目里能避免大量"前后端格式漂移"事故。
