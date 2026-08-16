import { Search, FileText } from 'lucide-react';
import { getInitials } from '@/lib/formatters';
import EmptyState from '@/components/common/EmptyState';

const STATUS_PILL = {
  draft: 'bg-muted text-muted-foreground border-border',
  sent: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  partially_paid: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  overdue: 'bg-red-500/15 text-red-400 border-red-500/20',
  cancelled: 'bg-muted/50 text-muted-foreground/60 border-border',
};

const STATUS_LABEL = {
  draft: 'Draft',
  sent: 'Sent',
  partially_paid: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

function daysUntilDue(dueDate) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diff = Math.ceil((due - today) / 86400000);
  return diff;
}

function dueLabel(inv) {
  if (inv.status === 'paid') return 'Paid';
  if (inv.status === 'cancelled') return 'Cancelled';
  const d = daysUntilDue(inv.due_date);
  if (d == null) return 'No due date';
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Due today';
  return `Due in ${d}d`;
}

export default function InvoiceListPane({
  invoices,
  selectedId,
  onSelect,
  tab,
  onTabChange,
  counts,
  search,
  onSearchChange,
  selectedSet,
  onToggleSelect,
  allSelected,
  onToggleSelectAll,
  onClientClick,
}) {
  const tabs = [
    { key: 'all', label: 'All Invoices', count: counts.all },
    { key: 'draft', label: 'Draft', count: counts.draft },
    { key: 'unpaid', label: 'Unpaid', count: counts.unpaid },
  ];

  return (
    <div className="glass-card rounded-2xl flex flex-col h-full min-h-0 overflow-hidden">
      {/* Tab header */}
      <div className="flex items-center gap-1 px-3 pt-3 border-b border-border/40">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            className={`relative px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors rounded-t-lg ${
              tab === t.key
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
            <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
              tab === t.key ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {t.count}
            </span>
            {tab === t.key && (
              <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Search + select all */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
        <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
            className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
          />
        </label>
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search invoices..."
            className="search-2026 w-full pl-8 pr-2 py-1.5 text-xs rounded-lg"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto thin-scroll min-h-0">
        {invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices found"
            description="Try a different filter or search term."
          />
        ) : (
          <div className="divide-y divide-border/30">
            {invoices.map(inv => {
              const total = Number(inv.total_amount || 0);
              const paid = Number(inv.paid_amount || 0);
              const balance = Math.max(0, total - paid);
              const isSelected = selectedId === inv.id;
              const isChecked = selectedSet?.has(inv.id);

              return (
                <div
                  key={inv.id}
                  onClick={() => onSelect(inv.id)}
                  className={`relative flex items-center gap-3 px-3 py-3 cursor-pointer transition-all duration-200 group ${
                    isSelected
                      ? 'bg-primary/10 border-l-2 border-primary'
                      : 'border-l-2 border-transparent hover:bg-muted/30'
                  }`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked || false}
                    onChange={(e) => { e.stopPropagation(); onToggleSelect?.(inv.id, e.target.checked); }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 rounded accent-primary cursor-pointer flex-shrink-0"
                  />

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {getInitials(inv.client_name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{inv.invoice_number || '—'}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${STATUS_PILL[inv.status] || STATUS_PILL.draft}`}>
                        {STATUS_LABEL[inv.status] || inv.status}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onClientClick?.(inv.client_name); }}
                      className="text-sm font-semibold text-foreground truncate block hover:text-primary transition-colors text-left"
                    >
                      {inv.client_name || '—'}
                    </button>
                    <span className="text-[11px] text-muted-foreground">{dueLabel(inv)}</span>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {balance > 0 && inv.status !== 'paid' && inv.status !== 'cancelled'
                        ? formatCurrencyShort(balance)
                        : formatCurrencyShort(total)}
                    </p>
                    {balance > 0 && inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <p className="text-[10px] text-muted-foreground tabular-nums">of {formatCurrencyShort(total)}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function formatCurrencyShort(amount) {
  return `AED ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}