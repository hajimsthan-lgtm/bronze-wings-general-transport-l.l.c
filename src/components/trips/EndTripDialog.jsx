import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';

/**
 * Modal for transitioning a trip to "Trip Ended".
 * Requires offload date & time before saving.
 */
export default function EndTripDialog({ trip, open, onOpenChange, onConfirm }) {
  const [offloadDatetime, setOffloadDatetime] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && trip) {
      // Pre-fill with existing offload_datetime or default to now
      const existing = trip.offload_datetime
        ? trip.offload_datetime.slice(0, 16)
        : '';
      setOffloadDatetime(existing || new Date().toISOString().slice(0, 16));
      setError('');
    }
  }, [open, trip]);

  const handleSave = async () => {
    if (!offloadDatetime) {
      setError('Offload time is required before the trip can be marked as Trip Ended.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm({ offload_datetime: offloadDatetime });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/15 border border-purple-500/30">
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            End Trip
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
              Offload Date & Time <span className="text-red-400">*</span>
            </Label>
            <Input
              type="datetime-local"
              value={offloadDatetime}
              onChange={(e) => { setOffloadDatetime(e.target.value); setError(''); }}
              className="bg-input border-border"
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
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Trip End
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}