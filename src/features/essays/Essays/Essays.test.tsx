import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { api, type ApiEssay } from '../../../services/api';
import { Essays } from './index';

vi.mock('../../../components/ui/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const essay: ApiEssay = {
  id: 73,
  documentId: 'journal-field-observation',
  category: 'THOUGHTS',
  title: '在河边观察一段代码的节奏',
  excerpt: '一篇由内容后台发布的现场观察。',
  date: '2026-07-12T08:00:00.000Z',
  slug: 'riverside-code-notes',
  published: true,
  createdAt: '2026-07-12T08:00:00.000Z',
  updatedAt: '2026-07-12T08:00:00.000Z',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Essays homepage section', () => {
  it('renders the CMS essay and its actual detail route', async () => {
    vi.spyOn(api, 'getEssays').mockResolvedValue([essay]);
    render(<MemoryRouter><Essays /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: essay.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `阅读全文：${essay.title}` }))
      .toHaveAttribute('href', '/essays/riverside-code-notes');
    expect(screen.getByText(essay.excerpt)).toBeInTheDocument();
  });

  it('recovers from a failed request through the retry button', async () => {
    const request = vi.spyOn(api, 'getEssays')
      .mockRejectedValueOnce(new Error('temporary network failure'))
      .mockResolvedValueOnce([essay]);
    render(<MemoryRouter><Essays /></MemoryRouter>);

    expect(await screen.findByText('随笔暂时没有加载成功。')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '思考与感悟' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '重新加载' }));

    expect(await screen.findByRole('link', { name: `阅读全文：${essay.title}` }))
      .toHaveAttribute('href', '/essays/riverside-code-notes');
    expect(screen.queryByText('随笔暂时没有加载成功。')).not.toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(2);
  });
});
