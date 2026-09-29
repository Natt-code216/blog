import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useApiFetch } from './useApiFetch';

describe('useApiFetch', () => {
  it('starts in loading state with empty data', () => {
    const fetchFn = () => new Promise<number[]>(() => {});
    const { result } = renderHook(() => useApiFetch(fetchFn));
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('transitions from loading to data on success', async () => {
    const payload = [1, 2, 3];
    const fetchFn = () => Promise.resolve(payload);
    const { result } = renderHook(() => useApiFetch(fetchFn));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual(payload);
    expect(result.current.error).toBeNull();
  });

  it('captures Error.message on failure', async () => {
    const fetchFn = () => Promise.reject(new Error('Boom'));
    const { result } = renderHook(() => useApiFetch(fetchFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Boom');
    expect(result.current.data).toEqual([]);
  });

  it('falls back to default error message for non-Error rejections', async () => {
    const fetchFn = () => Promise.reject('something');
    const { result } = renderHook(() => useApiFetch(fetchFn));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('请求失败');
  });

  it('ignores state updates after unmount', async () => {
    let resolve: (v: number[]) => void = () => {};
    const fetchFn = () =>
      new Promise<number[]>(r => {
        resolve = r;
      });
    const { result, unmount } = renderHook(() => useApiFetch(fetchFn));
    unmount();
    await act(async () => {
      resolve([1]);
    });
    // After unmount, no throw; data remains the initial value
    expect(result.current.data).toEqual([]);
  });
  it('retries a failed request and clears the previous error', async () => {
    const fetchFn = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([42]);
    const { result } = renderHook(() => useApiFetch<number>(fetchFn));
    await waitFor(() => expect(result.current.error).toBe('offline'));
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.data).toEqual([42]));
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('does not let an older request overwrite a newer retry result', async () => {
    let resolveOld!: (value: number[]) => void;
    const fetchFn = vi.fn()
      .mockImplementationOnce(() => new Promise<number[]>(resolve => { resolveOld = resolve; }))
      .mockResolvedValueOnce([2]);
    const { result } = renderHook(() => useApiFetch<number>(fetchFn));
    act(() => result.current.refetch());
    await waitFor(() => expect(result.current.data).toEqual([2]));
    await act(async () => resolveOld([1]));
    expect(result.current.data).toEqual([2]);
  });

});
