import { useState, useEffect, useRef } from 'react';

interface FetchState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

export function useApiFetch<T>(fetchFn: () => Promise<T[]>): FetchState<T> {
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const doFetch = async () => {
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
  }, []);

  return { data, loading, error };
}
