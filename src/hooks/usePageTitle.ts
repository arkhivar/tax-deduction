import { useEffect } from 'react';

export function usePageTitle(title: string | (() => string | null), suffix = 'КНД 1151158') {
  useEffect(() => {
    const resolved = typeof title === 'function' ? title() : title;
    if (!resolved) return;

    const previous = document.title;
    document.title = `${resolved} · ${suffix}`;

    return () => {
      document.title = previous;
    };
  }, [title, suffix]);
}
