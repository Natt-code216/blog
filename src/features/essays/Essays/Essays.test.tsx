import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { api, type ApiEssay } from '../../../services/api';
import { Essays } from './index';

vi.mock('../../../components/ui/ScrollReveal', () => ({
  ScrollReveal: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('../../../components/ui/LivingArtwork', () => ({ LivingArtwork: () => null }));
const motion = vi.hoisted(() => ({ motionEnabled: true }));
vi.mock('../../../app/providers/MotionContext', () => ({ useMotion: () => motion }));

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

const collection = [essay, {
  ...essay, id: 74, documentId: 'journal-morning', title: '清晨的第一束光', slug: 'first-light', excerpt: '把一个小小的想法，放进清晨。',
}, {
  ...essay, id: 75, documentId: 'journal-water', title: '让思绪慢慢沉淀', slug: 'quiet-water', excerpt: '留一点时间，等水面恢复平静。',
}];

beforeEach(() => {
  motion.motionEnabled = true;
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
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

  it('keeps every real article directly reachable while pointer and focus update the preview', async () => {
    vi.spyOn(api, 'getEssays').mockResolvedValue(collection);
    render(<MemoryRouter><Essays /></MemoryRouter>);
    expect(await screen.findByRole('heading', { name: essay.title })).toBeInTheDocument();

    for (const article of collection) {
      expect(screen.getByRole('link', { name: `阅读全文：${article.title}` })).toHaveAttribute('href', `/essays/${article.slug}`);
    }
    fireEvent.pointerEnter(screen.getByRole('link', { name: `阅读全文：${collection[1].title}` }));
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();
    fireEvent.focus(screen.getByRole('link', { name: `阅读全文：${collection[2].title}` }));
    expect(screen.getByRole('heading', { name: collection[2].title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: `阅读当前随笔：${collection[2].title}` })).toHaveAttribute('href', '/essays/quiet-water');
  });

  it('supports keyboard and arrow controls without changing the current page', async () => {
    vi.spyOn(api, 'getEssays').mockResolvedValue(collection);
    render(<MemoryRouter><Essays /></MemoryRouter>);
    const gallery = await screen.findByRole('region', { name: '随笔星际画廊' });
    fireEvent.keyDown(gallery, { key: 'ArrowRight' });
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();
    fireEvent.keyDown(gallery, { key: 'End' });
    expect(screen.getByRole('heading', { name: collection[2].title })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '下一篇随笔' }));
    expect(screen.getByRole('heading', { name: collection[0].title })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '上一篇随笔' }));
    expect(screen.getByRole('heading', { name: collection[2].title })).toBeInTheDocument();
  });

  it('requires user-started autoplay and suspends it for hover, focus, visibility and global pause', async () => {
    let observeVisibility: ((entries: Array<{ isIntersecting: boolean }>) => void) | undefined;
    const disconnect = vi.fn();
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: typeof observeVisibility) { observeVisibility = callback; }
      observe() {}
      disconnect = disconnect;
    });
    vi.spyOn(api, 'getEssays').mockResolvedValue(collection);
    const { rerender, unmount } = render(<MemoryRouter><Essays /></MemoryRouter>);
    const gallery = await screen.findByRole('region', { name: '随笔星际画廊' });
    vi.useFakeTimers();

    act(() => vi.advanceTimersByTime(16000));
    expect(screen.getByRole('heading', { name: collection[0].title })).toBeInTheDocument();
    const playButton = screen.getByRole('button', { name: '播放画廊' });
    fireEvent.pointerEnter(gallery);
    act(() => playButton.focus());
    expect(playButton).toHaveFocus();
    fireEvent.click(playButton);
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();

    fireEvent.pointerLeave(gallery);
    fireEvent.pointerEnter(gallery);
    act(() => vi.advanceTimersByTime(16000));
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();
    fireEvent.pointerLeave(gallery);
    fireEvent.focus(gallery);
    act(() => vi.advanceTimersByTime(16000));
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();
    fireEvent.blur(gallery, { relatedTarget: document.body });

    act(() => observeVisibility?.([{ isIntersecting: false }]));
    act(() => vi.advanceTimersByTime(16000));
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();
    act(() => observeVisibility?.([{ isIntersecting: true }]));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    fireEvent(document, new Event('visibilitychange'));
    act(() => vi.advanceTimersByTime(16000));
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    fireEvent(document, new Event('visibilitychange'));

    motion.motionEnabled = false;
    rerender(<MemoryRouter><Essays /></MemoryRouter>);
    act(() => vi.advanceTimersByTime(16000));
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();
    motion.motionEnabled = true;
    rerender(<MemoryRouter><Essays /></MemoryRouter>);
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByRole('heading', { name: collection[2].title })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '停止画廊轮播' }));
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: '播放画廊' }));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it('keeps manual browsing available when reduced motion or a global pause disables autoplay', async () => {
    motion.motionEnabled = false;
    vi.spyOn(api, 'getEssays').mockResolvedValue(collection);
    render(<MemoryRouter><Essays /></MemoryRouter>);
    expect(await screen.findByRole('button', { name: '动态效果已暂停，画廊可手动浏览' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '下一篇随笔' }));
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();
  });

  it('gives manual preview priority when the pointer moves to the index without leaving the gallery', async () => {
    vi.spyOn(api, 'getEssays').mockResolvedValue(collection);
    render(<MemoryRouter><Essays /></MemoryRouter>);
    const gallery = await screen.findByRole('region', { name: '随笔星际画廊' });
    vi.useFakeTimers();
    fireEvent.pointerEnter(gallery);
    const playButton = screen.getByRole('button', { name: '播放画廊' });
    act(() => playButton.focus());
    fireEvent.click(playButton);
    act(() => vi.advanceTimersByTime(8000));
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();

    // The pointer is still within the gallery: no outer pointerenter occurs.
    fireEvent.pointerEnter(screen.getByRole('link', { name: `阅读全文：${collection[2].title}` }));
    expect(screen.getByRole('heading', { name: collection[2].title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '播放画廊' })).toHaveAttribute('aria-pressed', 'false');
    act(() => vi.advanceTimersByTime(16000));
    expect(screen.getByRole('heading', { name: collection[2].title })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '播放画廊' }));
    fireEvent.click(screen.getByRole('button', { name: '上一篇随笔' }));
    act(() => vi.advanceTimersByTime(16000));
    expect(screen.getByRole('heading', { name: collection[1].title })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '播放画廊' })).toHaveAttribute('aria-pressed', 'false');
  });
});
