import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, XCircle, Loader2 } from 'lucide-react';

/**
 * Modal for cancelling a trip.
 * Requires cancellation reason before saving.
 */
export default function CancelTripDialog({ trip, open, onOpenChange, onConfirm }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && trip) {
      setReason(trip.cancellation_reason || '');
      setError('');
    }
  }, [open, trip]);

  const handleSave = async () => {
    if (!reason.trim()) {
      setError('Cancellation reason is required.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm({ cancellation_reason: reason.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/15 border border-red-500/30">
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            Cancel Trip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Trip <span className="font-mono font-semibold text-foreground">{trip?.trip_number || `#${trip?.id?.slice(-6)}`}</span>
            </p>
            <p className="text-sm text-foreground">
              {trip?.from_location} → {trip?.to_location}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Cancellation Reason <span className="text-red-400">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="e.g. Client cancelled the trip."
              className="bg-input border-border min-h-[80px] resize-none"
              autoFocus
            />
            {error && (
              <p className="flex items-start gap-1.5 text-xs text-red-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Keep Trip
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700 gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Cancel Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}