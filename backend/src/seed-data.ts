// 站点初始内容种子。所有条目以 slug 作为幂等键 —— bootstrap 时若 slug 已存在则跳过，
// 因此可以安全多次启动而不会重复插入。文风对齐根目录 blog.html 的极简、克制基调。

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
      '在这个快速发展的时代，我们常常被技术的浪潮裹挟前行。然而，最重要的是保持对人性的关怀，让技术真正服务于个体的成长而非异化。',
    date: '2026-03-01T10:00:00.000Z',
    content: [
      '技术从来不是中立的。每一次工具的迭代，都重新塑造着我们感知世界的方式。',
      '',
      '从纸笔到屏幕，从邮件到推送，效率被反复抬高，注意力却被反复切碎。我们获得了同时与一千个人对话的能力，却失去了与一个人安静相处一小时的耐心。',
      '',
      '我并不反对技术。相反，我深爱它带来的可能性。但当我每次准备打开一个新工具之前，我会问自己一个问题：它是在替我节省时间，还是在替我消费时间？',
      '',
      '答案不总是清晰的。但这个问题，本身就是一种克制。',
    ].join('\n'),
  },
  {
    slug: 'on-creativity',
    title: '关于创造力的本源思考',
    category: 'THOUGHTS',
    excerpt:
      '创造力绝不是凭空而来的神启，而是长期积累与深度思考在特定时刻的必然交汇。它要求我们保持对世界的好奇，以及拥抱未知的勇气。',
    date: '2026-02-15T09:00:00.000Z',
    content: [
      '人们容易把创造力浪漫化。仿佛灵感是一道闪电，劈在少数被神选中的人头上。',
      '',
      '但真正去做过创造性工作的人都知道：所谓的灵感，更多是长期沉默之后的回响。是你读过的书、走过的路、做坏过的版本，在某一个看似平凡的清晨，自己组合起来的样子。',
      '',
      '所以我越来越相信，培养创造力，不是去追逐灵感，而是去搭建一个让灵感愿意停留的环境：稳定的输入、留白的时间、以及一支随时可以记录的笔。',
    ].join('\n'),
  },
  {
    slug: 'art-of-slowing-down',
    title: '慢下来的艺术与哲学',
    category: 'LIFESTYLE',
    excerpt:
      '在效率至上的算法社会中，我们逐渐丧失了"慢"的能力。有时候，主动放慢脚步，去注视一朵花的盛开，反而能让我们在精神上走得更远。',
    date: '2026-01-28T20:00:00.000Z',
    content: [
      '"快"被默认是好的。早一天上线、早一周交付、早一年成名。',
      '',
      '可是真正决定一件作品厚度的，往往是那些"慢"下来的瞬间——反复打磨一个比喻的下午，把一段代码删掉重写的深夜，盯着一张白纸不写字的清晨。',
      '',
      '慢，不是落后，是一种敢于把节奏从外界手中拿回来的能力。',
    ].join('\n'),
  },
  {
    slug: 'signal-in-noise',
    title: '在喧嚣中寻找信号',
    category: 'ESSAY',
    excerpt:
      '信息越多，注意力越稀缺。学会筛选，本身就是一种创造。',
    date: '2026-04-12T15:00:00.000Z',
    content: [
      '订阅源、群聊、推送、热搜——每一种渠道都在向我们承诺"重要的事情"。',
      '',
      '可如果一切都重要，那就什么都不重要。',
      '',
      '我开始用一种笨办法：每周给自己留出半天，不接收任何新输入，只整理过去七天里被我标记过的内容。多数会被删掉，少数会被反复读。剩下的，才是真正在我心里留下了形状的东西。',
    ].join('\n'),
  },
  {
    slug: 'craftsmanship-and-code',
    title: '手艺与代码',
    category: 'THOUGHTS',
    excerpt: '写代码这件事，越久越觉得像传统手艺。',
    date: '2026-05-20T11:00:00.000Z',
    content: [
      '木匠会在做完一张椅子后，用手摸过每一处接缝。',
      '',
      '写代码的人也是。好的工程师会在合并 PR 之前，把自己写过的每一行从头读一遍——不是为了找 bug，而是确认自己愿意为这段文字署名。',
      '',
      '代码是一种留痕。它会被后来者看见，会在凌晨三点被追溯，会在某次重构时被复活。我希望我留下的，是干净的、可被理解的、值得被继承的东西。',
    ].join('\n'),
  },
  {
    slug: 'writing-as-thinking',
    title: '写下来才算思考',
    category: 'THOUGHTS',
    excerpt: '没有被写出来的想法，往往只是想法的幻觉。',
    date: '2026-03-22T08:30:00.000Z',
    content: [
      '我曾经以为我"想清楚"了很多事，直到我开始把它们写下来。',
      '',
      '一旦落到纸面，模糊的概念就必须长出筋骨：主语是谁，前提是什么，结论是否真的成立。很多时候，写到一半我才发现，我根本没想清楚，只是反复在脑海里复述同一种感觉。',
      '',
      '所以现在，凡是重要的判断，我都会先写。写完之后，再决定要不要说出口。',
    ].join('\n'),
  },
  {
    slug: 'tools-and-mind',
    title: '工具与心智',
    category: 'LIFESTYLE',
    excerpt: '工具是放大器而非创造者。',
    date: '2026-05-18T19:00:00.000Z',
    content: [
      '换一支更好的笔，并不会让你成为作家。',
      '',
      '换一台更快的电脑，也不会让你写出更优雅的代码。',
      '',
      '工具的价值，永远建立在使用者的心智之上。它能把一份清晰的意图放大十倍，也能把一份混乱的意图同样放大十倍。所以，与其反复追逐新工具，不如先确认：自己心里的那张图，是不是足够清楚。',
    ].join('\n'),
  },
  {
    slug: 'on-minimalism',
    title: '关于"克制"',
    category: 'LIFESTYLE',
    excerpt: '极简的本质不是"少"，而是"恰好"。',
    date: '2026-05-22T07:00:00.000Z',
    content: [
      '人们常常把极简理解为"舍弃"。但其实更难的，是判断什么值得留下。',
      '',
      '一张克制的网页，背后往往有更多的删改稿；一段克制的文字，背后往往有更多没说出口的话。克制不是匮乏，而是一种对"多余"的高度敏感。',
      '',
      '愿我们都能在加法的世界里，练好减法。',
    ].join('\n'),
  },
];

