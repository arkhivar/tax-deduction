import { useRef, useCallback } from 'react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface InnLookupResult {
  found: boolean;
  name?: string;
  full_name?: string;
  kpp?: string;
  inn?: string;
}

export function useInnLookup(
  onResult: (result: InnLookupResult) => void,
  onLoading: (loading: boolean) => void
) {
  const abortRef = useRef<AbortController | null>(null);
  const onResultRef = useRef(onResult);
  const onLoadingRef = useRef(onLoading);
  onResultRef.current = onResult;
  onLoadingRef.current = onLoading;

  const lookup = useCallback(async (inn: string) => {
    abortRef.current?.abort();

    if (inn.length !== 10) return;

    const controller = new AbortController();
    abortRef.current = controller;
    onLoadingRef.current(true);

    try {
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/inn-lookup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ inn }),
          signal: controller.signal,
        }
      );

      if (!res.ok) throw new Error('Lookup failed');

      const data: InnLookupResult = await res.json();
      if (!controller.signal.aborted) {
        onResultRef.current(data);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
    } finally {
      if (!controller.signal.aborted) {
        onLoadingRef.current(false);
      }
    }
  }, []);

  return lookup;
}
