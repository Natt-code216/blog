# 前端集成 API 服务完整指南

## 🎯 目标

将 React 前端从硬编码数据迁移到从 Strapi 后端 API 读取数据。

---

## 📦 第一步：安装依赖

在前端项目根目录执行:

```bash
cd E:\Claude_code\blog
pnpm add axios
```

或使用 npm:

```bash
npm install axios
```

---

## 🔧 第二步：创建 API 服务

### 创建服务目录

```bash
mkdir src/services
```

### 创建 API 服务文件

创建 `src/services/api.ts`:

```typescript
import axios from 'axios';

// API 基础 URL - 根据实际环境修改
const API_URL = 'http://localhost:1337/api';

export interface ApiEssay {
  id: number;
  attributes: {
    category: 'ESSAY' | 'THOUGHTS' | 'LIFESTYLE';
    title: string;
    excerpt: string;
    date: string;
    slug: string;
    published: boolean;
    featuredImage?: {
      data?: {
        attributes: {
          url: string;
          alternativeText?: string;
        };
      };
    };
  };
}

export interface ApiTutorial {
  id: number;
  attributes: {
    title: string;
    description: string;
    level: '初级' | '中高级' | '全阶段' | '高阶';
    status: '更新中' | '已完结';
    chapters: number;
    icon: 'code' | 'layers' | 'zap';
    slug: string;
    published: boolean;
    coverImage?: {
      data?: {
        attributes: {
          url: string;
        };
      };
    };
  };
}

export interface ApiTool {
  id: number;
  attributes: {
    title: string;
    description: string;
    icon: 'barChart' | 'droplet' | 'fileText' | 'search';
    url: string;
    slug: string;
    coverImage?: {
      data?: {
        attributes: {
          url: string;
        };
      };
    };
  };
}

export interface ApiComment {
  id: number;
  attributes: {
    authorName: string;
    content: string;
    email?: string;
    rating?: number;
    approved: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

class ApiService {
  // ==================== Essays ====================
  async getEssays(): Promise<ApiEssay[]> {
    try {
      const response = await axios.get(`${API_URL}/essays?populate=featuredImage`, {
        params: {
          'filters[published][$eq]': true,
          sort: 'date:desc',
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('获取随笔失败:', error);
      throw error;
    }
  }

  async getEssayBySlug(slug: string): Promise<ApiEssay | null> {
    try {
      const response = await axios.get(`${API_URL}/essays`, {
        params: {
          'filters[slug][$eq]': slug,
          'populate[0]': 'featuredImage',
          'populate[1]': 'comments',
        },
      });
      return response.data.data?.[0] || null;
    } catch (error) {
      console.error('获取随笔详情失败:', error);
      throw error;
    }
  }

  // ==================== Tutorials ====================
  async getTutorials(): Promise<ApiTutorial[]> {
    try {
      const response = await axios.get(`${API_URL}/tutorials?populate=coverImage`, {
        params: {
          'filters[published][$eq]': true,
          sort: 'createdAt:desc',
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('获取教程失败:', error);
      throw error;
    }
  }

  async getTutorialBySlug(slug: string): Promise<ApiTutorial | null> {
    try {
      const response = await axios.get(`${API_URL}/tutorials`, {
        params: {
          'filters[slug][$eq]': slug,
          'populate[0]': 'coverImage',
          'populate[1]': 'comments',
        },
      });
      return response.data.data?.[0] || null;
    } catch (error) {
      console.error('获取教程详情失败:', error);
      throw error;
    }
  }

  // ==================== Tools ====================
  async getTools(): Promise<ApiTool[]> {
    try {
      const response = await axios.get(`${API_URL}/tools?populate=coverImage`);
      return response.data.data || [];
    } catch (error) {
      console.error('获取工具失败:', error);
      throw error;
    }
  }

  // ==================== Comments ====================
  async getComments(options: {
    essayId?: number;
    tutorialId?: number;
  }): Promise<ApiComment[]> {
    try {
      const params: any = {};

      if (options.essayId) {
        params['filters[essay][id][$eq]'] = options.essayId;
      } else if (options.tutorialId) {
        params['filters[tutorial][id][$eq]'] = options.tutorialId;
      }

      params['filters[approved][$eq]'] = true;
      params.sort = 'createdAt:desc';

      const response = await axios.get(`${API_URL}/comments`, { params });
      return response.data.data || [];
    } catch (error) {
      console.error('获取评论失败:', error);
      throw error;
    }
  }

  async createComment(data: {
    authorName: string;
    content: string;
    email?: string;
    rating?: number;
    essay?: number;
    tutorial?: number;
  }): Promise<ApiComment> {
    try {
      const response = await axios.post(`${API_URL}/comments`, {
        data,
      });
      return response.data.data;
    } catch (error) {
      console.error('创建评论失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const api = new ApiService();

// 导出类型
export { ApiEssay, ApiTutorial, ApiTool, ApiComment };
```

