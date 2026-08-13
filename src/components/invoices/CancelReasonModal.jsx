import { useState, useEffect } from 'react';
import { Loader2, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

export default function CancelReasonModal({ invoice, open, onOpenChange, onConfirm }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(reason.trim());
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
            Please provide a reason for cancelling this invoice (optional).
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for cancellation (e.g. duplicate, client request, error...)"
            rows={3}
            className="resize-none"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Keep Invoice
          </Button>
          <Button onClick={handleConfirm} disabled={saving} className="bg-red-500 hover:bg-red-600 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
            Confirm Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}