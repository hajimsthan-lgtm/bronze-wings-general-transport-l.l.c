import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Truck, Save } from 'lucide-react';
import DatePicker from '@/components/common/DatePicker';

const TYPES = [
  { value: 'truck', label: 'Truck' },
  { value: 'trailer', label: 'Trailer' },
  { value: 'tanker', label: 'Tanker' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'other', label: 'Other' },
];
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'inactive', label: 'Inactive' },
];
const FUELS = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'petrol', label: 'Petrol' },
];

const Field = ({ label, children, full }) => (
  <div className={`space-y-1.5 ${full ? 'col-span-2' : ''}`}>
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

export default function VehicleEditDialog({ open, onOpenChange, vehicle, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && vehicle) {
      setForm({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        plate_number: vehicle.plate_number || '',
        type: vehicle.type || 'truck',
        status: vehicle.status || 'active',
        fuel_type: vehicle.fuel_type || 'diesel',
        assigned_driver: vehicle.assigned_driver || '',
        odometer_km: vehicle.odometer_km || 0,
        registration_expiry: vehicle.registration_expiry || '',
        insurance_expiry: vehicle.insurance_expiry || '',
        last_service_date: vehicle.last_service_date || '',
        next_service_date: vehicle.next_service_date || '',
        notes: vehicle.notes || '',
      });
    }
  }, [open, vehicle]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        ...form,
        year: form.year ? Number(form.year) : null,
        odometer_km: Number(form.odometer_km) || 0,
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
            <Truck className="w-4 h-4 text-primary" /> Edit Vehicle Profile
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-2">
          <Field label="Make"><Input value={form.make || ''} onChange={(e) => set('make', e.target.value)} /></Field>
          <Field label="Model"><Input value={form.model || ''} onChange={(e) => set('model', e.target.value)} /></Field>
          <Field label="Year"><Input type="number" value={form.year || ''} onChange={(e) => set('year', e.target.value)} /></Field>
          <Field label="Plate Number"><Input value={form.plate_number || ''} onChange={(e) => set('plate_number', e.target.value)} /></Field>
          <Field label="Type">
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Fuel Type">
            <Select value={form.fuel_type} onValueChange={(v) => set('fuel_type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{FUELS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Assigned Driver"><Input value={form.assigned_driver || ''} onChange={(e) => set('assigned_driver', e.target.value)} placeholder="Driver name" /></Field>
          <Field label="Odometer (km)"><Input type="number" value={form.odometer_km || 0} onChange={(e) => set('odometer_km', e.target.value)} /></Field>
          <Field label="Registration Expiry"><DatePicker value={form.registration_expiry || ''} onChange={(v) => set('registration_expiry', v)} /></Field>
          <Field label="Insurance Expiry"><DatePicker value={form.insurance_expiry || ''} onChange={(v) => set('insurance_expiry', v)} /></Field>
          <Field label="Last Service Date"><DatePicker value={form.last_service_date || ''} onChange={(v) => set('last_service_date', v)} /></Field>
          <Field label="Next Service Date"><DatePicker value={form.next_service_date || ''} onChange={(v) => set('next_service_date', v)} /></Field>
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