import { Users, TrendingUp, FileText, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/formatters';
import { hexToRgba } from '@/components/reports/ReportStatCard';

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

export default function ClientsAnalytics({ clients = [], trips = [], invoices = [], onSelect }) {
  const revenueMap = {};
  trips.forEach((tt) => {
    const n = tt.client_name;
    if (n) revenueMap[n] = (revenueMap[n] || 0) + (Number(tt.revenue) || 0);
  });
  const outstanding = invoices
    .filter((i) => !['paid', 'cancelled'].includes(i.status))
    .reduce((s, i) => s + Math.max(0, (Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0)), 0);
  const totalRevenue = Object.values(revenueMap).reduce((a, b) => a + b, 0);
  const active = clients.filter((c) => c.status === 'active').length;
  const topClients = clients
    .map((c) => ({ name: c.name, revenue: revenueMap[c.name] || 0 }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const kpis = [
    { label: 'Total Clients', value: clients.length, icon: Users, color: '#8b5cf6' },
    { label: 'Active', value: active, icon: Building2, color: '#34d399' },
    { label: 'Trip Revenue', value: formatCurrency(totalRevenue), icon: TrendingUp, color: '#3b82f6' },
    { label: 'Outstanding', value: formatCurrency(outstanding), icon: FileText, color: '#f59e0b' },
  ];

  return (
    <div className="detail-header-card p-5 relative overflow-hidden mb-5 animate-fade-in-up">
      <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba('#8b5cf6', 0.6)} 0%, transparent 70%)` }} />
      <div className="absolute -bottom-20 -left-10 w-48 h-48 rounded-full pointer-events-none opacity-15" style={{ background: `radial-gradient(circle, ${hexToRgba('#3b82f6', 0.6)} 0%, transparent 70%)` }} />

      <div className="relative flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: hexToRgba('#8b5cf6', 0.16), border: `1px solid ${hexToRgba('#8b5cf6', 0.35)}` }}>
            <Building2 className="w-5 h-5" style={{ color: '#8b5cf6' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground font-display">Clients Portal</h2>
            <p className="text-xs text-muted-foreground">Analytics overview & client insights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={(id) => onSelect?.(id)}>
            <SelectTrigger className="w-[240px] h-9 bg-white/5 border-white/10 text-foreground">
              <SelectValue placeholder="Select a client to view…" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
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

      <div className="relative rounded-xl border border-white/[0.06] p-4" style={{ background: hexToRgba('#ffffff', 0.03) }}>
        <p className="text-xs font-semibold text-foreground mb-3">Top Clients by Revenue</p>
        {topClients.length === 0 || topClients[0].revenue === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No revenue data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topClients} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#a0a5b8' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} tickFormatter={shortName} />
              <YAxis tick={{ fontSize: 10, fill: '#a0a5b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {topClients.map((_, i) => <Cell key={i} fill={i === 0 ? '#8b5cf6' : hexToRgba('#8b5cf6', 0.4)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}