import { useRef } from 'react';
import { FileDown, Pencil, Trash2, Loader2, Paperclip, CheckCircle2, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_COLORS = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-500/15 text-blue-400',
  partially_paid: 'bg-orange-500/15 text-orange-400',
  paid: 'bg-green-500/15 text-green-400',
  overdue: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-white/10 text-white/50',
};

export const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'partially_paid', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function InvoiceCard({ inv, selected, onSelect, onStatusChangeRequest, onAttachSigned, onDownload, onEdit, onDelete, downloadingId, uploadingId }) {
  const fileRef = useRef(null);
  const total = Number(inv.total_amount || 0);
  const isSigned = !!inv.signed_invoice_url;
  const isUploading = uploadingId === inv.id;
  const showAttachButton = inv.status === 'sent' || isSigned;

  const handleFileChange = (e) => {
    if (e.target.files[0]) onAttachSigned(inv, e.target.files[0]);
    e.target.value = '';
  };

  return (
    <div className={`glass-card-hover p-4 rounded-xl transition-all ${selected ? 'ring-2 ring-primary' : ''}`}>
      <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />

      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(inv.id, e.target.checked)}
            className="w-4 h-4 mt-1 rounded accent-primary cursor-pointer"
          />
          <div>
            <div className="text-xs text-muted-foreground font-mono">{inv.invoice_number || '—'}</div>
            <div className="text-sm font-semibold text-foreground mt-0.5">{inv.client_name || '—'}</div>
          </div>
        </div>
        <Select value={inv.status} onValueChange={(v) => onStatusChangeRequest(inv, v)}>
          <SelectTrigger className={`h-6 w-auto px-2 py-0 text-[10px] rounded-full font-semibold uppercase border-none shadow-none ${STATUS_COLORS[inv.status] || STATUS_COLORS.draft}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-muted-foreground">
          {inv.issue_date ? new Date(inv.issue_date).toLocaleDateString() : '—'}
        </div>
        <div className="text-sm font-bold font-mono text-primary">AED {total.toFixed(2)}</div>
      </div>

      {isSigned ? (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold">
            <CheckCircle2 className="w-3 h-3" /> Signed by Client
          </span>
          <a href={inv.signed_invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
            <Eye className="w-3 h-3" /> View
          </a>
          <button onClick={() => fileRef.current?.click()} disabled={isUploading} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Replace
          </button>
        </div>
      ) : showAttachButton && (
        <div className="mb-3">
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={isUploading} className="h-7 text-xs">
            {isUploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Paperclip className="w-3 h-3 mr-1" />}
            Attach Signed Invoice
          </Button>
        </div>
      )}

      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" onClick={() => onDownload(inv)} disabled={downloadingId === inv.id} className="flex-1 h-8 text-xs">
          {downloadingId === inv.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileDown className="w-3 h-3 mr-1" />}
          PDF
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onEdit(inv)} className="h-8 w-8 p-0"><Pencil className="w-3.5 h-3.5" /></Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(inv)} className="h-8 w-8 p-0 text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>
    </div>
  );
}