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
import EntityFormDialog from '@/components/common/EntityFormDialog';
import ExportButtons from '@/components/common/ExportButtons';
import CsvImportButton from '@/components/common/CsvImportButton';
import VehicleCard from '@/components/admin/VehicleCard';
import VehicleListRow from '@/components/admin/VehicleListRow';
import ViewToggle from '@/components/common/ViewToggle';
import SubTabBar from '@/components/common/SubTabBar';
import ImageUpload from '@/components/common/ImageUpload';
import TypeCombobox from '@/components/admin/TypeCombobox';
import VehiclesAnalytics from '@/components/admin/VehiclesAnalytics';
import Services from './Services';
import { safeListAll } from '@/lib/safeRequest';
import { useGlobalDate, inGlobalDateRange } from '@/lib/GlobalDateContext';
import { Plus, Search, Truck, Pencil, Trash2, Sparkles, BarChart3, LayoutGrid } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function Vehicles() {
  const { t } = useI18n();
  const [tab, setTab] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get('tab') === 'services' ? 'services' : 'vehicles';
  });
  return (
    <div>
      <div className="mb-5">
        <SubTabBar value={tab} onChange={setTab} options={[{ value: 'vehicles', label: t('vehicles') }, { value: 'services', label: t('maintenance') }]} />
      </div>
      {tab === 'vehicles' ? <VehiclesTab /> : <Services />}
    </div>
  );
}

