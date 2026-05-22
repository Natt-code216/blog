#!/usr/bin/env node
// scripts/sync-content.mjs
// 把 content/ 下的 markdown 同步到 Strapi：
//   - content/essays/{slug}/index.md     → api::essay.essay
//   - content/tutorials/{slug}/index.md  → api::tutorial.tutorial
//   - content/tutorials/{slug}/chapters/*.md → api::chapter.chapter
// 按 slug upsert，自动 publish。
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT = join(ROOT, 'content');

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { fm: {}, body: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { fm: {}, body: text };
  const block = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\r?\n/, '');
  const fm = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if (/^\[.*\]$/.test(v)) {
        v = v.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
      } else if (/^\d+$/.test(v)) {
        v = parseInt(v, 10);
      }
      fm[m[1]] = v;
    }
  }
  return { fm, body };
}

function readEssays() {
  const dir = join(CONTENT, 'essays');
  if (!existsSync(dir)) return [];
  const list = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name, 'index.md');
    if (!existsSync(p)) continue;
    const { fm, body } = parseFrontmatter(readFileSync(p, 'utf8'));
    list.push({ ...fm, content: body });
  }
  return list;
}

function readTutorials() {
  const dir = join(CONTENT, 'tutorials');
  if (!existsSync(dir)) return [];
  const list = [];
  for (const name of readdirSync(dir)) {
    const tdir = join(dir, name);
    const indexPath = join(tdir, 'index.md');
    if (!existsSync(indexPath)) continue;
    const { fm, body } = parseFrontmatter(readFileSync(indexPath, 'utf8'));
    const chapters = [];
    const chDir = join(tdir, 'chapters');
    if (existsSync(chDir)) {
      for (const cname of readdirSync(chDir).sort()) {
        if (!cname.endsWith('.md')) continue;
        const cp = join(chDir, cname);
        const parsed = parseFrontmatter(readFileSync(cp, 'utf8'));
        chapters.push({ ...parsed.fm, content: parsed.body, file: cname });
      }
    }
    list.push({ ...fm, content: body, chapters });
  }
  return list;
}

async function main() {
  const essays = readEssays();
  const tutorials = readTutorials();
  console.log(`[sync] loaded ${essays.length} essays, ${tutorials.length} tutorials (${tutorials.reduce((n, t) => n + t.chapters.length, 0)} chapters)`);

  process.chdir(join(ROOT, 'backend'));
  const { createStrapi, compileStrapi } = await import('@strapi/strapi');
  const appContext = await compileStrapi();
  const strapi = await createStrapi(appContext).load();

  try {
    // Essays
    for (const e of essays) {
      const existing = await strapi.documents('api::essay.essay').findMany({
        filters: { slug: e.slug },
        status: 'draft',
      });
      const data = {
        title: e.title,
        category: e.category,
        excerpt: e.excerpt,
        content: e.content,
        date: e.date,
        slug: e.slug,
        published: true,
      };
      if (existing.length > 0) {
        await strapi.documents('api::essay.essay').update({
          documentId: existing[0].documentId,
          data,
          status: 'published',
        });
        console.log(`[sync] ~ essay ${e.slug}`);
      } else {
        const created = await strapi.documents('api::essay.essay').create({ data, status: 'published' });
        await strapi.documents('api::essay.essay').publish({ documentId: created.documentId });
        console.log(`[sync] + essay ${e.slug}`);
      }
    }

    // Tutorials + Chapters
    for (const t of tutorials) {
      const tutorialData = {
        title: t.title,
        description: t.description,
        level: t.level,
        status: t.status,
        chaptersCount: t.chapters?.length || t.chapters || 0,
        icon: t.icon,
        content: t.content,
        slug: t.slug,
        published: true,
      };
      const existingT = await strapi.documents('api::tutorial.tutorial').findMany({
        filters: { slug: t.slug },
        status: 'draft',
      });
      let tutorialDocId;
      if (existingT.length > 0) {
        tutorialDocId = existingT[0].documentId;
        await strapi.documents('api::tutorial.tutorial').update({
          documentId: tutorialDocId,
          data: tutorialData,
          status: 'published',
        });
        console.log(`[sync] ~ tutorial ${t.slug}`);
      } else {
        const created = await strapi.documents('api::tutorial.tutorial').create({
          data: tutorialData,
          status: 'published',
        });
        tutorialDocId = created.documentId;
        await strapi.documents('api::tutorial.tutorial').publish({ documentId: tutorialDocId });
        console.log(`[sync] + tutorial ${t.slug}`);
      }

      for (const ch of t.chapters) {
        const chSlug = `${t.slug}-${String(ch.order).padStart(2, '0')}`;
        const chData = {
          title: ch.title,
          order: ch.order,
          content: ch.content,
          est_read_minutes: ch.est_read_minutes || null,
          slug: chSlug,
          tutorial: tutorialDocId,
        };
        const existingCh = await strapi.documents('api::chapter.chapter').findMany({
          filters: { slug: chSlug },
          status: 'draft',
        });
        if (existingCh.length > 0) {
          await strapi.documents('api::chapter.chapter').update({
            documentId: existingCh[0].documentId,
            data: chData,
            status: 'published',
          });
        } else {
          const created = await strapi.documents('api::chapter.chapter').create({
            data: chData,
            status: 'published',
          });
          await strapi.documents('api::chapter.chapter').publish({ documentId: created.documentId });
        }
        console.log(`[sync]   - chapter ${chSlug}`);
      }
    }
  } finally {
    await strapi.destroy();
  }
  console.log('[sync] done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
