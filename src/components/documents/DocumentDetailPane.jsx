import { useRef, useState } from 'react';
import {
  ExternalLink, FileDown, Loader2, Pencil, Trash2, Plus, FileText, Eye, LayoutList, Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/common/EmptyState';
import EmailShareButton from '@/components/common/EmailShareButton';
import WhatsAppShareButton from '@/components/common/WhatsAppShareButton';
import { formatCurrency, getInitials } from '@/lib/formatters';

export default function DocumentDetailPane({
  item,
  statusConfig,
  numberField,
  subtitleField,
  subtitleLabel,
  dateFields = [],
  totalFields = [],
  lineItemsKey = 'line_items',
  onClientClick,
  onEdit,
  onDelete,
  onDownload,
  downloadingId,
  primaryAction,
  emptyTitle = 'Select a document',
  emptyDescription = 'Choose an item from the list to view its full details here.',
  emptyIcon: EmptyIcon = FileText,
  documentLabel = 'Document',
  previewComponent,
  settings,
  docType = 'quotation',
  actionsMenu,
  signatureFlag,
}) {
  const fileRef = useRef(null);
  const [view, setView] = useState('details');

  if (!item) {
    return (
      <div className="glass-card rounded-2xl h-full flex items-center justify-center">
        <EmptyState icon={EmptyIcon} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  const status = item.status || 'draft';
  const cfg = statusConfig[status] || statusConfig.draft;
  const lineItems = item[lineItemsKey] || [];
  const isDownloading = downloadingId === item.id;
  const hasPreview = !!previewComponent;
  const showPreview = hasPreview && view === 'preview';

  return (
    <div className="glass-card rounded-2xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/25 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
              {getInitials(item.client_name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground font-mono">{item[numberField] || '—'}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${cfg.pill}`}>
                  {cfg.label}
                </span>
                {signatureFlag && (
                  <span
                    className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold border flex-shrink-0 ${signatureFlag.pill}`}
                    title={`Signature: ${signatureFlag.label}`}
                  >
                    <Flag className="w-2.5 h-2.5" />
                    {signatureFlag.label}
                  </span>
                )}
              </div>
              <button
                onClick={() => onClientClick?.(item.client_name)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 mt-0.5"
              >
                {item.client_name || '—'}
                <ExternalLink className="w-3 h-3 opacity-50" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {hasPreview && (
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
            )}
            <button onClick={() => onEdit(item)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(item)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      {showPreview ? (
        <div className="flex-1 min-h-0 overflow-hidden">
          {previewComponent}
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto thin-scroll min-h-0 px-5 py-4">
        {/* Subtitle / subject */}
        {item[subtitleField] && (
          <div className="mb-4">
            <p className="eyebrow mb-1">{subtitleLabel}</p>
            <p className="text-sm text-foreground">{item[subtitleField]}</p>
          </div>
        )}

        {/* Date fields */}
        {dateFields.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {dateFields.map(df => (
              <div key={df.key} className="rounded-xl border border-border/40 bg-muted/20 p-3">
                <p className="eyebrow mb-1">{df.label}</p>
                <p className="text-sm font-semibold text-foreground">
                  {item[df.key] ? new Date(item[df.key]).toLocaleDateString() : '—'}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Line items */}
        <div className="mb-5">
          <p className="eyebrow mb-3">Line Items</p>
          {lineItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
              No line items
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              {lineItems.map((li, idx) => (
                <div key={idx} className="rounded-xl border border-border/40 bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-foreground truncate mb-1">{li.description || `Item ${idx + 1}`}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{li.quantity || 0} × {li.unit_price ? `AED ${li.unit_price}` : ''}</span>
                    <span className="font-bold tabular-nums text-foreground">{formatCurrency(li.amount || 0)}</span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => onEdit(item)}
                className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 flex flex-col items-center justify-center gap-1 text-xs text-primary hover:bg-primary/10 transition-colors min-h-[72px]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          )}
        </div>

        {item.notes && (
          <div className="mb-4">
            <p className="eyebrow mb-1">Notes</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.notes}</p>
          </div>
        )}
      </div>
      )}

      {/* Footer: totals */}
      {!showPreview && totalFields.length > 0 && (
        <div className="px-5 py-3 border-t border-border/40 space-y-1.5">
          {totalFields.map(tf => (
            <div
              key={tf.key}
              className={`flex items-center justify-between ${tf.bold ? 'text-base font-bold pt-1 border-t border-border/30' : 'text-xs text-muted-foreground'}`}
            >
              <span>{tf.label}</span>
              <span className="tabular-nums">{tf.format ? tf.format(item[tf.key]) : formatCurrency(item[tf.key] || 0)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action row */}
      <div className="px-5 py-3 border-t border-border/40 flex items-center gap-2">
        <button
          onClick={() => onDownload(item)}
          disabled={isDownloading}
          className="w-9 h-9 rounded-lg flex items-center justify-center border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-50"
          title="Download PDF"
        >
          {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
        </button>

        <EmailShareButton doc={item} type={docType} settings={settings} />
        <WhatsAppShareButton doc={item} type={docType} settings={settings} />

        {actionsMenu}

        <div className="flex-1" />

        {primaryAction && primaryAction.show && (
          <Button
            onClick={() => primaryAction.onClick(item)}
            className="lightning-btn h-9 px-5 text-xs"
          >
            {primaryAction.icon && <primaryAction.icon className="w-3.5 h-3.5 mr-1.5" />}
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}