import { useRef } from 'react';
import {
  ExternalLink, Paperclip, FileDown, Loader2, Pencil, Trash2,
  CheckCircle2, Plus, FileText, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import IconChip from '@/components/common/IconChip';
import EmptyState from '@/components/common/EmptyState';
import { formatCurrency, getInitials } from '@/lib/formatters';

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

export default function InvoiceDetailPane({
  inv,
  clients,
  onClientClick,
  onEdit,
  onDelete,
  onDownload,
  onAttachSigned,
  onStatusChangeRequest,
  downloadingId,
  uploadingId,
}) {
  const fileRef = useRef(null);

  if (!inv) {
    return (
      <div className="glass-card rounded-2xl h-full flex items-center justify-center">
        <EmptyState
          icon={FileText}
          title="Select an invoice"
          description="Choose an invoice from the list to view its full details here."
        />
      </div>
    );
  }

  const total = Number(inv.total_amount || 0);
  const paid = Number(inv.paid_amount || 0);
  const balance = Math.max(0, total - paid);
  const subtotal = Number(inv.subtotal || 0);
  const vatAmount = Number(inv.vat_amount || 0);
  const isPaid = inv.status === 'paid';
  const isCancelled = inv.status === 'cancelled';
  const isSigned = !!inv.signed_invoice_url;
  const isUploading = uploadingId === inv.id;
  const isDownloading = downloadingId === inv.id;
  const lineItems = inv.line_items || [];

  const handleFileChange = (e) => {
    if (e.target.files[0]) onAttachSigned(inv, e.target.files[0]);
    e.target.value = '';
  };

  return (
    <div className="glass-card rounded-2xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/25 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {getInitials(inv.client_name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground font-mono">{inv.invoice_number || '—'}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${STATUS_PILL[inv.status] || STATUS_PILL.draft}`}>
                  {STATUS_LABEL[inv.status] || inv.status}
                </span>
              </div>
              <button
                onClick={() => onClientClick?.(inv.client_name)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mt-0.5"
              >
                {inv.client_name || '—'}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => onEdit(inv)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(inv)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto thin-scroll min-h-0 px-5 py-4">
        {/* Line items */}
        <div className="mb-5">
          <p className="eyebrow mb-3">Line Items</p>
          {lineItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
              No line items
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              {lineItems.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-border/40 bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-foreground truncate mb-1">{item.description || `Item ${idx + 1}`}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{item.quantity || 0} × {item.uom || 'TRIP'}</span>
                    <span className="font-bold tabular-nums text-foreground">{formatCurrency(item.amount || 0)}</span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => onEdit(inv)}
                className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 flex flex-col items-center justify-center gap-1 text-xs text-primary hover:bg-primary/10 transition-colors min-h-[72px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          )}
        </div>

        {/* Signed invoice */}
        {isSigned && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-xs text-emerald-600">Signed invoice attached</span>
          </div>
        )}
      </div>

      {/* Footer: totals */}
      <div className="px-5 py-3 border-t border-border/40 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Sub Total</span>
          <span className="tabular-nums">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>VAT ({inv.vat_rate || 5}%)</span>
          <span className="tabular-nums">{formatCurrency(vatAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-semibold pt-1 border-t border-border/30">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(total)}</span>
        </div>
        {paid > 0 && (
          <div className="flex items-center justify-between text-xs text-emerald-600">
            <span>Paid</span>
            <span className="tabular-nums">−{formatCurrency(paid)}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-base font-bold pt-1">
          <span>Balance Due</span>
          <span className="tabular-nums text-primary">{formatCurrency(balance)}</span>
        </div>
      </div>

      {/* Action row */}
      <div className="px-5 py-3 border-t border-border/40 flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
          title="Attach signed invoice"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        </button>
        <button
          onClick={() => onDownload(inv)}
          disabled={isDownloading}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
          title="Download PDF"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        </button>

        <div className="flex-1" />

        {!isPaid && !isCancelled && (
          <Button
            onClick={() => onStatusChangeRequest(inv, 'paid')}
            className="lightning-btn h-9 px-5 text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Mark as Paid
          </Button>
        )}
      </div>
    </div>
  );
}