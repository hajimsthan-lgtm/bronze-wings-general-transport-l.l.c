import { useMemo, useState } from 'react';
import {
  ComposedChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Percent, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

const RANGES = ['7D', '30D', '90D'];

const BRONZE = '#C9873B';
const BLUE = '#0A84FF';
const GREEN = '#10B981';
const RED = '#EF4444';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const revenue = payload.find(p => p.dataKey === 'revenue')?.value || 0;
  const expenses = payload.find(p => p.dataKey === 'expenses')?.value || 0;
  const profit = revenue - expenses;
  return (
    <div className="px-4 py-3 rounded-2xl bg-popover/95 backdrop-blur-xl border border-border/50 shadow-2xl min-w-[180px]">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: BLUE }} /> Revenue
          </span>
          <span className="text-xs font-bold tabular-nums">{formatCurrency(revenue)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full" style={{ background: RED }} /> Expenses
          </span>
          <span className="text-xs font-bold tabular-nums">{formatCurrency(expenses)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-border/30">
          <span className="flex items-center gap-1.5 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full" style={{ background: GREEN }} /> Net Profit
          </span>
          <span className={cn('text-xs font-bold tabular-nums', profit >= 0 ? 'text-green-500' : 'text-red-500')}>
            {formatCurrency(profit)}
          </span>
        </div>
      </div>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, tone }) {
  const tones = {
    blue: 'text-blue-500',
    red: 'text-red-500',
    green: 'text-green-500',
    bronze: 'text-amber-500',
  };
  return (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-foreground/[0.03] border border-border/30">
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center bg-foreground/5', tones[tone])}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="leading-tight">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
        <p className={cn('text-sm font-bold tabular-nums', tones[tone])}>{value}</p>
      </div>
    </div>
  );
}

export default function CommandAnalytics({ data, range, setRange }) {
  const [hoverIdx, setHoverIdx] = useState(null);

  const totals = useMemo(() => {
    const rev = data.reduce((s, d) => s + (Number(d.revenue) || 0), 0);
    const exp = data.reduce((s, d) => s + (Number(d.expenses) || 0), 0);
    const profit = rev - exp;
    const margin = rev > 0 ? (profit / rev * 100) : 0;
    return { rev, exp, profit, margin };
  }, [data]);

  const avgRev = data.length ? totals.rev / data.length : 0;
  const peakRev = data.length ? Math.max(...data.map(d => Number(d.revenue) || 0)) : 0;

  return (
    <div className="cmd-card animate-enter-up" style={{ animationDelay: '0.55s' }}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg brand-gradient-bg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Financial Analytics</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Revenue · Expenses · Net Profit</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-full bg-foreground/[0.06] border border-border/40">
          {RANGES.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all',
                range === r
                  ? 'bg-[#0A84FF] text-white shadow-md shadow-[0_2px_8px_rgba(10,132,255,0.4)]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stat pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-5">
        <StatPill icon={TrendingUp} label="Revenue" value={formatCurrency(totals.rev)} tone="blue" />
        <StatPill icon={TrendingDown} label="Expenses" value={formatCurrency(totals.exp)} tone="red" />
        <StatPill icon={Wallet} label="Net Profit" value={formatCurrency(totals.profit)} tone={totals.profit >= 0 ? 'green' : 'red'} />
        <StatPill icon={Percent} label="Margin" value={`${totals.margin.toFixed(1)}%`} tone="bronze" />
      </div>

      {/* Chart */}
      <div style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 0, left: -16 }}
            onMouseMove={(e) => { if (e?.activeTooltipIndex !== undefined) setHoverIdx(e.activeTooltipIndex); }}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id="an-rev-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={BRONZE} />
                <stop offset="100%" stopColor={BLUE} />
              </linearGradient>
              <linearGradient id="an-rev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BLUE} stopOpacity={0.28} />
                <stop offset="60%" stopColor={BRONZE} stopOpacity={0.06} />
                <stop offset="100%" stopColor={BRONZE} stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="an-exp-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={RED} stopOpacity={0.55} />
                <stop offset="100%" stopColor={RED} stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 6" stroke="rgba(128,128,128,0.1)" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} width={50} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(10,132,255,0.35)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <ReferenceLine y={avgRev} stroke={BRONZE} strokeDasharray="3 5" strokeOpacity={0.4} />
            <Bar dataKey="expenses" fill="url(#an-exp-fill)" radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive animationDuration={800} />
            <Area dataKey="revenue" stroke="url(#an-rev-stroke)" fill="url(#an-rev-fill)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: BLUE, stroke: '#fff', strokeWidth: 2 }} isAnimationActive animationDuration={900} />
            <Line dataKey="profit" stroke={GREEN} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: GREEN, stroke: '#fff', strokeWidth: 1.5 }} isAnimationActive animationDuration={1000} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + footer stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-border/20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: BLUE }} /> Revenue
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: RED }} /> Expenses
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: GREEN }} /> Profit
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-6 border-t-2 border-dashed" style={{ borderColor: BRONZE, opacity: 0.5 }} /> Avg
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">Avg/day: <span className="font-bold text-foreground tabular-nums">{formatCurrency(avgRev)}</span></span>
          <span className="text-muted-foreground">Peak: <span className="font-bold text-foreground tabular-nums">{formatCurrency(peakRev)}</span></span>
        </div>
      </div>
    </div>
  );
}