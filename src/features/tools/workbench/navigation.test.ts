import directoryHtml from '../../../../mini-tools/index.html?raw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getToolboxReturnHref } from './navigation';

vi.mock('./init', () => ({}));

async function loadDirectory(url: string) {
  history.replaceState(null, '', url);
  document.body.innerHTML = directoryHtml.match(/<body>([\s\S]*)<\/body>/)![1];
  await import('./directory');
  return document.querySelector<HTMLInputElement>('#tool-search')!;
}

beforeEach(() => { vi.resetModules(); });
afterEach(() => { document.body.innerHTML = ''; history.replaceState(null, '', '/'); });

describe('tool directory round trips', () => {
  it('restores a shared search, carries it into tools and returns to the same results', async () => {
    const input = await loadDirectory('/mini-tools/index.html?q=PDF');
    expect(input.value).toBe('PDF');
    const links = [...document.querySelectorAll<HTMLAnchorElement>('.directory-tool')];
    expect(links).toHaveLength(3);
    for (const link of links) {
      const url = new URL(link.href);
      expect(url.pathname).toMatch(/^\/mini-tools\/(pdf-merger|pdf-splitter|image-to-pdf)\.html$/);
      expect(getToolboxReturnHref(url.search)).toBe('/mini-tools/index.html?q=PDF');
    }
    expect(document.getElementById('result-count')).toHaveTextContent('找到 3 个工具');
  });

  it('updates the current history entry and removes stale filtering when cleared', async () => {
    const input = await loadDirectory('/mini-tools/index.html');
    const historyLength = history.length;
    input.value = '图片';
    input.dispatchEvent(new Event('input'));
    expect(new URLSearchParams(location.search).get('q')).toBe('图片');
    expect(document.querySelectorAll('.directory-tool')).toHaveLength(2);
    expect(history.length).toBe(historyLength);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    expect(location.search).toBe('');
    expect(document.querySelectorAll('.directory-tool')).toHaveLength(11);
    expect(document.getElementById('empty')).not.toBeVisible();
  });

  it('keeps an unmatched query visible instead of silently showing every tool', async () => {
    const input = await loadDirectory('/mini-tools/index.html?q=unknown-tool');
    expect(input.value).toBe('unknown-tool');
    expect(document.querySelectorAll('.directory-tool')).toHaveLength(0);
    expect(document.getElementById('empty')).toBeVisible();
  });

  it('uses the directory for direct visits and encodes filter text without accepting redirects', () => {
    expect(getToolboxReturnHref('')).toBe('/mini-tools/index.html');
    expect(getToolboxReturnHref('?returnTo=https://example.com')).toBe('/mini-tools/index.html');
    const query = '图片 & PDF/#';
    const href = getToolboxReturnHref(`?${new URLSearchParams({ q: query })}`);
    const url = new URL(href, 'https://blog.example');
    expect(url.pathname).toBe('/mini-tools/index.html');
    expect(url.searchParams.get('q')).toBe(query);
    expect(url.hash).toBe('');
  });
});
