export const readingCategories = [
  { id: 'learning', label: '学习与认知' },
  { id: 'acceptance', label: '努力与自我接纳' },
  { id: 'motivation', label: '自我认识与动机' },
  { id: 'work', label: '工作、方向与行动' },
  { id: 'life', label: '时间、人生与关系' },
  { id: 'writing', label: '表达与知识积累' },
] as const;

export type ReadingCategoryId = typeof readingCategories[number]['id'];
export type CollectionView = 'reading' | 'sites';

interface ReadingLink {
  id: string;
  title: string;
  originalTitle: string;
  author: string;
  category: ReadingCategoryId;
  url: string;
}

interface CollectedSite {
  id: string;
  title: string;
  monogram: string;
  description?: string;
  url: string;
}

// One source for the collection page, homepage counts and the search index.
// Chinese titles are reference translations, not links to translated articles.
export const readingLinks: readonly ReadingLink[] = [
  { id: 'teach-yourself', title: '如何自学困难的东西', originalTitle: 'How to teach yourself hard things', author: 'Julia Evans', category: 'learning', url: 'https://jvns.ca/blog/2018/09/01/learning-skills-you-can-practice/' },
  { id: 'lesson-to-unlearn', title: '需要重新审视的一课', originalTitle: 'The Lesson to Unlearn', author: 'Paul Graham', category: 'learning', url: 'https://paulgraham.com/lesson.html' },
  { id: 'relax', title: '放松一点，结果可能差不多', originalTitle: 'Relax for the same result', author: 'Derek Sivers', category: 'acceptance', url: 'https://sive.rs/relax' },
  { id: 'never-sort-life-out', title: '假如你永远无法把人生彻底理顺呢？', originalTitle: 'What if you never sort your life out?', author: 'Oliver Burkeman', category: 'acceptance', url: 'https://www.oliverburkeman.com/never' },
  { id: 'self-respect', title: '论自尊', originalTitle: 'On Self-Respect', author: 'Joan Didion', category: 'motivation', url: 'https://www.vogue.com/article/joan-didion-self-respect-essay-1961' },
  { id: 'why-i-write', title: '我为什么写作', originalTitle: 'Why I Write', author: 'George Orwell', category: 'motivation', url: 'https://www.orwellfoundation.com/the-orwell-foundation/orwell/essays-and-other-works/why-i-write/' },
  { id: 'great-work', title: '如何做出出色的工作', originalTitle: 'How to Do Great Work', author: 'Paul Graham', category: 'work', url: 'https://paulgraham.com/greatwork.html' },
  { id: 'de-bog-yourself', title: '想把自己从泥潭里拔出来？', originalTitle: 'So you wanna de-bog yourself', author: 'Adam Mastroianni', category: 'work', url: 'https://www.experimental-history.com/p/so-you-wanna-de-bog-yourself' },
  { id: 'life-is-short', title: '人生短暂', originalTitle: 'Life is Short', author: 'Paul Graham', category: 'life', url: 'https://paulgraham.com/vb.html' },
  { id: 'tail-end', title: '所剩的尾声', originalTitle: 'The Tail End', author: 'Tim Urban', category: 'life', url: 'https://waitbutwhy.com/2015/12/the-tail-end.html' },
  { id: 'learn-in-public', title: '公开学习', originalTitle: 'Learn In Public', author: 'swyx / Shawn Wang', category: 'writing', url: 'https://swyx.io/learn-in-public' },
  { id: 'digital-garden', title: '数字花园简史与理念', originalTitle: 'A Brief History & Ethos of the Digital Garden', author: 'Maggie Appleton', category: 'writing', url: 'https://maggieappleton.com/garden-history' },
];

export const collectedSites: readonly CollectedSite[] = [
  { id: 'offerready', title: '准Offer · OfferReady', monogram: '准', description: '个人自建的大学生 AI 求职面试助手，提供岗位调研、简历匹配分析与面试题预测。', url: 'https://www.offerready.cn/' },
  // Keep the domain until the site's display name and purpose can be verified.
  { id: 'aihot', title: 'aihot.news', monogram: 'A', url: 'https://aihot.news/' },
  { id: 'lks', title: 'LKs 网站推荐合集', monogram: 'LK', description: '从学习、工具到艺术与生活，发现更多有趣的网站。', url: 'https://lkssite.vip/' },
  { id: '9eip', title: '完美小站', monogram: '9', description: '收集课程、工具与创意素材的资源导航。', url: 'https://www.9eip.com/#term-80223' },
];

export function collectionHref(view: CollectionView = 'reading'): string {
  return `/collection?view=${view}`;
}

export function categoryLabel(id: ReadingCategoryId): string {
  return readingCategories.find(category => category.id === id)!.label;
}

export function sourceDomain(url: string): string {
  return new URL(url).hostname.replace(/^www\./, '');
}
