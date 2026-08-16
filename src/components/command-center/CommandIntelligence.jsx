import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import RadialGauge from '@/components/reports/RadialGauge';
import { Crown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const BRONZE = '#C9873B';

function CashTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl bg-popover/95 backdrop-blur-xl border border-border/40 shadow-xl">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.dataKey === 'inflow' ? 'Inflow' : 'Outflow'}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function CommandIntelligence({ fleetUtil, cashFlowData, topPerformers, maxPerformer }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Fleet Utilization */}
      <div className="cmd-card animate-enter-up flex flex-col" style={{ animationDelay: '0.6s' }}>
        <h3 className="text-sm font-semibold mb-2">Fleet Utilization</h3>
        <div className="flex-1 flex items-center justify-center py-2">
          <RadialGauge value={fleetUtil} color={BRONZE} size={160} label="Utilized" />
        </div>
      </div>

      {/* Cash Flow Snapshot */}
      <div className="cmd-card animate-enter-up" style={{ animationDelay: '0.68s' }}>
        <h3 className="text-sm font-semibold mb-3">Cash Flow Snapshot</h3>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlowData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} dy={6} />
              <Tooltip content={<CashTooltip />} cursor={{ fill: 'rgba(128,128,128,0.05)' }} />
              <Bar dataKey="inflow" fill="#22c55e" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
              <Bar dataKey="outflow" fill="#ef4444" radius={[4, 4, 0, 0]} isAnimationActive animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Inflow
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Outflow
          </span>
        </div>
      </div>

      {/* Top Performers */}
      <div className="cmd-card animate-enter-up" style={{ animationDelay: '0.76s' }}>
        <h3 className="text-sm font-semibold mb-3">Top Performers</h3>
        {topPerformers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p>
        ) : (
          <div className="space-y-2.5">
            {topPerformers.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                  i === 0 ? 'brand-gradient-bg text-white' : 'bg-foreground/10 text-muted-foreground'
                )}>
                  {i === 0 ? <Crown className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{p.name}</span>
                    <span className="text-xs font-bold tabular-nums">{formatCurrency(p.value)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
                    <div className="h-full rounded-full brand-gradient-bg transition-all duration-700" style={{ width: `${(p.value / maxPerformer * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}