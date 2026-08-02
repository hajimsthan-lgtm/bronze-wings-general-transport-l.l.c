import { useState, useEffect } from 'react';

export function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function useCountUp(target, duration = 1200) {
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

export default function ReportStatCard({ label, value, format, icon: Icon, color, index = 0, extra }) {
  const animated = useCountUp(value);
  const display = format ? format(animated) : Math.round(animated).toLocaleString();
  const rgba = (a) => hexToRgba(color, a);

  return (
    <div
      className="relative overflow-hidden p-4 sm:p-6 animate-fade-in-up hover:-translate-y-[3px] transition-all duration-400 group bg-card border border-white/[0.06] rounded-3xl"
      style={{
        animationDelay: `${index * 0.08}s`,
        boxShadow: `-8px -8px 16px rgba(255,255,255,0.05), 8px 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6b7280] pt-1.5">{label}</p>
        {Icon && (
          <span
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              boxShadow: `0 4px 12px ${rgba(0.3)}`,
            }}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-4xl font-light text-white tabular-nums tracking-tight">{display}</p>
      {extra && <div className="mt-3 flex items-center justify-between gap-2 relative z-10">{extra}</div>}
    </div>
  );
}