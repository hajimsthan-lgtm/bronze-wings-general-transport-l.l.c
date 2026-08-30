import { Link } from 'react-router-dom';
import { Truck, FileText, Receipt, CreditCard, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MobileActivityFeed({ trips, invoices, expenses, clientPayments }) {
  const events = [
    ...trips.filter((t) => t.status === 'completed').map((t) => ({
      id: 't' + t.id, icon: Truck, color: '#fb923c',
      label: `Trip ${t.trip_number || t.to_location || 'completed'}`,
      sub: 'Trip completed',
      time: t.created_date, amt: null,
    })),
    ...invoices.filter((i) => i.status === 'paid').map((i) => ({
      id: 'i' + i.id, icon: FileText, color: '#22c55e',
      label: `Invoice ${i.invoice_number || ''}`,
      sub: 'Invoice paid',
      time: i.created_date, amt: Number(i.total_amount) || 0,
    })),
    ...expenses.map((e) => ({
      id: 'e' + e.id, icon: Receipt, color: '#f97316',
      label: e.description || e.category || 'Expense',
      sub: 'Expense logged',
      time: e.created_date, amt: Number(e.total_with_vat) || Number(e.amount) || 0,
    })),
    ...clientPayments.map((p) => ({
      id: 'p' + p.id, icon: CreditCard, color: '#06b6d4',
      label: p.description || 'Client Payment',
      sub: 'Payment received',
      time: p.created_date, amt: Number(p.amount) || 0,
    })),
  ]
    .sort((a, b) => (b.time || '').localeCompare(a.time || ''))
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[14px] font-bold text-foreground">Recent Activity</p>
      </div>
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(var(--surf-1-rgb),0.60) 0%, rgba(var(--surf-2-rgb),0.70) 100%)',
          border: '1px solid rgba(var(--panel-accent-rgb),0.10)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {events.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[12px] text-muted-foreground">No recent activity</p>
          </div>
        ) : events.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <div
              key={ev.id}
              className={`flex items-center gap-3 px-3.5 py-3 ${i < events.length - 1 ? 'border-b border-border/40' : ''}`}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${ev.color}1f`, border: `1px solid ${ev.color}3a` }}
              >
                <Icon className="w-4 h-4" style={{ color: ev.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">{ev.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ev.sub} · {timeAgo(ev.time)}</p>
              </div>
              {ev.amt !== null && (
                <p className="text-[12px] font-bold tabular-nums shrink-0" style={{ color: ev.color }}>
                  {ev.amt >= 0 ? '+' : '−'}{formatCurrency(Math.abs(ev.amt))}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}