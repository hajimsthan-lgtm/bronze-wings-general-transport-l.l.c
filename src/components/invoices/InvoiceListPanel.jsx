import { formatCurrency, formatDate } from '@/lib/formatters';

const STATUS = {
  draft: { label: 'Unsent', cls: 'bg-slate-100 text-slate-500' },
  sent: { label: 'Viewed', cls: 'bg-blue-100 text-blue-600' },
  paid: { label: 'Paid', cls: 'bg-[#A6FF00]/20 text-[#5c8a00]' },
  overdue: { label: 'Overdue', cls: 'bg-red-100 text-red-600' },
  partially_paid: { label: 'Partial', cls: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Cancelled', cls: 'bg-slate-200 text-slate-500' },
};

function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function InvoiceListPanel({ invoices, selectedId, onSelect }) {
  return (
    <div className="space-y-1">
      {invoices.map(inv => {
        const st = STATUS[inv.status] || STATUS.draft;
        const active = inv.id === selectedId;
        return (
          <button
            key={inv.id}
            onClick={() => onSelect(inv.id)}
            className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-colors ${
              active ? 'bg-slate-100 ring-1 ring-[#A6FF00]/40' : 'hover:bg-slate-50'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-semibold shrink-0">
              {initials(inv.client_name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                #{inv.invoice_number || inv.id.slice(-6)}
              </p>
              <p className="text-xs text-slate-400 truncate">
                Due {formatDate(inv.due_date)} · {inv.client_name}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${st.cls}`}>
              {st.label}
            </span>
            <span className="text-sm font-bold text-slate-800 w-24 text-right shrink-0">
              {formatCurrency(inv.total_amount || 0)}
            </span>
          </button>
        );
      })}
    </div>
  );
}