import { Link } from 'react-router-dom';
import {
  FileText, Truck, Wrench, Fuel, Users, CalendarClock,
  ChevronRight, AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

/**
 * "Manage Your Payments" section — horizontal scroll carousel of payment cards.
 * Maps to fleet context: outstanding invoices, vendor payments due, recurring expenses.
 */
export default function MobilePaymentsCarousel({ invoices, vendorTxns, expenses }) {
  // Build payment cards from fleet data
  const cards = [];

  // Outstanding invoices (unpaid / partially paid)
  const unpaidInvoices = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled' && i.status !== 'draft')
    .slice(0, 5);
  unpaidInvoices.forEach((inv) => {
    const remaining = (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0);
    const isOverdue = inv.status === 'overdue' || (inv.due_date && new Date(inv.due_date) < new Date());
    cards.push({
      id: inv.id,
      icon: FileText,
      iconColor: isOverdue ? '#ef4444' : '#f59e0b',
      iconBg: isOverdue ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
      title: inv.client_name || 'Invoice',
      subtitle: inv.invoice_number || '—',
      amount: remaining,
      dueDate: inv.due_date,
      status: isOverdue ? 'Overdue' : inv.status === 'partially_paid' ? 'Partial' : 'Pay now',
      statusColor: isOverdue ? '#ef4444' : inv.status === 'partially_paid' ? '#3b82f6' : '#f59e0b',
      link: '/accounts/invoices',
    });
  });

  // Vendor payments due (unpaid / partially paid)
  const unpaidVendors = vendorTxns
    .filter((v) => v.payment_status === 'unpaid' || v.payment_status === 'partially_paid')
    .slice(0, 4);
  unpaidVendors.forEach((v) => {
    const remaining = (Number(v.amount) || 0) - (Number(v.paid_amount) || 0);
    cards.push({
      id: v.id,
      icon: Truck,
      iconColor: '#f97316',
      iconBg: 'rgba(249,115,22,0.15)',
      title: v.vendor_name || 'Vendor Payment',
      subtitle: v.trip_number || v.description || '—',
      amount: remaining,
      dueDate: v.due_date,
      status: v.payment_status === 'partially_paid' ? 'Partial' : 'Pay now',
      statusColor: v.payment_status === 'partially_paid' ? '#3b82f6' : '#f97316',
      link: '/trips',
    });
  });

  // Upcoming recurring expenses (maintenance, fuel)
  const recurringExpenses = expenses
    .filter((e) => e.status === 'pending' || e.status === 'approved')
    .slice(0, 3);
  recurringExpenses.forEach((e) => {
    const isFuel = e.category === 'fuel';
    const isMaint = e.category === 'maintenance';
    cards.push({
      id: e.id,
      icon: isFuel ? Fuel : isMaint ? Wrench : FileText,
      iconColor: isFuel ? '#10b981' : isMaint ? '#f59e0b' : '#a855f7',
      iconBg: isFuel ? 'rgba(16,185,129,0.15)' : isMaint ? 'rgba(245,158,11,0.15)' : 'rgba(168,85,247,0.15)',
      title: e.vendor_name || e.description || 'Expense',
      subtitle: e.category || '—',
      amount: Number(e.total_with_vat) || Number(e.amount) || 0,
      dueDate: e.date,
      status: e.status === 'approved' ? 'Approved' : 'Pending',
      statusColor: e.status === 'approved' ? '#10b981' : '#f59e0b',
      link: '/expenses',
    });
  });

  if (cards.length === 0) {
    return (
      <div>
        <p className="text-sm font-semibold text-white mb-3">Manage Your Payments</p>
        <div className="glass-card p-5 text-center">
          <CalendarClock className="w-7 h-7 text-white/30 mx-auto mb-2" />
          <p className="text-xs text-white/50">No pending payments</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-white">Manage Your Payments</p>
        <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">{cards.length} pending</span>
      </div>
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              to={card.link}
              className="glass-card p-4 shrink-0 w-44 flex flex-col gap-2 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: card.iconBg, border: `1px solid ${card.iconColor}33` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                </div>
                <span
                  className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${card.statusColor}22`, color: card.statusColor }}
                >
                  {card.status}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{card.title}</p>
                <p className="text-[10px] text-white/45 truncate mt-0.5">{card.subtitle}</p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-white/40 font-semibold">Amount</p>
                  <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(card.amount)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </div>
              {card.dueDate && (
                <p className="text-[9px] text-white/35 flex items-center gap-1 pt-1 border-t border-white/5">
                  <CalendarClock className="w-3 h-3" /> Due {card.dueDate}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}