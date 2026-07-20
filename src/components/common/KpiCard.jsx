import { TrendingUp, TrendingDown } from 'lucide-react';

const SATIN_BG = 'https://media.base44.com/images/public/6a5e20fffaa71b55806cccc8/e4039c17d_generated_image.png';

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, trendValue, className = '' }) {
  const isPositive = trend === 'up';

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] p-5 ${className}`}
      style={{
        backgroundImage: `url('${SATIN_BG}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid rgba(212,175,55,0.18)',
        boxShadow:
          '0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 1px 0 rgba(255,255,255,0.06) inset',
      }}
    >
      <div className="relative flex items-start justify-between mb-3">
        <p
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: '#8a8a8a' }}
        >
          {title}
        </p>
        {Icon && (
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{
              background: 'rgba(74,122,106,0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Icon className="w-4 h-4" style={{ color: '#d4af37' }} />
          </div>
        )}
      </div>

      <p
        className="text-2xl font-bold tracking-tight relative"
        style={{ color: '#f4f4f4', fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {value}
      </p>

      <div className="flex items-center gap-2 mt-2 relative">
        {trendValue && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: isPositive ? '#2ecc71' : '#ef4444',
            }}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </span>
        )}
        {subtitle && (
          <span
            className="text-xs"
            style={{ color: '#7a7a7a', fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}