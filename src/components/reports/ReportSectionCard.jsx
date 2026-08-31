import { hexToRgba } from './ReportStatCard';

export default function ReportSectionCard({ color, title, index = 0, children, className = '', action }) {
  const rgba = (a) => hexToRgba(color, a);
  return (
    <div
      className={`neon-edge report-section-card relative overflow-hidden p-6 animate-fade-in-up hover:-translate-y-0.5 transition-all duration-400 rounded-3xl ${className}`}
      style={{
        animationDelay: `${index * 0.1}s`,
        border: `1px solid ${rgba(0.22)}`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8), 0 0 32px ${rgba(0.08)}`,
      }}
    >
      {/* Neon top accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 10px ${rgba(0.7)}` }} />
      {/* Ambient color glow */}
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: color }} />
      {title && (
        <div className="relative flex items-center justify-between gap-3 mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: rgba(0.85) }}>{title}</h3>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}