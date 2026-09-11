/**
 * Minimal data-fetching hook. Deliberately not react-query: the customer app
 * has a handful of endpoints and every extra dependency is bundle weight on a
 * phone. What screens actually need is: fetch on focus, pull-to-refresh, and an
 * error you can retry.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> = {
  data: T | null;
  /** True only on the first load, so lists can show skeletons once. */
  loading: boolean;
  /** True while a pull-to-refresh is in flight. */
  refreshing: boolean;
  error: string | null;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  setData: (next: T) => void;
};

export function useAsync<T>(
  fetcher: () => Promise<T>,
  deps: readonly unknown[] = [],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // `fetcher` is a fresh closure on every render, so the effect keys off the
  // caller's `deps` instead — same contract as useEffect.
  const run = useRef(fetcher);
  run.current = fetcher;

  const load = useCallback(
    async (mode: 'initial' | 'refresh') => {
      if (mode === 'refresh') setRefreshing(true);
      else setLoading(true);
      try {
        const next = await run.current();
        if (!alive.current) return;
        setData(next);
        setError(null);
      } catch (err) {
        if (!alive.current) return;
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        if (alive.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void load('initial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    data,
    loading,
    refreshing,
    error,
    reload: useCallback(() => load('initial'), [load]),
    refresh: useCallback(() => load('refresh'), [load]),
    setData,
  };
}
