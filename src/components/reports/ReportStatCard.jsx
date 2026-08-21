import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

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

export default function ReportStatCard({ label, value, format, icon: Icon, color, index = 0, extra, to, onClick, compact = false }) {
  const animated = useCountUp(value);
  const display = format ? format(animated) : Math.round(animated).toLocaleString();
  const rgba = (a) => hexToRgba(color, a);
  const padCls = compact ? 'p-2.5 sm:p-3' : 'p-3 sm:p-4';
  const iconWrapCls = compact ? 'w-8 h-8 sm:w-9 sm:h-9 rounded-xl' : 'w-9 h-9 sm:w-11 sm:h-11 rounded-2xl';
  const iconCls = compact ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-5 sm:h-5';
  const valueCls = compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl';

  const inner = (
    <>
      {/* Neon top accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 12px ${rgba(0.8)}` }} />
      {/* Ambient color glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-25 group-hover:opacity-40 transition-opacity duration-500" style={{ background: color }} />
      <div className="relative flex items-start justify-between mb-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] pt-1.5" style={{ color: rgba(0.85) }}>{label}</p>
        {Icon && (
          <span
            className={`${iconWrapCls} flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110`}
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}aa)`,
              boxShadow: `0 0 20px ${rgba(0.6)}, 0 4px 12px ${rgba(0.4)}, inset 0 1px 0 rgba(255,255,255,0.3)`,
              border: `1px solid ${rgba(0.5)}`,
            }}
          >
            <Icon className={iconCls} style={{ filter: `drop-shadow(0 0 4px ${rgba(0.8)})` }} />
          </span>
        )}
      </div>
      <p className={`relative ${valueCls} font-light text-white tabular-nums tracking-tight`} style={{ textShadow: `0 0 24px ${rgba(0.3)}` }}>{display}</p>
      {extra && <div className="relative mt-2 flex items-center justify-between gap-2 z-10">{extra}</div>}
      {(to || onClick) && (
        <div className="absolute bottom-3 right-4 flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity" style={{ color, textShadow: `0 0 8px ${rgba(0.6)}` }}>
          View <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </>
  );

  const clickable = to || onClick;
  const cls = `relative overflow-hidden ${padCls} animate-fade-in-up transition-all duration-400 group bg-card rounded-2xl ${
    clickable ? 'hover:-translate-y-[3px] cursor-pointer' : 'hover:-translate-y-[3px]'
  }`;
  const style = {
    animationDelay: `${index * 0.08}s`,
    border: `1px solid ${rgba(0.25)}`,
    boxShadow: `0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8), 0 0 24px ${rgba(0.08)}`,
  };

  if (to) {
    return <Link to={to} className={cls} style={style}>{inner}</Link>;
  }
  if (onClick) {
    return <button type="button" onClick={onClick} className={cls} style={style}>{inner}</button>;
  }
  return <div className={cls} style={style}>{inner}</div>;
}