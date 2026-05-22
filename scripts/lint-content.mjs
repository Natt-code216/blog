#!/usr/bin/env node
// scripts/lint-content.mjs
// 校验 content/**/*.md：frontmatter 字段、字数、占位符、references.md 存在性。
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';

const ROOT = process.cwd();
const CONTENT = join(ROOT, 'content');

const PLACEHOLDERS = [/\bTODO\b/, /lorem ipsum/i, /xxxxx/i, /？？？？/];

const ESSAY_REQ = ['slug', 'title', 'category', 'excerpt', 'date'];
const TUTORIAL_REQ = ['slug', 'title', 'description', 'level', 'status', 'icon'];
const CHAPTER_REQ = ['order', 'title'];

const errors = [];
const warnings = [];

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (name.endsWith('.md')) out.push(p);
  }
  return out;
}

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return { fm: null, body: text };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { fm: null, body: text };
  const block = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\r?\n/, '');
  const fm = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:\s*(.*)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return { fm, body };
}

function countWords(body) {
  // Chinese chars count 1 each; ascii words split by whitespace
  const ascii = (body.match(/[A-Za-z0-9_'-]+/g) || []).length;
  const cjk = (body.match(/[一-鿿]/g) || []).length;
  return ascii + cjk;
}

function checkPlaceholders(body, file) {
  for (const re of PLACEHOLDERS) {
    if (re.test(body)) errors.push(`${file}: contains placeholder ${re}`);
  }
}

function checkReferences(mdFile) {
  const dir = dirname(mdFile);
  const ref = join(dir, 'references.md');
  // For tutorials chapters live under chapters/, references is one level up
  if (mdFile.includes(`${join('tutorials', '')}`) && basename(dir) !== 'chapters') {
    // tutorial index.md
    if (!existsSync(ref)) errors.push(`${mdFile}: missing references.md`);
    else if (statSync(ref).size === 0) errors.push(`${mdFile}: references.md is empty`);
  } else if (mdFile.includes(`${join('essays', '')}`) && basename(mdFile) === 'index.md') {
    if (!existsSync(ref)) errors.push(`${mdFile}: missing references.md`);
    else if (statSync(ref).size === 0) errors.push(`${mdFile}: references.md is empty`);
  }
}

const files = walk(CONTENT);

for (const file of files) {
  const rel = relative(ROOT, file);
  if (/[\\\/]references\.md$/.test(file) || /[\\\/]outline\.md$/.test(file) || /[\\\/]README\.md$/i.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  const { fm, body } = parseFrontmatter(text);
  if (!fm) {
    errors.push(`${rel}: missing or invalid frontmatter`);
    continue;
  }
  checkPlaceholders(body, rel);
  const wc = countWords(body);
  const isChapter = /[\\\/]chapters[\\\/]/.test(file);
  const isEssay = /[\\\/]essays[\\\/]/.test(file) && basename(file) === 'index.md';
  const isTutorialIndex = /[\\\/]tutorials[\\\/]/.test(file) && basename(file) === 'index.md';

  if (isEssay) {
    for (const k of ESSAY_REQ) if (!fm[k]) errors.push(`${rel}: missing frontmatter field ${k}`);
    if (wc < 1200) errors.push(`${rel}: word count ${wc} < 1200`);
    checkReferences(file);
  } else if (isTutorialIndex) {
    for (const k of TUTORIAL_REQ) if (!fm[k]) errors.push(`${rel}: missing frontmatter field ${k}`);
    if (wc < 200) warnings.push(`${rel}: tutorial index word count ${wc} (<200)`);
    checkReferences(file);
  } else if (isChapter) {
    for (const k of CHAPTER_REQ) if (!fm[k]) errors.push(`${rel}: missing frontmatter field ${k}`);
    if (wc < 1500) errors.push(`${rel}: chapter word count ${wc} < 1500`);
  }
}

for (const w of warnings) console.warn(`WARN ${w}`);
for (const e of errors) console.error(`ERROR ${e}`);

if (errors.length) {
  console.error(`\nlint-content: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`lint-content: OK (${files.length} files, ${warnings.length} warning(s))`);
