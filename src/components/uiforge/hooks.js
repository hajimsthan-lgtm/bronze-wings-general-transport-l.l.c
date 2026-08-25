import { useState, useEffect, useCallback, useRef } from 'react';

export function useUFTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('uiforge-theme') || 'dark');
  useEffect(() => { localStorage.setItem('uiforge-theme', theme); }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return { theme, setTheme, toggle };
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('uiforge-bookmarks') || '{}'); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem('uiforge-bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);
  const toggle = useCallback((id, meta) => {
    setBookmarks((b) => {
      const n = { ...b };
      if (n[id]) delete n[id]; else n[id] = meta || { id };
      return n;
    });
  }, []);
  const has = useCallback((id) => !!bookmarks[id], [bookmarks]);
  return { bookmarks, toggle, has };
}

export function useSearchHistory() {
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('uiforge-search-history') || '[]'); } catch { return []; }
  });
  useEffect(() => { localStorage.setItem('uiforge-search-history', JSON.stringify(history)); }, [history]);
  const add = useCallback((q) => {
    const term = q.trim();
    if (!term) return;
    setHistory((h) => [term, ...h.filter((x) => x.toLowerCase() !== term.toLowerCase())].slice(0, 8));
  }, []);
  const remove = useCallback((term) => setHistory((h) => h.filter((x) => x !== term)), []);
  const clear = useCallback(() => setHistory([]), []);
  return { history, add, remove, clear };
}

export function useFakeLoading(ms = 900) {
  const [loading, setLoading] = useState(true);
  const ref = useRef();
  const trigger = useCallback(() => {
    setLoading(true);
    clearTimeout(ref.current);
    ref.current = setTimeout(() => setLoading(false), ms);
  }, [ms]);
  useEffect(() => { trigger(); return () => clearTimeout(ref.current); }, [trigger]);
  return { loading, trigger };
}