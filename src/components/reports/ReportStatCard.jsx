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
  const padCls = compact ? 'p-2.5 sm:p-3' : 'p-4 sm:p-5';
  const iconWrapCls = compact ? 'w-8 h-8 rounded-xl' : 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl';
  const iconCls = compact ? 'w-3.5 h-3.5' : 'w-4 h-4 sm:w-5 sm:h-5';
  const valueCls = compact ? 'text-lg sm:text-xl' : 'text-lg sm:text-2xl';

  const inner = (
    <>
      {/* Decorative gradient blur */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-xl opacity-15" style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }} />
      <div className="relative flex items-center justify-between mb-3">
        <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">{label}</span>
        {Icon && (
          <span
            className={`${iconWrapCls} flex items-center justify-center text-white shadow-md transition-transform duration-300 group-hover:scale-110`}
            style={{
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              boxShadow: `0 4px 12px ${rgba(0.4)}, inset 0 1px 0 rgba(255,255,255,0.3)`,
            }}
          >
            <Icon className={iconCls} />
          </span>
        )}
      </div>
      <div className={`relative ${valueCls} font-extrabold tracking-tight text-foreground font-heading tabular-nums`}>{display}</div>
      {extra && <div className="relative mt-1 flex items-center justify-between gap-2 z-10">{extra}</div>}
      {(to || onClick) && (
        <div className="absolute bottom-3 right-4 flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }}>
          View <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </>
  );

  const clickable = to || onClick;
  const cls = `edge-panel edge-glow-animate ${padCls} relative overflow-hidden animate-fade-in-up transition-all duration-400 group rounded-2xl ${
    clickable ? 'hover:-translate-y-[3px] cursor-pointer' : 'hover:-translate-y-[3px]'
  }`;
  const style = { animationDelay: `${index * 0.08}s` };

  if (to) return <Link to={to} className={cls} style={style}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={cls} style={style}>{inner}</button>;
  return <div className={cls} style={style}>{inner}</div>;
}