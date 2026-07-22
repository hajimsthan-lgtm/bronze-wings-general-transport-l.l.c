import { useEffect, useState } from 'react';

export default function RadialGauge({ value, label, color = '#3b82f6', size = 170, suffix = '%' }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(c * (1 - pct / 100)));
    return () => cancelAnimationFrame(id);
  }, [pct, c]);

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 6px ${color}66)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color }}>{Math.round(pct)}{suffix}</span>
        </div>
      </div>
      {label && <span className="text-[10px] uppercase tracking-wider text-white/40 mt-1">{label}</span>}
    </div>
  );
}