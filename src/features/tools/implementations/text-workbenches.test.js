import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../workbench/init', () => ({}));

function loadPage(name) {
  const html = readFileSync(`${process.cwd()}/mini-tools/${name}.html`, 'utf8');
  document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)[1];
}
function setInput(id, value) {
  const input = document.getElementById(id);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
beforeEach(() => { vi.resetModules(); });
afterEach(() => { window.dispatchEvent(new Event('pagehide')); vi.useRealTimers(); document.body.innerHTML = ''; });

describe('tool page interactions', () => {
  it('formats JSON and clears obsolete output when edited or invalid', async () => {
    loadPage('json-formatter');
    await import('./json-formatter');
    setInput('input', '{"name":"测试"}');
    document.getElementById('format').click();
    expect(document.getElementById('output').value).toBe('{\n  "name": "测试"\n}');
    setInput('input', 'bad');
    expect(document.getElementById('output').value).toBe('');
    document.getElementById('validate').click();
    expect(document.getElementById('status').classList.contains('error')).toBe(true);
  });
  it('converts CSV in both directions and displays malformed CSV errors', async () => {
    loadPage('csv-json');
    await import('./csv-json');
    setInput('input', 'name,age\n张三,30');
    document.getElementById('csv-to-json').click();
    expect(JSON.parse(document.getElementById('output').value)).toEqual([{ name: '张三', age: '30' }]);
    setInput('input', '[{"name":"李四","age":25}]');
    document.getElementById('json-to-csv').click();
    expect(document.getElementById('output').value).toBe('name,age\n李四,25');
    setInput('input', 'a,b\n1,2,3');
    document.getElementById('csv-to-json').click();
    expect(document.getElementById('status').textContent).toContain('列数');
    expect(document.getElementById('output').value).toBe('');
  });
  it('switches Base64 tabs with the keyboard and encodes Chinese text', async () => {
    loadPage('base64');
    await import('./base64');
    setInput('text-input', '你好');
    document.getElementById('encode').click();
    expect(document.getElementById('text-output').value).toBe('5L2g5aW9');
    document.getElementById('text-tab').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(document.getElementById('tab-file').hidden).toBe(false);
    expect(document.getElementById('tab-text').hidden).toBe(true);
    expect(document.activeElement.id).toBe('file-tab');
  });
  it('reports invalid timestamps without throwing and renders Unix zero', async () => {
    vi.useFakeTimers();
    loadPage('timestamp');
    await import('./timestamp');
    setInput('ts', '999999999999999999');
    document.getElementById('ts2d').click();
    expect(document.getElementById('ts2dR').textContent).toContain('超出可转换范围');
    setInput('ts', '0');
    document.getElementById('ts2d').click();
    expect(document.getElementById('ts2dR').textContent).toContain('1970-01-01T00:00:00.000Z');
    const before = document.getElementById('now').textContent;
    window.dispatchEvent(new Event('pagehide'));
    vi.advanceTimersByTime(2000);
    expect(document.getElementById('now').textContent).toBe(before);
    window.dispatchEvent(new Event('pageshow'));
    expect(Number(document.getElementById('now').textContent)).toBe(Number(before) + 2);
    vi.advanceTimersByTime(1000);
    expect(Number(document.getElementById('now').textContent)).toBe(Number(before) + 3);
  });
});
