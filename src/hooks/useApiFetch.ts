import { useState, useEffect, useRef, useCallback } from 'react';

interface FetchState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApiFetch<T>(fetchFn: () => Promise<T[]>): FetchState<T> {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);
  const refetch = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchRef.current();
        if (!cancelled) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '请求失败');
          setLoading(false);
        }
      }
    };

    doFetch();
    return () => { cancelled = true; };
  }, [attempt]);

  return { data, loading, error, refetch };
}
