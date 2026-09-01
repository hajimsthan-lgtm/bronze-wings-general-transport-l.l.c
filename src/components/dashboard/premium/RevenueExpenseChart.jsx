import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import PremiumCard from './PremiumCard';
import { formatCurrency } from '@/lib/formatters';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3.5 py-2.5 space-y-1"
      style={{
        background: 'rgba(var(--surf-2-rgb),0.96)',
        border: '1px solid rgba(var(--panel-accent-rgb),0.25)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
          <span className="text-[11px] text-white/60 capitalize">{p.dataKey}</span>
          <span className="text-sm font-bold text-white tabular-nums ml-auto">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function RevenueExpenseChart({ trips = [], expenses = [] }) {
  const data = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('en', { month: 'short' }),
        revenue: 0,
        expenses: 0,
      });
    }
    const map = Object.fromEntries(months.map((m) => [m.key, m]));

    trips.forEach((t) => {
      if (!t.trip_date) return;
      const key = t.trip_date.slice(0, 7);
      if (map[key]) map[key].revenue += Number(t.revenue) || 0;
    });

    expenses.forEach((e) => {
      if (!e.date) return;
      const key = e.date.slice(0, 7);
      if (map[key]) map[key].expenses += Number(e.total_with_vat) || Number(e.amount) || 0;
    });

    return months.map((m) => ({
      ...m,
      revenue: Math.round(m.revenue * 100) / 100,
      expenses: Math.round(m.expenses * 100) / 100,
    }));
  }, [trips, expenses]);

  const totalRev = data.reduce((s, d) => s + d.revenue, 0);
  const totalExp = data.reduce((s, d) => s + d.expenses, 0);
  const net = totalRev - totalExp;

  return (
    <PremiumCard>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Revenue vs Expenses</h3>
          <p className="text-[11px] text-white/40 mt-0.5">Monthly transport revenue compared to operational costs</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-white/40 font-semibold">Net</p>
            <p className={`text-sm font-bold tabular-nums ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(net)}
            </p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }} barGap={4} barCategoryGap="22%">
          <defs>
            <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--panel-accent-rgb))" stopOpacity={0.95} />
              <stop offset="100%" stopColor="rgb(var(--panel-accent-rgb))" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="expBar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.5} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="rgba(255,255,255,0.35)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.35)"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}K` : v)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            iconType="circle"
            formatter={(v) => <span className="text-white/60 capitalize">{v}</span>}
          />
          <Bar dataKey="revenue" fill="url(#revBar)" radius={[5, 5, 0, 0]} maxBarSize={36} isAnimationActive animationDuration={800} />
          <Bar dataKey="expenses" fill="url(#expBar)" radius={[5, 5, 0, 0]} maxBarSize={36} isAnimationActive animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </PremiumCard>
  );
}