import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const THEME_CLASSES = {
  navy: 'theme-navy',
  emerald: 'theme-emerald',
  amethyst: 'theme-amethyst',
  // crimson is the :root default — no class needed
};
const CYCLE = ['crimson', 'navy', 'emerald', 'amethyst'];

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'crimson';
    return localStorage.getItem('bw-theme-v7') || 'crimson';
  });
  const [mode, setModeState] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('bw-mode-v1') || 'dark';
  });
  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);

  useEffect(() => {
    const root = document.documentElement;
    // remove all theme classes, then add the active one (if any)
    Object.values(THEME_CLASSES).forEach((c) => root.classList.remove(c));
    if (THEME_CLASSES[theme]) root.classList.add(THEME_CLASSES[theme]);
    localStorage.setItem('bw-theme-v7', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'light') root.classList.add('theme-light');
    else root.classList.remove('theme-light');
    localStorage.setItem('bw-mode-v1', mode);
  }, [mode]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleTheme = () => setThemeState((p) => {
    const i = CYCLE.indexOf(p);
    return CYCLE[(i + 1) % CYCLE.length];
  });

  const toggleMode = () => setModeState((p) => (p === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, toggleTheme, mode, setMode: setModeState, toggleMode, isFullscreen, toggleFullscreen: async () => {
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
  if (!ctx) return { theme: 'navy', setTheme: () => {}, toggleTheme: () => {}, mode: 'dark', setMode: () => {}, toggleMode: () => {}, isFullscreen: false, toggleFullscreen: () => {} };
  return ctx;
}