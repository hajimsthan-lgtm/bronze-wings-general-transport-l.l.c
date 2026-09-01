import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DatePicker from '@/components/common/DatePicker';
import { Label } from '@/components/ui/label';
import { AlertCircle, Clock, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * Bulk Trip Ended dialog.
 * Each trip gets its own offload date/time row.
 * Option to apply one time to all trips.
 */
export default function BulkEndTripDialog({ trips, open, onOpenChange, onConfirm }) {
  const [useShared, setUseShared] = useState(true);
  const [sharedDate, setSharedDate] = useState('');
  const [sharedTime, setSharedTime] = useState('');
  const [perTrip, setPerTrip] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && trips?.length) {
      const now = new Date();
      const d = now.toISOString().slice(0, 10);
      const t = now.toTimeString().slice(0, 5);
      setSharedDate(d);
      setSharedTime(t);
      const init = {};
      trips.forEach((tr) => {
        if (tr.offload_datetime) {
          const dt = new Date(tr.offload_datetime);
          init[tr.id] = { date: dt.toISOString().slice(0, 10), time: dt.toTimeString().slice(0, 5) };
        } else {
          init[tr.id] = { date: tr.offload_date || d, time: tr.offload_time || t };
        }
      });
      setPerTrip(init);
      setError('');
    }
  }, [open, trips]);

  const handleSave = async () => {
    setError('');
    const results = [];

    for (const trip of trips) {
      const date = useShared ? sharedDate : perTrip[trip.id]?.date;
      const time = useShared ? sharedTime : perTrip[trip.id]?.time;
      if (!date || !time) {
        setError(`Missing offload date/time for trip ${trip.trip_number || trip.id?.slice(-6)}.`);
        return;
      }
      const combined = new Date(`${date}T${time}:00`);
      if (isNaN(combined.getTime())) {
        setError(`Invalid date/time for trip ${trip.trip_number || trip.id?.slice(-6)}.`);
        return;
      }
      results.push({ trip, offload_date: date, offload_time: time, offload_datetime: combined.toISOString() });
    }

    setSaving(true);
    try {
      await onConfirm(results);
    } finally {
      setSaving(false);
    }
  };

  if (!trips?.length) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/15 border border-purple-500/30">
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            End {trips.length} Trip{trips.length !== 1 ? 's' : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1 max-h-[60vh] overflow-y-auto pr-1">
          {/* Apply-all toggle */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
            <input
              type="checkbox"
              id="useShared"
              checked={useShared}
              onChange={(e) => setUseShared(e.target.checked)}
              className="w-4 h-4 accent-purple-500"
            />
            <label htmlFor="useShared" className="text-xs font-medium text-foreground cursor-pointer">
              Use the same offload date &amp; time for all trips
            </label>
          </div>

          {useShared ? (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-purple-500/20 bg-purple-500/5">
              <div>
                <Label className="text-xs text-muted-foreground">Offload Date <span className="text-red-400">*</span></Label>
                <DatePicker value={sharedDate} onChange={(v) => { setSharedDate(v); setError(''); }} className="bg-input border-border" autoFocus />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Offload Time <span className="text-red-400">*</span></Label>
                <Input type="time" value={sharedTime} onChange={(e) => { setSharedTime(e.target.value); setError(''); }} className="bg-input border-border" />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {trips.map((trip) => (
                <div key={trip.id} className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    {trip.trip_number || `#${trip.id?.slice(-6)}`}
                    <span className="font-normal text-muted-foreground ml-2">{trip.from_location} → {trip.to_location}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Offload Date <span className="text-red-400">*</span></Label>
                      <DatePicker value={perTrip[trip.id]?.date || ''} onChange={(v) => { setPerTrip(p => ({ ...p, [trip.id]: { ...p[trip.id], date: v } })); setError(''); }} className="bg-input border-border text-xs h-8" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Offload Time <span className="text-red-400">*</span></Label>
                      <Input type="time" value={perTrip[trip.id]?.time || ''} onChange={(e) => { setPerTrip(p => ({ ...p, [trip.id]: { ...p[trip.id], time: e.target.value } })); setError(''); }} className="bg-input border-border text-xs h-8" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="flex items-start gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700 gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Trip End{trips.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}