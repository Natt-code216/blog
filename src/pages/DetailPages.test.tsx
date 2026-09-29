import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { api } from '../services/api';
import { EssayDetail } from './EssayDetail';
import { TutorialDetail } from './TutorialDetail';
import { ChapterDetail } from './ChapterDetail';

vi.mock('../services/api', () => ({ api: { getEssayBySlug: vi.fn(), getTutorialBySlug: vi.fn(), getChaptersByTutorialSlug: vi.fn().mockResolvedValue([]), getChapter: vi.fn() } }));
vi.mock('../features/comments/Comments', () => ({ Comments: () => null }));

const cases = [
  { name: 'essay', path: '/essays/:slug', url: '/essays/test-story', Component: EssayDetail, method: 'getEssayBySlug' as const },
  { name: 'tutorial', path: '/tutorials/:slug', url: '/tutorials/test-story', Component: TutorialDetail, method: 'getTutorialBySlug' as const },
];

describe.each(cases)('$name detail requests', ({ path, url, Component, method }) => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getChaptersByTutorialSlug).mockResolvedValue([]);
  });

  function renderPage() {
    render(<HelmetProvider><MemoryRouter initialEntries={[url]}><Routes>
      <Route path={path} element={<Component />} />
    </Routes></MemoryRouter></HelmetProvider>);
  }

  it('offers retry for a connection failure and recovers to an honest not-found state', async () => {
    vi.mocked(api[method]).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(null);
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('暂时无法加载内容');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重新加载' }));
    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(api[method]).toHaveBeenCalledTimes(2);
  });

  it('renders the CMS Markdown and retains its return link', async () => {
    vi.mocked(api[method]).mockResolvedValueOnce({
      id: 1, documentId: 'test-document', slug: 'test-story', title: '一篇真实的文章',
      excerpt: '随笔简介', description: '教程简介', category: 'ESSAY', date: '2026-09-29',
      level: 'A_level', status: 'A更新中', chapters: 3, chaptersCount: 3, icon: 'code',
      published: true, createdAt: '2026-09-29', updatedAt: '2026-09-29',
      content: '## 正文标题\n\n**加粗文字**\n\n- 列表内容',
    });
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: '一篇真实的文章' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '正文标题' })).toBeInTheDocument();
    expect(screen.getByRole('listitem')).toHaveTextContent('列表内容');
    expect(screen.getByRole('link', { name: /返回.*列表/ })).toHaveAttribute('href', method === 'getEssayBySlug' ? '/#essays' : '/#tutorials');
  });
});

describe('independent chapter route', () => {
  it('shows the chapter Markdown with a return link to its tutorial', async () => {
    vi.mocked(api.getChapter).mockResolvedValueOnce({
      id: 1, documentId: 'chapter-1', slug: 'react-vite-setup-01',
      title: '起步', order: 1, content: '## 安装依赖\n\n运行命令。',
      createdAt: '', updatedAt: '',
    });
    render(<HelmetProvider><MemoryRouter initialEntries={['/tutorials/react-vite-setup/chapters/1']}><Routes>
      <Route path="/tutorials/:slug/chapters/:order" element={<ChapterDetail />} />
    </Routes></MemoryRouter></HelmetProvider>);
    expect(await screen.findByRole('heading', { level: 1, name: '起步' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '安装依赖' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /返回教程/ })).toHaveAttribute('href', '/tutorials/react-vite-setup');
  });
});
