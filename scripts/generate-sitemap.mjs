#!/usr/bin/env node
/**
 * 生成 dist/sitemap.xml
 *
 * 用法：
 *   SITE_URL=https://your-blog.com STRAPI_URL=http://localhost:1337/api node scripts/generate-sitemap.mjs
 *
 * 在 build 后执行：dist/sitemap.xml 会被静态托管平台一起部署。
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE = process.env.SITE_URL || 'http://localhost:5173';
const API = process.env.STRAPI_URL || 'http://localhost:1337/api';

async function fetchAll(endpoint) {
  try {
    const res = await fetch(`${API}${endpoint}?pagination[limit]=100`);
    if (!res.ok) return [];
    const body = await res.json();
    return body.data || [];
  } catch {
    return [];
  }
}

(async () => {
  const [essays, tutorials] = await Promise.all([
    fetchAll('/essays'),
    fetchAll('/tutorials'),
  ]);

  const urls = [
    { loc: `${SITE}/`, lastmod: new Date().toISOString() },
    ...essays.map((e) => ({
      loc: `${SITE}/essays/${e.slug}`,
      lastmod: e.updatedAt || new Date().toISOString(),
    })),
    ...tutorials.map((t) => ({
      loc: `${SITE}/tutorials/${t.slug}`,
      lastmod: t.updatedAt || new Date().toISOString(),
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`,
  )
  .join('\n')}
</urlset>`;

  const outDir = path.resolve('dist');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml);
  console.log(`Sitemap 写入 dist/sitemap.xml，共 ${urls.length} 个 URL`);
})();
