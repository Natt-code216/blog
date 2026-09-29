// 站点初始内容种子。所有条目以 slug 作为幂等键 —— bootstrap 时若 slug 已存在则跳过，
// 因此可以安全多次启动而不会重复插入。
//
// 注意：自 §5.2 起，essay/tutorial 的 content 字段已置空，正文交由 `scripts/sync-content.mjs`
// 从 `content/` 目录下的 markdown 同步进 Strapi。本文件仅保留元数据（title/excerpt/level/icon 等）
// 作为启动初始化的最小数据。

export interface EssaySeed {
  slug: string;
  title: string;
  category: 'ESSAY' | 'THOUGHTS' | 'LIFESTYLE';
  excerpt: string;
  content: string;
  date: string; // ISO
}

export interface TutorialSeed {
  slug: string;
  title: string;
  description: string;
  level: 'A_level' | 'B_level' | 'C_level' | 'ALL';
  status: 'A更新中' | 'B已完结';
  chaptersCount: number;
  icon: 'code' | 'layers' | 'zap';
  content: string;
}

export interface ToolSeed {
  slug: string;
  title: string;
  description: string;
  icon: 'barChart' | 'droplet' | 'fileText' | 'search';
  url: string;
}

export const essaySeeds: EssaySeed[] = [
  {
    slug: 'tech-and-humanity',
    title: '技术与人性的平衡',
    category: 'ESSAY',
    excerpt:
      '技术从不中立。每一次工具的迭代，都在重塑我们感知世界的方式。问题不在于使用什么工具，而在于谁的意图被工具放大。',
    date: '2026-05-23T10:00:00.000Z',
    content: '',
  },
  {
    slug: 'on-creativity',
    title: '关于创造力的本源思考',
    category: 'THOUGHTS',
    excerpt:
      '创造力不是凭空降临的闪电，而是高质量输入、留白时间与一支随时记录的笔，三者长期复利的结果。',
    date: '2026-05-23T09:00:00.000Z',
    content: '',
  },
  {
    slug: 'art-of-slowing-down',
    title: '慢下来的艺术与哲学',
    category: 'LIFESTYLE',
    excerpt:
      '慢不是落后，是把节奏从外界手里拿回来。你愿意为一件事慢下来多少，决定了这件事在你心里的位置。',
    date: '2026-05-23T20:00:00.000Z',
    content: '',
  },
  {
    slug: 'signal-in-noise',
    title: '在喧嚣中寻找信号',
    category: 'ESSAY',
    excerpt: '信息越多，注意力越稀缺。学会筛选不是消极防御，而是一种创造性工作——你删掉的，决定了你能看见的。',
    date: '2026-05-23T15:00:00.000Z',
    content: '',
  },
  {
    slug: 'craftsmanship-and-code',
    title: '手艺与代码',
    category: 'THOUGHTS',
    excerpt: '写代码这件事，越久越觉得像传统手艺。好的工程师在合并 PR 前会把每一行重新读一遍——不是为找 bug，而是确认自己愿意为这段文字署名。',
    date: '2026-05-23T11:00:00.000Z',
    content: '',
  },
  {
    slug: 'writing-as-thinking',
    title: '写下来才算思考',
    category: 'THOUGHTS',
    excerpt: '没有被写出来的想法，往往只是想法的幻觉。写作的真正功能不是表达，而是揭穿——揭穿"我以为我想清楚了"的自欺。',
    date: '2026-05-23T08:30:00.000Z',
    content: '',
  },
  {
    slug: 'tools-and-mind',
    title: '工具与心智',
    category: 'LIFESTYLE',
    excerpt: '工具不是中立的容器。它放大什么、隐藏什么，悄悄重塑了你能思考什么。先看清自己心里的图，再选工具。',
    date: '2026-05-23T19:00:00.000Z',
    content: '',
  },
  {
    slug: 'on-minimalism',
    title: '关于"克制"',
    category: 'LIFESTYLE',
    excerpt: '极简的本质不是"少"，是"恰好"。克制不是匮乏，是对"多余"的高度敏感——一种愿意为"不增加什么"反复打磨的能力。',
    date: '2026-05-23T07:00:00.000Z',
    content: '',
  },
];

