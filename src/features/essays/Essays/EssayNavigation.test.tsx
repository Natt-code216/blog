import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import type { ApiEssay } from '../../../services/api';
import { EssayDetail } from '../../../pages/EssayDetail';
import { Essays } from './index';

vi.mock('axios');
vi.mock('../../../components/ui/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../../comments/Comments', () => ({ Comments: () => null }));

const articles: ApiEssay[] = [
  { slug: 'on-minimalism', title: '给生活留一点空处', content: '抽屉里那条多余的充电线。' },
  { slug: 'tools-and-mind', title: '一件顺手的工具', content: '打开空白文档，先写下今天的第一句。' },
  { slug: 'writing-as-thinking', title: '写到纸上才算想过', content: '被删掉的那一段，留下了一个更准确的问题。' },
].map((article, index) => ({
  ...article,
  id: index + 1,
  documentId: `document-${index + 1}`,
  category: 'ESSAY',
  excerpt: `第 ${index + 1} 篇文章的简介`,
  date: '2026-09-30',
  published: true,
  createdAt: '2026-09-30',
  updatedAt: '2026-09-30',
}));

function renderPages(initialEntry = '/') {
  render(<HelmetProvider><MemoryRouter initialEntries={[initialEntry]}>
    <nav aria-label="测试路由切换">
      <Link to="/essays/tools-and-mind">下一篇随笔</Link>
      <Link to="/essays/does-not-exist">不存在的随笔</Link>
    </nav>
    <Routes>
      <Route path="/" element={<Essays />} />
      <Route path="/essays/:slug" element={<EssayDetail />} />
    </Routes>
  </MemoryRouter></HelmetProvider>);
}

beforeEach(() => {
  vi.mocked(axios.get).mockReset();
  // Reproduce Strapi's observed behavior: only "$eq" filters match a field.
  // A bare "eq" is ignored and a detail limit then returns the first article.
  vi.mocked(axios.get).mockImplementation(async (_url, config) => {
    const params = config?.params ?? {};
    let data = articles.filter(article =>
      (!params['filters[slug][$eq]'] || article.slug === params['filters[slug][$eq]']) &&
      (params['filters[published][$eq]'] === undefined || article.published === params['filters[published][$eq]'])
    );
    if (params['pagination[limit]']) data = data.slice(0, params['pagination[limit]']);
    return { data: { data } };
  });
});

describe('essay cards and detail navigation', () => {
  it('opens each card at its own slug with its own title and body', async () => {
    renderPages();

    for (const article of articles) {
      const card = await screen.findByRole('link', { name: `阅读全文：${article.title}` });
      expect(card).toHaveAttribute('href', `/essays/${article.slug}`);
      fireEvent.click(card);
      expect(await screen.findByRole('heading', { level: 1, name: article.title })).toBeInTheDocument();
      expect(screen.getByText(article.content!)).toBeInTheDocument();
      for (const other of articles.filter(other => other.slug !== article.slug)) {
        expect(screen.queryByText(other.content!)).not.toBeInTheDocument();
      }
      fireEvent.click(screen.getByRole('link', { name: /返回随笔列表/ }));
    }
    expect(await screen.findByRole('heading', { name: '思考与感悟' })).toBeInTheDocument();
  });

  it('replaces the body on a route change and shows 404 for an unknown slug', async () => {
    renderPages('/essays/on-minimalism');
    expect(await screen.findByText(articles[0].content!)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: '下一篇随笔' }));
    expect(screen.queryByText(articles[0].content!)).not.toBeInTheDocument();
    expect(await screen.findByText(articles[1].content!)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: '不存在的随笔' }));
    expect(screen.queryByText(articles[1].content!)).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });
});
