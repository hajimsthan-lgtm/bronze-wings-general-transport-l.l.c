import { Store, TrendingDown, Layers, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

const ACCENT = '#f59e0b';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-medium text-foreground truncate max-w-[160px]">{label}</p>
      <p className="text-muted-foreground">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

const shortName = (v) => (v && v.length > 10 ? v.slice(0, 10) + '…' : v);

const CAT_COLORS = { fuel: '#3b82f6', maintenance: '#f59e0b', parts: '#a855f7', insurance: '#34d399', other: '#94a3b8' };

export default function VendorsAnalytics({ vendors = [], expenses = [], onSelect }) {
  const spendMap = {};
  expenses.forEach((e) => {
    const n = e.vendor_name;
    if (n) spendMap[n] = (spendMap[n] || 0) + (Number(e.amount) || 0);
  });
  const totalSpend = Object.values(spendMap).reduce((a, b) => a + b, 0);
  const active = vendors.filter((v) => v.status === 'active').length;
  const topVendors = vendors
    .map((v) => ({ name: v.name, spend: spendMap[v.name] || 0 }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 5);

  const catCounts = ['fuel', 'maintenance', 'parts', 'insurance', 'other']
    .map((c) => ({ cat: c, count: vendors.filter((v) => v.category === c).length }))
    .filter((x) => x.count > 0);

  const kpis = [
    { label: 'Total Vendors', value: vendors.length, icon: Store, color: ACCENT },
    { label: 'Active', value: active, icon: Store, color: '#34d399' },
    { label: 'Total Spend', value: formatCurrency(totalSpend), icon: TrendingDown, color: '#ef4444' },
    { label: 'Categories', value: catCounts.length, icon: Layers, color: '#a855f7' },
  ];

  return (
    <div className="detail-header-card p-5 relative overflow-hidden mb-5 animate-fade-in-up" style={{ ['--row-accent']: ACCENT, borderTop: '3px solid #f59e0b' }}>
      <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba(ACCENT, 0.6)} 0%, transparent 70%)` }} />
      <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full pointer-events-none opacity-15" style={{ background: `radial-gradient(circle, ${hexToRgba('#a855f7', 0.6)} 0%, transparent 70%)` }} />

      <div className="relative flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: hexToRgba(ACCENT, 0.16), border: `1px solid ${hexToRgba(ACCENT, 0.35)}` }}>
            <Store className="w-5 h-5" style={{ color: ACCENT }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground font-display">Vendors Portal</h2>
            <p className="text-xs text-muted-foreground">Spend analytics & vendor insights</p>
          </div>
        </div>
        <Select onValueChange={(id) => onSelect?.(id)}>
          <SelectTrigger className="w-[240px] h-9 bg-white/5 border-white/10 text-foreground">
            <SelectValue placeholder="Select a vendor to view…" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl p-3.5 border border-white/[0.06]" style={{ background: hexToRgba(k.color, 0.06) }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: hexToRgba(k.color, 0.14), border: `1px solid ${hexToRgba(k.color, 0.3)}` }}>
                <k.icon className="w-3.5 h-3.5" style={{ color: k.color }} />
              </span>
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums truncate">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] p-4" style={{ background: hexToRgba('#ffffff', 0.03) }}>
          <p className="text-xs font-semibold text-foreground mb-3">Top Vendors by Spend</p>
          {topVendors.length === 0 || topVendors[0].spend === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No spend data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topVendors} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#a0a5b8' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} tickFormatter={shortName} />
                <YAxis tick={{ fontSize: 10, fill: '#a0a5b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(245,158,11,0.08)' }} />
                <Bar dataKey="spend" radius={[6, 6, 0, 0]}>
                  {topVendors.map((_, i) => <Cell key={i} fill={i === 0 ? ACCENT : hexToRgba(ACCENT, 0.4)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-xl border border-white/[0.06] p-4" style={{ background: hexToRgba('#ffffff', 0.03) }}>
          <p className="text-xs font-semibold text-foreground mb-3">By Category</p>
          {catCounts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center">No vendors yet.</p>
          ) : (
            <div className="space-y-2.5">
              {catCounts.map((c) => {
                const pct = vendors.length ? (c.count / vendors.length) * 100 : 0;
                const col = CAT_COLORS[c.cat] || '#94a3b8';
                return (
                  <div key={c.cat}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground capitalize">{c.cat}</span>
                      <span className="text-foreground font-medium">{c.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: col, boxShadow: `0 0 8px ${hexToRgba(col, 0.5)}` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}