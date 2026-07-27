import { hexToRgba } from './ReportStatCard';

export default function ReportSectionCard({ color, title, index = 0, children, className = '', action }) {
  const rgba = (a) => hexToRgba(color, a);
  return (
    <div
      className={`relative overflow-hidden p-6 animate-fade-in-up hover:-translate-y-0.5 transition-all duration-400 bg-card border border-white/[0.06] rounded-3xl ${className}`}
      style={{
        animationDelay: `${index * 0.1}s`,
        boxShadow: `-8px -8px 16px rgba(255,255,255,0.05), 8px 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-20 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${rgba(0.06)} 0%, transparent 60%)` }} />
      {title && (
        <div className="relative flex items-center justify-between gap-3 mb-4">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/50">{title}</h3>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}