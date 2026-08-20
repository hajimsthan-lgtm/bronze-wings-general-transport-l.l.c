import { Search, FileText, ChevronDown, PenLine, FileSignature, Send, CreditCard, AlertCircle, Bell } from 'lucide-react';
import { getInitials } from '@/lib/formatters';
import EmptyState from '@/components/common/EmptyState';
import InvoiceActionsMenu from '@/components/invoices/InvoiceActionsMenu';
import { deriveStatus, isOverdue, STATUS_LABELS, STATUS_PILLS, STATUS_DOTS, getAvailableActions } from '@/lib/invoiceWorkflow';

function daysUntilDue(dueDate) {
  if (!dueDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diff = Math.ceil((due - today) / 86400000);
  return diff;
}

function dueLabel(inv) {
  const status = deriveStatus(inv);
  if (status === 'paid') return 'Paid';
  if (status === 'cancelled') return 'Cancelled';
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
  onAction,
}) {
  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'draft', label: 'Draft', count: counts.draft },
    { key: 'unsigned', label: 'Waiting for Sign', count: counts.unsigned, icon: PenLine },
    { key: 'signed', label: 'Signed', count: counts.signed, icon: FileSignature },
    { key: 'unpaid', label: 'Unpaid', count: counts.unpaid },
    { key: 'paid', label: 'Paid', count: counts.paid },
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
            <span className="flex items-center gap-1">
              {t.icon && <t.icon className="w-3 h-3" />}
              {t.label}
            </span>
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
              const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
              const status = deriveStatus(inv);
              const overdue = isOverdue(inv);
              const isSelected = selectedId === inv.id;
              const isChecked = selectedSet?.has(inv.id);
              const actions = getAvailableActions(inv);

              // Next-action hint: unsigned for 5+ days
              let idleDays = 0;
              if (status === 'unsigned' && inv.sent_for_signature_date) {
                idleDays = Math.floor((new Date() - new Date(inv.sent_for_signature_date)) / 86400000);
              }

              return (
                <div
                  key={inv.id}
                  onClick={() => onSelect(inv.id)}
                  style={{ gridTemplateColumns: 'auto auto 1fr minmax(90px, auto) 32px' }}
                  className={`relative grid items-start gap-2.5 px-3 py-3 cursor-pointer transition-all duration-200 group ${
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
                    className="w-3.5 h-3.5 mt-1 rounded accent-primary cursor-pointer flex-shrink-0"
                  />

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {getInitials(inv.client_name)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{inv.invoice_number || '—'}</span>
                      {/* Status badge with overdue flag */}
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${STATUS_PILLS[status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status]}`} />
                        {STATUS_LABELS[status]}
                      </span>
                      {overdue && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border bg-red-500/15 text-red-400 border-red-500/20" title="Overdue — past due date with balance remaining">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Overdue
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onClientClick?.(inv.client_name); }}
                      className="text-sm font-semibold text-foreground truncate block hover:text-primary transition-colors text-left"
                    >
                      {inv.client_name || '—'}
                    </button>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] ${overdue ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>{dueLabel(inv)}</span>
                      {/* Next-action hint */}
                      {idleDays >= 5 && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500/80 font-medium">
                          <Bell className="w-2.5 h-2.5" />
                          Follow up? ({idleDays}d idle)
                        </span>
                      )}
                    </div>
                    {/* Payment progress indicator */}
                    {paid > 0 && status !== 'paid' && status !== 'cancelled' && (
                      <div className="mt-1.5">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
                          <span className="tabular-nums">AED {paid.toFixed(0)} of AED {total.toFixed(0)}</span>
                          <span className="tabular-nums">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-emerald-500/70 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                    {/* Quick action icons on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                      {actions.sendForSignature && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onAction('sendForSignature', inv); }}
                          className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Send for Signature"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      )}
                      {actions.attachSigned && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onAction('attachSigned', inv); }}
                          className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          title="Attach Signed Copy"
                        >
                          <FileSignature className="w-3 h-3" />
                        </button>
                      )}
                      {actions.recordPayment && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onAction('recordPayment', inv); }}
                          className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Record Payment"
                        >
                          <CreditCard className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right mt-0.5">
                    <p className="text-sm font-bold tabular-nums text-foreground">
                      {balance > 0 && status !== 'paid' && status !== 'cancelled'
                        ? formatCurrencyShort(balance)
                        : formatCurrencyShort(total)}
                    </p>
                    {balance > 0 && status !== 'paid' && status !== 'cancelled' && (
                      <p className="text-[10px] text-muted-foreground tabular-nums">of {formatCurrencyShort(total)}</p>
                    )}
                  </div>

                  {/* Actions menu */}
                  <InvoiceActionsMenu inv={inv} onAction={onAction} />
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