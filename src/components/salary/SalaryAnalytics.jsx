import { Wallet, CheckCircle2, Clock, CreditCard, ArrowRight, Users, TrendingDown } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import DonutChart from '@/components/reports/DonutChart';
import TrendChart from '@/components/reports/TrendChart';
import ProgressBar from '@/components/reports/ProgressBar';
import Sparkline from '@/components/reports/Sparkline';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDateShort } from '@/lib/formatters';

const STATUS_COLORS = { paid: '#22c55e', pending: '#f59e0b', partial: '#3b82f6' };
const MONTH_COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#1ED760', '#f97316', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

export default function SalaryAnalytics({ records = [], drivers = [], loading, onBrowse }) {
  if (loading && records.length === 0) return <LoadingSpinner />;

  const totalPayroll = records.reduce((s, r) => s + (Number(r.net_salary) || 0), 0);
  const totalPaid = records.filter((r) => r.status === 'paid').reduce((s, r) => s + (Number(r.net_salary) || 0), 0);
  const totalPending = records.filter((r) => r.status !== 'paid').reduce((s, r) => s + (Number(r.net_salary) || 0), 0);
  const paidCount = records.filter((r) => r.status === 'paid').length;
  const pendingCount = records.length - paidCount;

  // Status donut
  const statusMap = { paid: 0, pending: 0, partial: 0 };
  records.forEach((r) => { statusMap[r.status] = (statusMap[r.status] || 0) + (Number(r.net_salary) || 0); });
  const donutData = Object.entries(statusMap)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] || '#94a3b8' }));
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  // Monthly trend (last 6 months)
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString('en', { month: 'short' }), year: d.getFullYear(), month: d.toLocaleString('en', { month: 'long' }) });
  }
  const monthlySeries = months.map((m) => records.filter((r) => r.month === m.month && Number(r.year) === m.year).reduce((s, r) => s + (Number(r.net_salary) || 0), 0));
  const trendData = months.map((m, i) => ({ label: m.label, payroll: monthlySeries[i] }));

  // Top earners
  const driverTotals = {};
  records.forEach((r) => { driverTotals[r.driver_name] = (driverTotals[r.driver_name] || 0) + (Number(r.net_salary) || 0); });
  const topEarners = Object.entries(driverTotals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  const maxEarner = Math.max(1, ...topEarners.map((e) => e.value));

  // Payment method breakdown
  const methodMap = {};
  records.forEach((r) => { if (r.payment_method) methodMap[r.payment_method] = (methodMap[r.payment_method] || 0) + (Number(r.net_salary) || 0); });

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <ReportStatCard index={1} label="Total Payroll" value={totalPayroll} format={formatCurrency} icon={Wallet} color="#38BDF8" onClick={onBrowse} />
        <ReportStatCard index={2} label="Paid" value={totalPaid} format={formatCurrency} icon={CheckCircle2} color="#22c55e" onClick={onBrowse} />
        <ReportStatCard index={3} label="Pending" value={totalPending} format={formatCurrency} icon={Clock} color="#f59e0b" onClick={onBrowse} />
        <ReportStatCard index={4} label="Records" value={records.length} icon={CreditCard} color="#a855f7" extra={<Sparkline data={monthlySeries} type="bar" color="#a855f7" />} onClick={onBrowse} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
        <ReportSectionCard index={5} color="#22c55e" title="Payment Status"
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

        <ReportSectionCard index={6} color="#38BDF8" title="Payroll Trend (6 months)">
          <TrendChart data={trendData} series={[{ key: 'payroll', name: 'Payroll', color: '#38BDF8' }]} type="area" height={220} />
        </ReportSectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <ReportSectionCard index={7} color="#a855f7" title="Top Earners"
          action={<button onClick={onBrowse} className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors">View All <ArrowRight className="w-3 h-3" /></button>}>
          {topEarners.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No data yet.</p> : (
            <div className="space-y-3">
              {topEarners.map((e) => {
                const pct = maxEarner > 0 ? (e.value / maxEarner) * 100 : 0;
                return (
                  <div key={e.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-white/70 truncate">{e.name}</span>
                      <span className="text-white/80 tabular-nums">{formatCurrency(e.value)}</span>
                    </div>
                    <ProgressBar pct={pct} color="#a855f7" />
                  </div>
                );
              })}
            </div>
          )}
        </ReportSectionCard>

        <ReportSectionCard index={8} color="#f59e0b" title="Recent Salary Records">
          {records.length === 0 ? <p className="text-xs text-muted-foreground py-6 text-center">No records yet.</p> : (
            <div className="space-y-1">
              {[...records].sort((a, b) => (b.created_date || '').localeCompare(a.created_date || '')).slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.02] rounded-lg px-1 transition-colors" onClick={onBrowse}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${STATUS_COLORS[r.status] || '#94a3b8'}1a`, border: `1px solid ${STATUS_COLORS[r.status] || '#94a3b8'}33` }}>
                    <Wallet className="w-4 h-4" style={{ color: STATUS_COLORS[r.status] || '#94a3b8' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.driver_name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.month} {r.year} · {(r.payment_method || '').replace(/_/g, ' ')}</p>
                  </div>
                  <span className="text-xs font-semibold text-white tabular-nums">{formatCurrency(r.net_salary)}</span>
                </div>
              ))}
            </div>
          )}
        </ReportSectionCard>
      </div>
    </div>
  );
}