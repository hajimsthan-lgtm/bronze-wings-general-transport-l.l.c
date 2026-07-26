import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'navy';
    return localStorage.getItem('bw-theme-v6') || 'navy';
  });
  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'navy') root.classList.add('theme-navy');
    else root.classList.remove('theme-navy');
    localStorage.setItem('bw-theme-v6', theme);
  }, [theme]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleTheme = () => setThemeState((p) => (p === 'crimson' ? 'navy' : 'crimson'));
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, toggleTheme, isFullscreen, toggleFullscreen }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'navy', setTheme: () => {}, toggleTheme: () => {}, isFullscreen: false, toggleFullscreen: () => {} };
  return ctx;
}