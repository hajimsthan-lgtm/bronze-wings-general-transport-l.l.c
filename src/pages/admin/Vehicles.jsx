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

import VehicleCard from '@/components/admin/VehicleCard';
import VehicleListRow from '@/components/admin/VehicleListRow';
import TypeCombobox from '@/components/admin/TypeCombobox';

import VehiclesAnalytics from '@/components/admin/VehiclesAnalytics';
import EntityFormDialog from '@/components/common/EntityFormDialog';
import VehicleAddForm from '@/components/admin/VehicleAddForm';
import { saveOwnershipDocument } from '@/lib/vehicleOwnershipDoc';
import { useToast } from '@/components/ui/use-toast';
import { safeListAll } from '@/lib/safeRequest';
import { useGlobalDate, inGlobalDateRange } from '@/lib/GlobalDateContext';
import { Plus, Search, Truck, Trash2, Sparkles, BookOpen } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import MobileFAB from '@/components/mobile/MobileFAB';
import { useVehiclesMode, setVehiclesMode, setVehiclesView, setVehiclesData } from '@/lib/vehiclesStore';
import { useProgressiveRender } from '@/hooks/useProgressiveRender';
import VehicleCatalogBuilder from '@/components/admin/VehicleCatalogBuilder';
import ExportButtons from '@/components/common/ExportButtons';

export default function Vehicles() {
  return <VehiclesTab />;
}