export const tutorialSeeds: TutorialSeed[] = [
  {
    slug: 'modern-frontend-architecture',
    title: '现代前端架构指南',
    description: '深入探讨 React / Vue 生态、状态管理艺术与企业级项目工程化实践。',
    level: 'B_level',
    status: 'A更新中',
    chaptersCount: 12,
    icon: 'code',
    content: [
      '本系列从"为什么需要架构"开始，逐步进入路由组织、状态分层、跨层通信、错误边界、模块联邦等话题。',
      '',
      '不追求堆砌名词，只回答一个问题：当项目跨过 5 万行代码之后，怎样让它依然可以被理解。',
    ].join('\n'),
  },
  {
    slug: 'ui-ux-minimal-design',
    title: 'UI/UX 美学与极简设计',
    description: '探寻排版、色彩理论与留白艺术，运用 Figma 打造克制而优雅的界面。',
    level: 'ALL',
    status: 'B已完结',
    chaptersCount: 8,
    icon: 'layers',
    content: [
      '设计不是装饰，而是删减后的秩序。',
      '',
      '我们将从字重、行高、留白三件最基础的事谈起，最后落到一套完整的暗色系设计令牌（design tokens）。',
    ].join('\n'),
  },
  {
    slug: 'web-performance-tuning',
    title: 'Web 极致性能优化',
    description: '从渲染管线到网络协议，系统解析毫秒级页面加载背后的底层逻辑。',
    level: 'C_level',
    status: 'A更新中',
    chaptersCount: 6,
    icon: 'zap',
    content: [
      '速度是一种功能。',
      '',
      '本系列覆盖关键渲染路径、字体加载策略、HTTP/3、Service Worker 缓存、以及如何用 Web Vitals 真正驱动优化决策。',
    ].join('\n'),
  },
  {
    slug: 'react-vite-setup',
    title: '从零搭建 React + Vite + TypeScript 项目',
    description: '第一章，讲清楚为什么选 Vite、怎么组织目录、CSS Module 怎么用。',
    level: 'A_level',
    status: 'A更新中',
    chaptersCount: 4,
    icon: 'code',
    content: [
      '面向刚刚走出脚手架时代的开发者：抛弃 CRA，理解 ESM 原生开发的真正乐趣。',
    ].join('\n'),
  },
  {
    slug: 'strapi-headless-cms',
    title: '用 Strapi 5 搭建 Headless CMS 后端',
    description: '介绍 Strapi 5 的 collection、权限、API 调用与上传。',
    level: 'B_level',
    status: 'A更新中',
    chaptersCount: 5,
    icon: 'layers',
    content: [
      '从零起一个 Strapi 5 项目，覆盖 content type 设计、API Token、关系字段、媒体上传与权限粒度。',
    ].join('\n'),
  },
  {
    slug: 'typescript-type-gymnastics',
    title: 'TypeScript 类型体操与领域建模',
    description: '从条件类型到模板字面量类型，让类型成为业务建模的工具，而不是负担。',
    level: 'C_level',
    status: 'A更新中',
    chaptersCount: 7,
    icon: 'zap',
    content: [
      '当类型能精确表达"不可能发生的状态"，运行时的 if/else 就会自然消失。',
    ].join('\n'),
  },
  {
    slug: 'frontend-backend-integration',
    title: '前后端联调与数据加载状态',
    description: '环境变量、Service 层、Hook 与组件解耦。',
    level: 'B_level',
    status: 'A更新中',
    chaptersCount: 3,
    icon: 'code',
    content: [
      '一个看似简单的"数据请求"，背后是错误、空状态、骨架屏、重试、缓存、并发与取消的合奏。',
    ].join('\n'),
  },
];

