import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../services/api';
import { TutorialDetail } from '../../../pages/TutorialDetail';
import { getChapterLinks } from './index';

vi.mock('../../../services/api', () => ({ api: { getTutorialBySlug: vi.fn() } }));

const content = `## 学习说明

<nav aria-label="章节目录"><ol>
<li><a href="#chapter-1">第一章</a></li>
<li><a href="#chapter-2">第二章</a></li>
</ol></nav>

<h2 id="chapter-1">第一章 · 开始动手</h2>

第一章正文。

<h2 id="chapter-2">第二章 · 完成项目</h2>

第二章正文。`;

beforeEach(() => { vi.resetAllMocks(); });
afterEach(cleanup);

describe('tutorial chapter quick navigation', () => {
  it('uses the chapter anchors in the sanitized article', () => {
    expect(getChapterLinks(content)).toEqual([
      { id: 'chapter-1', title: '第一章 · 开始动手' },
      { id: 'chapter-2', title: '第二章 · 完成项目' },
    ]);
    expect(getChapterLinks('<nav aria-label="章节目录"><a href="#missing">无效章节</a></nav>')).toEqual([]);
  });

  it('renders matching jump links and follows the chapter in view', async () => {
    vi.mocked(api.getTutorialBySlug).mockResolvedValue({
      id: 1, documentId: 'tutorial-1', slug: 'sample', title: '两章教程', description: '练习',
      level: 'A_level', status: 'A更新中', chapters: 2, icon: 'code', content,
      published: true, createdAt: '2026-09-30', updatedAt: '2026-09-30',
    });
    render(<HelmetProvider><MemoryRouter initialEntries={['/tutorials/sample']}><Routes>
      <Route path="/tutorials/:slug" element={<TutorialDetail />} />
    </Routes></MemoryRouter></HelmetProvider>);

    const nav = (await screen.findByText('快速跳转')).closest('nav')!;
    expect(nav).toHaveAttribute('aria-label', '本页章节快速跳转');
    const links = Array.from(nav.querySelectorAll<HTMLAnchorElement>('ol a'));
    expect(links.map(link => link.getAttribute('href'))).toEqual(['#chapter-1', '#chapter-2']);
    expect(document.getElementById('chapter-1')).toHaveTextContent('第一章 · 开始动手');
    expect(document.getElementById('chapter-2')).toHaveTextContent('第二章 · 完成项目');

    const first = document.getElementById('chapter-1')!;
    const second = document.getElementById('chapter-2')!;
    first.getBoundingClientRect = vi.fn(() => ({ top: 100 } as DOMRect));
    second.getBoundingClientRect = vi.fn(() => ({ top: 300 } as DOMRect));
    act(() => { fireEvent.scroll(window); });
    expect(links[0]).toHaveAttribute('aria-current', 'location');
    expect(links[1]).not.toHaveAttribute('aria-current');

    // In the browser an anchor lands below both scroll-padding and scroll-margin.
    second.getBoundingClientRect = vi.fn(() => ({ top: 214 } as DOMRect));
    act(() => { fireEvent.scroll(window); });
    expect(links[1]).toHaveAttribute('aria-current', 'location');
    expect(links[0]).not.toHaveAttribute('aria-current');
    expect(nav.querySelector('a[href="#article-title"]')).toHaveTextContent('返回标题');
  });
});
