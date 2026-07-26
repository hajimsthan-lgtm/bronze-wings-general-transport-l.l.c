import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import DriversAnalytics from '@/components/admin/DriversAnalytics';
import ImageUpload from '@/components/common/ImageUpload';
import Salary from './Salary';

export default function Drivers() {
  const { t } = useI18n();
  const [tab, setTab] = useState('drivers');
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setTab('drivers')} className={`sub-tab ${tab === 'drivers' ? 'sub-tab-active' : ''}`}>{t('drivers')}</button>
        <button onClick={() => setTab('salary')} className={`sub-tab ${tab === 'salary' ? 'sub-tab-active' : ''}`}>{t('salary')}</button>
      </div>
      {tab === 'drivers' ? <DriversTab /> : <Salary />}
    </div>
  );
}

function DriversTab() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      base44.entities.Driver.list('-created_date', 200).catch(() => []),
      base44.entities.Trip.list('-trip_date', 500).catch(() => []),
    ]).then(([d, tr]) => { setDrivers(d || []); setTrips(tr || []); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('new') === '1') { setEditItem(null); setFormOpen(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <DriversAnalytics drivers={drivers} trips={trips} loading={loading} onAdd={() => { setEditItem(null); setFormOpen(true); }} />

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Driver</SheetTitle></SheetHeader>
          <DriverForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.Driver.update(editItem.id, data); else await base44.entities.Driver.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function DriverForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', image_url: '', phone: '', email: '', license_number: '', license_expiry: '', nationality: '', status: 'active', assigned_vehicle: '', base_salary: '', join_date: '', visa_expiry: '', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem, base_salary: editItem.base_salary || '' }); else setForm({ name: '', image_url: '', phone: '', email: '', license_number: '', license_expiry: '', nationality: '', status: 'active', assigned_vehicle: '', base_salary: '', join_date: '', visa_expiry: '', notes: '' }); }, [editItem]);
  const update = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));
  const handle = async () => { setSaving(true); await onSave({ ...form, base_salary: Number(form.base_salary) || 0 }); setSaving(false); };

  return (
    <div className="space-y-4">
      <ImageUpload value={form.image_url} onChange={(v) => update('image_url', v)} label="Driver Photo" shape="circle" />
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Name</Label><Input value={form.name} onChange={(e) => update('name', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Phone</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">Email</Label><Input value={form.email} onChange={(e) => update('email', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">License #</Label><Input value={form.license_number} onChange={(e) => update('license_number', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">License Expiry</Label><Input type="date" value={form.license_expiry} onChange={(e) => update('license_expiry', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label><Select value={form.status} onValueChange={(v) => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['active', 'inactive', 'on_leave'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Salary</Label><Input type="number" value={form.base_salary} onChange={(e) => update('base_salary', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('vehicle')}</Label><Input value={form.assigned_vehicle} onChange={(e) => update('assigned_vehicle', e.target.value)} className="bg-background border-border" /></div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}