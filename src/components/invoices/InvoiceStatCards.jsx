import { AlertCircle, CalendarClock, Clock, TrendingUp } from 'lucide-react';
import KpiCard from '@/components/common/KpiCard';
import Sparkline from '@/components/reports/Sparkline';
import { formatCurrency } from '@/lib/formatters';
import { deriveStatus, isOverdue } from '@/lib/invoiceWorkflow';

export default function InvoiceStatCards({ invoices }) {
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  // 1. Overdue (derived flag, not stored status)
  const overdue = invoices.filter(i => isOverdue(i));
  const overdueTotal = overdue.reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);

  // 2. Due within next 30 days (unpaid, not overdue)
  const dueSoon = invoices.filter(i => {
    const s = deriveStatus(i);
    if (i.voided || s === 'paid' || s === 'cancelled' || isOverdue(i)) return false;
    if (!i.due_date || i.due_date < today || i.due_date > nextMonthStr) return false;
    return true;
  });
  const dueSoonTotal = dueSoon.reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);

  // 3. Average time to get paid (issue_date → signed_date, fallback to today)
  const paidInvoices = invoices.filter(i => deriveStatus(i) === 'paid' && i.issue_date);
  const avgDays = paidInvoices.length > 0
    ? Math.round(paidInvoices.reduce((s, i) => {
        const issue = new Date(i.issue_date);
        const paid = i.signed_date ? new Date(i.signed_date) : new Date();
        return s + Math.max(0, (paid - issue) / 86400000);
      }, 0) / paidInvoices.length)
    : 0;

  // Sparkline: last 6 months of paid amounts
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

  // 4. Total outstanding
  const outstanding = invoices
    .filter(i => { const s = deriveStatus(i); return !i.voided && s !== 'paid' && s !== 'cancelled'; })
    .reduce((s, i) => s + (Number(i.total_amount || 0) - Number(i.paid_amount || 0)), 0);

  // Trend: this month vs last month outstanding
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
  // For outstanding, increase = bad (red), decrease = good (green)
  const trendDir = trendPct != null ? (Number(trendPct) >= 0 ? 'down' : 'up') : null;
  const trendLabel = trendPct != null ? `${Number(trendPct) >= 0 ? '+' : ''}${trendPct}% vs last month` : null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <KpiCard
        icon={AlertCircle}
        title="Overdue"
        value={String(overdue.length)}
        subtitle={overdue.length > 0 ? formatCurrency(overdueTotal) : 'All clear'}
        accent="red"
        trendValue={overdue.length > 0 ? `${overdue.length} invoices` : null}
        trend={overdue.length > 0 ? 'down' : 'up'}
      />
      <KpiCard
        icon={CalendarClock}
        title="Due Next 30 Days"
        value={String(dueSoon.length)}
        subtitle={dueSoon.length > 0 ? formatCurrency(dueSoonTotal) : 'Nothing due'}
        accent="amber"
      />

      {/* Card 3: Avg time to get paid + sparkline */}
      <div className="kpi-card group relative overflow-hidden rounded-2xl p-5">
        <div className="kpi-dots pointer-events-none absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(45,212,191,0.16) 1px, transparent 1px)' }} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,0.35), transparent)' }} />
        <div className="relative">
          <div className="flex items-start justify-between mb-3.5">
            <p className="eyebrow pt-1">Avg Time to Paid</p>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.04]">
              <Clock className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-2xl font-bold tracking-tight tabular-nums font-display text-teal-600">{avgDays}<span className="text-sm font-medium text-muted-foreground ml-1">days</span></p>
              <p className="text-xs text-muted-foreground mt-2">{paidInvoices.length} paid invoices</p>
            </div>
            <Sparkline data={sparkData} color="#2dd4bf" width={80} height={36} />
          </div>
        </div>
      </div>

      <KpiCard
        icon={TrendingUp}
        title="Total Outstanding"
        value={formatCurrency(outstanding)}
        accent="primary"
        trendValue={trendLabel}
        trend={trendDir}
      />
    </div>
  );
}