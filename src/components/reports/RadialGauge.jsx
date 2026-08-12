import { useEffect, useState, useId } from 'react';

export default function RadialGauge({ value, label, color = '#1ED760', size = 170, suffix = '%' }) {
  const pct = Math.max(0, Math.min(100, value || 0));
  const stroke = 12;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const [offset, setOffset] = useState(c);
  const gid = useId().replace(/:/g, '');

  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(c * (1 - pct / 100)));
    return () => cancelAnimationFrame(id);
  }, [pct, c]);

  const ticks = Array.from({ length: 60 });

  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={`g-${gid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.6} />
              <stop offset="100%" stopColor={color} stopOpacity={1} />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#g-${gid})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </svg>
        {/* tick marks ring */}
        <svg width={size} height={size} className="absolute inset-0 pointer-events-none">
          {ticks.map((_, i) => {
            const angle = (i / ticks.length) * Math.PI * 2 - Math.PI / 2;
            const r1 = size / 2 - 2;
            const r2 = size / 2 - 6;
            const x1 = size / 2 + Math.cos(angle) * r1;
            const y1 = size / 2 + Math.sin(angle) * r1;
            const x2 = size / 2 + Math.cos(angle) * r2;
            const y2 = size / 2 + Math.sin(angle) * r2;
            const active = (i / ticks.length) * 100 <= pct;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={active ? color : 'rgba(255,255,255,0.08)'} strokeWidth={1.5} opacity={active ? 0.5 : 1} />;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums" style={{ color, textShadow: `0 0 16px ${color}55` }}>{Math.round(pct)}{suffix}</span>
        </div>
      </div>
      {label && <span className="text-[10px] uppercase tracking-[0.12em] text-white/45 mt-1.5">{label}</span>}
    </div>
  );
}