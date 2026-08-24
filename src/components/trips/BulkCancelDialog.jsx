import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * Bulk cancel dialog — requires a shared cancellation reason.
 */
export default function BulkCancelDialog({ trips, open, onOpenChange, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setReason(''); setError(''); }
  }, [open]);

  const handleSave = async () => {
    if (!reason.trim()) { setError('Cancellation reason is required.'); return; }
    setSaving(true);
    try {
      await onConfirm({ cancellation_reason: reason.trim() });
    } finally {
      setSaving(false);
    }
  };

  if (!trips?.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/15 border border-red-500/30">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            Cancel {trips.length} Trip{trips.length !== 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-xs text-muted-foreground">
              You are about to cancel <strong className="text-foreground">{trips.length} trip{trips.length !== 1 ? 's' : ''}</strong>. This action cannot be undone through normal workflow.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Cancellation Reason <span className="text-red-400">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="e.g. Client cancelled the trips."
              className="bg-input border-border min-h-[80px] resize-none"
              autoFocus
            />
            {error && (
              <p className="flex items-start gap-1.5 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Keep Trips</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Cancel {trips.length} Trip{trips.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}