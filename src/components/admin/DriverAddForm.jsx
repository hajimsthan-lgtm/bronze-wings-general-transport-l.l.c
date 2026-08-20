import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, ShieldCheck, Wallet, Car, StickyNote, Save, Phone, Mail, Globe2, CalendarClock, IdCard } from 'lucide-react';
import DocumentScanZone from './DocumentScanZone';
import ImageUpload from '@/components/common/ImageUpload';
import DuplicateConfirmDialog from '@/components/common/DuplicateConfirmDialog';
import { uploadAndExtractDriverLicense } from '@/lib/driverLicenseScan';
import { uploadAndExtractVisa } from '@/lib/visaScan';
import { uploadAndExtractEmiratesId } from '@/lib/emiratesIdScan';

const EMPTY = {
  name: '', image_url: '', phone: '', email: '',
  license_number: '', license_expiry: '', nationality: '',
  status: 'active', assigned_vehicle: '', base_salary: '',
  join_date: '', emergency_contact: '', visa_expiry: '', notes: '',
  license_url: '', visa_url: '', emirates_id_url: '',
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

export default function DriverAddForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [dupInfo, setDupInfo] = useState(null);
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (editItem) setForm({ ...EMPTY, ...editItem, base_salary: editItem.base_salary || '' });
    else setForm(EMPTY);
  }, [editItem]);

  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));

  const handleExtracted = (data, fileUrl) => {
    const lines = [];
    if (data.nameArabic) lines.push(`Name (AR): ${data.nameArabic}`);
    if (data.dateOfBirth) lines.push(`DOB: ${data.dateOfBirth}`);
    if (data.placeOfIssue) lines.push(`Place of Issue: ${data.placeOfIssue}`);
    if (data.licenseType) lines.push(`License Type: ${data.licenseType}`);
    if (data.bloodGroup) lines.push(`Blood Group: ${data.bloodGroup}`);
    if (data.gender) lines.push(`Gender: ${data.gender}`);
    if (data.address) lines.push(`Address: ${data.address}`);
    setForm((p) => ({
      ...p,
      name: data.name || p.name,
      license_number: data.licenseNumber || p.license_number,
      license_expiry: data.licenseExpiry || p.license_expiry,
      nationality: data.nationality || p.nationality,
      license_url: fileUrl || p.license_url,
      notes: lines.length > 0 ? lines.join('\n') : p.notes,
    }));
  };

  const handleVisaExtracted = (data, fileUrl) => {
    setForm((p) => ({
      ...p,
      visa_expiry: data.visaExpiry || p.visa_expiry,
      nationality: data.nationality || p.nationality,
      visa_url: fileUrl || p.visa_url,
    }));
  };

  const handleEmiratesIdExtracted = (data, fileUrl) => {
    setForm((p) => ({
      ...p,
      name: data.name || p.name,
      nationality: data.nationality || p.nationality,
      emirates_id_url: fileUrl || p.emirates_id_url,
    }));
  };

  const doSave = async () => {
    setSaving(true);
    try {
      await onSave({ ...form, base_salary: Number(form.base_salary) || 0 });
    } finally { setSaving(false); }
  };

  const handle = async () => {
    if (!editItem && form.name) {
      try {
        const existing = await base44.entities.Driver.list('-created_date', 200);
        const match = (existing || []).find((d) => d.name?.toLowerCase().trim() === form.name.toLowerCase().trim());
        if (match) { setDupInfo({ matchLabel: form.name, pendingSave: doSave }); return; }
      } catch { /* ignore */ }
    }
    doSave();
  };

  return (
    <div className="space-y-4">
      <DocumentScanZone
        extractFn={uploadAndExtractDriverLicense}
        onExtracted={handleExtracted}
        title="Scan UAE Driving License"
        description="Drag & drop a PDF or image, or browse. AI extracts all fields — review before saving."
      />

      <DocumentScanZone
        extractFn={uploadAndExtractVisa}
        onExtracted={handleVisaExtracted}
        title="Scan UAE Visa / Residence"
        description="Upload visa to auto-fill visa expiry date & nationality."
      />

      <DocumentScanZone
        extractFn={uploadAndExtractEmiratesId}
        onExtracted={handleEmiratesIdExtracted}
        title="Scan UAE Emirates ID"
        description="Upload Emirates ID to auto-fill name & nationality."
      />

      <ImageUpload value={form.image_url} onChange={(v) => update('image_url', v)} label="Driver Photo" shape="circle" />

      <Section icon={User} title="Personal Details" accent="#0ea5e9">
        <Field label="Name" span2><Input value={form.name} onChange={(e) => update('name', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Email"><Input value={form.email} onChange={(e) => update('email', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Nationality"><Input value={form.nationality} onChange={(e) => update('nationality', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Emergency Contact"><Input value={form.emergency_contact} onChange={(e) => update('emergency_contact', e.target.value)} className="bg-background border-border" /></Field>
      </Section>

      <Section icon={ShieldCheck} title="License Details" accent="#22c55e">
        <Field label="License #"><Input value={form.license_number} onChange={(e) => update('license_number', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="License Expiry"><Input type="date" value={form.license_expiry} onChange={(e) => update('license_expiry', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Visa Expiry"><Input type="date" value={form.visa_expiry} onChange={(e) => update('visa_expiry', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Join Date"><Input type="date" value={form.join_date} onChange={(e) => update('join_date', e.target.value)} className="bg-background border-border" /></Field>
      </Section>

      <Section icon={Wallet} title="Employment" accent="#f59e0b">
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => update('status', v)}>
            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
            <SelectContent>{['active', 'inactive', 'on_leave'].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Base Salary"><Input type="number" value={form.base_salary} onChange={(e) => update('base_salary', e.target.value)} className="bg-background border-border" /></Field>
        <Field label="Assigned Vehicle" span2><Input value={form.assigned_vehicle} onChange={(e) => update('assigned_vehicle', e.target.value)} placeholder="Plate number" className="bg-background border-border" /></Field>
      </Section>

      <div className="trip-section" style={{ '--section-accent': '#64748b' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="trip-section-icon"><StickyNote className="w-4 h-4" /></div>
          <h4 className="text-sm font-semibold text-foreground">Scanned License Data & Notes</h4>
        </div>
        <Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={3} className="bg-background border-border resize-none" placeholder="Extra license fields from scan (name Arabic, DOB, license type, blood group…) appear here." />
      </div>

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-secondary text-secondary-foreground hover:bg-muted transition">{t('cancel')}</button>
        <button type="button" onClick={handle} disabled={saving || !form.name} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:brightness-110 transition disabled:opacity-50 flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving…' : t('save')}
        </button>
      </div>

      <DuplicateConfirmDialog
        open={!!dupInfo}
        entityType="driver"
        matchLabel={dupInfo?.matchLabel || ''}
        onContinue={() => { const fn = dupInfo?.pendingSave; setDupInfo(null); if (fn) fn(); }}
        onCancel={() => setDupInfo(null)}
      />
    </div>
  );
}