import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, ShieldCheck, StickyNote, Save } from 'lucide-react';
import VehicleLicenseScanZone from './VehicleLicenseScanZone';
import TypeCombobox from './TypeCombobox';
import DatePicker from '@/components/common/DatePicker';

function mapExtractedToVehicle(data) {
  if (!data) return { vehicleFields: {}, extraNotes: '' };
  const modelRaw = (data.model || '').trim();
  let make = '';
  let model = '';
  if (modelRaw) {
    const parts = modelRaw.split(/\s+/);
    if (parts.length >= 2) { make = parts[0]; model = parts.slice(1).join(' '); }
    else { make = modelRaw; model = ''; }
  }
  const vehicleFields = {
    plate_number: data.trafficPlateNo || '',
    make, model,
    registration_expiry: data.expDate || '',
    insurance_expiry: data.insExpDate || '',
  };
  const lines = [];
  if (data.placeOfIssue) lines.push(`Place of Issue: ${data.placeOfIssue}`);
  if (data.tcNo) lines.push(`TC No: ${data.tcNo}`);
  if (data.plateCategory) lines.push(`Plate Category: ${data.plateCategory}`);
  if (data.ownerEnglish) lines.push(`Owner: ${data.ownerEnglish}`);
  if (data.ownerArabic) lines.push(`Owner (AR): ${data.ownerArabic}`);
  if (data.nationality) lines.push(`Nationality: ${data.nationality}`);
  if (data.insurer) lines.push(`Insurer: ${data.insurer}`);
  if (data.policyNo) lines.push(`Policy No: ${data.policyNo}`);
  if (data.insuranceType) lines.push(`Insurance Type: ${data.insuranceType}`);
  if (data.mortgageBy) lines.push(`Mortgage By: ${data.mortgageBy}`);
  if (data.numOfPassengers) lines.push(`Passengers: ${data.numOfPassengers}`);
  if (data.origin) lines.push(`Origin: ${data.origin}`);
  if (data.vehicleColor) lines.push(`Color: ${data.vehicleColor}`);
  if (data.vehicleCategory) lines.push(`Vehicle Category: ${data.vehicleCategory}`);
  if (data.vehicleType) lines.push(`Vehicle Type: ${data.vehicleType}`);
  if (data.gvw) lines.push(`GVW: ${data.gvw}`);
  if (data.emptyWeight) lines.push(`Empty Weight: ${data.emptyWeight}`);
  if (data.engineNo) lines.push(`Engine No: ${data.engineNo}`);
  if (data.chassisNo) lines.push(`Chassis No: ${data.chassisNo}`);
  if (data.regDate) lines.push(`Reg Date: ${data.regDate}`);
  return { vehicleFields, extraNotes: lines.join('\n') };
}

const EMPTY = {
  plate_number: '', image_url: '', make: '', model: '', year: '',
  type: 'truck', status: 'active', assigned_driver: '', vendor_name: '',
  registration_expiry: '', insurance_expiry: '', fuel_type: 'diesel', notes: '',
  ownership_front_url: '', ownership_back_url: '',
};

function FormSection({ icon: Icon, title, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function FormField({ label, span2, children }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

export default function VehicleForm({ editItem, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (editItem) setForm({ ...EMPTY, ...editItem, year: editItem.year || '' });
    else setForm(EMPTY);
  }, [editItem]);

  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const handleExtracted = (data, fileUrl) => {
    const { vehicleFields, extraNotes } = mapExtractedToVehicle(data);
    setForm((p) => ({
      ...p,
      ...vehicleFields,
      ownership_front_url: fileUrl || p.ownership_front_url,
      notes: extraNotes || p.notes,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ ...form, year: form.year ? Number(form.year) : undefined });
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <VehicleLicenseScanZone onExtracted={handleExtracted} />

      <FormSection icon={Truck} title="Vehicle Details">
        <FormField label="Plate Number">
          <Input value={form.plate_number} onChange={(e) => update('plate_number', e.target.value)} className="bg-background border-border" />
        </FormField>
        <FormField label="Year">
          <Input type="number" value={form.year} onChange={(e) => update('year', e.target.value)} className="bg-background border-border" />
        </FormField>
        <FormField label="Make">
          <Input value={form.make} onChange={(e) => update('make', e.target.value)} className="bg-background border-border" />
        </FormField>
        <FormField label="Model">
          <Input value={form.model} onChange={(e) => update('model', e.target.value)} className="bg-background border-border" />
        </FormField>
        <FormField label="Type">
          <TypeCombobox value={form.type} onChange={(v) => update('type', v)} suggestions={['truck', 'trailer', 'tanker', 'crane', 'pickup', 'chillervan', 'freezervan', 'othermachines', 'other']} storageKey="vehicle_type_custom" />
        </FormField>
        <FormField label="Status">
          <Select value={form.status} onValueChange={(v) => update('status', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{['active', 'maintenance', 'inactive'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="Fuel Type">
          <Select value={form.fuel_type} onValueChange={(v) => update('fuel_type', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{['diesel', 'petrol'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </FormField>
        <FormField label="Assigned Driver">
          <Input value={form.assigned_driver} onChange={(e) => update('assigned_driver', e.target.value)} className="bg-background border-border" />
        </FormField>
      </FormSection>

      <FormSection icon={ShieldCheck} title="Registration & Insurance">
        <FormField label="Registration Expiry">
          <DatePicker value={form.registration_expiry} onChange={(v) => update('registration_expiry', v)} />
        </FormField>
        <FormField label="Insurance Expiry">
          <DatePicker value={form.insurance_expiry} onChange={(v) => update('insurance_expiry', v)} />
        </FormField>
      </FormSection>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Scanned License Data & Notes</h4>
        </div>
        <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={4} className="bg-background border-border resize-none" placeholder="Extra license fields from scan (owner, chassis, engine, insurer…) appear here." />
      </div>

      <div className="flex gap-3 pt-2 border-t border-border/50">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-secondary text-secondary-foreground hover:bg-muted transition">Cancel</button>
        <button type="button" onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Vehicle'}
        </button>
      </div>
    </div>
  );
}