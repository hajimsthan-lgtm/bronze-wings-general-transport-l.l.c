import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { UsersRound, Save } from 'lucide-react';

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'on_leave', label: 'On Leave' },
];

const Field = ({ label, children, full }) => (
  <div className={`space-y-1.5 ${full ? 'col-span-2' : ''}`}>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export default function DriverEditDialog({ open, onOpenChange, driver, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && driver) {
      setForm({
        name: driver.name || '',
        phone: driver.phone || '',
        email: driver.email || '',
        license_number: driver.license_number || '',
        license_expiry: driver.license_expiry || '',
        nationality: driver.nationality || '',
        status: driver.status || 'active',
        assigned_vehicle: driver.assigned_vehicle || '',
        base_salary: driver.base_salary || 0,
        join_date: driver.join_date || '',
        emergency_contact: driver.emergency_contact || '',
        visa_expiry: driver.visa_expiry || '',
        notes: driver.notes || '',
      });
    }
  }, [open, driver]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        ...form,
        base_salary: Number(form.base_salary) || 0,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UsersRound className="w-4 h-4 text-primary" /> Edit Driver Profile
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label="Name" full><Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label="Phone"><Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
          <Field label="Email"><Input value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
          <Field label="License Number"><Input value={form.license_number || ''} onChange={(e) => set('license_number', e.target.value)} /></Field>
          <Field label="License Expiry"><Input type="date" value={form.license_expiry || ''} onChange={(e) => set('license_expiry', e.target.value)} /></Field>
          <Field label="Nationality"><Input value={form.nationality || ''} onChange={(e) => set('nationality', e.target.value)} /></Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Assigned Vehicle"><Input value={form.assigned_vehicle || ''} onChange={(e) => set('assigned_vehicle', e.target.value)} placeholder="Plate number" /></Field>
          <Field label="Base Salary"><Input type="number" value={form.base_salary || 0} onChange={(e) => set('base_salary', e.target.value)} /></Field>
          <Field label="Join Date"><Input type="date" value={form.join_date || ''} onChange={(e) => set('join_date', e.target.value)} /></Field>
          <Field label="Emergency Contact"><Input value={form.emergency_contact || ''} onChange={(e) => set('emergency_contact', e.target.value)} /></Field>
          <Field label="Visa Expiry"><Input type="date" value={form.visa_expiry || ''} onChange={(e) => set('visa_expiry', e.target.value)} /></Field>
          <Field label="Notes" full><Textarea rows={2} value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="gap-1.5">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}