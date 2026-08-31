import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Loader2, TrendingUp, Scale, Upload, FileText, X, Package, Clock, Wallet } from 'lucide-react';
import moment from 'moment';
import { base44 } from '@/api/base44Client';

const PAYMENT_OPTIONS = [
  { value: 'corporate_credit', label: 'Corporate Credit' },
  { value: 'cash_received', label: 'Cash Received' },
  { value: 'bank_received', label: 'Bank Received' },
];

/**
 * Modal for transitioning a trip to "Completed".
 * Editable start/end times with auto-calculated duration, overtime, and revenue.
 * Includes payment status and delivery note.
 */
export default function CompleteTripDialog({ trip, open, onOpenChange, onConfirm }) {
  const [loadDatetime, setLoadDatetime] = useState('');
  const [offloadDatetime, setOffloadDatetime] = useState('');
  const [baseFare, setBaseFare] = useState('');
  const [maxAllowed, setMaxAllowed] = useState('');
  const [overtimeRate, setOvertimeRate] = useState('');
  const [revenue, setRevenue] = useState('');
  const [revenueOverride, setRevenueOverride] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('corporate_credit');
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [wantAttachment, setWantAttachment] = useState(false);
  const [deliveryNoteUrl, setDeliveryNoteUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && trip) {
      setLoadDatetime(trip.load_datetime || (trip.trip_date ? `${trip.trip_date}T00:00` : ''));
      setOffloadDatetime(trip.offload_datetime || (trip.offload_date ? `${trip.offload_date}T${trip.offload_time || '00:00'}` : ''));
      setBaseFare(trip.base_fare != null ? String(trip.base_fare) : (trip.revenue != null ? String(trip.revenue) : ''));
      setMaxAllowed(trip.max_allowed_duration != null ? String(trip.max_allowed_duration) : '');
      setOvertimeRate(trip.overtime_rate != null ? String(trip.overtime_rate) : '');
      setRevenue(trip.revenue != null ? String(trip.revenue) : '');
      setRevenueOverride(false);
      setPaymentStatus(trip.payment_status || 'corporate_credit');
      setDeliveryNoteNumber(trip.delivery_note_number || '');
      setDeliveryNoteUrl(trip.delivery_note_url || '');
      setWantAttachment(!!trip.delivery_note_url);
      setError('');
    }
  }, [open, trip]);

  const num = (v) => (v === '' || v == null || isNaN(Number(v)) ? 0 : Number(v));

  // Auto-calculate duration from start/end times
  const calculatedDuration = useMemo(() => {
    if (!loadDatetime || !offloadDatetime) return 0;
    const load = new Date(loadDatetime).getTime();
    const offload = new Date(offloadDatetime).getTime();
    const diffMs = offload - load;
    if (diffMs <= 0) return 0;
    return Math.round((diffMs / 3600000) * 100) / 100;
  }, [loadDatetime, offloadDatetime]);

  const overtimeHours = useMemo(() => {
    const max = num(maxAllowed);
    return Math.max(0, calculatedDuration - max);
  }, [calculatedDuration, maxAllowed]);

  const overtimeAmount = useMemo(() => overtimeHours * num(overtimeRate), [overtimeHours, overtimeRate]);

  const autoRevenue = useMemo(() => num(baseFare) + overtimeAmount, [baseFare, overtimeAmount]);

  useEffect(() => {
    if (!revenueOverride) setRevenue(autoRevenue ? String(autoRevenue) : '');
  }, [autoRevenue, revenueOverride]);

  const fmt = (v) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDeliveryNoteUrl(file_url);
    } catch (err) {} finally { setUploading(false); }
  };

  const handleSave = async () => {
    const rev = num(revenue);
    if (!revenue || rev <= 0) {
      setError('Trip amount is required before the trip can be marked as Completed.');
      return;
    }
    setSaving(true);
    try {
      await onConfirm({
        revenue: rev,
        base_fare: num(baseFare),
        max_allowed_duration: num(maxAllowed),
        overtime_rate: num(overtimeRate),
        calculated_duration: calculatedDuration,
        load_datetime: loadDatetime || null,
        offload_datetime: offloadDatetime || null,
        offload_date: offloadDatetime ? offloadDatetime.split('T')[0] : (trip.offload_date || null),
        offload_time: offloadDatetime ? offloadDatetime.split('T')[1]?.slice(0, 5) || '' : (trip.offload_time || ''),
        payment_status: paymentStatus,
        delivery_note_number: deliveryNoteNumber || '',
        delivery_note_url: wantAttachment ? (deliveryNoteUrl || '') : '',
      });
    } finally {
      setSaving(false);
    }
  };

  const fieldCls = 'bg-input border-border text-sm font-semibold tabular-nums';
  const dtFieldCls = 'bg-input border-border text-sm tabular-nums';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-xl">
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
            </div>
          </div>

          {/* Start & End Times — editable, auto-calculates duration */}
          <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-3">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Start & End Times</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Start Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={loadDatetime}
                  onChange={(e) => setLoadDatetime(e.target.value)}
                  className={dtFieldCls}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={offloadDatetime}
                  onChange={(e) => setOffloadDatetime(e.target.value)}
                  className={dtFieldCls}
                />
              </div>
            </div>
            {calculatedDuration > 0 && (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">Calculated Duration</span>
                <span className="font-mono font-semibold text-cyan-400">{calculatedDuration} hrs</span>
              </div>
            )}
          </div>

          {/* Trip Calculation — Base Fare / Max Allowed / Overtime Rate */}
          <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-1.5 mb-2">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Trip Calculation</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs text-muted-foreground">Base Fare (AED)</Label>
                <Input type="number" step="0.01" min="0" value={baseFare} onChange={(e) => setBaseFare(e.target.value)} placeholder="0.00" className={fieldCls} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Max Allowed (Hrs)</Label>
                <Input type="number" step="0.01" min="0" value={maxAllowed} onChange={(e) => setMaxAllowed(e.target.value)} placeholder="0" className={fieldCls} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Overtime Rate</Label>
                <Input type="number" step="0.01" min="0" value={overtimeRate} onChange={(e) => setOvertimeRate(e.target.value)} placeholder="0.00" className={fieldCls} />
              </div>
            </div>
            {overtimeHours > 0 && (
              <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
                <span className="text-amber-400 font-semibold">Overtime: {overtimeHours} hrs × {fmt(overtimeRate)}</span>
                <span className="font-mono font-bold text-amber-400">+AED {fmt(overtimeAmount)}</span>
              </div>
            )}
          </div>

          {/* Revenue — auto-calculated */}
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Revenue</p>
              {!revenueOverride && autoRevenue > 0 && (
                <span className="ml-auto text-[9px] text-muted-foreground/60 uppercase tracking-wider">Auto-calculated</span>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Amount / Revenue (AED) <span className="text-red-400">*</span></Label>
              <Input
                type="number" step="0.01" min="0"
                value={revenue}
                onChange={(e) => { setRevenue(e.target.value); setRevenueOverride(true); setError(''); }}
                placeholder="0.00"
                className={fieldCls}
                autoFocus
              />
              {revenueOverride && (
                <button
                  onClick={() => { setRevenueOverride(false); setRevenue(String(autoRevenue)); }}
                  className="mt-1 text-[10px] text-primary hover:underline"
                >
                  Reset to auto-calc (AED {fmt(autoRevenue)})
                </button>
              )}
            </div>
          </div>

          {/* Payment Status */}
          <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet className="w-3.5 h-3.5 text-violet-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Payment</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Payment Status</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger className="bg-input border-border text-sm">{PAYMENT_OPTIONS.find((p) => p.value === paymentStatus)?.label || 'Select...'}</SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Delivery */}
          <div className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-3">
            <div className="flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-cyan-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Delivery</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Delivery Note #</Label>
              <Input
                value={deliveryNoteNumber}
                onChange={(e) => setDeliveryNoteNumber(e.target.value.replace(/[<>]/g, '').slice(0, 50))}
                placeholder="Optional"
                className="bg-input border-border text-sm"
                maxLength={50}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="want-attachment"
                checked={wantAttachment}
                onCheckedChange={(v) => { setWantAttachment(!!v); if (!v) setDeliveryNoteUrl(''); }}
              />
              <Label htmlFor="want-attachment" className="text-xs text-muted-foreground cursor-pointer">
                Attach a Delivery Note file
              </Label>
            </div>
            {wantAttachment && (
              <div>
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
                {deliveryNoteUrl ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border">
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <a href={deliveryNoteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate flex-1">View attachment</a>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setDeliveryNoteUrl('')} className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" onClick={(e) => e.currentTarget.previousElementSibling?.click()} disabled={uploading} className="w-full border-border border-dashed">
                    <Upload className="w-4 h-4 mr-1.5" /> {uploading ? 'Uploading…' : 'Upload Delivery Note'}
                  </Button>
                )}
              </div>
            )}
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