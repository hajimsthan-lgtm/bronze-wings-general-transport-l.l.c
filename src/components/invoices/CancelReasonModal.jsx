import { useState, useEffect } from 'react';
import { Loader2, Ban, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const CANCEL_REASONS = [
  { value: 'Client Cancelled', label: 'Client Cancelled' },
  { value: 'Duplicate', label: 'Duplicate' },
  { value: 'Error', label: 'Error' },
  { value: 'Other', label: 'Other' },
];

export default function CancelReasonModal({ invoice, open, onOpenChange, onConfirm }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);
  const hasPayments = invoice?.hasPayments || Number(invoice?.paid_amount || 0) > 0;

  useEffect(() => {
    if (open) {
      setReason('');
      setDetails('');
    }
  }, [open]);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const reasonText = reason === 'Other' ? `Other: ${details.trim()}` : reason || details.trim();
      await onConfirm(reasonText || 'Not specified');
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ban className="w-5 h-5 text-red-400" />
            Cancel Invoice — {invoice?.invoice_number}
          </DialogTitle>
          <DialogDescription>
            Please select a reason for cancelling this invoice.
          </DialogDescription>
        </DialogHeader>

        {hasPayments && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-600">
              <span className="font-semibold">Warning:</span> This invoice has a payment of AED {Number(invoice?.paid_amount || 0).toFixed(2)} recorded against it. Cancelling will not delete the payment record.
            </div>
          </div>
        )}

        <div className="py-2 space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Reason *</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="w-full h-10 text-sm">
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === 'Other' && (
            <Textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Please specify the reason..."
              rows={2}
              className="resize-none"
              autoFocus
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Keep Invoice
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !reason} className="bg-red-500 hover:bg-red-600 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
            Confirm Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}