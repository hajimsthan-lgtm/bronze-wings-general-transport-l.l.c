import { FileSignature, Clock, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import { formatCurrency } from '@/lib/formatters';

export default function AgreementStatCards({ agreements }) {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  const active = agreements.filter(a => a.status === 'active');
  const activeValue = active.reduce((s, a) => s + Number(a.amount || 0), 0);

  const expiring = agreements.filter(a => {
    if (a.status !== 'active') return false;
    if (!a.end_date || a.end_date < today || a.end_date > nextMonthStr) return false;
    return true;
  });

  const signed = agreements.filter(a => a.status === 'signed');

  const totalValue = agreements
    .filter(a => a.status === 'active' || a.status === 'signed')
    .reduce((s, a) => s + Number(a.amount || 0), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const thisVal = agreements.filter(a => a.start_date?.startsWith(thisMonth)).reduce((s, a) => s + Number(a.amount || 0), 0);
  const lastVal = agreements.filter(a => a.start_date?.startsWith(lastMonth)).reduce((s, a) => s + Number(a.amount || 0), 0);
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
      <ReportStatCard index={1} label="Active" value={active.length} icon={FileSignature} color="#22c55e"
        extra={active.length > 0 ? <Subtitle>{formatCurrency(activeValue)}</Subtitle> : <Subtitle>None active</Subtitle>} />
      <ReportStatCard index={2} label="Expiring Soon" value={expiring.length} icon={AlertTriangle} color="#f59e0b"
        extra={<Subtitle>{expiring.length > 0 ? 'Within 30 days' : 'All valid'}</Subtitle>} />
      <ReportStatCard index={3} label="Signed" value={signed.length} icon={Clock} color="#00f2c3"
        extra={<Subtitle>{signed.length > 0 ? 'Awaiting activation' : 'None pending'}</Subtitle>} />
      <ReportStatCard index={4} label="Total Contract Value" value={totalValue} format={formatCurrency} icon={TrendingUp} color="#a855f7"
        extra={<TrendExtra />} />
    </div>
  );
}