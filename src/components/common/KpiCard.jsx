import { TrendingUp, TrendingDown } from 'lucide-react';
import SatinCard from '@/components/common/SatinCard';

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, trendValue, className = '' }) {
  const isPositive = trend === 'up';

  return (
    <SatinCard className={`p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3">
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
        className="text-2xl font-bold tracking-tight"
        style={{ color: '#f4f4f4', fontFamily: 'Georgia, "Times New Roman", serif' }}
      >
        {value}
      </p>

      <div className="flex items-center gap-2 mt-2">
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
    </SatinCard>
  );
}