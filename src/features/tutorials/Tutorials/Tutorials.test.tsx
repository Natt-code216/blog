import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { api, type ApiTutorial } from '../../../services/api';
import { Tutorials } from './index';

vi.mock('../../../components/ui/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Tutorials homepage section', () => {
  it('renders the CMS tutorial with its detail route and readable learning labels', async () => {
    const tutorial: ApiTutorial = {
      id: 84,
      documentId: 'offline-reading-course',
      title: '构建离线阅读体验',
      description: '练习缓存失效与页面恢复。',
      level: 'B_level',
      status: 'A更新中',
      chapters: 6,
      icon: 'layers',
      slug: 'offline-reading-lab',
      published: true,
      createdAt: '2026-08-09T08:00:00.000Z',
      updatedAt: '2026-08-09T08:00:00.000Z',
    };
    vi.spyOn(api, 'getTutorials').mockResolvedValue([tutorial]);
    render(<MemoryRouter><Tutorials /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: tutorial.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /构建离线阅读体验/ }))
      .toHaveAttribute('href', '/tutorials/offline-reading-lab');
    expect(screen.getByText('进阶', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('更新中 (6 章)', { exact: true })).toBeInTheDocument();
    expect(screen.queryByText(/B_level|A更新中/)).not.toBeInTheDocument();
  });
});
