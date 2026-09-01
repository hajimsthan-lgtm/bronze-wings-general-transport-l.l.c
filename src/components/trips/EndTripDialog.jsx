import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Label } from '@/components/ui/label';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';

/**
 * Modal for transitioning a trip to "Trip Ended".
 * Requires separate offload DATE and offload TIME before saving.
 * Saves: offload_date, offload_time, offload_datetime (combined)
 */
export default function EndTripDialog({ trip, open, onOpenChange, onConfirm }) {
  const [offloadDate, setOffloadDate] = useState('');
  const [offloadTime, setOffloadTime] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && trip) {
      setError('');
      // Pre-fill from existing values
      if (trip.offload_datetime) {
        const dt = new Date(trip.offload_datetime);
        setOffloadDate(dt.toISOString().slice(0, 10));
        setOffloadTime(dt.toTimeString().slice(0, 5));
      } else if (trip.offload_date) {
        setOffloadDate(trip.offload_date);
        setOffloadTime(trip.offload_time || new Date().toTimeString().slice(0, 5));
      } else {
        const now = new Date();
        setOffloadDate(now.toISOString().slice(0, 10));
        setOffloadTime(now.toTimeString().slice(0, 5));
      }
    }
  }, [open, trip]);

  const handleSave = async () => {
    if (!offloadDate) { setError('Offload date and offload time are required before the trip can be marked as Trip Ended.'); return; }
    if (!offloadTime) { setError('Offload date and offload time are required before the trip can be marked as Trip Ended.'); return; }

    const combined = new Date(`${offloadDate}T${offloadTime}:00`);
    if (isNaN(combined.getTime())) { setError('Invalid offload date or time.'); return; }

    // Validate offload >= trip start
    const startDT = trip.load_datetime ? new Date(trip.load_datetime) : (trip.trip_date ? new Date(trip.trip_date + 'T00:00:00') : null);
    if (startDT && combined < startDT) {
      setError('Offload date/time cannot be before the trip start date/time.');
      return;
    }

    setSaving(true);
    try {
      await onConfirm({
        offload_date: offloadDate,
        offload_time: offloadTime,
        offload_datetime: combined.toISOString(),
      });
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
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground mb-0.5">
              Trip <span className="font-mono font-semibold text-foreground">{trip?.trip_number || `#${trip?.id?.slice(-6)}`}</span>
            </p>
            <p className="text-sm font-medium text-foreground">
              {trip?.from_location} → {trip?.to_location}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Offload Date <span className="text-red-400">*</span>
              </Label>
              <DatePicker
                value={offloadDate}
                onChange={(v) => { setOffloadDate(v); setError(''); }}
                className="bg-input border-border"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Offload Time <span className="text-red-400">*</span>
              </Label>
              <Input
                type="time"
                value={offloadTime}
                onChange={(e) => { setOffloadTime(e.target.value); setError(''); }}
                className="bg-input border-border"
              />
            </div>
          </div>

          {error && (
            <p className="flex items-start gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </p>
          )}
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