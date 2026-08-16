import { Clock, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import KpiCard from '@/components/common/KpiCard';

export default function QuotationStatCards({ quotations }) {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  const computeTotal = (q) => {
    const subtotal = (q.line_items || []).reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const vat = subtotal * (q.vat_rate || 5) / 100;
    return subtotal + vat;
  };

  // 1. Pending (sent, not accepted/rejected/expired)
  const pending = quotations.filter(q => q.status === 'sent');
  const pendingTotal = pending.reduce((s, q) => s + computeTotal(q), 0);

  // 2. Accepted
  const accepted = quotations.filter(q => q.status === 'accepted');
  const acceptedTotal = accepted.reduce((s, q) => s + computeTotal(q), 0);

  // 3. Expiring soon (valid_until within 30 days, not accepted/rejected)
  const expiring = quotations.filter(q => {
    if (['accepted', 'rejected', 'expired'].includes(q.status)) return false;
    if (!q.valid_until || q.valid_until < today || q.valid_until > nextMonthStr) return false;
    return true;
  });

  // 4. Total quoted value
  const totalValue = quotations.reduce((s, q) => s + computeTotal(q), 0);

  // Trend: this month vs last month
  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const thisVal = quotations.filter(q => q.issue_date?.startsWith(thisMonth)).reduce((s, q) => s + computeTotal(q), 0);
  const lastVal = quotations.filter(q => q.issue_date?.startsWith(lastMonth)).reduce((s, q) => s + computeTotal(q), 0);
  const trendPct = lastVal > 0 ? ((thisVal - lastVal) / lastVal * 100).toFixed(1) : null;
  const trendDir = trendPct != null ? (Number(trendPct) >= 0 ? 'up' : 'down') : null;
  const trendLabel = trendPct != null ? `${Number(trendPct) >= 0 ? '+' : ''}${trendPct}% vs last month` : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        icon={Clock}
        title="Pending"
        value={String(pending.length)}
        subtitle={pending.length > 0 ? `AED ${pendingTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'None pending'}
        accent="amber"
        trendValue={pending.length > 0 ? `${pending.length} awaiting` : null}
        trend={pending.length > 0 ? 'down' : 'up'}
      />
      <KpiCard
        icon={CheckCircle2}
        title="Accepted"
        value={String(accepted.length)}
        subtitle={accepted.length > 0 ? `AED ${acceptedTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'None yet'}
        accent="emerald"
      />
      <KpiCard
        icon={AlertTriangle}
        title="Expiring Soon"
        value={String(expiring.length)}
        subtitle={expiring.length > 0 ? 'Within 30 days' : 'All valid'}
        accent="red"
      />
      <KpiCard
        icon={TrendingUp}
        title="Total Quoted Value"
        value={`AED ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
        accent="primary"
        trendValue={trendLabel}
        trend={trendDir}
      />
    </div>
  );
}