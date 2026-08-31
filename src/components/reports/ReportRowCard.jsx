import { hexToRgba } from './ReportStatCard';

export default function ReportRowCard({ icon: Icon, iconColor = '#1ED760', title, subtitle, right, onClick, accent, className = '', children }) {
  return (
    <div
      onClick={onClick}
      className={`neon-edge group relative rounded-2xl mb-2 transition-all duration-200 hover:-translate-y-px ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb), 0.45) 0%, rgba(var(--surf-2-rgb), 0.55) 100%)',
        border: '1px solid hsl(var(--border))',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(24px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
      }}
    >
      <span
        className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: accent || iconColor, boxShadow: `0 0 8px ${accent || iconColor}` }}
      />
      <div className="flex items-center gap-3 p-4">
        {Icon && (
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(iconColor, 0.12), border: `1px solid ${hexToRgba(iconColor, 0.2)}` }}>
            <Icon className="w-4 h-4" style={{ color: iconColor }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && <p className="text-sm font-medium text-white/80 truncate">{title}</p>}
          {subtitle && <p className="text-xs text-white/35 truncate">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}