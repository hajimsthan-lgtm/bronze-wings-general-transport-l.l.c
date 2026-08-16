/**
 * Ledger Analytics — mobile-only analytics dashboard for Bank & Petty Cash pages.
 * Shows cash flow trend, inflow/outflow comparison, and KPI summary.
 */
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const BLUE = '#2196f3';
const GREEN = '#22c55e';
const RED = '#ef4444';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl bg-popover/95 backdrop-blur-xl border border-border/40 shadow-xl">
      <p className="text-[10px] text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs font-semibold" style={{ color: p.color }}>
          {p.dataKey === 'net' ? 'Net' : p.dataKey === 'in' ? 'Inflow' : 'Outflow'}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

function KpiPill({ icon: Icon, label, value, tone }) {
  const tones = { green: 'text-green-500', red: 'text-red-500', blue: 'text-blue-500' };
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/[0.03] border border-border/30">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-foreground/5 ${tones[tone]}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="leading-tight min-w-0">
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold truncate">{label}</p>
        <p className={`text-xs font-bold tabular-nums truncate ${tones[tone]}`}>{value}</p>
      </div>
    </div>
  );
}

export default function LedgerAnalytics({ rows, inflowKey, outflowKey, inflowLabel, outflowLabel, title }) {
  const analytics = useMemo(() => {
    const sorted = [...rows].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const daily = {};
    sorted.forEach((r) => {
      const day = (r.date || '').slice(0, 10);
      if (!daily[day]) daily[day] = { date: day, in: 0, out: 0 };
      const inAmt = Number(r[inflowKey]) || 0;
      const outAmt = Number(r[outflowKey]) || 0;
      daily[day].in += inAmt;
      daily[day].out += outAmt;
    });
    const chartData = Object.values(daily).map((d) => ({
      ...d,
      net: d.in - d.out,
      label: d.date.slice(5),
    }));
    const totalIn = chartData.reduce((s, d) => s + d.in, 0);
    const totalOut = chartData.reduce((s, d) => s + d.out, 0);
    const net = totalIn - totalOut;
    const avgDaily = chartData.length ? net / chartData.length : 0;
    return { chartData, totalIn, totalOut, net, avgDaily };
  }, [rows, inflowKey, outflowKey]);

  if (!rows || rows.length === 0) return null;

  return (
    <div className="md:hidden space-y-3 mb-4">
      {/* KPI pills */}
      <div className="grid grid-cols-2 gap-2">
        <KpiPill icon={TrendingUp} label={inflowLabel} value={formatCurrency(analytics.totalIn)} tone="green" />
        <KpiPill icon={TrendingDown} label={outflowLabel} value={formatCurrency(analytics.totalOut)} tone="red" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <KpiPill icon={Wallet} label="Net Flow" value={formatCurrency(analytics.net)} tone={analytics.net >= 0 ? 'green' : 'red'} />
        <KpiPill icon={Activity} label="Avg/Day" value={formatCurrency(analytics.avgDaily)} tone="blue" />
      </div>

      {/* Cash flow trend */}
      <div className="cmd-card p-4" style={{ borderRadius: 18 }}>
        <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-primary" />
          {title} — Flow Trend
        </h3>
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="ledger-net-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(128,128,128,0.1)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.4 }} axisLine={false} tickLine={false} dy={4} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.4 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip content={<ChartTooltip />} />
              <Area dataKey="net" stroke={BLUE} fill="url(#ledger-net-fill)" strokeWidth={2} dot={false} isAnimationActive animationDuration={600} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Inflow vs Outflow */}
      <div className="cmd-card p-4" style={{ borderRadius: 18 }}>
        <h3 className="text-xs font-semibold mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          {inflowLabel} vs {outflowLabel}
        </h3>
        <div style={{ height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="rgba(128,128,128,0.1)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.4 }} axisLine={false} tickLine={false} dy={4} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: 'currentColor', opacity: 0.4 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(128,128,128,0.05)' }} />
              <Bar dataKey="in" fill={GREEN} radius={[3, 3, 0, 0]} maxBarSize={16} isAnimationActive animationDuration={600} />
              <Bar dataKey="out" fill={RED} radius={[3, 3, 0, 0]} maxBarSize={16} isAnimationActive animationDuration={600} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-green-500" /> {inflowLabel}
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-red-500" /> {outflowLabel}
          </span>
        </div>
      </div>
    </div>
  );
}