import { useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const ACCENTS = {
  primary: { icon: 'text-primary', glow: '30,215,96', value: 'text-foreground' },
  amber: { icon: 'text-amber-600', glow: '251,191,36', value: 'text-amber-600' },
  teal: { icon: 'text-teal-600', glow: '45,212,191', value: 'text-teal-600' },
  emerald: { icon: 'text-emerald-600', glow: '52,211,153', value: 'text-emerald-600' },
  red: { icon: 'text-rose-600', glow: '251,113,133', value: 'text-rose-600' },
};

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, trendValue, accent = 'primary', className = '' }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 50, y: 30, active: false });
  const a = ACCENTS[accent] || ACCENTS.primary;
  const isPositive = trend === 'up';

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, active: true });
  };
  const onLeave = () => setPos((p) => ({ ...p, active: false }));

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`kpi-card group relative overflow-hidden rounded-2xl p-5 ${className}`}
    >
      {/* dotted grid */}
      <div
        className="kpi-dots pointer-events-none absolute inset-0"
        style={{ backgroundImage: `radial-gradient(circle, rgba(${a.glow},0.16) 1px, transparent 1px)` }}
      />
      {/* cursor spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: pos.active ? 1 : 0,
          background: `radial-gradient(240px circle at ${pos.x}% ${pos.y}%, rgba(${a.glow},0.22), transparent 60%)`,
        }}
      />
      {/* top hairline */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, rgba(${a.glow},0.35), transparent)` }} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3.5">
          <p className="eyebrow pt-1">{title}</p>
          {Icon && (
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.04]">
              <Icon className={`w-4 h-4 ${a.icon}`} />
            </div>
          )}
        </div>

        <p className={`text-2xl font-bold tracking-tight tabular-nums font-display ${a.value}`}>{value}</p>

        <div className="flex items-center gap-2 mt-2">
          {trendValue && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                isPositive ? 'text-emerald-600 border-emerald-500/25 bg-emerald-500/10' : 'text-red-600 border-red-500/25 bg-red-500/10'
              }`}
            >
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </span>
          )}
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
}