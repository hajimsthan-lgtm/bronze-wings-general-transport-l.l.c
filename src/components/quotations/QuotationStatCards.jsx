import { Clock, CheckCircle2, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import { formatCurrency } from '@/lib/formatters';

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

  const pending = quotations.filter(q => q.status === 'sent');
  const pendingTotal = pending.reduce((s, q) => s + computeTotal(q), 0);

  const accepted = quotations.filter(q => q.status === 'accepted');
  const acceptedTotal = accepted.reduce((s, q) => s + computeTotal(q), 0);

  const expiring = quotations.filter(q => {
    if (['accepted', 'rejected', 'expired'].includes(q.status)) return false;
    if (!q.valid_until || q.valid_until < today || q.valid_until > nextMonthStr) return false;
    return true;
  });

  const totalValue = quotations.reduce((s, q) => s + computeTotal(q), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const thisVal = quotations.filter(q => q.issue_date?.startsWith(thisMonth)).reduce((s, q) => s + computeTotal(q), 0);
  const lastVal = quotations.filter(q => q.issue_date?.startsWith(lastMonth)).reduce((s, q) => s + computeTotal(q), 0);
  const trendPct = lastVal > 0 ? ((thisVal - lastVal) / lastVal * 100).toFixed(1) : null;
  const trendUp = trendPct != null && Number(trendPct) >= 0;

  const TrendExtra = () => trendPct != null ? (
    <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: trendUp ? '#22c55e' : '#ef4444' }}>
      {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      {trendUp ? '+' : ''}{trendPct}% vs last month
    </div>
  ) : null;

  const Subtitle = ({ children }) => (
    <div className="text-[11px] text-muted-foreground truncate">{children}</div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <ReportStatCard index={1} label="Pending" value={pending.length} icon={Clock} color="#f59e0b"
        extra={pending.length > 0 ? <Subtitle>{formatCurrency(pendingTotal)}</Subtitle> : <Subtitle>None pending</Subtitle>} />
      <ReportStatCard index={2} label="Accepted" value={accepted.length} icon={CheckCircle2} color="#22c55e"
        extra={accepted.length > 0 ? <Subtitle>{formatCurrency(acceptedTotal)}</Subtitle> : <Subtitle>None yet</Subtitle>} />
      <ReportStatCard index={3} label="Expiring Soon" value={expiring.length} icon={AlertTriangle} color="#ef4444"
        extra={<Subtitle>{expiring.length > 0 ? 'Within 30 days' : 'All valid'}</Subtitle>} />
      <ReportStatCard index={4} label="Total Quoted Value" value={totalValue} format={formatCurrency} icon={TrendingUp} color="#00f2c3"
        extra={<TrendExtra />} />
    </div>
  );
}