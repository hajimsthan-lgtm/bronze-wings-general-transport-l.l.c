import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/formatters';

export default function SendForSignatureDialog({ invoice, open, onOpenChange, onConfirm }) {
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(invoice);
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
            <Send className="w-5 h-5 text-primary" />
            Send for Signature — {invoice?.invoice_number}
          </DialogTitle>
          <DialogDescription>
            This will mark the invoice as <span className="font-semibold text-foreground">Unsigned</span> and send it to the client for signature/attestation. Please confirm before proceeding.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2 rounded-xl bg-muted/30 p-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Client</span>
            <span className="font-semibold text-foreground">{invoice?.client_name || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Invoice Amount</span>
            <span className="font-bold font-mono text-foreground">{formatCurrency(invoice?.total_amount || 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Due Date</span>
            <span className="font-mono text-foreground">{invoice?.due_date || '—'}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving} className="lightning-btn">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send for Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}