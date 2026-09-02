import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, X, Building2, Route as RouteIcon, CalendarClock, Truck, Package, Wallet, StickyNote, MapPin, Flag, Hash, Ruler, RotateCcw, DollarSign, Gauge, Timer, User, Clock, Store, AlertCircle, Shield, ShieldCheck, Plus, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/formatters';
import CreateNewCard from './CreateNewCard';
import DateTimePicker from '@/components/common/DateTimePicker';
import Section from './Section';
import IconInput from './IconInput';
import TripTypeSelector from './TripTypeSelector';
import VendorPaymentFields from './VendorPaymentFields';
import TripFinancialFields from './TripFinancialFields';
import SearchableSelect from '@/components/common/SearchableSelect';
import { Switch } from '@/components/ui/switch';
import GradientAvatar from '@/components/common/GradientAvatar';
import ContactPersonSelect from './ContactPersonSelect';
import { autoCap } from '@/lib/formEnhancements';

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
    allVehicles, allDrivers, allClients,
    errors = {},
  } = p;

  const [manualClientMode, setManualClientMode] = useState(false);

  const errCls = (field) => errors[field] ? ' !border-red-500/70 !ring-2 !ring-red-500/30' : '';
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const loadIsPast = form.load_datetime && new Date(form.load_datetime) < todayMidnight;

  // Sanitizers — strip dangerous/invalid characters before they reach state
  const sanitizePlain = (v) => v.replace(/[<>]/g, '').slice(0, 100);
  const sanitizePhone = (v) => v.replace(/[^0-9+\-\s()]/g, '').slice(0, 20);
  const sanitizeDistance = (v) => {
    if (v === '' || v === '-') return '';
    const n = Math.max(0, Number(v) || 0);
    return Number.isFinite(n) && n > 0 ? String(n) : '';
  };

  const initials = (name) => (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const selectedVehicle = allVehicles?.find((v) => v.plate_number === form.vehicle_plate);
  const selectedDriver = allDrivers?.find((d) => d.name === form.driver_name);
  const selectedClient = allClients?.find((c) => c.name === form.client_name);
  const vehicleIsVendor = !!selectedVehicle?.vendor_name;
  const driverIsVendor = !!selectedDriver?.vendor_name;

  // Strict data separation: company vs vendor vehicles/drivers, filtered to active status
  const availableVehicles = (form.assignment_mode === 'vendor'
    ? (allVehicles || []).filter((v) => v.vendor_name === form.vendor_name)
    : (allVehicles || []).filter((v) => !v.vendor_name)
  ).filter((v) => v.status === 'active' || v.plate_number === form.vehicle_plate);

  const availableDrivers = (form.assignment_mode === 'vendor'
    ? (allDrivers || []).filter((d) => d.vendor_name === form.vendor_name)
    : (allDrivers || []).filter((d) => !d.vendor_name)
  ).filter((d) => d.status === 'active' || d.name === form.driver_name);

  // Bidirectional auto-link: driver ↔ vehicle based on assigned relationships
  const handleDriverSelect = (driverName) => {
    update('driver_name', driverName);
    const driver = (allDrivers || []).find((d) => d.name === driverName);
    if (driver?.assigned_vehicle && availableVehicles.some((v) => v.plate_number === driver.assigned_vehicle)) {
      update('vehicle_plate', driver.assigned_vehicle);
    }
  };

  const handleVehicleSelect = (plateNumber) => {
    update('vehicle_plate', plateNumber);
    const vehicle = (allVehicles || []).find((v) => v.plate_number === plateNumber);
    if (vehicle?.assigned_driver && availableDrivers.some((d) => d.name === vehicle.assigned_driver)) {
      update('driver_name', vehicle.assigned_driver);
    }
  };

  return (
    <>
      {/* Client */}
      <Section title={t('client')} icon={Building2} accent="99,102,241" delay={0}>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('client')} <span className="text-red-400">*</span></Label>
          {manualClientMode ? (
            <>
              <IconInput icon={User} list="client-suggestions" value={form.client_name} onChange={(e) => update('client_name', e.target.value)} className={`${inputCls}${errCls('client_name')}`} placeholder="Type client name" />
              <datalist id="client-suggestions">{clientSuggestions.map((c) => <option key={c} value={c} />)}</datalist>
              <button type="button" onClick={() => { setManualClientMode(false); }} className="text-[10px] text-primary mt-1 flex items-center gap-1 hover:underline">
                ← Select from list
              </button>
            </>
          ) : (
            <>
              <SearchableSelect
                value={form.client_name || ''}
                onChange={(v) => update('client_name', v)}
                placeholder="Select client"
                className={errCls('client_name')}
                renderLabel={(it) => (
                  <span className="flex items-center gap-2 truncate">
                    {selectedClient?.image_url ? (
                      <img src={selectedClient.image_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <GradientAvatar name={it.label} size="xs" />
                    )}
                    <span className="truncate">{it.label}</span>
                  </span>
                )}
                items={(allClients || []).filter((c) => c.status === 'active' || c.name === form.client_name).map((c) => ({
                  value: c.name,
                  label: c.name,
                  search: c.contact_person ? ` ${c.contact_person}` : '',
                  content: (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {c.image_url ? (
                        <img src={c.image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <GradientAvatar name={c.name} size="md" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {c.contact_person || 'No contact'} · ID: {(c.id || '').slice(0, 8)}
                        </p>
                      </div>
                      {c.status && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${
                          c.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                        }`}>
                          {c.status}
                        </span>
                      )}
                    </div>
                  ),
                }))}
              />
              <button type="button" onClick={() => { setManualClientMode(true); update('client_name', ''); }} className="text-[10px] text-primary mt-1 flex items-center gap-1 hover:underline">
                <Plus className="w-3 h-3" /> New client not in list? Type manually
              </button>
            </>
          )}
          {errors.client_name && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.client_name}</p>}
          {isNewClient && (
            <CreateNewCard label="client" value={form.client_name} created={createdFlags.client} loading={creating === 'client'}
              onCreate={() => createEntity('Client', { name: form.client_name }, 'client')} />
          )}
          {form.client_name && fixedCharges.length > 0 && (
            <p className="text-[10px] text-blue-400 mt-1.5">{fixedCharges.length} fixed charge(s) loaded — matching routes auto-fill amount</p>
          )}
          {availableContacts.length > 0 && (
            <div className="mt-2">
              <Label className="text-xs text-white/60 mb-1.5">Contact Person {availableContacts.length === 1 && <span className="text-emerald-400/70 text-[9px]">· auto-selected</span>}</Label>
              <ContactPersonSelect
                contacts={availableContacts}
                value={form.contact_person}
                onChange={(v) => update('contact_person', v)}
              />
            </div>
          )}
        </div>
      </Section>

      {/* Route */}
      <Section title="Route" icon={RouteIcon} accent="16,185,129" delay={60}>
        {/* Trip Type — select first, at top */}
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('trip_type')} <span className="text-red-400">*</span></Label>
          <TripTypeSelector value={form.trip_type} onChange={(v) => update('trip_type', v)} t={t} />
          {form.trip_type === 'contract' && (
            <p className="text-[10px] text-amber-400/80 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Contract mode — duration & overtime fields are hidden
            </p>
          )}
        </div>

        {/* From / To — shown after type selection */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('from')} <span className="text-red-400">*</span></Label>
            <IconInput icon={MapPin} list="from-suggestions" dir="auto" value={form.from_location} onChange={(e) => update('from_location', autoCap(sanitizePlain(e.target.value)))} placeholder="Dubai" className={`${inputCls}${errCls('from_location')}`} />
            <datalist id="from-suggestions">{fromSuggestions.map((loc) => <option key={loc} value={loc} />)}</datalist>
            {errors.from_location && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.from_location}</p>}
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('to')} <span className="text-red-400">*</span></Label>
            <IconInput icon={Flag} list="to-suggestions" dir="auto" value={form.to_location} onChange={(e) => update('to_location', autoCap(sanitizePlain(e.target.value)))} placeholder="Abu Dhabi" className={`${inputCls}${errCls('to_location')}`} />
            <datalist id="to-suggestions">{toSuggestions.map((loc) => <option key={loc} value={loc} />)}</datalist>
            {errors.to_location && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.to_location}</p>}
          </div>
        </div>

        {/* Permitted Routes toggle */}
        <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {form.permit_required ? (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <Shield className="w-4 h-4 text-muted-foreground" />
              )}
              <div>
                <Label className="text-xs text-white/70 font-semibold cursor-pointer">Permitted Route</Label>
                <p className="text-[10px] text-muted-foreground">Toggle on if this route requires a special permit</p>
              </div>
            </div>
            <Switch
              checked={!!form.permit_required}
              onCheckedChange={(v) => {
                update('permit_required', v);
                if (!v) update('permit_name', '');
              }}
            />
          </div>
          {form.permit_required && (
            <div className="animate-fade-in">
              <Label className="text-xs text-white/60 mb-1.5">Permit Name <span className="text-red-400">*</span></Label>
              <IconInput
                icon={Shield}
                value={form.permit_name || ''}
                onChange={(e) => update('permit_name', autoCap(sanitizePlain(e.target.value)))}
                placeholder="e.g. Hazmat Pass, Over-dimensional, Cold Chain..."
                className={inputCls}
              />
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs text-white/60 mb-1.5">Trip # <span className="text-white/30 font-normal">(max 20 chars)</span></Label>
          <IconInput icon={Hash} value={form.trip_number || autoTripNumber} onChange={(e) => update('trip_number', e.target.value.slice(0, 20))} maxLength={20} className={`${inputCls} font-mono text-xs`} />
          {tripNumberOverridden && (
            <p className="text-[10px] text-red-400 font-semibold mt-1">⚠ Overwritten — auto value was {autoTripNumber}</p>
          )}
        </div>
      </Section>

      {/* Schedule */}
      <Section title="Schedule" icon={CalendarClock} accent="245,158,11" delay={120}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div>
            <Label className="text-xs text-white/60 mb-1.5">Load Date &amp; Time</Label>
            <DateTimePicker value={form.load_datetime} onChange={(v) => update('load_datetime', v)} placeholder="Load time" />
            {loadIsPast && (
              <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Load date is in the past — please verify</p>
            )}
          </div>
          <div>
            <Label className="text-xs text-white/60 mb-1.5">Offload Date &amp; Time</Label>
            <DateTimePicker value={form.offload_datetime} onChange={(v) => update('offload_datetime', v)} placeholder="Offload time" />
          </div>
        </div>
        {form.trip_type !== 'contract' && (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
        )}
      </Section>

      {/* Assignment */}
      <Section title="Assignment" icon={Truck} accent="6,182,212" delay={180}>
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
            <SearchableSelect
              value={form.vendor_name || ''}
              onChange={(v) => { update('vendor_name', v); update('vehicle_plate', ''); update('driver_name', ''); }}
              placeholder="Select Vendor"
              items={serviceProviderVendors.map((v) => ({ value: v.name, label: v.name }))}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Driver first — auto-selects assigned vehicle */}
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('driver')} <span className="text-red-400">*</span></Label>
            <SearchableSelect
              value={form.driver_name || ''}
              onChange={handleDriverSelect}
              placeholder="Select driver"
              className={errCls('driver_name')}
              renderLabel={(it) => (
                <span className="flex items-center gap-2 truncate">
                  {selectedDriver?.image_url ? (
                    <img src={selectedDriver.image_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <GradientAvatar name={it.label} size="xs" />
                  )}
                  <span className="truncate">{it.label}</span>
                </span>
              )}
              items={availableDrivers.map((d) => ({
                value: d.name,
                label: d.name,
                search: d.phone ? ` ${d.phone}` : '',
                content: (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {d.image_url ? (
                      <img src={d.image_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <GradientAvatar name={d.name} size="md" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {d.phone || 'No phone'} · ID: {(d.id || '').slice(0, 8)}
                      </p>
                    </div>
                    {d.status && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${
                        d.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                      }`}>
                        {d.status}
                      </span>
                    )}
                  </div>
                ),
              }))}
            />
            {driverIsVendor && (
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">Vendor</span>
            )}
            {selectedDriver?.assigned_vehicle && availableVehicles.some((v) => v.plate_number === selectedDriver.assigned_vehicle) && (
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">↳ Auto-selected assigned vehicle</p>
            )}
            {errors.driver_name && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.driver_name}</p>}
          </div>
          {/* Vehicle second — auto-selects assigned driver */}
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('vehicle')} <span className="text-red-400">*</span></Label>
            <SearchableSelect
              value={form.vehicle_plate || ''}
              onChange={handleVehicleSelect}
              placeholder="Select vehicle"
              className={errCls('vehicle_plate')}
              renderLabel={(it) => (
                <span className="flex items-center gap-2 truncate">
                  {selectedVehicle?.image_url ? (
                    <img src={selectedVehicle.image_url} alt="" className="w-5 h-5 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-3 h-3" />
                    </span>
                  )}
                  <span className="truncate">{it.label}</span>
                </span>
              )}
              items={availableVehicles.map((v) => ({
                value: v.plate_number,
                label: v.plate_number,
                search: v.make && v.model ? ` ${v.make} ${v.model}` : (v.make ? ` ${v.make}` : ''),
                content: (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                      {v.image_url ? (
                        <img src={v.image_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <Truck className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{v.plate_number}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {[v.make, v.model].filter(Boolean).join(' ') || 'No model'} · ID: {(v.id || '').slice(0, 8)}
                      </p>
                    </div>
                    {v.status && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full capitalize flex-shrink-0 ${
                        v.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted text-muted-foreground'
                      }`}>
                        {v.status}
                      </span>
                    )}
                  </div>
                ),
              }))}
            />
            {vehicleIsVendor && (
              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">Vendor</span>
            )}
            {selectedVehicle?.assigned_driver && availableDrivers.some((d) => d.name === selectedVehicle.assigned_driver) && (
              <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">↳ Auto-selected assigned driver</p>
            )}
            {errors.vehicle_plate && <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.vehicle_plate}</p>}
          </div>
        </div>
        {/* Driver mobile number */}
        <div>
          <Label className="text-xs text-white/60 mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Driver Mobile Number</Label>
          <IconInput icon={User} type="tel" inputMode="tel" value={form.driver_phone || ''} onChange={(e) => update('driver_phone', sanitizePhone(e.target.value))} placeholder="+971 50 123 4567" className={inputCls} />
          {selectedDriver?.phone && selectedDriver.phone !== '—' && (
            <p className="text-[10px] text-emerald-400 mt-1">Auto-filled from driver profile</p>
          )}
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
      <Section title="Delivery" icon={Package} accent="139,92,246" delay={240}>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('delivery_note')} #</Label>
          <div className="relative">
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 inline-flex items-center px-1.5 h-6 rounded-md bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-bold font-mono tracking-wider pointer-events-none select-none">DN#</span>
            <Input maxLength={50} value={form.delivery_note_number} onChange={(e) => update('delivery_note_number', sanitizePlain(e.target.value))} className={`${inputCls} pl-14 font-mono text-sm tracking-wider`} placeholder="000000" />
          </div>
          {form.delivery_note_number && (
            <p className="text-[10px] text-cyan-400/70 mt-1 font-mono">Bubble: DN#{form.delivery_note_number}</p>
          )}
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
              <a href={form.delivery_note_url} target="_blank" rel="noopener noreferrer" className="h-7 w-7 p-0 inline-flex items-center justify-center text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-md transition-colors flex-shrink-0" title="View document">
                <Eye className="w-3.5 h-3.5" />
              </a>
              <Button type="button" variant="ghost" size="sm" onClick={() => update('delivery_note_url', '')} className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400">
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
      <Section title={t('notes')} icon={StickyNote} accent="236,72,153" delay={360}>
        <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} className={inputCls} />
      </Section>
    </>
  );
}