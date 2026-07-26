import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ExportButtons from '@/components/common/ExportButtons';
import VehicleCard from '@/components/admin/VehicleCard';
import VehicleListRow from '@/components/admin/VehicleListRow';
import ViewToggle from '@/components/common/ViewToggle';
import ImageUpload from '@/components/common/ImageUpload';
import VehiclesAnalytics from '@/components/admin/VehiclesAnalytics';
import Services from './Services';
import { Plus, Search, Truck, Pencil, Trash2, BarChart3, LayoutGrid } from 'lucide-react';

export default function Vehicles() {
  const { t } = useI18n();
  const [tab, setTab] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('tab') === 'services' ? 'services' : 'vehicles';
  });
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => setTab('vehicles')} className={`sub-tab ${tab === 'vehicles' ? 'sub-tab-active' : ''}`}>{t('vehicles')}</button>
        <button onClick={() => setTab('services')} className={`sub-tab ${tab === 'services' ? 'sub-tab-active' : ''}`}>{t('services')}</button>
      </div>
      {tab === 'vehicles' ? <VehiclesTab /> : <Services />}
    </div>
  );
}

function VehiclesTab() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [view, setView] = useState('grid');
  const [mode, setMode] = useState('analytics');
  const [trips, setTrips] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const load = () => {
    setLoading(true);
    base44.entities.Vehicle.list('-created_date', 100).then(setItems).finally(() => setLoading(false));
    base44.entities.Trip.list('-created_date', 200).then(setTrips).catch(() => {});
    base44.entities.FuelRecord.list('-created_date', 200).then(setFuelRecords).catch(() => {});
    base44.entities.Expense.list('-created_date', 200).then(setExpenses).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((v) => !search || v.plate_number?.toLowerCase().includes(search.toLowerCase()) || v.make?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Vehicles Portal</h1>
          <p className="text-sm text-muted-foreground">Analytics overview & fleet insights</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button onClick={() => setMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
            <button onClick={() => setMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
          </div>
          {mode === 'browse' && <ViewToggle view={view} onChange={setView} />}
          <ExportButtons data={filtered} filename="vehicles" title="Vehicles" columns={[{ label: 'Plate', key: 'plate_number' }, { label: 'Make', key: 'make' }, { label: 'Model', key: 'model' }, { label: 'Year', key: 'year' }, { label: 'Type', key: 'type' }, { label: 'Status', key: 'status' }, { label: 'Driver', key: 'assigned_driver' }, { label: 'Reg Expiry', key: 'registration_expiry' }, { label: 'Ins Expiry', key: 'insurance_expiry' }, { label: 'Fuel', key: 'fuel_type' }]} />
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>
        </div>
      </div>

      {mode === 'analytics' ? (
        <VehiclesAnalytics vehicles={filtered} trips={trips} fuelRecords={fuelRecords} expenses={expenses} loading={loading} />
      ) : (
        <>
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" />
          </div>

          {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Truck} title={t('no_data')} /> :
          view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((v) => (
                <VehicleCard key={v.id} v={v} onOpen={() => navigate(`/admin/vehicles/${v.id}`)} onEdit={() => { setEditItem(v); setFormOpen(true); }} onDelete={async () => { await base44.entities.Vehicle.delete(v.id); load(); }} onOwnershipChange={async (front, back) => { await base44.entities.Vehicle.update(v.id, { ownership_front_url: front, ownership_back_url: back }); load(); }} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((v) => (
                <VehicleListRow key={v.id} v={v} onOpen={() => navigate(`/admin/vehicles/${v.id}`)} onEdit={() => { setEditItem(v); setFormOpen(true); }} onDelete={async () => { await base44.entities.Vehicle.delete(v.id); load(); }} />
              ))}
            </div>
          )}
        </>
      )}

      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="mb-6"><SheetTitle className="font-display text-foreground">{editItem ? t('edit') : t('add_new')} Vehicle</SheetTitle></SheetHeader>
          <VehicleForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.Vehicle.update(editItem.id, data); else await base44.entities.Vehicle.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function VehicleForm({ editItem, onSave, onCancel }) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ plate_number: '', image_url: '', make: '', model: '', year: '', type: 'truck', status: 'active', assigned_driver: '', registration_expiry: '', insurance_expiry: '', fuel_type: 'diesel', notes: '' });
  useEffect(() => { if (editItem) setForm({ ...form, ...editItem, year: editItem.year || '' }); else setForm({ plate_number: '', image_url: '', make: '', model: '', year: '', type: 'truck', status: 'active', assigned_driver: '', registration_expiry: '', insurance_expiry: '', fuel_type: 'diesel', notes: '' }); }, [editItem]);
  const update = (f, v) => setForm((prev) => ({ ...prev, [f]: v }));
  const handle = async () => { setSaving(true); await onSave({ ...form, year: form.year ? Number(form.year) : undefined }); setSaving(false); };

  return (
    <div className="space-y-4">
      <ImageUpload value={form.image_url} onChange={(v) => update('image_url', v)} label="Vehicle Photo" />
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('plate_number')}</Label><Input value={form.plate_number} onChange={(e) => update('plate_number', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Make</Label><Input value={form.make} onChange={(e) => update('make', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Model</Label><Input value={form.model} onChange={(e) => update('model', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Year</Label><Input type="number" value={form.year} onChange={(e) => update('year', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Type</Label>
          <Select value={form.type} onValueChange={(v) => update('type', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['truck', 'trailer', 'tanker', 'pickup', 'other'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">{t('status')}</Label>
          <Select value={form.status} onValueChange={(v) => update('status', v)}><SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger><SelectContent>{['active', 'maintenance', 'inactive'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div><Label className="text-xs text-muted-foreground mb-1.5">{t('driver')}</Label><Input value={form.assigned_driver} onChange={(e) => update('assigned_driver', e.target.value)} className="bg-background border-border" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground mb-1.5">Reg. Expiry</Label><Input type="date" value={form.registration_expiry} onChange={(e) => update('registration_expiry', e.target.value)} className="bg-background border-border" /></div>
        <div><Label className="text-xs text-muted-foreground mb-1.5">Ins. Expiry</Label><Input type="date" value={form.insurance_expiry} onChange={(e) => update('insurance_expiry', e.target.value)} className="bg-background border-border" /></div>
      </div>
      <div className="flex gap-3 mt-6"><Button variant="outline" onClick={onCancel} className="flex-1 border-border">{t('cancel')}</Button><Button onClick={handle} disabled={saving} className="flex-1 bg-primary hover:bg-primary/90">{saving ? t('loading') : t('save')}</Button></div>
    </div>
  );
}