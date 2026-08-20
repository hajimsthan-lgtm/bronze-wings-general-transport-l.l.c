import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, User, ShieldCheck, Car, Hash, StickyNote, Save } from 'lucide-react';
import VehicleLicenseScanZone from './VehicleLicenseScanZone';
import { vehicleToLicenseForm, licenseFormToVehicle } from '@/lib/vehicleLicenseNotes';
import DuplicateConfirmDialog from '@/components/common/DuplicateConfirmDialog';

const CATEGORY_OPTIONS = ['Private', 'Commercial', 'Truck', 'Bus', 'Taxi', 'Other'];

const EMPTY = {
  trafficPlateNo: '', placeOfIssue: '', tcNo: '', plateCategory: '',
  ownerArabic: '', ownerEnglish: '', nationality: '',
  expDate: '', regDate: '',
  insurer: '', insExpDate: '', policyNo: '', insuranceType: '', mortgageBy: '',
  model: '', numOfPassengers: '', origin: '', vehicleColor: '', vehicleCategory: '', vehicleType: '',
  gvw: '', emptyWeight: '', engineNo: '', chassisNo: '',
  category: 'Private', notes: '',
  // Vehicle-specific fields
  year: '', assigned_driver: '', fuel_type: 'diesel', status: 'active',
};

function Section({ icon: Icon, title, accent, children }) {
  return (
    <div className="trip-section" style={{ '--section-accent': accent }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="trip-section-icon"><Icon className="w-4 h-4" /></div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, span2, children }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

export default function VehicleAddForm({ editItem, editLicense, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [dupInfo, setDupInfo] = useState(null); // { matchLabel, pendingSave }

  useEffect(() => {
    setForm(editItem ? vehicleToLicenseForm(editItem, editLicense) : EMPTY);
  }, [editItem, editLicense]);

  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const handleExtracted = (data) => {
    setForm((p) => ({ ...p, ...data, category: data.category || p.category }));
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const vehicleData = licenseFormToVehicle(form);
      await onSave(vehicleData, form);
    } finally { setSaving(false); }
  };

  const handleSave = async () => {
    // Only check duplicates on NEW records (not edit)
    if (!editItem && form.trafficPlateNo) {
      try {
        const existing = await base44.entities.Vehicle.filter({ plate_number: form.trafficPlateNo });
        if (existing && existing.length > 0) {
          setDupInfo({ matchLabel: form.trafficPlateNo, pendingSave: doSave });
          return;
        }
      } catch { /* ignore check failure, proceed */ }
    }
    doSave();
  };

  return (
    <div className="space-y-4">
      <VehicleLicenseScanZone onExtracted={handleExtracted} />

      <Section icon={FileText} title="License Details" accent="#0ea5e9">
        <Field label="Traffic Plate No."><Input value={form.trafficPlateNo} onChange={(e) => update('trafficPlateNo', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Place of Issue"><Input value={form.placeOfIssue} onChange={(e) => update('placeOfIssue', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="TC No."><Input value={form.tcNo} onChange={(e) => update('tcNo', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Plate Category"><Input value={form.plateCategory} onChange={(e) => update('plateCategory', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Expiry Date"><Input type="date" value={form.expDate} onChange={(e) => update('expDate', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Registration Date"><Input type="date" value={form.regDate} onChange={(e) => update('regDate', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Category" span2>
          <Select value={form.category} onValueChange={(v) => update('category', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORY_OPTIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </Section>

      <Section icon={User} title="Owner Details" accent="#8b5cf6">
        <Field label="Owner (English)"><Input value={form.ownerEnglish} onChange={(e) => update('ownerEnglish', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Owner (Arabic)"><Input value={form.ownerArabic} onChange={(e) => update('ownerArabic', e.target.value)} className="bg-background border-border" dir="rtl" /></Field>
        <Field label="Nationality" span2><Input value={form.nationality} onChange={(e) => update('nationality', e.target.value)} className="bg-background border-border" /></Field>
      </Section>

      <Section icon={ShieldCheck} title="Insurance" accent="#22c55e">
        <Field label="Insurer"><Input value={form.insurer} onChange={(e) => update('insurer', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Policy No."><Input value={form.policyNo} onChange={(e) => update('policyNo', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Insurance Type"><Input value={form.insuranceType} onChange={(e) => update('insuranceType', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Insurance Expiry"><Input type="date" value={form.insExpDate} onChange={(e) => update('insExpDate', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Mortgage By" span2><Input value={form.mortgageBy} onChange={(e) => update('mortgageBy', e.target.value)} className="bg-background border-border" /></Field>
      </Section>

      <Section icon={Car} title="Vehicle Information" accent="#f59e0b">
        <Field label="Model"><Input value={form.model} onChange={(e) => update('model', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="No. of Passengers"><Input value={form.numOfPassengers} onChange={(e) => update('numOfPassengers', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Origin"><Input value={form.origin} onChange={(e) => update('origin', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Vehicle Color"><Input value={form.vehicleColor} onChange={(e) => update('vehicleColor', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Vehicle Category"><Input value={form.vehicleCategory} onChange={(e) => update('vehicleCategory', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Vehicle Type"><Input value={form.vehicleType} onChange={(e) => update('vehicleType', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="GVW"><Input value={form.gvw} onChange={(e) => update('gvw', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Empty Weight"><Input value={form.emptyWeight} onChange={(e) => update('emptyWeight', e.target.value)} className="bg-background border-border" /></Field>
      </Section>

      <Section icon={Hash} title="Identification Numbers" accent="#ec4899">
        <Field label="Engine No."><Input value={form.engineNo} onChange={(e) => update('engineNo', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Chassis No."><Input value={form.chassisNo} onChange={(e) => update('chassisNo', e.target.value)} className="bg-background border-border" /></Field>
      </Section>

      {/* Fleet assignment fields */}
      <Section icon={Car} title="Fleet Assignment" accent="#10b981">
        <Field label="Year"><Input type="number" value={form.year} onChange={(e) => update('year', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Assigned Driver"><Input value={form.assigned_driver} onChange={(e) => update('assigned_driver', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Fuel Type">
          <Select value={form.fuel_type} onValueChange={(v) => update('fuel_type', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{['diesel', 'petrol'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => update('status', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{['active', 'maintenance', 'inactive'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </Section>

      <div className="trip-section" style={{ '--section-accent': '#64748b' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="trip-section-icon"><StickyNote className="w-4 h-4" /></div>
          <h4 className="text-sm font-semibold text-foreground">Notes</h4>
        </div>
        <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={2} className="bg-background border-border resize-none" />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-secondary text-secondary-foreground hover:bg-muted transition">Cancel</button>
        <button type="button" onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Vehicle'}
        </button>
      </div>

      <DuplicateConfirmDialog
        open={!!dupInfo}
        entityType="vehicle"
        matchLabel={dupInfo?.matchLabel || ''}
        onContinue={() => { const fn = dupInfo?.pendingSave; setDupInfo(null); if (fn) fn(); }}
        onCancel={() => setDupInfo(null)}
      />
    </div>
  );
}