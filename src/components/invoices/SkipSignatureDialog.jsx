import { useState } from 'react';
import { FileX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function SkipSignatureDialog({ invoice, open, onOpenChange, onConfirm }) {
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
            <FileX className="w-5 h-5 text-orange-400" />
            Skip Signature — {invoice?.invoice_number}
          </DialogTitle>
          <DialogDescription>
            This invoice will skip the signature step and move to <span className="font-semibold text-foreground">Sent</span> (payment-ready) status. You can still attach a signed copy later if needed.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileX className="w-4 h-4 mr-2" />}
            Skip Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}