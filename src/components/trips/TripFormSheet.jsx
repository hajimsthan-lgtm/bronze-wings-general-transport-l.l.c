import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import CreateNewCard from './CreateNewCard';
import { useTripCreate, useTripUpdate } from '@/hooks/useEntityQueries';

const TRIP_TYPES = ['one_way', 'hourly', 'contract', 'return'];
const PAYMENT_STATUSES = ['corporate_credit', 'cash_received', 'bank_received'];

const DEFAULT_FORM = {
  from_location: '', to_location: '', vehicle_plate: '', driver_name: '',
  client_name: '', trip_type: 'one_way', delivery_note_number: '', delivery_note_url: '',
  hours: '', return_trip_number: '', payment_status: 'corporate_credit',
  trip_date: new Date().toISOString().split('T')[0],
  load_datetime: '', offload_datetime: '', trip_number: '',
  status: 'scheduled', revenue: '', distance_km: '', notes: '', contact_person: '',
  duration_unit: 'hours', calculated_duration: '', base_fare: '', max_allowed_duration: '', overtime_rate: '',
};

export default function TripFormSheet({ open, onOpenChange, editTrip, onSaved }) {
  const { t } = useI18n();
  const createTrip = useTripCreate();
  const updateTrip = useTripUpdate();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tripsList, setTripsList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [clients, setClients] = useState([]);
  const [fixedCharges, setFixedCharges] = useState([]);
  const [autoFilled, setAutoFilled] = useState(false);
  const [createdFlags, setCreatedFlags] = useState({ client: false, vehicle: false, driver: false });
  const [creating, setCreating] = useState(null);
  const [revenueOverride, setRevenueOverride] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });

  useEffect(() => {
    if (open) {
      Promise.all([
        base44.entities.Trip.list('-created_date', 200).catch(() => []),
        base44.entities.Vehicle.list('-created_date', 200).catch(() => []),
        base44.entities.Driver.list('-created_date', 200).catch(() => []),
        base44.entities.Client.list('-created_date', 200).catch(() => []),
      ]).then(([trips, vehs, drvs, clnts]) => {
        setTripsList(trips || []);
        setVehicles(vehs || []);
        setDrivers(drvs || []);
        setClients(clnts || []);
      });
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setRevenueOverride(false);
      if (editTrip) {
        setForm({
          ...DEFAULT_FORM,
          ...editTrip,
          hours: editTrip.hours || '',
          revenue: editTrip.revenue || '',
          distance_km: editTrip.distance_km || '',
          load_datetime: editTrip.load_datetime || '',
          offload_datetime: editTrip.offload_datetime || '',
          base_fare: editTrip.base_fare || editTrip.revenue || '',
          max_allowed_duration: editTrip.max_allowed_duration || '',
          overtime_rate: editTrip.overtime_rate || '',
          duration_unit: editTrip.duration_unit || 'hours',
          calculated_duration: editTrip.calculated_duration || '',
        });
      } else {
        setForm({ ...DEFAULT_FORM, trip_date: new Date().toISOString().split('T')[0] });
        setCreatedFlags({ client: false, vehicle: false, driver: false });
      }
    }
  }, [editTrip, open]);

  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'client_name') setCreatedFlags(prev => ({ ...prev, client: false }));
    if (field === 'vehicle_plate') setCreatedFlags(prev => ({ ...prev, vehicle: false }));
    if (field === 'driver_name') setCreatedFlags(prev => ({ ...prev, driver: false }));
  };

  useEffect(() => {
    if (form.client_name) {
      base44.entities.FixedCharge.filter({ client_name: form.client_name, status: 'active' })
        .then(charges => setFixedCharges(charges || []))
        .catch(() => setFixedCharges([]));
    } else { setFixedCharges([]); }
  }, [form.client_name]);

  useEffect(() => {
    if (form.client_name && form.from_location && form.to_location && fixedCharges.length > 0) {
      const routeDesc = `${form.from_location} → ${form.to_location}`;
      const match = fixedCharges.find(c => c.description === routeDesc);
      if (match) { update('base_fare', match.amount); setAutoFilled(true); }
      else { setAutoFilled(false); }
    } else { setAutoFilled(false); }
  }, [form.from_location, form.to_location, fixedCharges]);

  // Calculated duration only (date handled in backend from load/offload)
  useEffect(() => {
    let calculatedDuration = '';
    if (form.load_datetime && form.offload_datetime) {
      const load = new Date(form.load_datetime).getTime();
      const offload = new Date(form.offload_datetime).getTime();
      const diffMs = offload - load;
      if (diffMs > 0) {
        const duration = form.duration_unit === 'days' ? diffMs / 86400000 : diffMs / 3600000;
        calculatedDuration = Math.round(duration * 100) / 100;
      }
    }
    setForm(prev => ({ ...prev, calculated_duration: calculatedDuration }));
  }, [form.load_datetime, form.offload_datetime, form.duration_unit]);

  // Auto revenue (overridable)
  const autoRevenue = (() => {
    const baseFare = Number(form.base_fare) || 0;
    let total = baseFare;
    if (form.load_datetime && form.offload_datetime) {
      const load = new Date(form.load_datetime).getTime();
      const offload = new Date(form.offload_datetime).getTime();
      const diffMs = offload - load;
      if (diffMs > 0) {
        const duration = form.duration_unit === 'days' ? diffMs / 86400000 : diffMs / 3600000;
        const calc = Math.round(duration * 100) / 100;
        const maxAllowed = Number(form.max_allowed_duration) || 0;
        const otRate = Number(form.overtime_rate) || 0;
        const overtime = Math.max(0, calc - maxAllowed);
        total = baseFare + overtime * otRate;
      }
    }
    return total;
  })();

  useEffect(() => {
    if (!revenueOverride) setForm(prev => ({ ...prev, revenue: autoRevenue || '' }));
  }, [autoRevenue, revenueOverride]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      update('delivery_note_url', file_url);
    } catch (err) {} finally { setUploading(false); }
  };

  const generateTripNumber = () => {
    const dateSource = form.load_datetime || (form.trip_date + 'T00:00');
    const date = new Date(dateSource);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `TR-${dd}${mm}-`;
    let maxSeq = 0;
    tripsList.forEach(tr => {
      if (tr.trip_number?.startsWith(prefix)) {
        const seq = parseInt(tr.trip_number.slice(prefix.length), 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    });
    return `${prefix}${String(maxSeq + 1).padStart(2, '0')}`;
  };

  const autoTripNumber = editTrip ? (editTrip.trip_number || '') : generateTripNumber();

  const buildData = (isDraft = false) => ({
    ...form,
    is_draft: isDraft,
    trip_number: form.trip_number || autoTripNumber,
    trip_date: form.load_datetime
      ? form.load_datetime.split('T')[0]
      : (form.offload_datetime ? form.offload_datetime.split('T')[0] : new Date().toISOString().split('T')[0]),
    hours: form.trip_type === 'hourly' ? (Number(form.hours) || 0) : 0,
    revenue: Number(form.revenue) || 0,
    distance_km: Number(form.distance_km) || 0,
    base_fare: Number(form.base_fare) || 0,
    max_allowed_duration: Number(form.max_allowed_duration) || 0,
    overtime_rate: Number(form.overtime_rate) || 0,
    calculated_duration: Number(form.calculated_duration) || 0,
  });

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const data = buildData(false);
      if (editTrip) await updateTrip.mutateAsync({ id: editTrip.id, data });
      else await createTrip.mutateAsync(data);
      if (form.client_name && form.from_location && form.to_location && (Number(form.revenue) || 0) > 0) {
        const routeDesc = `${form.from_location} → ${form.to_location}`;
        if (!fixedCharges.find(c => c.description === routeDesc)) {
          await base44.entities.FixedCharge.create({ client_name: form.client_name, description: routeDesc, amount: Number(form.revenue) || 0, frequency: 'one_time', status: 'active' }).catch(() => {});
        }
      }
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  const fromSuggestions = [...new Set(tripsList.map(tr => tr.from_location).filter(Boolean))];
  const toSuggestions = [...new Set(tripsList.map(tr => tr.to_location).filter(Boolean))];
  const vehicleSuggestions = vehicles.map(v => v.plate_number).filter(Boolean);
  const driverSuggestions = drivers.map(d => d.name).filter(Boolean);
  const clientSuggestions = clients.map(c => c.name).filter(Boolean);
  const selectedClientData = clients.find(c => c.name?.toLowerCase() === form.client_name?.toLowerCase());
  const availableContacts = selectedClientData
    ? (selectedClientData.contact_persons?.length
        ? selectedClientData.contact_persons
        : (selectedClientData.contact_person ? [{ name: selectedClientData.contact_person }] : []))
    : [];

  const isNewClient = form.client_name && !clientSuggestions.some(c => c.toLowerCase() === form.client_name.toLowerCase());
  const isNewVehicle = form.vehicle_plate && !vehicleSuggestions.some(v => v.toLowerCase() === form.vehicle_plate.toLowerCase());
  const isNewDriver = form.driver_name && !driverSuggestions.some(d => d.toLowerCase() === form.driver_name.toLowerCase());

  const createEntity = async (type, payload, flagKey) => {
    setCreating(flagKey);
    try {
      await base44.entities[type].create(payload);
      const updated = await base44.entities[type].list('-created_date', 200);
      if (type === 'Client') setClients(updated || []);
      if (type === 'Vehicle') setVehicles(updated || []);
      if (type === 'Driver') setDrivers(updated || []);
      setCreatedFlags(prev => ({ ...prev, [flagKey]: true }));
    } catch (e) {} finally { setCreating(null); }
  };

  const calculatedDurationNum = Number(form.calculated_duration) || 0;
  const maxAllowedNum = Number(form.max_allowed_duration) || 0;
  const overtimeMetric = Math.max(0, calculatedDurationNum - maxAllowedNum);
  const extraCharges = overtimeMetric * (Number(form.overtime_rate) || 0);
  const isOvertime = overtimeMetric > 0 && form.load_datetime && form.offload_datetime;
  const inputCls = "bg-background/50 border-border backdrop-blur-sm";

  const tripNumberOverridden = !!form.trip_number && form.trip_number !== autoTripNumber;
  const revenueOverridden = revenueOverride && Number(form.revenue) !== autoRevenue;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/80 backdrop-blur-2xl border border-white/[0.08] max-w-4xl max-h-[92vh] overflow-y-auto p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-display text-foreground text-lg">
            {editTrip ? t('edit') : t('new_trip')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-[1fr_290px] gap-6 items-start">
        <div className="space-y-5">
          {/* Client */}
          <Section title="Client">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{t('client')}</Label>
              <Input list="client-suggestions" value={form.client_name} onChange={e => update('client_name', e.target.value)} className={inputCls} />
              <datalist id="client-suggestions">{clientSuggestions.map(c => <option key={c} value={c} />)}</datalist>
              {isNewClient && (
                <CreateNewCard label="client" value={form.client_name} created={createdFlags.client} loading={creating === 'client'}
                  onCreate={() => createEntity('Client', { name: form.client_name }, 'client')} />
              )}
              {form.client_name && fixedCharges.length > 0 && (
                <p className="text-[10px] text-violet-400 mt-1.5">{fixedCharges.length} fixed charge(s) loaded — matching routes auto-fill amount</p>
              )}
              {availableContacts.length > 1 && (
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground mb-1.5">Contact Person</Label>
                  <Select value={form.contact_person} onValueChange={v => update('contact_person', v)}>
                    <SelectTrigger className={inputCls}><SelectValue placeholder="Select contact person" /></SelectTrigger>
                    <SelectContent>
                      {availableContacts.map((cp, i) => (
                        <SelectItem key={i} value={cp.name}>{cp.name}{cp.department ? ` — ${cp.department}` : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </Section>

          {/* Route */}
          <Section title="Route">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('from')}</Label>
                <Input list="from-suggestions" value={form.from_location} onChange={e => update('from_location', e.target.value)} placeholder="Dubai" className={inputCls} />
                <datalist id="from-suggestions">{fromSuggestions.map(loc => <option key={loc} value={loc} />)}</datalist>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('to')}</Label>
                <Input list="to-suggestions" value={form.to_location} onChange={e => update('to_location', e.target.value)} placeholder="Abu Dhabi" className={inputCls} />
                <datalist id="to-suggestions">{toSuggestions.map(loc => <option key={loc} value={loc} />)}</datalist>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{t('trip_type')}</Label>
              <Select value={form.trip_type} onValueChange={v => update('trip_type', v)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>{TRIP_TYPES.map(tp => <SelectItem key={tp} value={tp}>{t(tp)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">Trip #</Label>
              <Input value={form.trip_number || autoTripNumber} onChange={e => update('trip_number', e.target.value)} className={`${inputCls} font-mono text-xs`} />
              {tripNumberOverridden && (
                <p className="text-[10px] text-red-400 font-semibold mt-1">⚠ Overwritten — auto value was {autoTripNumber}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Load Date & Time</Label>
                <Input type="datetime-local" value={form.load_datetime} onChange={e => update('load_datetime', e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Offload Date & Time</Label>
                <Input type="datetime-local" value={form.offload_datetime} onChange={e => update('offload_datetime', e.target.value)} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Duration Unit</Label>
                <Select value={form.duration_unit} onValueChange={v => update('duration_unit', v)}>
                  <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Total Hours</SelectItem>
                    <SelectItem value="days">Total Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Calculated Duration</Label>
                <Input value={form.calculated_duration ? `${form.calculated_duration} ${form.duration_unit === 'days' ? 'Days' : 'Hours'}` : ''} readOnly className={`${inputCls} opacity-60 font-mono text-xs`} />
              </div>
            </div>
          </Section>

          {/* Assignment */}
          <Section title="Assignment">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('vehicle')}</Label>
                <Input list="vehicle-suggestions" value={form.vehicle_plate} onChange={e => update('vehicle_plate', e.target.value)} placeholder="A 12345" className={inputCls} />
                <datalist id="vehicle-suggestions">{vehicleSuggestions.map(v => <option key={v} value={v} />)}</datalist>
                {isNewVehicle && (
                  <CreateNewCard label="vehicle" value={form.vehicle_plate} created={createdFlags.vehicle} loading={creating === 'vehicle'}
                    onCreate={() => createEntity('Vehicle', { plate_number: form.vehicle_plate, make: '—', model: '—' }, 'vehicle')} />
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('driver')}</Label>
                <Input list="driver-suggestions" value={form.driver_name} onChange={e => update('driver_name', e.target.value)} placeholder="Ahmed" className={inputCls} />
                <datalist id="driver-suggestions">{driverSuggestions.map(d => <option key={d} value={d} />)}</datalist>
                {isNewDriver && (
                  <CreateNewCard label="driver" value={form.driver_name} created={createdFlags.driver} loading={creating === 'driver'}
                    onCreate={() => createEntity('Driver', { name: form.driver_name, phone: '—' }, 'driver')} />
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{t('payment_status')}</Label>
              <Select value={form.payment_status} onValueChange={v => update('payment_status', v)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_STATUSES.map(ps => <SelectItem key={ps} value={ps}>{t(ps)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </Section>

          {/* Delivery */}
          <Section title="Delivery">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('delivery_note')} #</Label>
                <Input value={form.delivery_note_number} onChange={e => update('delivery_note_number', e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('distance')}</Label>
                <Input type="number" value={form.distance_km} onChange={e => update('distance_km', e.target.value)} className={inputCls} />
              </div>
            </div>
            {form.trip_type === 'return' && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Return Of (Trip #)</Label>
                <Input value={form.return_trip_number} onChange={e => update('return_trip_number', e.target.value)} placeholder="TR-0607-0001" className={inputCls} />
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{t('delivery_note')} Attachment</Label>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
              {form.delivery_note_url ? (
                <div className="flex items-center gap-2 glass-card p-2.5">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <a href={form.delivery_note_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate flex-1">View attachment</a>
                  <Button type="button" variant="ghost" size="sm" onClick={() => update('delivery_note_url', '')} className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400">
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full border-border border-dashed">
                  <Upload className="w-4 h-4 mr-1.5" /> {uploading ? t('loading') : 'Upload Delivery Note'}
                </Button>
              )}
            </div>
          </Section>

          {/* Financial */}
          <Section title="Financial">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Base Fare (AED)</Label>
                <Input type="number" value={form.base_fare} onChange={e => update('base_fare', e.target.value)} className={inputCls} />
                {autoFilled && <p className="text-[10px] text-violet-400 mt-1">Auto-filled from fixed charge</p>}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Max Allowed ({form.duration_unit === 'days' ? 'Days' : 'Hrs'})</Label>
                <Input type="number" value={form.max_allowed_duration} onChange={e => update('max_allowed_duration', e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">Overtime Rate (AED)</Label>
                <Input type="number" value={form.overtime_rate} onChange={e => update('overtime_rate', e.target.value)} className={inputCls} />
              </div>
            </div>
            {isOvertime && (
              <div className="glass-card p-3 border-red-500/30 bg-red-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-red-400 font-medium">Overtime Active</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{overtimeMetric} {form.duration_unit === 'days' ? 'days' : 'hrs'} × {formatCurrency(Number(form.overtime_rate) || 0)}</p>
                  </div>
                  <p className="text-sm font-semibold text-red-400">+{formatCurrency(extraCharges)}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5">{t('amount')} (Revenue)</Label>
                <Input type="number" value={form.revenue} onChange={e => { update('revenue', e.target.value); setRevenueOverride(true); }} className={inputCls} />
                {revenueOverridden ? (
                  <p className="text-[10px] text-red-400 font-semibold mt-1">⚠ Overwritten — calculated value was {formatCurrency(autoRevenue)}</p>
                ) : (
                  <p className="text-[10px] text-primary mt-1">Auto-calculated: base fare + overtime (editable)</p>
                )}
              </div>
              {form.trip_type === 'hourly' && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5">{t('hours')}</Label>
                  <Input type="number" value={form.hours} onChange={e => update('hours', e.target.value)} className={inputCls} />
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes">
            <Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} className={inputCls} />
          </Section>
        </div>

        {/* Live calculation panel */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-3">
            <div className="glass-card p-4 space-y-3">
              <p className="eyebrow">Live Calculation</p>
              <CalcRow label="Base Fare" value={formatCurrency(Number(form.base_fare) || 0)} />
              <CalcRow label={`Duration (${form.duration_unit === 'days' ? 'days' : 'hrs'})`} value={form.calculated_duration ? `${form.calculated_duration}` : '—'} />
              <CalcRow label={`Max Allowed`} value={form.max_allowed_duration || '—'} />
              {isOvertime ? (
                <>
                  <div className="border-t border-white/10 pt-3 space-y-2">
                    <CalcRow label="Overtime" value={`${overtimeMetric} ${form.duration_unit === 'days' ? 'days' : 'hrs'}`} tone="text-amber-300" />
                    <CalcRow label="Overtime Rate" value={formatCurrency(Number(form.overtime_rate) || 0)} />
                    <CalcRow label="Overtime Charges" value={`+${formatCurrency(extraCharges)}`} tone="text-rose-300" />
                  </div>
                </>
              ) : (
                <p className="text-[10px] text-muted-foreground italic">{form.load_datetime && form.offload_datetime ? 'Within allowed duration — no overtime' : 'Enter load & offload times'}</p>
              )}
              <div className="border-t border-white/10 pt-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-foreground">Revenue</span>
                  <span className={`text-xl font-bold tabular-nums font-display ${revenueOverridden ? 'text-red-400' : 'text-primary'}`}>{formatCurrency(Number(form.revenue) || 0)}</span>
                </div>
              </div>
            </div>
            <div className="glass-card p-3">
              <p className="text-[10px] text-muted-foreground leading-relaxed">Trip date is set automatically from the load time. Revenue is auto-calculated and can be overwritten.</p>
            </div>
          </div>
        </div>
        </div>

        {/* Mobile live calc */}
        <div className="lg:hidden glass-card p-4 space-y-2 mb-4">
          <p className="eyebrow">Live Calculation</p>
          <CalcRow label="Base Fare" value={formatCurrency(Number(form.base_fare) || 0)} />
          {isOvertime && <CalcRow label="Overtime" value={`+${formatCurrency(extraCharges)}`} tone="text-rose-300" />}
          <div className="border-t border-white/10 pt-2 flex justify-between items-baseline">
            <span className="text-sm font-semibold text-foreground">Revenue</span>
            <span className={`text-lg font-bold tabular-nums font-display ${revenueOverridden ? 'text-red-400' : 'text-primary'}`}>{formatCurrency(Number(form.revenue) || 0)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">{t('cancel')}</Button>
          <div className="flex-1" />
          <Button onClick={handleSubmit} disabled={saving} className="bg-primary hover:bg-primary/90">
            {saving ? t('loading') : t('submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <div className="border-t border-white/[0.04] pt-4 first:border-t-0 first:pt-0">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-3">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function CalcRow({ label, value, tone = 'text-foreground' }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}