export const tutorialSeeds: TutorialSeed[] = [
  {
    slug: 'modern-frontend-architecture',
    title: '现代前端架构指南',
    description: '当前端项目跨过 5 万行代码之后，怎样让它依然可以被理解、被修改、被新人接手。',
    level: 'B_level',
    status: 'A更新中',
    chaptersCount: 6,
    icon: 'code',
    content: '',
  },
  {
    slug: 'ui-ux-minimal-design',
    title: 'UI/UX 美学与极简设计',
    description: '从字重、行高、留白这些"最基础的小事"开始，落到一套可复用的设计令牌系统。',
    level: 'ALL',
    status: 'B已完结',
    chaptersCount: 5,
    icon: 'layers',
    content: '',
  },
  {
    slug: 'web-performance-tuning',
    title: 'Web 极致性能优化',
    description: '从渲染管线到网络协议，系统讲解毫秒级页面加载背后的底层逻辑。',
    level: 'C_level',
    status: 'A更新中',
    chaptersCount: 5,
    icon: 'zap',
    content: '',
  },
  {
    slug: 'react-vite-setup',
    title: '从零搭建 React + Vite + TypeScript 项目',
    description: '抛弃 CRA，用 ESM 原生 + esbuild 预构建搭一份既快又干净的现代脚手架。',
    level: 'A_level',
    status: 'A更新中',
    chaptersCount: 4,
    icon: 'code',
    content: '',
  },
  {
    slug: 'strapi-headless-cms',
    title: '用 Strapi 5 搭建 Headless CMS 后端',
    description: '从零起一个 Strapi 5 项目，覆盖 schema 设计、权限、关系、媒体、部署。',
    level: 'B_level',
    status: 'A更新中',
    chaptersCount: 5,
    icon: 'layers',
    content: '',
  },
  {
    slug: 'typescript-type-gymnastics',
    title: 'TypeScript 类型体操与领域建模',
    description: '让类型成为业务建模的工具，而不是负担——当不可能的状态在编译期就不存在，运行时就少 50% 的 if/else。',
    level: 'C_level',
    status: 'A更新中',
    chaptersCount: 6,
    icon: 'zap',
    content: '',
  },
  {
    slug: 'frontend-backend-integration',
    title: '前后端联调与数据加载状态',
    description: '一个看似简单的"数据请求"，背后是错误、空状态、骨架屏、重试、缓存、并发与取消的合奏。',
    level: 'B_level',
    status: 'A更新中',
    chaptersCount: 4,
    icon: 'code',
    content: '',
  },
];

export const toolSeeds: ToolSeed[] = [
  {
    slug: 'analytics-dashboard',
    title: '数据洞察视图',
    description: '将 CSV、JSON 数据瞬间转化为优雅直观的统计图表，支持极简主题导出。',
    icon: 'barChart',
    url: '/tools/analytics-dashboard/index.html',
  },
  {
    slug: 'color-palette',
    title: '色彩调和引擎',
    description: '基于色彩理论，生成专业、和谐且符合无障碍标准的调色板。',
    icon: 'droplet',
    url: '/tools/color-palette/index.html',
  },
  {
    slug: 'markdown-editor',
    title: 'Markdown 沉浸创作',
    description: '提供所见即所得的沉浸式 Markdown 写作体验，支持本地草稿与导出 HTML。',
    icon: 'fileText',
    url: '/tools/markdown-editor/index.html',
  },
  {
    slug: 'regex-visualizer',
    title: '正则可视化调试',
    description: '把晦涩的正则表达式实时高亮匹配，让正则编写与调试不再枯燥。',
    icon: 'search',
    url: '/tools/regex-visualizer/index.html',
  },
  {
    slug: 'json-formatter',
    title: 'JSON 结构化对齐',
    description: '一键格式化、压缩、差异比较，支持大型 JSON 流式解析与字段路径定位。',
    icon: 'fileText',
    url: '/tools/json-formatter/index.html',
  },
  {
    slug: 'image-minifier',
    title: '图片极简压缩',
    description: '本地端无损 / 有损压缩 PNG、JPG、WebP，所有处理在浏览器内完成，不上传任何文件。',
    icon: 'droplet',
    url: '/tools/image-minifier/index.html',
  },
  {
    slug: 'timestamp-converter',
    title: '时间戳与时区转换器',
    description: 'Unix 时间戳、ISO 8601、本地时区之间的无缝互转，常驻顶栏的开发者好搭档。',
    icon: 'barChart',
    url: '/tools/timestamp-converter/index.html',
  },
  {
    slug: 'url-codec',
    title: 'URL 编解码工具',
    description: '对 URL、Base64、HTML 实体进行批量编解码，支持自动识别与多行处理。',
    icon: 'search',
    url: '/tools/url-codec/index.html',
  },
  {
    slug: 'csv-json',
    title: 'CSV ↔ JSON 互转',
    description: 'CSV 与 JSON 之间双向无损互转，全程在浏览器内本地完成。',
    icon: 'fileText',
    url: '/tools/csv-json/index.html',
  },
  {
    slug: 'image-to-pdf',
    title: '图片转 PDF',
    description: '把多张图片合并为一份 PDF，全部在浏览器本地处理。',
    icon: 'fileText',
    url: '/tools/image-to-pdf/index.html',
  },
  {
    slug: 'pdf-merger',
    title: 'PDF 合并',
    description: '把多份 PDF 合并成一份，全部在浏览器本地处理，不会上传到任何服务器。',
    icon: 'fileText',
    url: '/tools/pdf-merger/index.html',
  },
  {
    slug: 'pdf-splitter',
    title: 'PDF 拆分',
    description: '按页码范围从一份 PDF 中抽取页面，本地完成。',
    icon: 'fileText',
    url: '/tools/pdf-splitter/index.html',
  },
  {
    slug: 'qrcode',
    title: '二维码生成',
    description: '把文本或链接快速生成为二维码，本地渲染。',
    icon: 'search',
    url: '/tools/qrcode/index.html',
  },
  {
    slug: 'word-counter',
    title: '文本字数统计',
    description: '统计文本的字符数、词数、段落数与预估阅读时长。',
    icon: 'fileText',
    url: '/tools/word-counter/index.html',
  },
];
