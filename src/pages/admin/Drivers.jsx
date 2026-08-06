import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import DriversAnalytics from '@/components/admin/DriversAnalytics';
import DriverCard from '@/components/admin/DriverCard';
import DriverListRow from '@/components/admin/DriverListRow';
import ViewToggle from '@/components/common/ViewToggle';
import SubTabBar from '@/components/common/SubTabBar';
import ExportButtons from '@/components/common/ExportButtons';
import CsvImportButton from '@/components/common/CsvImportButton';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ImageUpload from '@/components/common/ImageUpload';
import Salary from './Salary';
import { safeListAll } from '@/lib/safeRequest';
import { useGlobalDate, inGlobalDateRange } from '@/lib/GlobalDateContext';
import { Plus, Search, Users, BarChart3, LayoutGrid } from 'lucide-react';

export default function Drivers() {
  const { t } = useI18n();
  const [tab, setTab] = useState('drivers');
  return (
    <div>
      <div className="mb-5">
        <SubTabBar value={tab} onChange={setTab} options={[{ value: 'drivers', label: t('drivers') }, { value: 'salary', label: t('salary') }]} />
      </div>
      {tab === 'drivers' ? <DriversTab /> : <Salary />}
    </div>
  );
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
  const [view, setView] = useState('list');
  const [mode, setMode] = useState('analytics');
  const { dateFrom, dateTo } = useGlobalDate();

  const load = async () => {
    setLoading(true);
    try {
      const [d, tr] = await safeListAll([
        () => base44.entities.Driver.list('-created_date', 200).catch(() => []),
        () => base44.entities.Trip.list('-trip_date', 500).catch(() => []),
      ]);
      setDrivers(d || []); setTrips(tr || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('new') === '1') { setEditItem(null); setFormOpen(true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = drivers.filter((d) => !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.phone?.includes(search) || d.license_number?.toLowerCase().includes(search.toLowerCase()));
  const fTrips = trips.filter((tt) => inGlobalDateRange(tt.trip_date, dateFrom, dateTo));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Drivers Portal</h1>
          <p className="text-sm text-muted-foreground">Performance & fleet insights</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value="all" onValueChange={(id) => { if (id === 'all') navigate('/admin/drivers'); else if (id) navigate(`/admin/drivers/${id}`); }}>
            <SelectTrigger className="w-[200px] h-8 bg-white/5 border-white/10 text-foreground text-xs"><SelectValue placeholder="Select Employee…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All drivers</SelectItem>
              {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button onClick={() => setMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
            <button onClick={() => setMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
          </div>
          {mode === 'browse' && <ViewToggle view={view} onChange={setView} />}
          <ExportButtons data={filtered.map((d) => ({ name: d.name, phone: d.phone, email: d.email, license_number: d.license_number, license_expiry: d.license_expiry, nationality: d.nationality, status: d.status, assigned_vehicle: d.assigned_vehicle, base_salary: d.base_salary }))} filename="drivers" title="Drivers" columns={[{ label: 'Name', key: 'name' }, { label: 'Phone', key: 'phone' }, { label: 'Email', key: 'email' }, { label: 'License #', key: 'license_number' }, { label: 'License Expiry', key: 'license_expiry' }, { label: 'Nationality', key: 'nationality' }, { label: 'Status', key: 'status' }, { label: 'Vehicle', key: 'assigned_vehicle' }, { label: 'Base Salary', key: 'base_salary' }]} />
          <CsvImportButton entityName="Driver" filename="drivers" onImported={load} columns={[
            { key: 'name', label: 'Name', sample: 'Ahmed Ali' },
            { key: 'phone', label: 'Phone', sample: '+971501234567' },
            { key: 'email', label: 'Email', sample: 'ahmed@example.com' },
            { key: 'license_number', label: 'License #', sample: 'DL-12345' },
            { key: 'license_expiry', label: 'License Expiry', sample: '2027-06-15' },
            { key: 'nationality', label: 'Nationality', sample: 'UAE' },
            { key: 'status', label: 'Status', sample: 'active' },
            { key: 'assigned_vehicle', label: 'Vehicle', sample: 'AD-1-12345' },
            { key: 'base_salary', label: 'Base Salary', sample: '3500' },
          ]} transform={(r) => ({
            name: r.name || r.Name || '',
            phone: r.phone || r.Phone || '',
            email: r.email || r.Email || '',
            license_number: r.license_number || r['License #'] || '',
            license_expiry: r.license_expiry || r['License Expiry'] || '',
            nationality: r.nationality || r.Nationality || '',
            status: r.status || r.Status || 'active',
            assigned_vehicle: r.assigned_vehicle || r.Vehicle || '',
            base_salary: Number(r.base_salary || r['Base Salary']) || 0,
          })} />
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>
        </div>
      </div>

      {mode === 'analytics' ? (
        <DriversAnalytics drivers={filtered} trips={fTrips} loading={loading} onBrowseDrivers={() => setMode('browse')} />
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