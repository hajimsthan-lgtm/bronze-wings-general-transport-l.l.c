import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import moment from 'moment';

/**
 * Modal for transitioning a trip to "Completed".
 * Shows full financial section with live balance calculation.
 * All financial data is saved to the trip record.
 */
export default function CompleteTripDialog({ trip, open, onOpenChange, onConfirm }) {
  const [revenue, setRevenue]       = useState('');
  const [fuelCost, setFuelCost]     = useState('');
  const [tollCost, setTollCost]     = useState('');
  const [otherCost, setOtherCost]   = useState('');
  const [error, setError]           = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (open && trip) {
      setRevenue(trip.revenue != null ? String(trip.revenue) : '');
      setFuelCost(trip.fuel_cost != null ? String(trip.fuel_cost) : '');
      setTollCost(trip.toll_cost != null ? String(trip.toll_cost) : '');
      setOtherCost(trip.other_cost != null ? String(trip.other_cost) : '');
      setError('');
    }
  }, [open, trip]);

  const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? 0 : Number(v));

  const totalRevenue  = useMemo(() => num(revenue), [revenue]);
  const totalExpenses = useMemo(() => num(fuelCost) + num(tollCost) + num(otherCost), [fuelCost, tollCost, otherCost]);
  const balance       = useMemo(() => totalRevenue - totalExpenses, [totalRevenue, totalExpenses]);

  const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleSave = async () => {
    const rev = num(revenue);
    if (!revenue || rev < 0) {
      setError('Trip amount is required before the trip can be marked as Completed.');
      return;
    }
    if (rev === 0) {
      setError('Trip amount is required before the trip can be marked as Completed.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm({
        revenue: rev,
        fuel_cost: num(fuelCost),
        toll_cost: num(tollCost),
        other_cost: num(otherCost),
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = 'bg-input border-border text-sm font-semibold tabular-nums';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            Complete Trip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1 max-h-[70vh] overflow-y-auto pr-1">
          {/* Trip Info */}
          <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Trip Information</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div><span className="text-muted-foreground">Trip #</span> <span className="font-mono font-semibold text-foreground">{trip?.trip_number || `#${trip?.id?.slice(-6)}`}</span></div>
              <div><span className="text-muted-foreground">Client</span> <span className="font-medium text-foreground">{trip?.client_name || '—'}</span></div>
              <div><span className="text-muted-foreground">Vehicle</span> <span className="font-mono text-foreground">{trip?.vehicle_plate || '—'}</span></div>
              <div><span className="text-muted-foreground">Driver</span> <span className="text-foreground">{trip?.driver_name || '—'}</span></div>
              <div><span className="text-muted-foreground">From</span> <span className="text-foreground">{trip?.from_location || '—'}</span></div>
              <div><span className="text-muted-foreground">To</span> <span className="text-foreground">{trip?.to_location || '—'}</span></div>
              {trip?.trip_date && <div><span className="text-muted-foreground">Start Date</span> <span className="font-mono text-foreground">{moment(trip.trip_date).format('DD MMM YYYY')}</span></div>}
              {(trip?.offload_date || trip?.offload_datetime) && (
                <div>
                  <span className="text-muted-foreground">Offload</span>{' '}
                  <span className="font-mono text-foreground">
                    {trip.offload_date
                      ? `${trip.offload_date} ${trip.offload_time || ''}`.trim()
                      : moment(trip.offload_datetime).format('DD MMM YYYY HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Section */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Financial Information</p>

            {/* Revenue */}
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Revenue</p>
              </div>
              <div className="space-y-1.5">
                <div>
                  <Label className="text-xs text-muted-foreground">Trip Fare / Revenue (AED) <span className="text-red-400">*</span></Label>
                  <Input
                    type="number" step="0.01" min="0"
                    value={revenue}
                    onChange={(e) => { setRevenue(e.target.value); setError(''); }}
                    placeholder="0.00"
                    className={fieldCls}
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-400">Expenses</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Fuel Cost</Label>
                  <Input type="number" step="0.01" min="0" value={fuelCost} onChange={(e) => setFuelCost(e.target.value)} placeholder="0.00" className={fieldCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Toll Cost</Label>
                  <Input type="number" step="0.01" min="0" value={tollCost} onChange={(e) => setTollCost(e.target.value)} placeholder="0.00" className={fieldCls} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Other Cost</Label>
                  <Input type="number" step="0.01" min="0" value={otherCost} onChange={(e) => setOtherCost(e.target.value)} placeholder="0.00" className={fieldCls} />
                </div>
              </div>
            </div>

            {/* Live Balance Summary */}
            <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Scale className="w-3.5 h-3.5 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Live Summary</p>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total Revenue</span>
                <span className="font-mono font-semibold text-emerald-400">AED {fmt(totalRevenue)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Total Expenses</span>
                <span className="font-mono font-semibold text-red-400">AED {fmt(totalExpenses)}</span>
              </div>
              <div className="h-px bg-border/60 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-foreground">Live Balance</span>
                <span className={`font-mono font-bold text-sm ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  AED {fmt(balance)}
                </span>
              </div>
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
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Complete Trip
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}