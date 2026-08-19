import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EntityFormDialog from '@/components/common/EntityFormDialog';
import DriversAnalytics from '@/components/admin/DriversAnalytics';
import DriverCard from '@/components/admin/DriverCard';
import DriverListRow from '@/components/admin/DriverListRow';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ImageUpload from '@/components/common/ImageUpload';
import { safeListAll } from '@/lib/safeRequest';
import { useGlobalDate, inGlobalDateRange } from '@/lib/GlobalDateContext';
import { Plus, Search, Users } from 'lucide-react';
import MobileFAB from '@/components/mobile/MobileFAB';
import { useDriversMode, setDriversMode, setDriversData, getDriversView } from '@/lib/driversStore';

export default function Drivers() {
  return <DriversTab />;
}

function DriversTab() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { mode } = useDriversMode();
  const view = getDriversView();
  const { dateFrom, dateTo } = useGlobalDate();

  const load = async () => {
    setLoading(true);
    try {
      const [d, tr] = await safeListAll([
        () => base44.entities.Driver.list('-created_date', 200).catch(() => []),
        () => base44.entities.Trip.list('-trip_date', 500).catch(() => []),
      ]);
      setDrivers((d || []).filter((x) => !x.vendor_name)); setTrips(tr || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('new') === '1') { setEditItem(null); setFormOpen(true); }
    const onNew = () => { setEditItem(null); setFormOpen(true); };
    window.addEventListener('drivers:new', onNew);
    return () => window.removeEventListener('drivers:new', onNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = drivers.filter((d) => !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.phone?.includes(search) || d.license_number?.toLowerCase().includes(search.toLowerCase()));
  const fTrips = trips.filter((tt) => inGlobalDateRange(tt.trip_date, dateFrom, dateTo));

  // Publish filtered data + load to the store for TopBar Export/Import
  useEffect(() => { setDriversData(filtered, load); }, [filtered, load]);

  return (
    <div>
      {mode === 'analytics' ? (
        <DriversAnalytics drivers={filtered} trips={fTrips} loading={loading} onBrowseDrivers={() => setDriversMode('browse')} />
      ) : (
        <>
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" />
          </div>

          {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Users} title={t('no_data')} /> :
            view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((d) => (
                  <DriverCard key={d.id} d={d} onOpen={(dd) => navigate(`/admin/drivers/${dd.id}`)} onEdit={(dd) => { setEditItem(dd); setFormOpen(true); }} onDelete={async (dd) => { await base44.entities.Driver.delete(dd.id); load(); }} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((d) => (
                  <DriverListRow key={d.id} d={d} onOpen={(dd) => navigate(`/admin/drivers/${dd.id}`)} onEdit={(dd) => { setEditItem(dd); setFormOpen(true); }} onDelete={async (dd) => { await base44.entities.Driver.delete(dd.id); load(); }} />
                ))}
              </div>
            )}
        </>
      )}

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} icon={Users} title={`${editItem ? t('edit') : t('add_new')} Driver`} subtitle="Register a new driver">
          <DriverForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.Driver.update(editItem.id, data); else await base44.entities.Driver.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
      </EntityFormDialog>
      <MobileFAB icon={Plus} onClick={() => { setEditItem(null); setFormOpen(true); }} label="Add Driver" />
    </div>
  );
}

function DriverForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', image_url: '', phone: '', email: '', license_number: '', license_expiry: '', nationality: '', status: 'active', assigned_vehicle: '', base_salary: '', join_date: '', visa_expiry: '', notes: '' });
  useEffect(() => {
    if (editItem) { setForm({ ...form, ...editItem, base_salary: editItem.base_salary || '' }); }
    else setForm({ name: '', image_url: '', phone: '', email: '', license_number: '', license_expiry: '', nationality: '', status: 'active', assigned_vehicle: '', base_salary: '', join_date: '', visa_expiry: '', notes: '' });
  }, [editItem]);
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