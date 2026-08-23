import { Wallet, Receipt, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import DonutChart from '@/components/reports/DonutChart';
import TrendChart from '@/components/reports/TrendChart';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDateShort } from '@/lib/formatters';
import { categoryColors } from '@/components/expenses/expenseMeta';

export default function ExpensesAnalytics({ expenses = [], loading, onBrowse }) {
  if (loading && expenses.length === 0) return <LoadingSpinner />;

  const totalAmount = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;
  const approvedCount = expenses.filter((e) => e.status === 'approved').length;

  // Category donut
  const catMap = {};
  expenses.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + (e.amount || 0); });
  const donutData = Object.entries(catMap)
    .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, color: categoryColors[name] || '#94a3b8' }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  // Daily trend (last 30 days max)
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  const trendData = days.map((d) => ({
    label: formatDateShort(d),
    amount: expenses.filter((e) => e.date === d).reduce((s, e) => s + (e.amount || 0), 0),
  }));

  // Top vendors by spend
  const vendorMap = {};
  expenses.forEach((e) => { if (e.vendor_name) vendorMap[e.vendor_name] = (vendorMap[e.vendor_name] || 0) + (e.amount || 0); });
  const topVendors = Object.entries(vendorMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const maxVendor = Math.max(1, ...topVendors.map((v) => v.value));

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <ReportStatCard index={1} label="Total Spend" value={totalAmount} format={formatCurrency} icon={Wallet} color="#f97316" onClick={onBrowse} />
        <ReportStatCard index={2} label="Expenses" value={expenses.length} icon={Receipt} color="#00f2c3" onClick={onBrowse} />
        <ReportStatCard index={3} label="Pending" value={pendingCount} icon={Clock} color="#f59e0b" onClick={onBrowse} />
        <ReportStatCard index={4} label="Approved" value={approvedCount} icon={CheckCircle2} color="#22c55e" onClick={onBrowse} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={5} color="#a855f7" title="Expense Categories"
          action={<button onClick={onBrowse} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
          {donutData.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No data yet.</p> : (
            <div className="flex items-center gap-6 flex-wrap">
              <DonutChart data={donutData} total={formatCurrency(donutTotal)} height={180} />
              <div className="space-y-2 flex-1 min-w-[140px]">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-white/70 capitalize">{d.name}</span>
                    <span className="text-xs font-semibold text-white ml-auto tabular-nums">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard index={6} color="#f97316" title="Expense Trend (30 days)">
          <TrendChart data={trendData} series={[{ key: 'amount', name: 'Amount', color: '#f97316' }]} type="area" height={220} />
        </ReportSectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ReportSectionCard index={7} color="#1ED760" title="Top Vendors by Spend"
          action={<button onClick={onBrowse} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
          {topVendors.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No vendor data yet.</p> : (
            <div className="space-y-3">
              {topVendors.map((v) => {
                const pct = maxVendor > 0 ? (v.value / maxVendor) * 100 : 0;
                return (
                  <div key={v.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate">{v.name}</span>
                      <span className="text-white/80 tabular-nums">{formatCurrency(v.value)}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: '#1ED760', boxShadow: '0 0 6px rgba(30,215,96,0.5)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard index={8} color="#34d399" title="Recent Expenses">
          {expenses.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No records yet.</p> : (
            <div className="space-y-1">
              {[...expenses].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6).map((e) => (
                <div key={e.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.02] rounded-lg px-1 transition-colors" onClick={onBrowse}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(categoryColors[e.category] || '#94a3b8', 0.12), border: `1px solid ${hexToRgba(categoryColors[e.category] || '#94a3b8', 0.3)}` }}>
                    <Receipt className="w-4 h-4" style={{ color: categoryColors[e.category] || '#94a3b8' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.description || e.category}</p>
                    <p className="text-[11px] text-muted-foreground">{e.vendor_name || '—'} · {formatDateShort(e.date)}</p>
                  </div>
                  <span className="text-xs font-semibold text-white tabular-nums">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </ReportSectionCard>
      </div>
    </div>
  );
}

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(148,163,184,${alpha})`;
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}