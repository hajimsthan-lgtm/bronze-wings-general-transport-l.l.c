import { Link } from 'react-router-dom';

const VARIANTS = {
  green:  { gradient: 'linear-gradient(135deg, rgba(74,222,128,0.25) 0%, rgba(34,197,94,0.10) 50%, rgba(10,20,12,0.5) 100%)', rgb: '74,222,128', glow: '#22c55e' },
  purple: { gradient: 'linear-gradient(135deg, rgba(168,85,247,0.20) 0%, rgba(147,51,234,0.08) 50%, rgba(15,10,20,0.5) 100%)', rgb: '168,85,247', glow: '#a855f7' },
  teal:   { gradient: 'linear-gradient(135deg, rgba(45,212,191,0.20) 0%, rgba(20,184,166,0.08) 50%, rgba(8,18,18,0.5) 100%)', rgb: '45,212,191', glow: '#14b8a6' },
  orange: { gradient: 'linear-gradient(135deg, rgba(251,146,60,0.20) 0%, rgba(249,115,22,0.08) 50%, rgba(20,12,8,0.5) 100%)', rgb: '251,146,60', glow: '#f97316' },
  blue:   { gradient: 'linear-gradient(135deg, rgba(59,130,246,0.22) 0%, rgba(37,99,235,0.08) 50%, rgba(8,12,20,0.5) 100%)', rgb: '59,130,246', glow: '#3b82f6' },
  red:    { gradient: 'linear-gradient(135deg, rgba(239,68,68,0.20) 0%, rgba(220,38,38,0.08) 50%, rgba(20,8,8,0.5) 100%)', rgb: '239,68,68', glow: '#ef4444' },
  pink:   { gradient: 'linear-gradient(135deg, rgba(236,72,153,0.20) 0%, rgba(217,70,239,0.08) 50%, rgba(20,8,16,0.5) 100%)', rgb: '236,72,153', glow: '#ec4899' },
  yellow: { gradient: 'linear-gradient(135deg, rgba(245,158,11,0.20) 0%, rgba(217,119,6,0.08) 50%, rgba(20,16,8,0.5) 100%)', rgb: '245,158,11', glow: '#f59e0b' },
};

export default function GradientCard({ variant = 'blue', icon: Icon, label, title, subtitle, to, index = 0 }) {
  const v = VARIANTS[variant] || VARIANTS.blue;

  const inner = (
    <div
      className="group relative overflow-hidden rounded-3xl p-5 min-h-[140px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      style={{
        background: v.gradient,
        backdropFilter: 'blur(16px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.1)',
        border: `1px solid rgba(${v.rgb},0.15)`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)`,
      }}
    >
      {/* hover glow intensifier */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at 80% 0%, rgba(${v.rgb},0.20), transparent 60%)` }}
      />

      {/* top-left label */}
      <span className="relative z-10 text-[11px] uppercase tracking-wider font-semibold text-white/50">{label}</span>

      {/* top-right icon in soft glow circle */}
      <div className="absolute top-4 right-4 z-10">
        <div
          className="absolute -inset-2 rounded-full animate-halo pointer-events-none"
          style={{ background: `radial-gradient(circle, rgba(${v.rgb},0.32) 0%, transparent 70%)`, filter: 'blur(6px)' }}
        />
        <div
          className="relative w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: `rgba(${v.rgb},0.15)`, border: `1px solid rgba(${v.rgb},0.25)`, boxShadow: `0 0 20px rgba(${v.rgb},0.2), inset 0 1px 0 rgba(255,255,255,0.1)` }}
        >
          {Icon && <Icon className="w-4 h-4 text-white/70" />}
        </div>
      </div>

      {/* number + subtext */}
      <div className="relative z-10">
        <p className="text-4xl font-bold text-white font-display tracking-tight leading-none">{title}</p>
        {subtitle && <p className="text-sm text-white/40 mt-2">{subtitle}</p>}
      </div>

      {/* bottom glow line */}
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