---

## 🔄 第三步：更新类型定义

更新 `src/types/index.ts`:

```typescript
// 原有类型保留
export interface Essay {
  id: string;
  category: string;
  date: string;
  title: string;
  excerpt: string;
  link: string;
}

export interface Tutorial {
  id: string;
  icon: 'code' | 'layers' | 'zap';
  title: string;
  description: string;
  level: string;
  status: string;
  link: string;
}

export interface Tool {
  id: string;
  icon: 'barChart' | 'droplet' | 'fileText' | 'search';
  title: string;
  description: string;
  link: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
}

// 新增从 API 转换的类型
export { ApiEssay, ApiTutorial, ApiTool, ApiComment } from '../services/api';
```

---

## 📱 第四步：更新 Essays 组件

### 创建数据转换工具

创建 `src/utils/transformData.ts`:

```typescript
import type { ApiEssay, ApiTutorial, ApiTool } from '../services/api';
import type { Essay, Tutorial, Tool } from '../types';

export function transformEssays(apiEssays: ApiEssay[]): Essay[] {
  return apiEssays.map((essay) => ({
    id: essay.id.toString(),
    category: essay.attributes.category,
    date: formatDate(essay.attributes.date),
    title: essay.attributes.title,
    excerpt: essay.attributes.excerpt || '',
    link: `/essays/${essay.attributes.slug}`,
  }));
}

export function transformTutorials(apiTutorials: ApiTutorial[]): Tutorial[] {
  return apiTutorials.map((tutorial) => ({
    id: tutorial.id.toString(),
    icon: tutorial.attributes.icon,
    title: tutorial.attributes.title,
    description: tutorial.attributes.description,
    level: tutorial.attributes.level,
    status: `${tutorial.attributes.status} (${tutorial.attributes.chapters} 章)`,
    link: `/tutorials/${tutorial.attributes.slug}`,
  }));
}

export function transformTools(apiTools: ApiTool[]): Tool[] {
  return apiTools.map((tool) => ({
    id: tool.id.toString(),
    icon: tool.attributes.icon,
    title: tool.attributes.title,
    description: tool.attributes.description,
    link: tool.attributes.url || `#/tools/${tool.attributes.slug}`,
  }));
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
```

### 更新 Essays 组件

更新 `src/components/Essays/index.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { ScrollReveal } from '../ScrollReveal';
import type { Essay } from '../../types';
import { api } from '../../services/api';
import { transformEssays } from '../../utils/transformData';
import styles from './Essays.module.css';

function EssayCard({ essay }: { essay: Essay }) {
  return (
    <>
      <div className={styles.essayMeta}>
        <span>{essay.category}</span>
        <span>{essay.date}</span>
      </div>
      <h3 className="serif">{essay.title}</h3>
      <p>{essay.excerpt}</p>
      <span className={styles.readMoreLink}>
        阅读全文
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </>
  );
}

