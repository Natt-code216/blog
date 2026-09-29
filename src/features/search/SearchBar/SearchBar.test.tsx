import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../services/api';
import { SearchBar } from './index';

vi.mock('../../../services/api', () => ({
  api: { getEssays: vi.fn(), getTutorials: vi.fn(), getTools: vi.fn() },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(api.getEssays).mockResolvedValue([]);
  vi.mocked(api.getTutorials).mockResolvedValue([]);
  vi.mocked(api.getTools).mockResolvedValue([]);
});
afterEach(cleanup);

function renderSearch() {
  return render(<MemoryRouter><SearchBar /></MemoryRouter>);
}

describe('SearchBar', () => {
  it('keeps all local tools searchable when every CMS request fails', async () => {
    vi.mocked(api.getEssays).mockRejectedValue(new Error('Offline'));
    vi.mocked(api.getTutorials).mockRejectedValue(new Error('Offline'));
    vi.mocked(api.getTools).mockRejectedValue(new Error('Offline'));
    const user = userEvent.setup();
    const { container } = renderSearch();
    await user.click(screen.getByRole('button', { name: '打开搜索 (Ctrl K)' }));
    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByText('部分文章内容暂时无法加载，工具与收藏仍可搜索。')).toBeInTheDocument();
    expect(within(dialog).getAllByText('工具', { exact: true })).toHaveLength(11);
    await user.type(screen.getByRole('searchbox'), 'JSON');
    expect(screen.getByRole('link', { name: /JSON 格式化/ })).toHaveAttribute('href', '/mini-tools/json-formatter.html');
    expect(screen.getByRole('link', { name: /CSV ↔ JSON/ })).toHaveAttribute('href', '/mini-tools/csv-json.html');
    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), '时间戳');
    const toolLink = screen.getByRole('link', { name: /时间戳转换/ });
    expect(toolLink).toHaveAttribute('href', '/mini-tools/timestamp.html');
    let navigationIntercepted: boolean | undefined;
    container.addEventListener('click', (event) => {
      navigationIntercepted = event.defaultPrevented;
      event.preventDefault(); // Avoid actual document navigation in JSDOM.
    }, { once: true });
    await user.click(toolLink);
    expect(navigationIntercepted).toBe(false);
  });

  it('preserves successful article results when another content source fails', async () => {
    vi.mocked(api.getEssays).mockResolvedValue([{
      id: 1, documentId: 'essay-1', category: 'ESSAY', title: '真实文章', excerpt: '来自内容后台',
      date: '2026-01-01', slug: 'real-essay', published: true, createdAt: '', updatedAt: '',
    }]);
    vi.mocked(api.getTutorials).mockRejectedValue(new Error('Offline'));
    const user = userEvent.setup();
    renderSearch();
    await user.click(screen.getByRole('button', { name: '打开搜索 (Ctrl K)' }));
    expect(await screen.findByRole('link', { name: /真实文章/ })).toHaveAttribute('href', '/essays/real-essay');
    expect(screen.getByRole('status')).toHaveTextContent('部分文章内容暂时无法加载');
    expect(screen.getByRole('link', { name: /Markdown → HTML/ })).toHaveAttribute('href', '/mini-tools/markdown-html.html');
  });

  it('traps keyboard focus and restores it after closing with Escape', async () => {
    const user = userEvent.setup();
    renderSearch();
    const trigger = screen.getByRole('button', { name: '打开搜索 (Ctrl K)' });
    trigger.focus();
    await user.keyboard('{Control>}k{/Control}');
    const input = screen.getByRole('searchbox');
    expect(input).toHaveFocus();
    await user.tab({ shift: true });
    const links = screen.getAllByRole('link');
    expect(links[links.length - 1]).toHaveFocus();
    await user.tab();
    expect(input).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('searches collected articles by author, English title, topic and websites by domain when the CMS is offline', async () => {
    vi.mocked(api.getEssays).mockRejectedValue(new Error('Offline'));
    vi.mocked(api.getTutorials).mockRejectedValue(new Error('Offline'));
    vi.mocked(api.getTools).mockRejectedValue(new Error('Offline'));
    const user = userEvent.setup();
    renderSearch();
    await user.click(screen.getByRole('button', { name: '打开搜索 (Ctrl K)' }));
    const search = screen.getByRole('searchbox');
    await user.type(search, 'Paul Graham');
    expect(screen.getAllByRole('link')).toHaveLength(3);
    await user.clear(search);
    await user.type(search, 'Learn In Public');
    const article = screen.getByRole('link', { name: /公开学习/ });
    expect(article).toHaveAttribute('href', 'https://swyx.io/learn-in-public');
    expect(article).toHaveAttribute('target', '_blank');
    await user.clear(search);
    await user.type(search, '时间、人生与关系');
    expect(screen.getAllByRole('link')).toHaveLength(2);
    await user.clear(search);
    await user.type(search, '9eip.com');
    expect(screen.getByRole('link', { name: /完美小站/ })).toHaveAttribute('href', 'https://www.9eip.com/#term-80223');
  });
});