function VehiclesTab() {
  const { t } = useI18n();
  const { mode: themeMode } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editLicense, setEditLicense] = useState(null);
  const vehStore = useVehiclesMode();
  const view = vehStore.view;
  const mode = vehStore.mode;
  const [trips, setTrips] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [catalogOpen, setCatalogOpen] = useState(false);
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
      setItems((v || []).filter((x) => !x.vendor_name)); setTrips(tr || []); setFuelRecords(fr || []); setExpenses(ex || []);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Fetch the VehicleLicense record for a vehicle (by plate) so the edit form can populate
  const fetchLicense = async (vehicle) => {
    if (!vehicle?.plate_number) { setEditLicense(null); return; }
    try {
      const records = await base44.entities.VehicleLicense.filter({ trafficPlateNo: vehicle.plate_number });
      setEditLicense(records?.[0] || null);
    } catch { setEditLicense(null); }
  };

  const openEdit = (vehicle) => { setEditItem(vehicle); fetchLicense(vehicle); setFormOpen(true); };
  const openNew = () => { setEditItem(null); setEditLicense(null); setFormOpen(true); };

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('new') === '1') { openNew(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open form from TopBar "Add New" button
  useEffect(() => {
    const handler = () => { openNew(); };
    window.addEventListener('vehicles:new', handler);
    return () => window.removeEventListener('vehicles:new', handler);
  }, []);

  const q = search.toLowerCase().trim();
  const filtered = items.filter((v) => !q ||
    v.plate_number?.toLowerCase().includes(q) ||
    v.make?.toLowerCase().includes(q) ||
    v.model?.toLowerCase().includes(q) ||
    v.assigned_driver?.toLowerCase().includes(q) ||
    v.vendor_name?.toLowerCase().includes(q) ||
    v.type?.toLowerCase().includes(q) ||
    v.notes?.toLowerCase().includes(q)
  ).sort((a, b) => (a.plate_number || '').localeCompare(b.plate_number || ''));
  const { visible: visVehicles, sentinelProps: vehSentinel, hasMore: hasMoreVehicles, visibleCount: visV, totalCount: totalV } = useProgressiveRender(filtered);
  const fTrips = trips.filter((tt) => inGlobalDateRange(tt.trip_date, dateFrom, dateTo));
  const fFuel = fuelRecords.filter((r) => inGlobalDateRange(r.date, dateFrom, dateTo));
  const fExpenses = expenses.filter((r) => inGlobalDateRange(r.date, dateFrom, dateTo));

  // Publish filtered data + reload to the store so TopBar Export/Import work
  useEffect(() => { setVehiclesData(filtered, load); }, [filtered, items, trips, fuelRecords, expenses, dateFrom, dateTo]);

  return (
    <div>
      <MobileFAB icon={Plus} onClick={openNew} label="Add Vehicle" />

      {/* Catalog Builder button — floating, top-right of browse mode */}
      {mode !== 'analytics' && (
        <button
          onClick={() => setCatalogOpen(true)}
          className="hidden md:flex fixed right-6 bottom-6 z-40 items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          style={{ background: 'linear-gradient(135deg, rgb(var(--panel-accent-rgb)), rgb(var(--panel-accent2-rgb)))' }}
        >
          <BookOpen className="w-4 h-4" />
          Catalog Builder
        </button>
      )}

      {mode === 'analytics' ? (
        <div data-tour data-tour-title="Fleet Analytics" data-tour-en="This panel summarizes fleet performance — active vs maintenance counts, trip activity, fuel cost trends, and vehicle utilization. Use it to spot issues at a glance." data-tour-ur="یہ پینل فلیٹ کی کارکردگی کا خلاصہ پیش کرتا ہے — فعال بمقابلہ دیکھ بھال کے حسابات، ٹرپ سرگرمی، ایندھن لاگت کے رجحانات، اور گاڑی کا استعمال۔" data-tour-ml="ഈ പാനൽ ഫ്ലീറ്റ് പ്രകടനം സംഗ്രഹിക്കുന്നു — സജീവവും പരിപാലനവുമായ എണ്ണം, യാത്രാ പ്രവർത്തനം, ഇന്ധന ചെലവ് പ്രവണത.">
          <VehiclesAnalytics vehicles={filtered} trips={fTrips} fuelRecords={fFuel} expenses={fExpenses} loading={loading} onBrowseVehicles={() => setVehiclesMode('browse')} />
        </div>
      ) : (
        <>
          <div data-tour data-tour-title="Search Fleet" data-tour-en="Type a plate number or make here to instantly filter your vehicles. The list below updates as you type." data-tour-ur="اپنی گاڑیوں کو فوری طور پر فلٹر کرنے کے لیے یہاں پلیٹ نمبر یا برانڈ درج کریں۔ نیچے دی گئی فہرست آپ کی ٹائپ کے مطابق اپڈیٹ ہوتی ہے۔" data-tour-ml="നിങ്ങളുടെ വാഹനങ്ങൾ ഉടൻ ഫിൽട്ടർ ചെയ്യാൻ ഇവിടെ പ്ലേറ്റ് നമ്പർ അല്ലെങ്കിൽ മേക്ക് ടൈപ്പ് ചെയ്യുക. താഴെയുള്ള പട്ടിക ടൈപ്പ് ചെയ്യുമ്പോൾ അപ്ഡേറ്റ് ചെയ്യും." className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`${t('search')}...`} className="pl-9 search-2026 h-10" />
          </div>

          {/* Export sub-header — slides in with transition */}
          <div className="flex items-center justify-between gap-3 mb-4 px-4 py-2.5 rounded-xl bg-muted/30 border border-border/40 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{filtered.length} vehicles</span>
            </div>
            <ExportButtons data={filtered} filename="vehicles" title="Vehicles" columns={[{ label: 'Plate', key: 'plate_number' }, { label: 'Make', key: 'make' }, { label: 'Model', key: 'model' }, { label: 'Year', key: 'year' }, { label: 'Category', key: 'category', transform: (v) => { const m = (v.notes || '').match(/^Vehicle Category:\s*(.+)$/m); return m ? m[1].trim() : ''; } }, { label: 'Type', key: 'type' }, { label: 'Vehicle Type', key: 'vehicleType', transform: (v) => { const m = (v.notes || '').match(/^Vehicle Type:\s*(.+)$/m); return m ? m[1].trim() : ''; } }, { label: 'Status', key: 'status' }, { label: 'Driver', key: 'assigned_driver' }, { label: 'Reg Expiry', key: 'registration_expiry' }, { label: 'Ins Expiry', key: 'insurance_expiry' }, { label: 'Fuel', key: 'fuel_type' }]} />
          </div>

          {loading ? <LoadingSpinner /> : filtered.length === 0 ? <EmptyState icon={Truck} title={t('no_data')} /> :
          view === 'grid' ? (
            themeMode === 'light' ? (
              <div data-tour data-tour-title="Vehicle List" data-tour-en="Each card is a vehicle. Tap to open its full profile, edit details, or remove it. Switch between grid and list views using the toggle above." data-tour-ur="ہر کارڈ ایک گاڑی ہے۔ اس کی مکمل پروفائل کھولنے، تفصیلات میں ترمیم، یا اسے ہٹانے کے لیے ٹیپ کریں۔" data-tour-ml="ഓരോ കാർഡും ഒരു വാഹനമാണ്. പ്രൊഫൈൽ തുറക്കാനോ വിവരങ്ങൾ എഡിറ്റുചെയ്യാനോ നീക്കംചെയ്യാനോ ടാപ്പുചെയ്യുക.">
                {filtered.length > 4 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                    {filtered.slice(0, 4).map((v) => (
                      <VehicleCard key={v.id} v={v} onOpen={() => navigate(`/admin/vehicles/${v.id}`)} onEdit={() => openEdit(v)} onDelete={async () => { await base44.entities.Vehicle.delete(v.id); load(); }} onOwnershipChange={async (front, back) => { await base44.entities.Vehicle.update(v.id, { ownership_front_url: front, ownership_back_url: back }); load(); }} />
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
                    <VehicleCard key={v.id} v={v} onOpen={() => navigate(`/admin/vehicles/${v.id}`)} onEdit={() => openEdit(v)} onDelete={async () => { await base44.entities.Vehicle.delete(v.id); load(); }} onOwnershipChange={async (front, back) => { await base44.entities.Vehicle.update(v.id, { ownership_front_url: front, ownership_back_url: back }); load(); }} />
                  ))}
                </div>
              </div>
            ) : (
            <div data-tour data-tour-title="Vehicle List" data-tour-en="Each card is a vehicle. Tap to open its full profile, edit details, or remove it. Switch between grid and list views using the toggle above." data-tour-ur="ہر کارڈ ایک گاڑی ہے۔ اس کی مکمل پروفائل کھولنے، تفصیلات میں ترمیم، یا اسے ہٹانے کے لیے ٹیپ کریں۔" data-tour-ml="ഓരോ കാർഡും ഒരു വാഹനമാണ്. പ്രൊഫൈൽ തുറക്കാനോ വിവരങ്ങൾ എഡിറ്റുചെയ്യാനോ നീക്കംചെയ്യാനോ ടാപ്പുചെയ്യുക." className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {visVehicles.map((v) => (
                <VehicleCard key={v.id} v={v} onOpen={() => navigate(`/admin/vehicles/${v.id}`)} onEdit={() => openEdit(v)} onDelete={async () => { await base44.entities.Vehicle.delete(v.id); load(); }} onOwnershipChange={async (front, back) => { await base44.entities.Vehicle.update(v.id, { ownership_front_url: front, ownership_back_url: back }); load(); }} />
              ))}
              {hasMoreVehicles && (
                <div {...vehSentinel} className="col-span-full text-center text-xs text-muted-foreground py-4">
                  Loading more… ({visV}/{totalV})
                </div>
              )}
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
              {visVehicles.map((v) => (
                <VehicleListRow key={v.id} v={v} selected={selected.has(v.id)} onSelect={() => toggleSelect(v.id)} onOpen={() => navigate(`/admin/vehicles/${v.id}`)} onEdit={() => openEdit(v)} onDelete={async () => { await base44.entities.Vehicle.delete(v.id); load(); }} />
              ))}
              {hasMoreVehicles && (
                <div {...vehSentinel} className="text-center text-xs text-muted-foreground py-4">
                  Loading more… ({visV}/{totalV})
                </div>
              )}
            </div>
          )}
        </>
      )}

      <EntityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        icon={Truck}
        title={editItem ? 'Edit Vehicle' : 'Add New Vehicle'}
        subtitle="Scan license or enter details manually"
      >
        <VehicleAddForm
          editItem={editItem}
          editLicense={editLicense}
          onCancel={() => { setFormOpen(false); setEditLicense(null); }}
          onSave={async (vehicleData, licenseData) => {
            try {
              if (editItem) {
                await base44.entities.Vehicle.update(editItem.id, vehicleData);
                if (licenseData?.trafficPlateNo) {
                  const existing = await base44.entities.VehicleLicense.filter({ trafficPlateNo: licenseData.trafficPlateNo });
                  if (existing?.length) {
                    await base44.entities.VehicleLicense.update(existing[0].id, licenseData);
                  } else {
                    await base44.entities.VehicleLicense.create(licenseData);
                  }
                }
                if (licenseData?.ownershipPdf) {
                  await saveOwnershipDocument(editItem.id, { pdfFile: licenseData.ownershipPdf, expiryDate: licenseData.expDate });
                }
              } else {
                const created = await base44.entities.Vehicle.create(vehicleData);
                if (licenseData?.trafficPlateNo) {
                  await base44.entities.VehicleLicense.create(licenseData);
                }
                if (licenseData?.ownershipPdf) {
                  await saveOwnershipDocument(created.id, { pdfFile: licenseData.ownershipPdf, expiryDate: licenseData.expDate });
                }
                toast({ title: 'Vehicle added', description: `${vehicleData.make} ${vehicleData.model} · ${vehicleData.plate_number}` });
              }
              setFormOpen(false);
              setEditLicense(null);
              load();
            } catch (e) {
              toast({ title: 'Save failed', description: e?.message, variant: 'destructive' });
            }
          }}
        />
      </EntityFormDialog>

      <VehicleCatalogBuilder vehicles={filtered} open={catalogOpen} onOpenChange={setCatalogOpen} />

    </div>
  );
}