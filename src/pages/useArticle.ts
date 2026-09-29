import { useCallback, useEffect, useState } from 'react';

type ArticleState<T> = { slug: string | undefined; data: T | null; loading: boolean; error: boolean };

/** Detail pages share request state; a late response must never replace a newer route. */
export function useArticle<T>(slug: string | undefined, fetchArticle: (slug: string) => Promise<T | null>) {
  const [state, setState] = useState<ArticleState<T>>({ slug, data: null, loading: true, error: false });
  const [attempt, setAttempt] = useState(0);
  const refetch = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    setState({ slug, data: null, loading: Boolean(slug), error: false });
    if (!slug) return;

    fetchArticle(slug).then(data => {
      if (!cancelled) setState({ slug, data, loading: false, error: false });
    }).catch(() => {
      if (!cancelled) setState({ slug, data: null, loading: false, error: true });
    });
    return () => { cancelled = true; };
  }, [slug, attempt, fetchArticle]);

  // The URL changes before its effect runs; do not flash the previous article.
  return { ...(state.slug === slug ? state : { data: null, loading: true, error: false }), refetch };
}
