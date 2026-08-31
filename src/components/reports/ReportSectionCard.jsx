import { hexToRgba } from './ReportStatCard';

export default function ReportSectionCard({ color, title, index = 0, children, className = '', action }) {
  const rgba = (a) => hexToRgba(color, a);
  return (
    <div
      className={`edge-panel edge-glow-animate relative overflow-hidden p-6 animate-fade-in-up hover:-translate-y-0.5 transition-all duration-400 rounded-3xl ${className}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Neon top accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)`, boxShadow: `0 0 10px ${rgba(0.7)}` }} />
      {/* Ambient color glow */}
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: color }} />
      {title && (
        <div className="relative flex items-center justify-between gap-3 mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] flex items-center gap-2" style={{ color: rgba(0.85) }}>
            <span className="w-5 h-5 rounded-lg flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 2px 8px ${rgba(0.4)}` }}>
              <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
            </span>
            {title}
          </h3>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}