export function Essays() {
  const [essays, setEssays] = useState<Essay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEssays = async () => {
      try {
        const apiData = await api.getEssays();
        const transformed = transformEssays(apiData);
        setEssays(transformed);
        setLoading(false);
      } catch (err) {
        console.error('获取随笔失败:', err);
        setError('加载随笔失败，请稍后重试');
        setLoading(false);
      }
    };

    fetchEssays();
  }, []);

  if (loading) {
    return (
      <section id="essays" className={styles.section}>
        <div className="container">
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className={styles.loadingSpinner}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>加载中...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="essays" className={styles.section}>
        <div className="container">
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: '#ff4444' }}>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="essays" className={styles.section}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <div className="section-subtitle">Journal</div>
              <h2 className="section-title serif">思考与感悟</h2>
            </div>
            <a href="/essays" className={styles.viewAllLink}>
              查看全部
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </ScrollReveal>

        {essays.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: 'var(--text-secondary)' }}>暂无随笔</p>
          </div>
        ) : (
          <div className={styles.essaysGrid}>
            {essays.map((essay, index) => (
              <ScrollReveal key={essay.id} delay={index * 0.1}>
                <a href={essay.link} className={styles.essayCard}>
                  <EssayCard essay={essay} />
                </a>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
```

### 添加加载动画样式

在 `src/components/Essays/Essays.module.css` 末尾添加:

```css
.loadingSpinner {
  border: 3px solid var(--border-light);
  border-top: 3px solid var(--text-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 📱 第五步：更新 Tutorials 组件

更新 `src/components/Tutorials/index.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { ScrollReveal } from '../ScrollReveal';
import type { Tutorial } from '../../types';
import { api } from '../../services/api';
import { transformTutorials } from '../../utils/transformData';
import styles from './Tutorials.module.css';

const iconMap = {
  code: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  ),
  layers: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2zM12 22v-6.5" />
    </svg>
  ),
  zap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
};

function TutorialContent({ tutorial }: { tutorial: Tutorial }) {
  return (
    <>
      <div className={styles.tutIconWrapper}>{iconMap[tutorial.icon]}</div>
      <div className={styles.tutInfo}>
        <h3>{tutorial.title}</h3>
        <p>{tutorial.description}</p>
      </div>
      <div className={styles.tutMeta}>
        <span className={styles.tutTag}>{tutorial.level}</span>
        <span className={styles.tutStatus}>{tutorial.status}</span>
      </div>
    </>
  );
}

export function Tutorials() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const apiData = await api.getTutorials();
        const transformed = transformTutorials(apiData);
        setTutorials(transformed);
        setLoading(false);
      } catch (err) {
        console.error('获取教程失败:', err);
        setLoading(false);
      }
    };

    fetchTutorials();
  }, []);

  if (loading) {
    return (
      <section id="tutorials" className={styles.section}>
        <div className="container">
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className={styles.loadingSpinner}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>加载中...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="tutorials" className={styles.section}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <div className="section-subtitle">Education</div>
              <h2 className="section-title serif">系统化学习</h2>
            </div>
          </div>
        </ScrollReveal>

        <div className={styles.tutorialsList}>
          {tutorials.map((tutorial, index) => (
            <ScrollReveal key={tutorial.id} delay={index * 0.1}>
              <a href={tutorial.link} className={styles.tutorialRow}>
                <TutorialContent tutorial={tutorial} />
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

在 `Tutorials.module.css` 末尾添加加载动画:

```css
.loadingSpinner {
  border: 3px solid var(--border-light);
  border-top: 3px solid var(--text-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 📱 第六步：更新 Tools 组件

更新 `src/components/Tools/index.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { ScrollReveal } from '../ScrollReveal';
import type { Tool } from '../../types';
import { api } from '../../services/api';
import { transformTools } from '../../utils/transformData';
import styles from './Tools.module.css';

const iconMap = {
  barChart: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  droplet: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  fileText: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  search: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
};

function ToolContent({ tool }: { tool: Tool }) {
  return (
    <>
      <div className={styles.toolIcon}>{iconMap[tool.icon]}</div>
      <h3>{tool.title}</h3>
      <p>{tool.description}</p>
    </>
  );
}

export function Tools() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const apiData = await api.getTools();
        const transformed = transformTools(apiData);
        setTools(transformed);
        setLoading(false);
      } catch (err) {
        console.error('获取工具失败:', err);
        setLoading(false);
      }
    };

    fetchTools();
  }, []);

  if (loading) {
    return (
      <section id="tools" className={styles.section}>
        <div className="container">
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className={styles.loadingSpinner}></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>加载中...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="tools" className={styles.section}>
      <div className="container">
        <ScrollReveal>
          <div className="section-header">
            <div>
              <div className="section-subtitle">Workspace</div>
              <h2 className="section-title serif">实用工具集</h2>
            </div>
          </div>
        </ScrollReveal>

        <div className={styles.toolsGrid}>
          {tools.map((tool, index) => (
            <ScrollReveal key={tool.id} delay={index * 0.1}>
              <a href={tool.link} className={styles.toolCard}>
                <ToolContent tool={tool} />
              </a>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

在 `Tools.module.css` 末尾添加:

```css
.loadingSpinner {
  border: 3px solid var(--border-light);
  border-top: 3px solid var(--text-primary);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 🧪 测试集成

### 1. 启动后端

```bash
cd E:\Claude_code\blog\backend
npm run develop
```

### 2. 启动前端

在另一个终端:

```bash
cd E:\Claude_code\blog
pnpm dev
```

### 3. 验证数据加载

打开浏览器访问 `http://localhost:5173`:

- ✅ 随笔板块显示从 Strapi 获取的数据
- ✅ 教程板块显示从 Strapi 获取的数据
- ✅ 工具集板块显示从 Strapi 获取的数据
- ✅ 加载动画正常显示
- ✅ 无控制台错误

### 4. 检查网络请求

打开浏览器开发者工具 (F12) → Network 标签:

- 应该看到对 `/api/essays` 的请求
- 应该看到对 `/api/tutorials` 的请求
- 应该看到对 `/api/tools` 的请求
- 所有请求状态码应该是 200

---

## 🐛 故障排除

### 问题 1: 跨域错误 (CORS)

**症状**: 控制台显示 `CORS policy` 错误

**解决**:
1. 确保后端 `middlewares.js` 配置了正确的 CORS
2. 重启 Strapi 服务器

### 问题 2: 无法获取数据

**症状**: 页面显示"加载失败"或空白

**解决**:
1. 检查 Strapi 服务器是否运行在 1337 端口
2. 在浏览器直接访问 `http://localhost:1337/api/essays` 看是否有数据
3. 检查网络标签中的请求是否成功
4. 查看控制台的错误信息

### 问题 3: 数据为空

**症状**: 没有错误，但页面没有显示内容

**解决**:
1. 登录 Strapi 管理面板
2. 检查是否创建了随笔、教程、工具
3. 检查这些内容的 `published` 字段是否为 true
4. 检查权限配置是否允许公开访问

---

## ✅ 完成检查清单

- [ ] 已安装 axios 依赖
- [ ] 已创建 api.ts 服务文件
- [ ] 已创建 transformData.ts 工具文件
- [ ] Essays 组件已更新
- [ ] Tutorials 组件已更新
- [ ] Tools 组件已更新
- [ ] 后端服务器正在运行
- [ ] 前端可以成功获取数据
- [ ] 所有板块显示正常
- [ ] 无控制台错误

---

**🎉 恭喜！您已成功将前端集成到 Strapi 后端！**

现在您可以:
1. 在 Strapi 管理面板创建和编辑内容
2. 前端会自动显示最新数据
3. 添加评论功能（可选）
