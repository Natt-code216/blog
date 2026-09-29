#!/usr/bin/env node
// Explicit, first-deployment import. Never overwrites an existing CMS document.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { tutorialDrafts } from './tutorial-content.mjs';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = resolve(backendDir, '..');
const require = createRequire(import.meta.url);

async function main() {
  if (process.argv[2] !== '--initialize' || process.env.DATABASE_CLIENT !== 'postgres'
    || process.env.DATABASE_NAME !== 'blog') {
    throw new Error('Requires --initialize and DATABASE_CLIENT=postgres, DATABASE_NAME=blog.');
  }
  const essays = readdirSync(join(rootDir, 'content/essays'), { withFileTypes: true })
    .filter(entry => entry.isDirectory()).map(({ name }) => {
      const source = readFileSync(join(rootDir, 'content/essays', name, 'index.md'), 'utf8');
      const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!match) throw new Error(`Missing frontmatter: ${name}`);
      const fields = Object.fromEntries(match[1].split(/\r?\n/).map(line => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator), line.slice(separator + 1).trim()];
      }));
      if (fields.slug !== name || !fields.title || !match[2].trim()) {
        throw new Error(`Invalid essay: ${name}`);
      }
      return { slug: name, title: fields.title, category: fields.category,
        excerpt: fields.excerpt || '', date: `${fields.date}T12:00:00.000Z`,
        content: match[2].trim(), published: true };
    });
  const tutorials = tutorialDrafts();
  process.chdir(backendDir);
  const { createStrapi } = require('@strapi/strapi');
  const app = await createStrapi({ appDir: backendDir, distDir: join(backendDir, 'dist') }).load();
  try {
    for (const [uid, drafts] of [['api::essay.essay', essays], ['api::tutorial.tutorial', tutorials]]) {
      const documents = app.documents(uid);
      for (const draft of drafts) {
        const existing = await documents.findMany({ filters: { slug: draft.slug } });
        if (existing.length) { console.log(`Already exists: ${draft.slug}`); continue; }
        await documents.create({ data: draft, status: 'published' });
        console.log(`Published: ${draft.slug}`);
      }
    }
    const role = await app.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
    if (!role) throw new Error('Public role missing');
    for (const type of ['essay', 'tutorial', 'tool']) {
      for (const method of ['find', 'findOne']) {
        const action = `api::${type}.${type}.${method}`;
        const permissions = app.db.query('plugin::users-permissions.permission');
        if (!await permissions.findOne({ where: { action, role: role.id } })) {
          await permissions.create({ data: { action, role: role.id } });
        }
      }
    }
  } finally {
    await app.destroy();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
