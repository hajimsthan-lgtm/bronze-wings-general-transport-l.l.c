import { Link } from 'react-router-dom';

const VARIANTS = {
  red:    { top: '#4a1818', glow: '#ef4444' },
  purple: { top: '#2e1b45', glow: '#a855f7' },
  green:  { top: '#1d3d24', glow: '#22c55e' },
  yellow: { top: '#4a3a1a', glow: '#f59e0b' },
  teal:   { top: '#183d36', glow: '#14b8a6' },
  blue:   { top: '#162a4a', glow: '#3b82f6' },
  orange: { top: '#4a2a12', glow: '#f97316' },
  pink:   { top: '#451a2e', glow: '#ec4899' },
};

export default function GradientCard({ variant = 'blue', icon: Icon, label, title, subtitle, to, index = 0 }) {
  const v = VARIANTS[variant] || VARIANTS.blue;
  const delay = `${index * 0.18}s`;

  const inner = (
    <div
      className="group relative overflow-hidden rounded-2xl p-4 min-h-[132px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] animate-float cursor-pointer"
      style={{
        background: `linear-gradient(180deg, ${v.top} 0%, rgba(6,8,15,0.92) 100%)`,
        border: `1px solid ${v.glow}26`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.45)`,
        animationDelay: delay,
      }}
    >
      {/* Frosted glass sheen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 45%)' }}
      />
      {/* Top radial light from halo */}
      <div
        className="absolute -top-10 -right-6 w-40 h-40 pointer-events-none opacity-60"
        style={{ background: `radial-gradient(circle, ${v.glow}22 0%, transparent 65%)`, filter: 'blur(20px)' }}
      />

      {/* Top-left label */}
      <div className="relative z-10 flex items-start justify-between">
        <span className="text-[10px] uppercase tracking-[0.14em] font-semibold text-white/45">{label}</span>
      </div>

      {/* Top-right icon with pulsing glow halo */}
      <div className="absolute top-3 right-3 z-10">
        {/* halo layer 1 */}
        <div
          className="absolute -inset-3 rounded-full animate-halo pointer-events-none"
          style={{ background: `radial-gradient(circle, ${v.glow}55 0%, transparent 70%)`, filter: 'blur(8px)' }}
        />
        {/* halo layer 2 */}
        <div
          className="absolute -inset-1 rounded-full animate-halo pointer-events-none"
          style={{ background: `radial-gradient(circle, ${v.glow}40 0%, transparent 70%)`, filter: 'blur(4px)', animationDelay: '-1.3s' }}
        />
        {/* icon button */}
        <div
          className="relative w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md"
          style={{ background: 'rgba(255,255,255,0.10)', border: `1px solid ${v.glow}55`, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2)` }}
        >
          {Icon && <Icon className="w-4 h-4 text-white" />}
        </div>
      </div>

      {/* Primary + secondary text */}
      <div className="relative z-10 mt-6">
        <p className="text-2xl font-bold text-white font-display leading-tight tracking-tight">{title}</p>
        {subtitle && <p className="text-[11px] text-white/50 mt-1">{subtitle}</p>}
      </div>

      {/* Bottom glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${v.glow}, transparent)` }}
      />
    </div>
  );

  if (to) {
    return <Link to={to} className="block h-full">{inner}</Link>;
  }
  return inner;
}