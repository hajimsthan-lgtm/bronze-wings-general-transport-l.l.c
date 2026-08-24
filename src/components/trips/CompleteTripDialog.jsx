import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Modal for transitioning a trip to "Completed".
 * Requires trip amount (revenue) before saving.
 */
export default function CompleteTripDialog({ trip, open, onOpenChange, onConfirm }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && trip) {
      setAmount(trip.revenue != null ? String(trip.revenue) : '');
      setError('');
    }
  }, [open, trip]);

  const handleSave = async () => {
    const num = Number(amount);
    if (!amount || isNaN(num) || num < 0) {
      setError('Trip amount is required before the trip can be marked as Completed.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm({ revenue: num });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            Complete Trip
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
              Trip Amount (AED) <span className="text-red-400">*</span>
            </Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              placeholder="0.00"
              className="bg-input border-border text-lg font-semibold tabular-nums"
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
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Complete Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}