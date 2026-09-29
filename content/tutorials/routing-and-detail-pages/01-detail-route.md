# 第一章 · 从教程列表进入正确的文章

首页上的标题只是入口。读者需要能够复制地址、刷新页面、返回列表，并在输入错误地址时得到清楚的反馈。详情页应始终显示 URL 指定的文章，不能在查不到时拿列表第一篇顶替。

**本章完成标志**：五个教程链接分别打开自己的正文，不存在的 slug 显示未找到，正文目录能定位章节。预计用时 30 分钟。操作基于本站已有代码，不必重新安装路由库。

### 1. 一套 Router 连接列表和详情

本站前端依赖 React Router 7，使用声明式的 `BrowserRouter`、`Routes` 和 `Route`。`src/main.tsx` 已经提供 `BrowserRouter`，因此不要在详情组件里再嵌套一次。以下是 `src/app/App.tsx` 中需要关注的路由关系：

```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/essays/:slug" element={<EssayDetail />} />
  <Route path="/tutorials/:slug" element={<TutorialDetail />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

`:slug` 是动态路径参数，例如 `/tutorials/react-vite-setup`。React Router 的 [Declarative Routing](https://reactrouter.com/start/declarative/routing) 说明了动态片段如何映射到参数。本站保留 `react-router-dom` 的导入方式；学习其他文档示例时注意导入包与所用模式，不要把框架模式的文件路由配置直接混进来。

列表中使用 `<Link to={...}>` 完成站内导航。指向外部参考资料时使用普通 `<a href={...}>`。slug 是文章身份，标题是展示文案，修改标题不应该自动破坏既有链接。

### 2. 精确查询，不接受错误替代

`src/services/api.ts` 的单篇读取使用列表接口加筛选：

```ts
async getTutorialBySlug(slug: string): Promise<ApiTutorial | null> {
  const response = await axios.get(`${API_URL}/tutorials`, {
    params: {
      'filters[slug][$eq]': slug,
      'filters[published][$eq]': true,
      'pagination[limit]': 1,
    },
  });
  const list: ApiTutorial[] = response.data.data || [];
  return list.find(item => item.slug === slug && item.published) || null;
}
```

最后的 `find` 是第二道核对：即使请求参数意外失效，也不把别的文章展示到这个 URL 下。请求本身失败时会抛错；没有匹配项才返回 `null`。筛选用法参考 [Strapi Filters](https://docs.strapi.io/cms/api/rest/filters)。

这是集合筛选，不是按文档 ID 调用单条接口，所以请求路径仍为 `/tutorials`，对应 Public 角色的 `find` 权限。

### 3. 让页面明确表达当前状态

`src/pages/TutorialDetail.tsx` 通过 `useParams` 取出 slug，再交给 `useArticle` 请求。读源码时按以下顺序观察：

```text
URL 参数
  → 请求中：ArticleState loading
  → 请求失败：ArticleState error，可重试
  → 请求成功但为空：ArticleState notFound
  → 找到匹配教程：ArticleLayout + MarkdownContent
```

`useArticle` 在 slug 变化时清空旧文章，并忽略旧请求迟到的结果。否则你从第一篇切换到第二篇，可能在标题已经变化时仍看见第一篇正文。

`ArticleLayout` 统一返回链接、标题、简介和元信息，也设置页面标题与描述。此处显示的「未找到」是客户端界面状态；纯静态 SPA 的服务器可能仍返回 200。若目标是服务端准确返回 HTTP 404 或让抓取工具直接拿到完整文章 HTML，需要进一步采用预渲染或服务端渲染，不能只靠设置 `<title>` 解决。

### 4. 安全渲染正文，并提供章节目录

正文走 `src/components/ui/MarkdownContent/`，由 `src/utils/renderMarkdown.ts` 先解析 Markdown，再经过 DOMPurify 清洗。不要把 CMS 的原始 HTML 直接交给 `dangerouslySetInnerHTML`。合法的标题、表格、代码块和链接会保留；主动脚本等不应进入文章 DOM。

本系列同步时会为章节生成稳定的 ID，例如 `chapter-1`、`chapter-2`，并在正文开头放置「章节目录」。因此跳转依赖的是实际标题 ID，不是假设 Markdown 解析器会自动给所有中文标题生成锚点。

目录使用页内链接。带章节地址直接打开或刷新时，正文要等接口返回后才存在；阅读组件会在正文准备好后再次定位锚点，避免只在加载占位时寻找目标。固定导航栏上方也预留了滚动间距，标题不会被遮住。

### 5. 验证刷新与返回

在浏览器中完成以下步骤：

1. 从首页打开 React 教程，检查显示 3 章。
2. 点击目录第三章，确认「加入搜索、已读切换与空结果」进入视野。
3. 复制当前带 `#chapter-3` 的地址，在新标签页打开，再刷新，确认仍能定位到第三章。
4. 返回教程列表，打开 Strapi 教程，确认标题、章数和正文同步变化。
5. 输入 `/tutorials/does-not-exist`，确认是未找到，而不是另一篇文章。
6. 停止后端再刷新详情，应显示连接错误与重试，不能误报文章不存在。

开发服务通常会把站内路径交给 `index.html`。正式静态托管也需要回退规则，否则从首页点进去正常，刷新 `/tutorials/...` 却会由服务器直接返回 404。下一篇会讲这个部署问题。

### 本章练习与后续

找出 `TutorialDetail` 中等级从 `A_level` 映射为「入门」的地方，再观察正文目录和页头章数是否一致。这两个数字来自同一套章节源文件，新增章节后应通过同步一起更新。

继续阅读 [部署上线](/tutorials/deploy-to-production)。本教程后续可扩展文章预渲染、独立章节 URL 和长文阅读导航。
