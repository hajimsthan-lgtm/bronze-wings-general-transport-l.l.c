import { useMemo } from 'react';
import { formatCurrency } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import InvoiceAgingStrip, { getAgingBuckets } from '@/components/invoices/InvoiceAgingStrip';
import { FileText, CheckCircle2, AlertTriangle, Wallet, TrendingUp, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts';

const STATUS_COLORS = {
  paid: '#34d399',
  sent: '#3b82f6',
  draft: '#fbbf24',
  partially_paid: '#f97316',
  overdue: '#f87171',
  cancelled: '#94a3b8',
};

export default function InvoiceAnalytics({ invoices, clients }) {
  const { t } = useI18n();

  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
    const collected = invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
    const outstanding = invoices
      .filter((i) => !['paid', 'cancelled'].includes(i.status))
      .reduce((s, i) => s + ((Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0)), 0);
    const overdue = invoices
      .filter((i) => i.status === 'overdue')
      .reduce((s, i) => s + ((Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0)), 0);
    const draftCount = invoices.filter((i) => i.status === 'draft').length;
    const collectionRate = totalInvoiced > 0 ? Math.round((collected / totalInvoiced) * 100) : 0;
    return { totalInvoiced, collected, outstanding, overdue, draftCount, collectionRate };
  }, [invoices]);

  const statusData = useMemo(() => {
    const groups = {};
    invoices.forEach((inv) => {
      const k = inv.status || 'draft';
      if (!groups[k]) groups[k] = { name: k, value: 0, count: 0 };
      groups[k].value += Number(inv.total_amount) || 0;
      groups[k].count += 1;
    });
    return Object.values(groups).map((g) => ({ ...g, color: STATUS_COLORS[g.name] || '#94a3b8' }));
  }, [invoices]);

  const topClients = useMemo(() => {
    const byClient = {};
    invoices.forEach((inv) => {
      const n = inv.client_name || 'Unknown';
      if (!byClient[n]) byClient[n] = { name: n, outstanding: 0, total: 0, count: 0 };
      byClient[n].total += Number(inv.total_amount) || 0;
      byClient[n].outstanding += !['paid', 'cancelled'].includes(inv.status) ? (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0) : 0;
      byClient[n].count += 1;
    });
    return Object.values(byClient).sort((a, b) => b.outstanding - a.outstanding).slice(0, 6);
  }, [invoices]);

  const monthlyTrend = useMemo(() => {
    const byMonth = {};
    invoices.forEach((inv) => {
      if (!inv.issue_date) return;
      const d = new Date(inv.issue_date + 'T00:00');
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byMonth[key]) byMonth[key] = { month: key, invoiced: 0, paid: 0 };
      byMonth[key].invoiced += Number(inv.total_amount) || 0;
      if (inv.status === 'paid') byMonth[key].paid += Number(inv.total_amount) || 0;
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }, [invoices]);

  const kpis = [
    { label: 'Total Invoiced', value: formatCurrency(stats.totalInvoiced), icon: FileText, color: '#3b82f6' },
    { label: 'Collected', value: formatCurrency(stats.collected), sub: `${stats.collectionRate}% rate`, icon: CheckCircle2, color: '#34d399' },
    { label: 'Outstanding', value: formatCurrency(stats.outstanding), icon: Wallet, color: '#fbbf24' },
    { label: 'Overdue', value: formatCurrency(stats.overdue), icon: AlertTriangle, color: '#f87171' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => {
          const KIcon = k.icon;
          return (
            <div key={k.label} className="kpi-card p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}18`, border: `1px solid ${k.color}40` }}>
                  <KIcon className="w-4 h-4" style={{ color: k.color }} />
                </div>
                {k.sub && <span className="text-[10px] font-mono text-muted-foreground">{k.sub}</span>}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{k.label}</p>
              <p className="text-xl font-bold text-foreground tabular-nums font-display mt-0.5">{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Aging + status donut */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Monthly Trend</p>
          </div>
          {monthlyTrend.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                  formatter={(v) => formatCurrency(v)}
                />
                <Bar dataKey="invoiced" fill="rgb(var(--panel-accent-rgb))" radius={[4, 4, 0, 0]} name="Invoiced" />
                <Bar dataKey="paid" fill="#34d399" radius={[4, 4, 0, 0]} name="Collected" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="glass-card p-4">
          <p className="text-sm font-semibold text-foreground mb-3">Status Breakdown</p>
          {statusData.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No invoices</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={2}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="flex-1 capitalize text-muted-foreground">{s.name.replace(/_/g, ' ')}</span>
                    <span className="font-mono tabular-nums text-foreground">{formatCurrency(s.value)}</span>
                    <span className="text-muted-foreground/60 text-[10px]">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Aging strip */}
      {invoices.length > 0 && (
        <div className="glass-card p-4">
          <InvoiceAgingStrip invoices={invoices} />
        </div>
      )}

      {/* Top clients by outstanding */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Top Clients by Outstanding</p>
        </div>
        {topClients.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No outstanding invoices</p>
        ) : (
          <div className="space-y-1.5">
            {topClients.map((c) => {
              const max = topClients[0].outstanding || 1;
              const pct = Math.max(2, (c.outstanding / max) * 100);
              return (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground truncate w-32 flex-shrink-0">{c.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.outstanding > 0 ? 'linear-gradient(90deg, #fbbf24, #f87171)' : '#34d399' }} />
                  </div>
                  <span className="text-xs font-mono tabular-nums text-foreground w-24 text-right flex-shrink-0">{formatCurrency(c.outstanding)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}