import { useEffect, useState } from 'react';

export default function ProgressBar({ pct, color, delay = 300 }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setW(Math.max(0, Math.min(100, pct))), delay);
    return () => clearTimeout(id);
  }, [pct, delay]);
  return (
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${w}%`, background: color }} />
    </div>
  );
}