import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const THEME_CLASSES = {
  navy: 'theme-navy',
  emerald: 'theme-emerald',
  // crimson is the :root default — no class needed
};
const CYCLE = ['crimson', 'navy', 'emerald'];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'navy';
    return localStorage.getItem('bw-theme-v6') || 'navy';
  });
  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);

  useEffect(() => {
    const root = document.documentElement;
    // remove all theme classes, then add the active one (if any)
    Object.values(THEME_CLASSES).forEach((c) => root.classList.remove(c));
    if (THEME_CLASSES[theme]) root.classList.add(THEME_CLASSES[theme]);
    localStorage.setItem('bw-theme-v6', theme);
  }, [theme]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleTheme = () => setThemeState((p) => {
    const i = CYCLE.indexOf(p);
    return CYCLE[(i + 1) % CYCLE.length];
  });

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, toggleTheme, isFullscreen, toggleFullscreen: async () => {
      try {
        if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
        else await document.exitFullscreen();
      } catch {}
    } }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'navy', setTheme: () => {}, toggleTheme: () => {}, isFullscreen: false, toggleFullscreen: () => {} };
  return ctx;
}