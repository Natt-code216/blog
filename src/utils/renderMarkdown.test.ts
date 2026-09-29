import { describe, expect, it } from 'vitest';
import { renderMarkdown } from './renderMarkdown';

function parse(content: string) {
  const root = document.createElement('div');
  root.innerHTML = renderMarkdown(content);
  return root;
}

describe('renderMarkdown', () => {
  it('renders headings, links, tables, lists and code while preserving code as text', () => {
    const root = parse('## 标题\n\n- 第一项\n- 第二项\n\n[文章](https://example.com/article)\n\n| 项目 | 内容 |\n| --- | --- |\n| 名称 | 测试 |\n\n```html\n<script>example()</script>\n```');
    expect(root.querySelector('h2')?.textContent).toBe('标题');
    expect(root.querySelectorAll('li')).toHaveLength(2);
    expect(root.querySelector('a')?.getAttribute('href')).toBe('https://example.com/article');
    expect(root.querySelectorAll('table tbody td')).toHaveLength(2);
    expect(root.querySelector('pre code')?.textContent).toContain('<script>example()</script>');
    expect(root.querySelector('script')).toBeNull();
  });

  it('removes scripts, event handlers, unsafe links, forms and theme-breaking inline styles', () => {
    const root = parse('<script>alert(1)</script>\n\n<img src="broken" onerror="alert(1)"><a href="javascript:alert(1)">危险链接</a><p style="position:fixed;inset:0" onclick="alert(1)">正文</p><iframe src="https://example.com"></iframe><form><input autofocus><button>提交</button></form>');
    expect(root.querySelector('script, iframe, input, button, form')).toBeNull();
    expect(root.querySelector('[onerror], [onclick], [style], [autofocus]')).toBeNull();
    expect(root.querySelector('a')?.hasAttribute('href')).toBe(false);
    expect(root.textContent).toContain('正文');
  });

  it('returns an empty string for blank content', () => {
    expect(renderMarkdown(' \n\t')).toBe('');
  });
});
