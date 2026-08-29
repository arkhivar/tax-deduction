import { useRef, useCallback } from 'react';
import { api } from '../lib/api';

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
      const { data } = await api.innLookup(inn);
      if (!controller.signal.aborted && data) {
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
