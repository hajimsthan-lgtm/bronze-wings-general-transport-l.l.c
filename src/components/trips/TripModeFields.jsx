import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X, Building2, Route as RouteIcon, CalendarClock, Truck, Package, Wallet, StickyNote, MapPin, Flag, Hash, Ruler, RotateCcw, DollarSign, Gauge, Timer, User, Clock, Plus, Store } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import CreateNewCard from './CreateNewCard';
import DateTimePicker from '@/components/common/DateTimePicker';
import Section from './Section';
import IconInput from './IconInput';
import TripTypeSelector from './TripTypeSelector';
import VendorPaymentFields from './VendorPaymentFields';
import TripFinancialFields from './TripFinancialFields';

const PAYMENT_STATUSES = ['corporate_credit', 'cash_received', 'bank_received'];

export default function TripModeFields({ p }) {
  const {
    form, update, t, inputCls,
    fromSuggestions, toSuggestions, vehicleSuggestions, driverSuggestions, clientSuggestions,
    isNewClient, isNewVehicle, isNewDriver,
    createdFlags, creating, createEntity,
    fixedCharges, autoFilled,
    availableContacts,
    autoTripNumber, tripNumberOverridden,
    fileInputRef, handleFileUpload, uploading,
    isOvertime, overtimeMetric, extraCharges,
    revenueOverridden, autoRevenue,
    serviceProviderVendors,
    allVehicles, allDrivers,
  } = p;

  const selectedVehicle = allVehicles?.find((v) => v.plate_number === form.vehicle_plate);
  const selectedDriver = allDrivers?.find((d) => d.name === form.driver_name);
  const vehicleIsVendor = !!selectedVehicle?.vendor_name;
  const driverIsVendor = !!selectedDriver?.vendor_name;

  return (
    <>
      {/* Client */}
      <Section title={t('client')} icon={Building2} accent="30,215,96" delay={0}>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('client')}</Label>
          <IconInput icon={User} list="client-suggestions" value={form.client_name} onChange={(e) => update('client_name', e.target.value)} className={inputCls} />
          <datalist id="client-suggestions">{clientSuggestions.map((c) => <option key={c} value={c} />)}</datalist>
          {isNewClient && (
            <CreateNewCard label="client" value={form.client_name} created={createdFlags.client} loading={creating === 'client'}
              onCreate={() => createEntity('Client', { name: form.client_name }, 'client')} />
          )}
          {form.client_name && fixedCharges.length > 0 && (
            <p className="text-[10px] text-blue-400 mt-1.5">{fixedCharges.length} fixed charge(s) loaded — matching routes auto-fill amount</p>
          )}
          {availableContacts.length > 1 && (
            <div className="mt-2">
              <Label className="text-xs text-white/60 mb-1.5">Contact Person</Label>
              <Select value={form.contact_person} onValueChange={(v) => update('contact_person', v)}>
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
      <Section title="Route" icon={RouteIcon} accent="16,185,129" delay={60}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('from')}</Label>
            <IconInput icon={MapPin} list="from-suggestions" value={form.from_location} onChange={(e) => update('from_location', e.target.value)} placeholder="Dubai" className={inputCls} />
            <datalist id="from-suggestions">{fromSuggestions.map((loc) => <option key={loc} value={loc} />)}</datalist>
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('to')}</Label>
            <IconInput icon={Flag} list="to-suggestions" value={form.to_location} onChange={(e) => update('to_location', e.target.value)} placeholder="Abu Dhabi" className={inputCls} />
            <datalist id="to-suggestions">{toSuggestions.map((loc) => <option key={loc} value={loc} />)}</datalist>
          </div>
        </div>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('trip_type')}</Label>
          <TripTypeSelector value={form.trip_type} onChange={(v) => update('trip_type', v)} t={t} />
        </div>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">Trip #</Label>
          <IconInput icon={Hash} value={form.trip_number || autoTripNumber} onChange={(e) => update('trip_number', e.target.value)} className={`${inputCls} font-mono text-xs`} />
          {tripNumberOverridden && (
            <p className="text-[10px] text-red-400 font-semibold mt-1">⚠ Overwritten — auto value was {autoTripNumber}</p>
          )}
        </div>
      </Section>

      {/* Schedule */}
      <Section title="Schedule" icon={CalendarClock} accent="245,158,11" delay={120}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">Load Date &amp; Time</Label>
            <DateTimePicker value={form.load_datetime} onChange={(v) => update('load_datetime', v)} placeholder="Load time" />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">Offload Date &amp; Time</Label>
            <DateTimePicker value={form.offload_datetime} onChange={(v) => update('offload_datetime', v)} placeholder="Offload time" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">Duration Unit</Label>
            <Select value={form.duration_unit} onValueChange={(v) => update('duration_unit', v)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Total Hours</SelectItem>
                <SelectItem value="days">Total Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">Calculated Duration</Label>
            <IconInput icon={Gauge} value={form.calculated_duration ? `${form.calculated_duration} ${form.duration_unit === 'days' ? 'Days' : 'Hours'}` : ''} readOnly className={`${inputCls} opacity-60 font-mono text-xs`} />
          </div>
        </div>
      </Section>

      {/* Assignment */}
      <Section title="Assignment" icon={Truck} accent="20,184,166" delay={180}>
        {/* Mode toggle */}
        <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
          <button type="button" onClick={() => { update('assignment_mode', 'company'); update('vendor_name', ''); }}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${form.assignment_mode !== 'vendor' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <Truck className="w-3.5 h-3.5" /> Company Fleet
          </button>
          <button type="button" onClick={() => update('assignment_mode', 'vendor')}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${form.assignment_mode === 'vendor' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <Store className="w-3.5 h-3.5" /> Service Provider
          </button>
        </div>

        {/* Service Provider dropdown — only in vendor mode */}
        {form.assignment_mode === 'vendor' && (
          <div>
            <Label className="text-xs text-white/60 mb-1.5 flex items-center gap-1"><Store className="w-3 h-3" /> Service Provider</Label>
            <Select value={form.vendor_name || ''} onValueChange={(v) => { update('vendor_name', v); update('vehicle_plate', ''); update('driver_name', ''); }}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="Select Vendor" /></SelectTrigger>
              <SelectContent>
                {serviceProviderVendors.map((v) => <SelectItem key={v.id} value={v.name}>{v.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('vehicle')}</Label>
            <IconInput icon={Truck} list="vehicle-suggestions" value={form.vehicle_plate} onChange={(e) => update('vehicle_plate', e.target.value)} placeholder="A 12345" className={inputCls} />
            <datalist id="vehicle-suggestions">{vehicleSuggestions.map((v) => <option key={v} value={v} />)}</datalist>
            {vehicleIsVendor && (
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">Vendor</span>
            )}
            {isNewVehicle && form.assignment_mode === 'vendor' && form.vendor_name && (
              <button type="button" onClick={() => createEntity('Vehicle', { plate_number: form.vehicle_plate, make: '—', model: '—', vendor_name: form.vendor_name }, 'vehicle')}
                disabled={creating === 'vehicle'}
                className="text-[10px] text-primary hover:text-primary-light mt-1 inline-flex items-center gap-1 transition-colors">
                <Plus className="w-3 h-3" /> Add new vehicle under {form.vendor_name}
              </button>
            )}
            {isNewVehicle && form.assignment_mode === 'company' && (
              <CreateNewCard label="vehicle" value={form.vehicle_plate} created={createdFlags.vehicle} loading={creating === 'vehicle'}
                onCreate={() => createEntity('Vehicle', { plate_number: form.vehicle_plate, make: '—', model: '—' }, 'vehicle')} />
            )}
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('driver')}</Label>
            <IconInput icon={User} list="driver-suggestions" value={form.driver_name} onChange={(e) => update('driver_name', e.target.value)} placeholder="Ahmed" className={inputCls} />
            <datalist id="driver-suggestions">{driverSuggestions.map((d) => <option key={d} value={d} />)}</datalist>
            {driverIsVendor && (
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">Vendor</span>
            )}
            {isNewDriver && form.assignment_mode === 'vendor' && form.vendor_name && (
              <button type="button" onClick={() => createEntity('Driver', { name: form.driver_name, phone: '—', vendor_name: form.vendor_name }, 'driver')}
                disabled={creating === 'driver'}
                className="text-[10px] text-primary hover:text-primary-light mt-1 inline-flex items-center gap-1 transition-colors">
                <Plus className="w-3 h-3" /> Add new driver under {form.vendor_name}
              </button>
            )}
            {isNewDriver && form.assignment_mode === 'company' && (
              <CreateNewCard label="driver" value={form.driver_name} created={createdFlags.driver} loading={creating === 'driver'}
                onCreate={() => createEntity('Driver', { name: form.driver_name, phone: '—' }, 'driver')} />
            )}
          </div>
        </div>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('payment_status')}</Label>
          <Select value={form.payment_status} onValueChange={(v) => update('payment_status', v)}>
            <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_STATUSES.map((ps) => <SelectItem key={ps} value={ps}>{t(ps)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </Section>

      {/* Vendor Payment — only in Service Provider mode */}
      {form.assignment_mode === 'vendor' && form.vendor_name && (
        <VendorPaymentFields p={p} />
      )}

      {/* Delivery */}
      <Section title="Delivery" icon={Package} accent="6,182,212" delay={240}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('delivery_note')} #</Label>
            <IconInput icon={FileText} value={form.delivery_note_number} onChange={(e) => update('delivery_note_number', e.target.value)} className={inputCls} />
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('distance')}</Label>
            <IconInput icon={Ruler} type="number" value={form.distance_km} onChange={(e) => update('distance_km', e.target.value)} className={inputCls} />
          </div>
        </div>
        {form.trip_type === 'return' && (
          <div>
            <Label className="text-xs text-white/60 mb-1.5">Return Of (Trip #)</Label>
            <IconInput icon={RotateCcw} value={form.return_trip_number} onChange={(e) => update('return_trip_number', e.target.value)} placeholder="TR-0607-0001" className={inputCls} />
          </div>
        )}
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('delivery_note')} Attachment</Label>
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

      {/* Financial — data entry fields, belongs with the form */}
      <TripFinancialFields p={p} />

      {/* Notes */}
      <Section title={t('notes')} icon={StickyNote} accent="148,163,184" delay={360}>
        <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} className={inputCls} />
      </Section>
    </>
  );
}