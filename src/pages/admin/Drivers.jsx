import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { Input } from '@/components/ui/input';
import EntityFormDialog from '@/components/common/EntityFormDialog';
import DriversAnalytics from '@/components/admin/DriversAnalytics';
import DriverCard from '@/components/admin/DriverCard';
import DriverListRow from '@/components/admin/DriverListRow';
import DriverAddForm from '@/components/admin/DriverAddForm';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
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

      <EntityFormDialog open={formOpen} onOpenChange={setFormOpen} icon={Users} title={`${editItem ? t('edit') : t('add_new')} Driver`} subtitle="Scan license or enter details manually">
          <DriverAddForm editItem={editItem} onSave={async (data) => { if (editItem) await base44.entities.Driver.update(editItem.id, data); else await base44.entities.Driver.create(data); load(); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
      </EntityFormDialog>
      <MobileFAB icon={Plus} onClick={() => { setEditItem(null); setFormOpen(true); }} label="Add Driver" />
    </div>
  );
}