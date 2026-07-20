import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KpiCard({ title, value, subtitle, icon: Icon, trend, trendValue, className = '' }) {
  const isPositive = trend === 'up';

  return (
    <div className={`glass-card p-5 stat-glow ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
        )}
      </div>
      <p className="text-2xl font-display font-bold text-foreground tracking-tight">{value}</p>
      <div className="flex items-center gap-2 mt-1.5">
        {trendValue && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </span>
        )}
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}