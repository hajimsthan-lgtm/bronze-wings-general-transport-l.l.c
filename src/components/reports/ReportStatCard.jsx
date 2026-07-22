import { useState, useEffect } from 'react';

export function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export default function ReportStatCard({ label, value, format, icon: Icon, color, index = 0 }) {
  const animated = useCountUp(value);
  const display = format ? format(animated) : Math.round(animated).toLocaleString();
  const rgba = (a) => hexToRgba(color, a);

  return (
    <div
      className="relative overflow-hidden p-5 animate-fade-in-up hover:-translate-y-[3px] hover:scale-[1.01] transition-transform duration-300 group"
      style={{
        animationDelay: `${index * 0.08}s`,
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        background: `linear-gradient(165deg, ${rgba(0.18)} 0%, ${rgba(0.06)} 40%, rgba(12,16,26,0.55) 100%)`,
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${rgba(0.08)}`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-white/50 pt-1.5">{label}</p>
        {Icon && (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `radial-gradient(circle, ${rgba(0.25)} 0%, transparent 70%)`,
              border: `1.5px solid ${rgba(0.30)}`,
              boxShadow: `0 0 16px ${rgba(0.20)}, inset 0 1px 0 rgba(255,255,255,0.10)`,
            }}
          >
            <Icon className="w-[18px] h-[18px] text-white/70" />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold tabular-nums font-display tracking-tight" style={{ color: 'rgba(255,255,255,0.92)' }}>
        {display}
      </p>
      <div
        className="mt-4"
        style={{ height: 2, background: `linear-gradient(90deg, transparent, ${rgba(0.5)}, transparent)`, opacity: 0.6 }}
      />
    </div>
  );
}