function VehiclesTab() {
  const { t } = useI18n();
  const { mode: themeMode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [view, setView] = useState('list');
  const [mode, setMode] = useState('analytics');
  const [trips, setTrips] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const { dateFrom, dateTo } = useGlobalDate();

  const toggleSelect = (id) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clearSelection = () => setSelected(new Set());
  const bulkDelete = async () => {
    for (const id of selected) { await base44.entities.Vehicle.delete(id).catch(() => {}); }
    clearSelection(); load();
  };

  const load = async () => {
    setLoading(true);
    try {
      const [v, tr, fr, ex] = await safeListAll([
        () => base44.entities.Vehicle.list('-created_date', 100).catch(() => []),
        () => base44.entities.Trip.list('-created_date', 200).catch(() => []),
        () => base44.entities.FuelRecord.list('-created_date', 200).catch(() => []),
        () => base44.entities.Expense.list('-created_date', 200).catch(() => []),
      ]);
      setItems(v || []); setTrips(tr || []); setFuelRecords(fr || []); setExpenses(ex || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = items.filter((v) => !search || v.plate_number?.toLowerCase().includes(search.toLowerCase()) || v.make?.toLowerCase().includes(search.toLowerCase()));
  const fTrips = trips.filter((tt) => inGlobalDateRange(tt.trip_date, dateFrom, dateTo));
  const fFuel = fuelRecords.filter((r) => inGlobalDateRange(r.date, dateFrom, dateTo));
  const fExpenses = expenses.filter((r) => inGlobalDateRange(r.date, dateFrom, dateTo));

  return (
    <div>
      <div data-tour data-tour-title="Header & Controls" data-tour-en="Welcome to the Vehicles portal. Use Analytics for a fleet overview or Browse to manage individual vehicles. Export your fleet to Excel or PDF, and tap Add New to register a vehicle." data-tour-ur="ویہکل پورٹل میں خوش آمدید۔ فلیٹ کے جائزے کے لیے اینالیٹکس استعمال کریں یا انفرادی گاڑیوں کو منتظم کرنے کے لیے براؤز کریں۔ فلیٹ کو ایکسل یا پی ڈی ایف پر برآمد کریں، اور نئی گاڑی داخل کرنے کے لیے نیا اضافہ کریں۔" data-tour-ml="വാഹന പോർട്ടലിലേക്ക് സ്വാഗതം. ഫ്ലീറ്റ് അവലോകനത്തിന് അനലിറ്റിക്സ് ഉപയോഗിക്കുക അല്ലെങ്കിൽ വാഹനങ്ങൾ കൈകാര്യം ചെയ്യാൻ ബ്രൗസ് ചെയ്യുക. എക്സൽ അല്ലെങ്കിൽ PDF ലേക്ക് എക്സ്പോർട്ട് ചെയ്യുക." className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground font-display">Vehicles</h1>
          <p className="text-sm text-muted-foreground">Fleet management & registration</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button onClick={() => setMode('analytics')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'analytics' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><BarChart3 className="w-3.5 h-3.5" />Analytics</button>
            <button onClick={() => setMode('browse')} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${mode === 'browse' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-3.5 h-3.5" />Browse</button>
          </div>
          {mode === 'browse' && <ViewToggle view={view} onChange={setView} />}
          <ExportButtons data={filtered} filename="vehicles" title="Vehicles" columns={[{ label: 'Plate', key: 'plate_number' }, { label: 'Make', key: 'make' }, { label: 'Model', key: 'model' }, { label: 'Year', key: 'year' }, { label: 'Type', key: 'type' }, { label: 'Status', key: 'status' }, { label: 'Driver', key: 'assigned_driver' }, { label: 'Reg Expiry', key: 'registration_expiry' }, { label: 'Ins Expiry', key: 'insurance_expiry' }, { label: 'Fuel', key: 'fuel_type' }]} />
          <CsvImportButton entityName="Vehicle" filename="vehicles" onImported={load} columns={[
            { key: 'plate_number', label: 'Plate Number', sample: 'AD-1-12345' },
            { key: 'make', label: 'Make', sample: 'Mitsubishi' },
            { key: 'model', label: 'Model', sample: 'Fuso' },
            { key: 'year', label: 'Year', sample: '2022' },
            { key: 'type', label: 'Type', sample: 'truck' },
            { key: 'status', label: 'Status', sample: 'active' },
            { key: 'assigned_driver', label: 'Driver', sample: 'Ahmed Ali' },
            { key: 'registration_expiry', label: 'Reg Expiry', sample: '2026-12-31' },
            { key: 'insurance_expiry', label: 'Ins Expiry', sample: '2026-12-31' },
            { key: 'fuel_type', label: 'Fuel', sample: 'diesel' },
          ]} transform={(r) => ({
            plate_number: r.plate_number || r.Plate || '',
            make: r.make || r.Make || '',
            model: r.model || r.Model || '',
            year: r.year || r.Year ? Number(r.year || r.Year) : undefined,
            type: r.type || r.Type || 'truck',
            status: r.status || r.Status || 'active',
            assigned_driver: r.assigned_driver || r.Driver || '',
            registration_expiry: r.registration_expiry || r['Reg Expiry'] || '',
            insurance_expiry: r.insurance_expiry || r['Ins Expiry'] || '',
            fuel_type: r.fuel_type || r.Fuel || 'diesel',
          })} />
          <Button onClick={() => { setEditItem(null); setFormOpen(true); }} className="h-10"><Plus className="w-4 h-4 mr-1.5" />{t('add_new')}</Button>
        </div>
      </div>

      {mode === 'analytics' ? (
        <div data-tour data-tour-title="Fleet Analytics" data-tour-en="This panel summarizes fleet performance — active vs maintenance counts, trip activity, fuel cost trends, and vehicle utilization. Use it to spot issues at a glance." data-tour-ur="یہ پینل فلیٹ کی کارکردگی کا خلاصہ پیش کرتا ہے — فعال بمقابلہ دیکھ بھال کے حسابات، ٹرپ سرگرمی، ایندھن لاگت کے رجحانات، اور گاڑی کا استعمال۔" data-tour-ml="ഈ പാനൽ ഫ്ലീറ്റ് പ്രകടനം സംഗ്രഹിക്കുന്നു — സജീവവും പരിപാലനവുമായ എണ്ണം, യാത്രാ പ്രവർത്തനം, ഇന്ധന ചെലവ് പ്രവണത.">
          <VehiclesAnalytics vehicles={filtered} trips={fTrips} fuelRecords={fFuel} expenses={fExpenses} loading={loading} onBrowseVehicles={() => setMode('browse')} />
        </div>
      ) : (
        <>
          <div data-tour data-tour-title="Search Fleet" data-tour-en="Type a plate number or make here to instantly filter your vehicles. The list below updates as you type." data-tour-ur="اپنی گاڑیوں کو فوری طور پر فلٹر کرنے کے لیے یہاں پلیٹ نمبر یا برانڈ درج کریں۔ نیچے دی گئی فہرست آپ کی ٹائپ کے مطابق اپڈیٹ ہوتی ہے۔" data-tour-ml="നിങ്ങളുടെ വാഹനങ്ങൾ ഉടൻ ഫിൽട്ടർ ചെയ്യാൻ ഇവിടെ പ്ലേറ്റ് നമ്പർ അല്ലെങ്കിൽ മേക്ക് ടൈപ്പ് ചെയ്യുക. താഴെയുള്ള പട്ടിക ടൈപ്പ് ചെയ്യുമ്പോൾ അപ്ഡേറ്റ് ചെയ്യും." className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" />
          </div>

          {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Truck} title={t('no_data')} /> :
          view === 'grid' ? (
            themeMode === 'light' ? (
              <div data-tour data-tour-title="Vehicle List" data-tour-en="Each card is a vehicle. Tap to open its full profile, edit details, or remove it. Switch between grid and list views using the toggle above." data-tour-ur="ہر کارڈ ایک گاڑی ہے۔ اس کی مکمل پروفائل کھولنے، تفصیلات میں ترمیم، یا اسے ہٹانے کے لیے ٹیپ کریں۔" data-tour-ml="ഓരോ കാർഡും ഒരു വാഹനമാണ്. പ്രൊഫൈൽ തുറക്കാനോ വിവരങ്ങൾ എഡിറ്റുചെയ്യാനോ നീക്കംചെയ്യാനോ ടാപ്പുചെയ്യുക.">
                {filtered.length > 4 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    {filtered.slice(0, 4).map((v) => (
                      <VehicleCard key={v.id} v={v} onOpen={() => navigate(`/admin/vehicles/${v.id}`)} onEdit={() => { setEditItem(v); setFormOpen(true); }} onDelete={async () => { await base44.entities.Vehicle.delete(v.id); load(); }} onOwnershipChange={async (front, back) => { await base44.entities.Vehicle.update(v.id, { ownership_front_url: front, ownership_back_url: back }); load(); }} />
                    ))}
                  </div>
                )}
                {filtered.length > 4 && (
                  <div className="flex items-center gap-3 mb-5 mt-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Top picks of the day</h2>
                        <p className="text-xs text-gray-500">These vehicles are tailored just for you</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {filtered.slice(filtered.length > 4 ? 4 : 0).map((v) => (
                    <VehicleCard key={v.id} v={v} onOpen={() => navigate(`/admin/vehicles/${v.id}`)} onEdit={() => { setEditItem(v); setFormOpen(true); }} onDelete={async () => { await base44.entities.Vehicle.delete(v.id); load(); }} onOwnershipChange={async (front, back) => { await base44.entities.Vehicle.update(v.id, { ownership_front_url: front, ownership_back_url: back }); load(); }} />
                  ))}
                </div>
              </div>
            ) : (
            <div data-tour data-tour-title="Vehicle List" data-tour-en="Each card is a vehicle. Tap to open its full profile, edit details, or remove it. Switch between grid and list views using the toggle above." data-tour-ur="ہر کارڈ ایک گاڑی ہے۔ اس کی مکمل پروفائل کھولنے، تفصیلات میں ترمیم، یا اسے ہٹانے کے لیے ٹیپ کریں۔" data-tour-ml="ഓരോ കാർഡും ഒരു വാഹനമാണ്. പ്രൊഫൈൽ തുറക്കാനോ വിവരങ്ങൾ എഡിറ്റുചെയ്യാനോ നീക്കംചെയ്യാനോ ടാപ്പുചെയ്യുക." className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((v) => (
                <VehicleCard key={v.id} v={v} onOpen={() => navigate(`/admin/vehicles/${v.id}`)} onEdit={() => { setEditItem(v); setFormOpen(true); }} onDelete={async () => { await base44.entities.Vehicle.delete(v.id); load(); }} onOwnershipChange={async (front, back) => { await base44.entities.Vehicle.update(v.id, { ownership_front_url: front, ownership_back_url: back }); load(); }} />
              ))}
            </div>
            )
          ) : (
            <div data-tour data-tour-title="Vehicle List" data-tour-en="Each row is a vehicle. Tap to open its full profile, edit details, or remove it. Switch between grid and list views using the toggle above." data-tour-ur="ہر قطار ایک گاڑی ہے۔ اس کی مکمل پروفائل کھولنے، تفصیلات میں ترمیم، یا اسے ہٹانے کے لیے ٹیپ کریں۔" data-tour-ml="ഓരോ വരിയും ഒരു വാഹനമാണ്. പ്രൊഫൈൽ തുറക്കാനോ എഡിറ്റുചെയ്യാനോ നീക്കംചെയ്യാനോ ടാപ്പുചെയ്യുക." className="space-y-2">
              {selected.size > 0 && (
                <div className="flex items-center justify-between gap-3 mb-3 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/30">
                  <p className="text-xs font-semibold text-primary">{selected.size} selected</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={clearSelection} className="h-8 border-border">{t('cancel')}</Button>
                    <Button size="sm" onClick={bulkDelete} className="h-8 bg-destructive hover:bg-destructive/90"><Trash2 className="w-3.5 h-3.5 mr-1" />{t('delete')} all</Button>
                  </div>
                </div>
              )}
              {filtered.map((v) => (
                <VehicleListRow key={v.id} v={v} selected={selected.has(v.id)} onSelect={() => toggleSelect(v.id)} onOpen={() => navigate(`/admin/vehicles/${v.id}`)} onEdit={() => { setEditItem(v); setFormOpen(true); }} onDelete={async () => { await base44.entities.Vehicle.delete(v.id); load(); }} />
              ))}
            </div>
          )}
        </>
      )}

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} icon={Truck} title={`${editItem ? t('edit') : t('add_new')} Vehicle`} subtitle="Register a new vehicle in the fleet">
          <VehicleForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.Vehicle.update(editItem.id, data); else await base44.entities.Vehicle.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
      </EntityFormDialog>
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
          <TypeCombobox value={form.type} onChange={(v) => update('type', v)} suggestions={['truck', 'trailer', 'tanker', 'crane', 'pickup', 'chillervan', 'freezervan', 'othermachines', 'other']} storageKey="vehicle_type_custom" /></div>
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