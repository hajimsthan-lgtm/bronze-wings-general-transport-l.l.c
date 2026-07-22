import { hexToRgba } from './ReportStatCard';

export default function ReportSectionCard({ color, title, index = 0, children, className = '' }) {
  const rgba = (a) => hexToRgba(color, a);
  return (
    <div
      className={`relative overflow-hidden p-6 animate-fade-in-up hover:-translate-y-0.5 transition-transform duration-300 ${className}`}
      style={{
        animationDelay: `${index * 0.1}s`,
        transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)',
        background: `linear-gradient(165deg, ${rgba(0.12)} 0%, ${rgba(0.04)} 40%, rgba(12,16,26,0.55) 100%)`,
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${rgba(0.06)}`,
      }}
    >
      <div className="absolute inset-x-0 top-0 h-20 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${rgba(0.06)} 0%, transparent 60%)` }} />
      {title && <h3 className="relative text-[11px] font-semibold uppercase tracking-[0.1em] text-white/40 mb-4">{title}</h3>}
      <div className="relative">{children}</div>
    </div>
  );
}