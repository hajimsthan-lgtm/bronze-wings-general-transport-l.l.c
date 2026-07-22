import { useEffect, useState } from 'react';

const TINTS = [
  { name: 'Blue',   rgb: '59,130,246',  rgb2: '37,99,235',  swatch: '#3b82f6' },
  { name: 'Purple', rgb: '168,85,247',  rgb2: '147,51,234', swatch: '#a855f7' },
  { name: 'Teal',   rgb: '20,184,166',  rgb2: '13,148,136', swatch: '#14b8a6' },
  { name: 'Orange', rgb: '249,115,22',  rgb2: '234,88,12',  swatch: '#f97316' },
];
const STORAGE_KEY = 'panel-tint-idx';

function apply(i) {
  const tint = TINTS[i];
  const root = document.documentElement;
  root.style.setProperty('--panel-accent-rgb', tint.rgb);
  root.style.setProperty('--panel-accent2-rgb', tint.rgb2);
}

export default function ThemeToggle({ className = '' }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    const i = Number.isInteger(saved) && saved >= 0 && saved < TINTS.length ? saved : 0;
    setIdx(i);
    apply(i);
  }, []);

  const current = TINTS[idx];
  const cycle = () => {
    const next = (idx + 1) % TINTS.length;
    setIdx(next);
    localStorage.setItem(STORAGE_KEY, String(next));
    apply(next);
  };

  return (
    <button
      onClick={cycle}
      className={`clay-sm flex items-center justify-center w-8 h-8 rounded-lg transition-transform active:scale-95 ${className}`}
      aria-label={`Panel color: ${current.name}`}
      title={`Panel color: ${current.name}`}
    >
      <span
        className="w-4 h-4 rounded-full transition-all"
        style={{ background: current.swatch, boxShadow: `0 0 10px ${current.swatch}` }}
      />
    </button>
  );
}