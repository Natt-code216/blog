import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const tools = readdirSync(resolve(root, 'mini-tools')).filter(name => name.endsWith('.html'));
const catalog = readFileSync(resolve(root, 'src/services/toolCatalog.ts'), 'utf8');
const links = [...catalog.matchAll(/href: '(\/mini-tools\/[^']+)'/g)].map(match => match[1]);
assert.equal(new Set(links).size, links.length, 'Tool catalog contains duplicate URLs');
for (const link of links) assert.ok(existsSync(resolve(dist, `.${link}`)), `Missing tool: ${link}`);
assert.equal(tools.length, links.length + 1, 'Tool entry pages and catalog must stay in sync');

for (const page of ['index.html', ...tools.map(file => `mini-tools/${file}`)]) {
  const path = resolve(dist, page);
  assert.ok(existsSync(path), `Missing build entry: ${page}`);
  const html = readFileSync(path, 'utf8');
  assert.ok(html.includes('/theme.js'), `Missing early theme setup: ${page}`);
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/g)) {
    const url = match[1];
    assert.ok(!/^https?:/.test(url), `Unexpected runtime CDN dependency in ${page}: ${url}`);
    const asset = url.split(/[?#]/)[0];
    assert.ok(existsSync(asset.startsWith('/') ? resolve(dist, `.${asset}`) : resolve(dirname(path), asset)), `Missing asset in ${page}: ${asset}`);
  }
}
console.log(`Verified ${tools.length + 1} page entries, ${links.length} tool links and their bundled assets.`);
