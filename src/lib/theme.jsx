import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

const ACCENTS = {
  blue:   { primary: '217 91% 60%', light: '213 94% 68%', accent: '217 91% 60%', ring: '217 91% 60%', rgb: '59,130,246', rgb2: '37,99,235', sidebar: '217 91% 60%', chart1: '217 91% 60%' },
  green:  { primary: '142 71% 45%', light: '142 69% 55%', accent: '142 71% 45%', ring: '142 71% 45%', rgb: '16,185,129', rgb2: '5,150,105', sidebar: '142 71% 45%', chart1: '142 71% 45%' },
  purple: { primary: '265 89% 66%', light: '270 90% 72%', accent: '265 89% 66%', ring: '265 89% 66%', rgb: '168,85,247', rgb2: '147,51,234', sidebar: '265 89% 66%', chart1: '265 89% 66%' },
  amber:  { primary: '32 95% 50%', light: '35 92% 58%', accent: '32 95% 50%', ring: '32 95% 50%', rgb: '245,158,11', rgb2: '217,119,6', sidebar: '32 95% 50%', chart1: '32 95% 50%' },
  rose:   { primary: '347 77% 60%', light: '350 80% 70%', accent: '347 77% 60%', ring: '347 77% 60%', rgb: '244,63,94', rgb2: '219,39,119', sidebar: '347 77% 60%', chart1: '347 77% 60%' },
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('bw-theme') || 'dark';
  });
  const [accent, setAccentState] = useState(() => {
    if (typeof window === 'undefined') return 'blue';
    return ACCENTS[localStorage.getItem('bw-accent')] ? localStorage.getItem('bw-accent') : 'blue';
  });
  const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement);

  const applyAccent = useCallback((acc) => {
    const a = ACCENTS[acc] || ACCENTS.blue;
    const root = document.documentElement;
    root.style.setProperty('--primary', a.primary);
    root.style.setProperty('--primary-light', a.light);
    root.style.setProperty('--accent', a.accent);
    root.style.setProperty('--ring', a.ring);
    root.style.setProperty('--panel-accent-rgb', a.rgb);
    root.style.setProperty('--panel-accent2-rgb', a.rgb2);
    root.style.setProperty('--sidebar-primary', a.sidebar);
    root.style.setProperty('--chart-1', a.chart1);
    root.dataset.accent = acc;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') root.classList.add('light');
    else root.classList.remove('light');
    localStorage.setItem('bw-theme', theme);
  }, [theme]);

  useEffect(() => {
    applyAccent(accent);
    localStorage.setItem('bw-accent', accent);
  }, [accent, applyAccent]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleTheme = () => setThemeState((p) => (p === 'dark' ? 'light' : 'dark'));
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, toggleTheme, accent, setAccent: setAccentState, isFullscreen, toggleFullscreen, accents: Object.keys(ACCENTS) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'dark', accent: 'blue', isFullscreen: false, setTheme: () => {}, setAccent: () => {}, toggleTheme: () => {}, toggleFullscreen: () => {} };
  return ctx;
}