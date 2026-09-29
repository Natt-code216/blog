import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MarkdownContent } from './index';

afterEach(() => {
  window.history.replaceState(null, '', '/');
  vi.restoreAllMocks();
});

describe('chapter deep links', () => {
  it('locates a chapter after its asynchronous content arrives and retains the safe directory', () => {
    window.history.replaceState(null, '', '/tutorials/react-vite-setup#chapter-3');
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll });
    const { rerender } = render(<MarkdownContent />);
    expect(scroll).not.toHaveBeenCalled();
    rerender(<MarkdownContent content={'<nav aria-label="章节目录"><a href="#chapter-3">第三章</a></nav>\n\n<h2 id="chapter-3">第三章 · 状态</h2>\n\n<script>alert(1)</script>正文'} />);
    expect(screen.getByRole('navigation', { name: '章节目录' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '第三章' })).toHaveAttribute('href', '#chapter-3');
    expect(scroll).toHaveBeenCalledOnce();
    expect(scroll.mock.instances[0]).toBe(screen.getByRole('heading', { name: '第三章 · 状态' }));
    expect(document.querySelector('script')).toBeNull();
  });

  it('does not scroll to an anchor outside the article or throw on malformed hashes', () => {
    window.history.replaceState(null, '', '/#outside');
    const scroll = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scroll });
    const { rerender } = render(<><h2 id="outside">页面外壳</h2><MarkdownContent content="正文" /></>);
    expect(scroll).not.toHaveBeenCalled();
    window.history.replaceState(null, '', '/#%E0%A4%A');
    expect(() => rerender(<MarkdownContent content="更新的正文" />)).not.toThrow();
    expect(scroll).not.toHaveBeenCalled();
  });
});
