import { TrendingUp, TrendingDown } from 'lucide-react';
import SatinCard from '@/components/common/SatinCard';

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, trendValue, className = '' }) {
  const isPositive = trend === 'up';

  return (
    <SatinCard className={`p-5 ${className}`}>
      <div className="flex items-start justify-between mb-3.5">
        <p className="eyebrow pt-1">{title}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center glass-panel">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>

      <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums font-display">
        {value}
      </p>

      <div className="flex items-center gap-2 mt-2">
        {trendValue && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
              isPositive ? 'text-emerald-300 border-emerald-400/25 bg-emerald-400/10' : 'text-red-300 border-red-400/25 bg-red-400/10'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </span>
        )}
        {subtitle && (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </SatinCard>
  );
}