export const toolSeeds: ToolSeed[] = [
  {
    slug: 'analytics-dashboard',
    title: '数据洞察视图',
    description: '将复杂的 CSV、JSON 数据瞬间转化为优雅直观的统计图表，支持极简主题导出。',
    icon: 'barChart',
    url: '/tools/analytics',
  },
  {
    slug: 'color-palette',
    title: '色彩调和引擎',
    description: '基于色彩理论与高阶算法，为您生成专业、和谐且符合无障碍标准的调色板。',
    icon: 'droplet',
    url: '/tools/palette',
  },
  {
    slug: 'markdown-editor',
    title: 'Markdown 沉浸创作',
    description: '提供所见即所得的沉浸式 Markdown 写作体验，支持导出纯净版 PDF 与 HTML。',
    icon: 'fileText',
    url: '/tools/markdown',
  },
  {
    slug: 'regex-visualizer',
    title: '正则可视化调试',
    description: '将晦涩的正则表达式转换为清晰的状态机图表，让正则编写与调试不再枯燥。',
    icon: 'search',
    url: '/tools/regex',
  },
  {
    slug: 'json-formatter',
    title: 'JSON 结构化对齐',
    description: '一键格式化、压缩、差异比较，支持大型 JSON 流式解析与字段路径定位。',
    icon: 'fileText',
    url: '/tools/json',
  },
  {
    slug: 'image-minifier',
    title: '图片极简压缩',
    description: '本地端无损 / 有损压缩 PNG、JPG、WebP，所有处理在浏览器内完成，不上传任何文件。',
    icon: 'droplet',
    url: '/tools/image',
  },
  {
    slug: 'timestamp-converter',
    title: '时间戳与时区转换器',
    description: 'Unix 时间戳、ISO 8601、本地时区之间的无缝互转，常驻顶栏的开发者好搭档。',
    icon: 'barChart',
    url: '/tools/timestamp',
  },
  {
    slug: 'url-codec',
    title: 'URL 编解码工具',
    description: '对 URL、Base64、HTML 实体进行批量编解码，支持自动识别与多行处理。',
    icon: 'search',
    url: '/tools/url-codec',
  },
];
