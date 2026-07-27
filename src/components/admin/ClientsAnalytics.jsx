import { Users, Building2, TrendingUp, FileText, Plus } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ProgressBar from '@/components/reports/ProgressBar';
import TrendChart from '@/components/reports/TrendChart';
import Sparkline from '@/components/reports/Sparkline';
import ExportButtons from '@/components/common/ExportButtons';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function ClientsAnalytics({ clients = [], trips = [], invoices = [], loading }) {
  if (loading && clients.length === 0) return <LoadingSpinner />;

  const revenueMap = {};
  trips.forEach((tt) => { if (tt.client_name) revenueMap[tt.client_name] = (revenueMap[tt.client_name] || 0) + (Number(tt.revenue) || 0); });
  const totalRevenue = Object.values(revenueMap).reduce((a, b) => a + b, 0);
  const active = clients.filter((c) => c.status === 'active').length;
  const outstandingInvs = invoices
    .filter((i) => !['paid', 'cancelled'].includes(i.status))
    .map((i) => ({ ...i, balance: (Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0) }))
    .filter((i) => i.balance > 0.001)
    .sort((a, b) => b.balance - a.balance);
  const outstanding = outstandingInvs.reduce((s, i) => s + i.balance, 0);

  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en', { month: 'short' }) }); }
  const revSeries = months.map((m) => trips.filter((tt) => tt.trip_date && tt.trip_date.startsWith(m.key)).reduce((s, tt) => s + (Number(tt.revenue) || 0), 0));
  const trendData = months.map((m, i) => ({ label: m.label, revenue: revSeries[i] }));

  const topClients = clients.map((c) => ({ name: c.name, revenue: revenueMap[c.name] || 0 })).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ReportStatCard index={0} label="Total Clients" value={clients.length} icon={Users} color="#8b5cf6" />
        <ReportStatCard index={1} label="Active Clients" value={active} icon={Building2} color="#34d399" />
        <ReportStatCard index={2} label="Trip Revenue" value={totalRevenue} format={formatCurrency} icon={TrendingUp} color="#22c55e" extra={<Sparkline data={revSeries} type="bar" color="#22c55e" />} />
        <ReportStatCard index={3} label="Outstanding" value={outstanding} format={formatCurrency} icon={FileText} color="#ef4444" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={4} color="#8b5cf6" title="Top Clients by Revenue">
          {topClients.length === 0 || topClients[0].revenue === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No revenue data yet.</p> : (
            <div className="space-y-3">
              {topClients.map((c) => {
                const pct = totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0;
                return (
                  <div key={c.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate">{c.name}</span>
                      <span className="text-white/80 tabular-nums">{formatCurrency(c.revenue)} · {pct.toFixed(0)}%</span>
                    </div>
                    <ProgressBar pct={pct} color="#8b5cf6" />
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard index={5} color="#ef4444" title="Outstanding Invoices">
          {outstandingInvs.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No outstanding invoices.</p> : (
            <div className="space-y-1">
              {outstandingInvs.slice(0, 6).map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.invoice_number || '—'}</p>
                    <p className="text-[11px] text-muted-foreground">{inv.client_name} · {formatDate(inv.issue_date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-rose-300 tabular-nums">{formatCurrency(inv.balance)}</span>
                </div>
              ))}
            </div>
          )}
        </ReportSectionCard>
      </div>

      <ReportSectionCard index={6} color="#22c55e" title="Revenue Trend" className="mb-4">
        <TrendChart data={trendData} series={[{ key: 'revenue', name: 'Revenue', color: '#22c55e' }]} type="area" height={220} />
      </ReportSectionCard>
    </div>
  );
}