#!/usr/bin/env node
// Fill the local SQLite database with repository drafts for UI debugging.
// Essays mirror content/essays; retired essays remain as unpublished drafts.
// Tutorials update by slug from chapter files. This script only accepts local SQLite.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { tutorialDrafts } from './tutorial-content.mjs';

const backendDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootDir = resolve(backendDir, '..');
const require = createRequire(import.meta.url);
process.chdir(backendDir);

function essayDrafts() {
  const drafts = readdirSync(join(rootDir, 'content/essays'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name }) => {
      const source = readFileSync(join(rootDir, 'content/essays', name, 'index.md'), 'utf8');
      const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
      if (!match) throw new Error(`Missing frontmatter: ${name}`);
      const fields = Object.fromEntries(match[1].split(/\r?\n/).map((line) => {
        const separator = line.indexOf(':');
        return [line.slice(0, separator), line.slice(separator + 1).trim()];
      }));
      if (fields.slug !== name || !fields.title || !['ESSAY', 'THOUGHTS', 'LIFESTYLE'].includes(fields.category)
        || !/^\d{4}-\d{2}-\d{2}$/.test(fields.date) || !match[2].trim()) {
        throw new Error(`Invalid essay metadata: ${name}`);
      }
      return {
        slug: name,
        title: fields.title,
        category: fields.category,
        excerpt: fields.excerpt || '',
        date: `${fields.date}T12:00:00.000Z`,
        content: match[2].trim(),
        published: true,
      };
    });
  if (!drafts.length) throw new Error('No essay drafts found; refusing to unpublish all essays.');
  return drafts;
}

async function syncEssays(app, drafts) {
  const documents = app.documents('api::essay.essay');
  const existing = [
    ...await documents.findMany({ status: 'draft' }),
    ...await documents.findMany({ status: 'published' }),
  ];
  const bySlug = new Map();
  for (const essay of existing) {
    if (bySlug.has(essay.slug) && bySlug.get(essay.slug).documentId !== essay.documentId) {
      throw new Error(`Multiple documents share slug ${essay.slug}; resolve duplicates before syncing.`);
    }
    bySlug.set(essay.slug, essay);
  }

  for (const draft of drafts) {
    const previous = bySlug.get(draft.slug);
    const document = previous
      ? await documents.update({ documentId: previous.documentId, data: draft })
      : await documents.create({ data: draft });
    await documents.publish({ documentId: document.documentId });
    console.log(`${previous ? 'Updated' : 'Added'} essay: ${draft.slug}`);
  }

  const activeSlugs = new Set(drafts.map((draft) => draft.slug));
  for (const essay of bySlug.values()) {
    if (activeSlugs.has(essay.slug)) continue;
    await documents.update({ documentId: essay.documentId, data: { published: false } });
    await documents.unpublish({ documentId: essay.documentId });
    console.log(`Archived essay: ${essay.slug}`);
  }
}

async function syncTutorials(app, drafts) {
  const documents = app.documents('api::tutorial.tutorial');
  const existing = [
    ...await documents.findMany({ status: 'draft' }),
    ...await documents.findMany({ status: 'published' }),
  ];
  const bySlug = new Map();
  for (const tutorial of existing) {
    if (bySlug.has(tutorial.slug) && bySlug.get(tutorial.slug).documentId !== tutorial.documentId) {
      throw new Error(`Multiple documents share slug ${tutorial.slug}; resolve duplicates before syncing.`);
    }
    bySlug.set(tutorial.slug, tutorial);
  }
  for (const draft of drafts) {
    const previous = bySlug.get(draft.slug);
    const document = previous
      ? await documents.update({ documentId: previous.documentId, data: draft })
      : await documents.create({ data: draft });
    await documents.publish({ documentId: document.documentId });
    console.log(`${previous ? 'Updated' : 'Added'} tutorial: ${draft.slug} (${draft.chapters} chapters)`);
  }
}

async function main() {
  const flags = new Set(process.argv.slice(2));
  if ([...flags].some(flag => !['--essays-only', '--tutorials-only', '--check-tutorials'].includes(flag)) || flags.size > 1) {
    throw new Error('Use one of --essays-only, --tutorials-only, --check-tutorials, or no flag.');
  }
  const tutorials = flags.has('--essays-only') ? [] : tutorialDrafts();
  if (flags.has('--check-tutorials')) {
    for (const draft of tutorials) console.log(`${draft.order}. ${draft.title}: ${draft.chapters} chapters`);
    console.log(`Validated ${tutorials.length} tutorials / ${tutorials.reduce((sum, draft) => sum + draft.chapters, 0)} chapters.`);
    return;
  }
  const essays = flags.has('--tutorials-only') ? [] : essayDrafts();
  const { compileStrapi, createStrapi } = require('@strapi/strapi');
  const app = createStrapi(await compileStrapi());
  const connection = app.config.get('database.connection');
  if (connection.client !== 'sqlite' || resolve(connection.connection.filename) !== join(backendDir, '.tmp/data.db')) {
    throw new Error('Local seeding requires the default backend/.tmp/data.db SQLite database.');
  }
  const databaseFile = join(backendDir, '.tmp/data.db');
  if (existsSync(databaseFile)) {
    const Database = require('better-sqlite3');
    const database = new Database(databaseFile, { readonly: true });
    const backup = join(backendDir, `.tmp/before-content-sync-${Date.now()}.db`);
    try { await database.backup(backup); } finally { database.close(); }
    console.log(`Local database backup: ${backup}`);
  }
  await app.load();
  try {
    if (essays.length) await syncEssays(app, essays);
    if (tutorials.length) await syncTutorials(app, tutorials);

    const role = await app.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
    if (!role) throw new Error('Public role is missing.');
    const actions = flags.has('--tutorials-only') ? [
      'api::tutorial.tutorial.find', 'api::tutorial.tutorial.findOne',
    ] : [
      'api::essay.essay.find', 'api::essay.essay.findOne',
      'api::tutorial.tutorial.find', 'api::tutorial.tutorial.findOne',
      'api::tool.tool.find', 'api::tool.tool.findOne',
    ];
    for (const action of actions) {
      const exists = await app.db.query('plugin::users-permissions.permission').findOne({
        where: { action, role: role.id },
      });
      if (!exists) {
        await app.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
        console.log(`Enabled local public read: ${action}`);
      }
    }
  } finally {
    await app.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
