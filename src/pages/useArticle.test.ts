import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useArticle } from './useArticle';

describe('useArticle', () => {
  it('ignores a late result from a previous article after the route changes', async () => {
    let resolveOld!: (value: { title: string }) => void;
    const fetchArticle = vi.fn()
      .mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }))
      .mockResolvedValueOnce({ title: '新文章' });
    const { result, rerender } = renderHook(({ slug }) => useArticle(slug, fetchArticle), { initialProps: { slug: 'old' } });
    expect(result.current.loading).toBe(true);
    rerender({ slug: 'new' });
    await waitFor(() => expect(result.current.data).toEqual({ title: '新文章' }));
    await act(async () => { resolveOld({ title: '旧文章' }); });
    expect(result.current.data).toEqual({ title: '新文章' });
  });
});
