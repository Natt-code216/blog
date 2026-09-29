import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../content/tutorials');
const escapeHtml = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

/** Chapter files are the source of truth for both the reader and the CMS count. */
export function tutorialDrafts(root = defaultRoot) {
  const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'));
  if (!Array.isArray(catalog) || !catalog.length) throw new Error('No tutorials in catalog.');
  const slugs = new Set();
  const orders = new Set();
  const drafts = catalog.map(item => {
    const { slug, title, description, level, status, icon, order, chapters } = item;
    if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug)
      || typeof title !== 'string' || !title.trim() || typeof description !== 'string' || !description.trim()
      || !['A_level', 'B_level', 'C_level', 'ALL'].includes(level)
      || !['A更新中', 'B已完结'].includes(status) || !['code', 'layers', 'zap'].includes(icon)
      || !Number.isInteger(order) || order < 1 || orders.has(order)
      || !Array.isArray(chapters) || !chapters.length || new Set(chapters).size !== chapters.length) {
      throw new Error(`Invalid or duplicate tutorial metadata: ${slug}`);
    }
    slugs.add(slug);
    orders.add(order);
    const sections = chapters.map((file, index) => {
      if (typeof file !== 'string' || !/^\d{2}-[a-z0-9-]+\.md$/.test(file)) {
        throw new Error(`Invalid chapter filename: ${slug}/${file}`);
      }
      const source = readFileSync(join(root, slug, file), 'utf8').trim();
      const match = source.match(/^# ([^\r\n]+)\r?\n+([\s\S]+)$/);
      if (!match || !match[2].trim() || /^# /m.test(match[2])) {
        throw new Error(`Chapter must have one title and a body: ${slug}/${file}`);
      }
      return { title: match[1], body: match[2], id: `chapter-${index + 1}` };
    });
    const contents = sections.map(section =>
      `<li><a href="#${section.id}">${escapeHtml(section.title)}</a></li>`).join('\n');
    const body = sections.map(section =>
      `<h2 id="${section.id}">${escapeHtml(section.title)}</h2>\n\n${section.body}`).join('\n\n---\n\n');
    return {
      slug, title, description, level, status, icon, order,
      chapters: sections.length,
      content: `## 学习说明\n\n本教程已整理 ${sections.length} 章，建议按目录顺序学习。每章包含操作步骤、练习与验收方法，英文参考链接附在相关段落。\n\n<nav aria-label="章节目录">\n<p><strong>章节目录</strong></p>\n<ol>\n${contents}\n</ol>\n</nav>\n\n${body}`,
      published: true,
    };
  });
  const allSlugs = new Set(drafts.map(draft => draft.slug));
  for (const draft of drafts) {
    for (const [, target] of draft.content.matchAll(/\]\(\/tutorials\/([a-z0-9-]+)\)/g)) {
      if (!allSlugs.has(target)) throw new Error(`Unknown tutorial link: ${draft.slug} → ${target}`);
    }
  }
  return drafts.sort((a, b) => a.order - b.order);
}
