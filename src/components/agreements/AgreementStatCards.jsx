import { FileSignature, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import KpiCard from '@/components/common/KpiCard';

export default function AgreementStatCards({ agreements }) {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  // 1. Active
  const active = agreements.filter(a => a.status === 'active');
  const activeValue = active.reduce((s, a) => s + Number(a.amount || 0), 0);

  // 2. Expiring soon (end_date within 30 days, active)
  const expiring = agreements.filter(a => {
    if (a.status !== 'active') return false;
    if (!a.end_date || a.end_date < today || a.end_date > nextMonthStr) return false;
    return true;
  });

  // 3. Signed (not yet active)
  const signed = agreements.filter(a => a.status === 'signed');

  // 4. Total contract value
  const totalValue = agreements
    .filter(a => a.status === 'active' || a.status === 'signed')
    .reduce((s, a) => s + Number(a.amount || 0), 0);

  // Trend
  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const thisVal = agreements.filter(a => a.start_date?.startsWith(thisMonth)).reduce((s, a) => s + Number(a.amount || 0), 0);
  const lastVal = agreements.filter(a => a.start_date?.startsWith(lastMonth)).reduce((s, a) => s + Number(a.amount || 0), 0);
  const trendPct = lastVal > 0 ? ((thisVal - lastVal) / lastVal * 100).toFixed(1) : null;
  const trendDir = trendPct != null ? (Number(trendPct) >= 0 ? 'up' : 'down') : null;
  const trendLabel = trendPct != null ? `${Number(trendPct) >= 0 ? '+' : ''}${trendPct}% vs last month` : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        icon={FileSignature}
        title="Active"
        value={String(active.length)}
        subtitle={active.length > 0 ? `AED ${activeValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'None active'}
        accent="emerald"
      />
      <KpiCard
        icon={AlertTriangle}
        title="Expiring Soon"
        value={String(expiring.length)}
        subtitle={expiring.length > 0 ? 'Within 30 days' : 'All valid'}
        accent="amber"
      />
      <KpiCard
        icon={Clock}
        title="Signed"
        value={String(signed.length)}
        subtitle={signed.length > 0 ? 'Awaiting activation' : 'None pending'}
        accent="primary"
      />
      <KpiCard
        icon={TrendingUp}
        title="Total Contract Value"
        value={`AED ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        accent="primary"
        trendValue={trendLabel}
        trend={trendDir}
      />
    </div>
  );
}