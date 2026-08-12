import { Clock, AlertTriangle, Calendar, Hourglass } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

const BUCKETS = [
  { key: 'current', label: 'Current', color: '#34d399', Icon: Calendar, desc: 'Not yet due' },
  { key: 'd30', label: '1–30', color: '#4ADE80', Icon: Clock, desc: 'Days overdue' },
  { key: 'd60', label: '31–60', color: '#fbbf24', Icon: Hourglass, desc: 'Days overdue' },
  { key: 'd90', label: '61–90', color: '#f97316', Icon: AlertTriangle, desc: 'Days overdue' },
  { key: 'd90p', label: '90+', color: '#f87171', Icon: AlertTriangle, desc: 'Days overdue' },
];

export function getAgingBuckets(invoices) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = { current: [], d30: [], d60: [], d90: [], d90p: [] };
  (invoices || []).forEach((inv) => {
    const balance = (Number(inv.total_amount) || 0) - (Number(inv.paid_amount) || 0);
    if (inv.status === 'paid' || balance <= 0.001 || inv.status === 'cancelled') return;
    const due = inv.due_date ? new Date(inv.due_date) : null;
    if (!due) { result.current.push({ inv, balance }); return; }
    const days = Math.ceil((today - due) / 86400000);
    if (days <= 0) result.current.push({ inv, balance, days });
    else if (days <= 30) result.d30.push({ inv, balance, days });
    else if (days <= 60) result.d60.push({ inv, balance, days });
    else if (days <= 90) result.d90.push({ inv, balance, days });
    else result.d90p.push({ inv, balance, days });
  });
  return result;
}

export default function InvoiceAgingStrip({ invoices }) {
  const buckets = getAgingBuckets(invoices);
  const totalOutstanding = Object.values(buckets).flat().reduce((s, e) => s + e.balance, 0);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Hourglass className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice Aging</span>
        </div>
        <span className="text-[11px] font-semibold text-foreground tabular-nums">{formatCurrency(totalOutstanding)} outstanding</span>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {BUCKETS.map((b) => {
          const items = buckets[b.key];
          const amount = items.reduce((s, e) => s + e.balance, 0);
          const active = items.length > 0;
          const BIcon = b.Icon;
          return (
            <div
              key={b.key}
              className="rounded-xl p-2.5 border transition-all"
              style={{
                background: active ? `${b.color}14` : 'rgba(255,255,255,0.02)',
                borderColor: active ? `${b.color}44` : 'rgba(255,255,255,0.06)',
                opacity: active ? 1 : 0.5,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold tabular-nums" style={{ color: b.color }}>{b.label}</span>
                {active && <BIcon className="w-3 h-3" style={{ color: b.color }} />}
              </div>
              <p className="text-xs font-bold text-foreground tabular-nums leading-tight">{formatCurrency(amount)}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">{items.length} {items.length === 1 ? 'inv' : 'invoices'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}