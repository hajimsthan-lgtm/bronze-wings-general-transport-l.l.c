import { useRef, useState } from 'react';
import {
  ExternalLink, FileDown, Loader2, Pencil, Trash2,
  Plus, FileText, Download, Eye, Upload, FileSignature, AlertCircle, LayoutList, LayoutTemplate,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/common/EmptyState';
import InvoiceActionsMenu from '@/components/invoices/InvoiceActionsMenu';
import EmailShareButton from '@/components/common/EmailShareButton';
import WhatsAppShareButton from '@/components/common/WhatsAppShareButton';
import InvoiceActivityTimeline from '@/components/invoices/InvoiceActivityTimeline';
import InvoicePreview from '@/components/invoices/InvoicePreview';
import { formatCurrency, getInitials } from '@/lib/formatters';
import { deriveStatus, isOverdue, STATUS_LABELS, STATUS_PILLS, STATUS_DOTS } from '@/lib/invoiceWorkflow';

export default function InvoiceDetailPane({
  inv,
  clients,
  onClientClick,
  onEdit,
  onDelete,
  onDownload,
  onAttachSigned,
  onAction,
  downloadingId,
  uploadingId,
  signedDocs,
  onViewSigned,
  onDownloadSigned,
  onDeleteSigned,
  payments,
  settings,
}) {
  const fileRef = useRef(null);
  const [view, setView] = useState('details');

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
  const status = deriveStatus(inv);
  const overdue = isOverdue(inv);
  const isCancelled = status === 'cancelled';
  const isSigned = !!inv.signed_invoice_url;
  const isUploading = uploadingId === inv.id;
  const isDownloading = downloadingId === inv.id;
  const lineItems = inv.line_items || [];
  const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
  const showPreview = view === 'preview';

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
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground font-mono">{inv.invoice_number || '—'}</h3>
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${STATUS_PILLS[status]}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOTS[status]}`} />
                  {STATUS_LABELS[status]}
                </span>
                {overdue && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 bg-red-500/15 text-red-400 border-red-500/20">
                    <AlertCircle className="w-2.5 h-2.5" />
                    Overdue
                  </span>
                )}
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
            <div className="inline-flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5 mr-1">
              <button
                onClick={() => setView('details')}
                className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-semibold transition-colors ${view === 'details' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                title="Details view"
              >
                <LayoutList className="w-3 h-3" /> Details
              </button>
              <button
                onClick={() => setView('preview')}
                className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-semibold transition-colors ${view === 'preview' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                title="Live preview"
              >
                <Eye className="w-3 h-3" /> Preview
              </button>
            </div>
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
      {showPreview ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          <InvoicePreview form={inv} settings={settings || {}} mode="trip" />
        </div>
      ) : (
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

        {/* Payment progress */}
        {paid > 0 && status !== 'cancelled' && (
          <div className="mb-5 rounded-xl border border-border/40 bg-muted/20 p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-muted-foreground">Payment Progress</span>
              <span className="font-semibold tabular-nums text-foreground">{pct.toFixed(0)}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-emerald-500/70 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-emerald-400 font-medium tabular-nums">AED {paid.toFixed(2)} paid</span>
              <span className="text-muted-foreground tabular-nums">AED {balance.toFixed(2)} remaining</span>
            </div>
          </div>
        )}

        {/* Signed Document Section */}
        <div className="mb-5">
          <p className="eyebrow mb-3">Signature Status</p>
          {isSigned ? (
            <div className="space-y-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSignature className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-semibold text-emerald-600 truncate">
                      {signedDocs?.[0]?.file_name || 'Signed document'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {inv.signed_date || '—'}{inv.signed_uploaded_by ? ` · ${inv.signed_uploaded_by}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onViewSigned?.(inv)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                  >
                    <Eye className="w-3 h-3" /> View
                  </button>
                  <button
                    onClick={() => onDownloadSigned?.(inv)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                  {onDeleteSigned && (
                    <button
                      onClick={() => onDeleteSigned(inv)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
                      title="Remove signed copy & revert to unsigned"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  )}
                </div>
              </div>
              {signedDocs && signedDocs.length > 1 && (
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-1">Version History</p>
                  {signedDocs.map((doc, i) => (
                    <div key={doc.id} className="flex items-center justify-between gap-2 text-[11px] py-1.5 px-2.5 rounded-lg bg-muted/20">
                      <span className="text-muted-foreground flex-shrink-0">v{signedDocs.length - i}</span>
                      <span className="text-muted-foreground truncate flex-1">{doc.file_name || '—'}</span>
                      <span className="text-muted-foreground flex-shrink-0">{doc.upload_date || '—'}</span>
                      <button
                        onClick={() => onViewSigned?.({ signed_invoice_url: doc.file_url })}
                        className="text-primary hover:underline flex-shrink-0"
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              className="w-full rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-3 flex items-center justify-center gap-2 text-xs font-semibold text-amber-600 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? 'Uploading...' : 'Upload Signed Copy'}
            </button>
          )}
        </div>

        {/* Activity Timeline */}
        <InvoiceActivityTimeline inv={inv} signedDocs={signedDocs} payments={payments} />
      </div>
      )}

      {/* Footer: totals */}
      {!showPreview && (
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
      )}

      {/* Action row */}
      <div className="px-5 py-3 border-t border-border/40 flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => onDownload(inv)}
          disabled={isDownloading}
          className="h-9 px-3 rounded-lg flex items-center gap-1.5 bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors text-xs font-semibold disabled:opacity-50"
          title="Download PDF"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          PDF
        </button>

        <EmailShareButton doc={inv} type="invoice" settings={settings} />
        <WhatsAppShareButton doc={inv} type="invoice" settings={settings} />

        <div className="flex-1" />

        {!isCancelled && (
          <InvoiceActionsMenu inv={inv} onAction={onAction} variant="button" />
        )}
      </div>
    </div>
  );
}