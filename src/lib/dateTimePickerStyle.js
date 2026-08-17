import { useState, useEffect } from 'react';

const STORAGE_KEY = 'dtp-style';
export const PICKER_STYLES = ['scroll_wheel', 'analog_custom', 'analog_library'];
const DEFAULT_STYLE = 'scroll_wheel';

export function getPickerStyle() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return PICKER_STYLES.includes(s) ? s : DEFAULT_STYLE;
  } catch { return DEFAULT_STYLE; }
}

export function setPickerStyle(style) {
  try {
    localStorage.setItem(STORAGE_KEY, style);
    window.dispatchEvent(new CustomEvent('dtp-style-change', { detail: style }));
  } catch {}
}

export function usePickerStyle() {
  const [style, setStyle] = useState(getPickerStyle());
  useEffect(() => {
    const handler = (e) => setStyle(e.detail || getPickerStyle());
    window.addEventListener('dtp-style-change', handler);
    return () => window.removeEventListener('dtp-style-change', handler);
  }, []);
  return style;
}