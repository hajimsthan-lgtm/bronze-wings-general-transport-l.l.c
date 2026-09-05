import { useState } from 'react';
import { Search, FileText, CheckSquare, CheckCircle2, Sparkles, PenLine, FileSignature, Send, CreditCard, AlertCircle, Bell, Pencil, Trash2 } from 'lucide-react';
import { getInitials } from '@/lib/formatters';
import EmptyState from '@/components/common/EmptyState';
import InvoiceActionsMenu from '@/components/invoices/InvoiceActionsMenu';
import { deriveStatus, isOverdue, STATUS_LABELS, STATUS_PILLS, STATUS_DOTS, getAvailableActions } from '@/lib/invoiceWorkflow';
import { useProgressiveRender } from '@/hooks/useProgressiveRender';

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

function RowBody({ inv, onClientClick, onAction, onEdit, onDelete }) {
  const total = Number(inv.total_amount || 0);
  const paid = Number(inv.paid_amount || 0);
  const balance = Math.max(0, total - paid);
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const status = deriveStatus(inv);
  const overdue = isOverdue(inv);
  const actions = getAvailableActions(inv);

  let idleDays = 0;
  if (status === 'unsigned' && inv.sent_for_signature_date) {
    idleDays = Math.floor((new Date() - new Date(inv.sent_for_signature_date)) / 86400000);
  }

  return (
    <div className="flex items-start gap-2.5 min-w-0">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
        {getInitials(inv.client_name)}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-mono text-muted-foreground">{inv.invoice_number || '—'}</span>
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
        <span className="text-sm font-semibold text-foreground truncate block">
          {inv.client_name || '—'}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] ${overdue ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>{dueLabel(inv)}</span>
          {idleDays >= 5 && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-500/80 font-medium">
              <Bell className="w-2.5 h-2.5" />
              Follow up? ({idleDays}d idle)
            </span>
          )}
        </div>
        {paid > 0 && status !== 'paid' && status !== 'cancelled' && (
          <div className="mt-1.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-0.5">
              <span className="tabular-nums">AED {paid.toFixed(2)} of AED {total.toFixed(2)}</span>
              <span className="tabular-nums">{pct.toFixed(0)}%</span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-emerald-500/70 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(inv); }}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(inv); }}
            className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
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
      <div className="text-right mt-0.5 flex-shrink-0 pr-9 group-hover:pr-0 transition-all">
        <p className="text-sm font-bold tabular-nums text-foreground">
          {balance > 0 && status !== 'paid' && status !== 'cancelled'
            ? formatCurrencyShort(balance)
            : formatCurrencyShort(total)}
        </p>
        {balance > 0 && status !== 'paid' && status !== 'cancelled' && (
          <p className="text-[10px] text-muted-foreground tabular-nums">of {formatCurrencyShort(total)}</p>
        )}
      </div>
    </div>
  );
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
  onEdit,
  onDelete,
}) {
  const [mode, setMode] = useState(false);
  const { visible: visibleInvoices, sentinelProps, hasMore: hasMoreInvoices, visibleCount: visInv, totalCount: totalInv } = useProgressiveRender(invoices);

  const tabs = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'draft', label: 'Draft', count: counts.draft },
    { key: 'unsigned', label: 'Waiting', count: counts.unsigned, icon: PenLine },
    { key: 'signed', label: 'Signed', count: counts.signed, icon: FileSignature },
    { key: 'unpaid', label: 'Unpaid', count: counts.unpaid },
    { key: 'paid', label: 'Paid', count: counts.paid },
  ];

  const exitMode = () => {
    setMode(false);
    if (allSelected) onToggleSelectAll?.();
  };

  return (
    <section className="edge-panel pane-edge-neon rounded-2xl h-full flex flex-col overflow-hidden">
      {/* Header — search + select toggle */}
      <div className="p-3 sm:p-4 border-b border-border/40 glass-soft">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search invoice or client"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-input/60 border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
          <button
            onClick={mode ? exitMode : () => setMode(true)}
            className={`shrink-0 inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold transition ${
              mode
                ? 'bg-[linear-gradient(135deg,rgb(var(--panel-accent-rgb))_0%,rgb(var(--panel-accent2-rgb))_100%)] text-primary-foreground shadow-md'
                : 'bg-secondary/60 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            {mode ? 'Done' : 'Select'}
          </button>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1 ${
                tab === t.key
                  ? 'bg-[linear-gradient(135deg,rgb(var(--panel-accent-rgb))_0%,rgb(var(--panel-accent2-rgb))_100%)] text-primary-foreground shadow-md shadow-primary/30'
                  : 'text-muted-foreground bg-secondary/40 hover:bg-secondary/70 hover:text-foreground'
              }`}
            >
              {t.icon && <t.icon className="w-3 h-3" />}
              {t.label}
              <span className={`inline-flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold ${
                tab === t.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bulk select-all bar (only in mode) */}
      {mode && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-primary/5">
          <button
            onClick={onToggleSelectAll}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
              allSelected ? 'bg-primary border-primary' : 'border-border bg-input'
            }`}
          >
            {allSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
          </button>
          <span className="text-xs font-semibold text-muted-foreground">
            {selectedSet?.size || 0} selected
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground/70">Tap rows to select</span>
        </div>
      )}

      {/* List */}
      <div className="overflow-y-auto flex-1 no-scrollbar overscroll-contain min-h-0 pb-24 lg:pb-0">
        {invoices.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-primary/40" />
            <p className="font-medium">No matching invoices</p>
            <p className="text-[11px] mt-1 flex items-center justify-center gap-1 text-muted-foreground/60">
              <Sparkles className="w-3 h-3" />
              Try a different filter
            </p>
          </div>
        ) : (
          <>
            {visibleInvoices.map((inv) => {
              const checked = selectedSet?.has(inv.id);
              const isSelected = selectedId === inv.id;

              if (mode) {
                return (
                  <button
                    key={inv.id}
                    onClick={() => onToggleSelect?.(inv.id, !checked)}
                    className={`w-full text-left p-3.5 border-b border-border/30 flex items-center gap-3 transition group ${
                      checked ? 'bg-primary/10' : 'hover:bg-muted/30'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                      checked ? 'bg-primary border-primary' : 'border-border bg-input'
                    }`}>
                      {checked && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <RowBody inv={inv} onClientClick={onClientClick} onAction={onAction} onEdit={onEdit} onDelete={onDelete} />
                    </div>
                  </button>
                );
              }

              return (
                <div
                  key={inv.id}
                  onClick={() => onSelect(inv.id)}
                  className={`w-full p-3.5 border-b border-border/30 transition relative cursor-pointer group ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary/10 to-accent/5'
                      : 'hover:bg-muted/20'
                  }`}
                >
                  {isSelected && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-[linear-gradient(to_bottom,rgb(var(--panel-accent-rgb)),rgb(var(--panel-accent2-rgb)))] rounded-r" />
                  )}
                  <RowBody inv={inv} onClientClick={onClientClick} onAction={onAction} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <InvoiceActionsMenu inv={inv} onAction={onAction} />
                  </div>
                </div>
              );
            })}
            {hasMoreInvoices && (
              <div {...sentinelProps} className="text-center text-xs text-muted-foreground py-3">
                Loading more… ({visInv}/{totalInv})
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function formatCurrencyShort(amount) {
  return `AED ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}