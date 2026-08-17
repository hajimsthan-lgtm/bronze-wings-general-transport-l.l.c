import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import RadialGauge from '@/components/reports/RadialGauge';
import { Crown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const BRONZE = '#C9873B';
const BLUE = '#0A84FF';
const RED = '#EF4444';

function CashTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const inflow = payload.find(p => p.dataKey === 'inflow')?.value || 0;
  const outflow = payload.find(p => p.dataKey === 'outflow')?.value || 0;
  const net = inflow - outflow;
  return (
    <div className="px-4 py-3 rounded-2xl bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl min-w-[160px]">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: BLUE }} /> Inflow
          </span>
          <span className="text-xs font-bold tabular-nums">{formatCurrency(inflow)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: RED }} /> Outflow
          </span>
          <span className="text-xs font-bold tabular-nums">{formatCurrency(outflow)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-border/30">
          <span className="text-xs font-semibold">Net</span>
          <span className={cn('text-xs font-bold tabular-nums', net >= 0 ? 'text-green-500' : 'text-red-500')}>
            {formatCurrency(net)}
          </span>
        </div>
      </div>
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
              <defs>
                <linearGradient id="cf-inflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="cf-outflow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={RED} stopOpacity={0.7} />
                  <stop offset="100%" stopColor={RED} stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.4 }} axisLine={false} tickLine={false} dy={6} />
              <Tooltip content={<CashTooltip />} cursor={{ fill: 'rgba(128,128,128,0.04)' }} />
              <Bar dataKey="inflow" fill="url(#cf-inflow)" radius={[5, 5, 0, 0]} maxBarSize={20} isAnimationActive animationDuration={900} animationEasing="ease-out" />
              <Bar dataKey="outflow" fill="url(#cf-outflow)" radius={[5, 5, 0, 0]} maxBarSize={20} isAnimationActive animationDuration={900} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: BLUE }} /> Inflow
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} /> Outflow
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