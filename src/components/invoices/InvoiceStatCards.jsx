import { AlertCircle, CalendarClock, Clock, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import ReportStatCard from '@/components/reports/ReportStatCard';
import Sparkline from '@/components/reports/Sparkline';
import { formatCurrency } from '@/lib/formatters';
import { deriveStatus, isOverdue } from '@/lib/invoiceWorkflow';

export default function InvoiceStatCards({ invoices }) {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  const overdue = invoices.filter(i => isOverdue(i));
  const overdueTotal = overdue.reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);

  const dueSoon = invoices.filter(i => {
    const s = deriveStatus(i);
    if (i.voided || s === 'paid' || s === 'cancelled' || isOverdue(i)) return false;
    if (!i.due_date || i.due_date < today || i.due_date > nextMonthStr) return false;
    return true;
  });
  const dueSoonTotal = dueSoon.reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);

  const paidInvoices = invoices.filter(i => deriveStatus(i) === 'paid' && i.issue_date);
  const avgDays = paidInvoices.length > 0
    ? Math.round(paidInvoices.reduce((s, i) => {
        const issue = new Date(i.issue_date);
        const paid = i.signed_date ? new Date(i.signed_date) : new Date();
        return s + Math.max(0, (paid - issue) / 86400000);
      }, 0) / paidInvoices.length)
    : 0;

  const sparkData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthPaid = invoices
      .filter(inv => deriveStatus(inv) === 'paid' && inv.issue_date?.startsWith(key))
      .reduce((s, inv) => s + Number(inv.paid_amount || 0), 0);
    sparkData.push(monthPaid);
  }

  const outstanding = invoices
    .filter(i => { const s = deriveStatus(i); return !i.voided && s !== 'paid' && s !== 'cancelled'; })
    .reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonthDate = new Date();
  lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
  const lastMonth = lastMonthDate.toISOString().slice(0, 7);
  const thisOut = invoices
    .filter(i => { const s = deriveStatus(i); return !i.voided && s !== 'paid' && s !== 'cancelled' && i.issue_date?.startsWith(thisMonth); })
    .reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);
  const lastOut = invoices
    .filter(i => { const s = deriveStatus(i); return !i.voided && s !== 'paid' && s !== 'cancelled' && i.issue_date?.startsWith(lastMonth); })
    .reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);
  const trendPct = lastOut > 0 ? ((thisOut - lastOut) / lastOut * 100).toFixed(1) : null;
  const trendUp = trendPct != null && Number(trendPct) >= 0;

  const TrendExtra = () => trendPct != null ? (
    <div className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: trendUp ? '#ef4444' : '#22c55e' }}>
      {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
      {trendUp ? '+' : ''}{trendPct}% vs last month
    </div>
  ) : null;

  const Subtitle = ({ children }) => (
    <div className="text-[11px] text-muted-foreground truncate">{children}</div>
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <ReportStatCard index={1} label="Overdue" value={overdue.length} icon={AlertCircle} color="#ef4444"
        extra={overdue.length > 0 ? <Subtitle>{formatCurrency(overdueTotal)}</Subtitle> : <Subtitle>All clear</Subtitle>} />
      <ReportStatCard index={2} label="Due Next 30 Days" value={dueSoon.length} icon={CalendarClock} color="#f59e0b"
        extra={dueSoon.length > 0 ? <Subtitle>{formatCurrency(dueSoonTotal)}</Subtitle> : <Subtitle>Nothing due</Subtitle>} />
      <ReportStatCard index={3} label="Avg Time to Paid" value={avgDays} format={(v) => `${Math.round(v)}`} icon={Clock} color="#14b8a6"
        extra={<div className="flex items-end justify-between gap-2"><Subtitle>{paidInvoices.length} paid invoices</Subtitle><Sparkline data={sparkData} color="#14b8a6" width={80} height={32} /></div>} />
      <ReportStatCard index={4} label="Total Outstanding" value={outstanding} format={formatCurrency} icon={TrendingUp} color="#00f2c3"
        extra={<TrendExtra />} />
    </div>
  );
}