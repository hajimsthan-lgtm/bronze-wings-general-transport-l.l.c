import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import TripCard from '@/components/trips/TripCard';
import TripFormSheet from '@/components/trips/TripFormSheet';
import TripDetailSheet from '@/components/trips/TripDetailSheet';
import TripListRow from '@/components/trips/TripListRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Truck, LayoutGrid, List } from 'lucide-react';
import ExportButtons from '@/components/common/ExportButtons';
import { useSheetUrlState } from '@/hooks/useSheetUrlState';
import PullToRefresh from '@/components/common/PullToRefresh';
import { useTrips, useTripDelete, useInvoices } from '@/hooks/useEntityQueries';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import FilterPill from '@/components/operations/FilterPill';
import SegmentedToggle from '@/components/operations/SegmentedToggle';
import PageInfo from '@/components/common/PageInfo';
import { formatDate } from '@/lib/formatters';

const STATUSES = ['all', 'scheduled', 'in_transit', 'completed', 'cancelled'];

export default function TripsView() {
  const { t } = useI18n();
  const { data: trips = [], isLoading: loading, refetch } = useTrips();
  const deleteTrip = useTripDelete();
  const { data: invoices = [], refetch: refetchInvoices } = useInvoices();
  const invoiceMap = useMemo(() => Object.fromEntries((invoices || []).filter((i) => i.trip_id).map((i) => [i.trip_id, i])), [invoices]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useSheetUrlState('trip');
  const [detailTrip, setDetailTrip] = useState(null);
  const [editTrip, setEditTrip] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [dateFrom, setDateFrom] = useState(() => {const d = new Date();return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];});
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [driverMap, setDriverMap] = useState({});
  const [vehicleMap, setVehicleMap] = useState({});
  const [clientMap, setClientMap] = useState({});
  const [clientsList, setClientsList] = useState([]);

  const loadMaps = async () => {
    try {
      const [drivers, vehicles, clients] = await Promise.all([
      base44.entities.Driver.list('-created_date', 200).catch(() => []),
      base44.entities.Vehicle.list('-created_date', 200).catch(() => []),
      base44.entities.Client.list('-created_date', 200).catch(() => [])]
      );
      setDriverMap(Object.fromEntries((drivers || []).map((d) => [d.name, d.id])));
      setVehicleMap(Object.fromEntries((vehicles || []).map((v) => [v.plate_number, v.id])));
      setClientMap(Object.fromEntries((clients || []).map((c) => [c.name, c.id])));
      setClientsList(clients || []);
    } catch {}
  };

  useEffect(() => {loadMaps();}, []);

  const filtered = trips.filter((trip) => {
    if (trip.trip_date < dateFrom || trip.trip_date > dateTo) return false;
    if (filter !== 'all' && trip.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return trip.from_location?.toLowerCase().includes(q) ||
      trip.to_location?.toLowerCase().includes(q) ||
      trip.driver_name?.toLowerCase().includes(q) ||
      trip.vehicle_plate?.toLowerCase().includes(q) ||
      trip.client_name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <PullToRefresh onRefresh={() => refetch()}>
      <PageHeader
          title={t('trips')}
          description={`${trips.length} total trips`}
          action={
          <Button onClick={() => {setEditTrip(null);setFormOpen(true);}} className="bg-primary hover:bg-primary/90 h-10">
            <Plus className="w-4 h-4 mr-1.5" /> {t('new_trip')}
          </Button>
          } />
        <PageInfo text="Record every transport job here. Enter client, route and times — revenue and overtime calculate automatically. Tap a driver, vehicle or client name to jump to their profile." />

      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`${t('search')}...`}
              className="w-full h-11 rounded-xl pl-9 pr-3 text-sm bg-muted/50 border border-border focus-visible:border-primary/40"
            />
          </div>
          <DateRangeFilter
            fromValue={dateFrom}
            onFromChange={setDateFrom}
            toValue={dateTo}
            onToChange={setDateTo}
            onToday={() => {
              const today = new Date().toISOString().split('T')[0];
              setDateFrom(today);
              setDateTo(today);
            }}
          />
          <div className="flex-1" />
          <SegmentedToggle
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'card', label: 'Cards', icon: LayoutGrid },
              { value: 'list', label: 'List', icon: List },
            ]}
          />
          <ExportButtons data={filtered.map((t) => ({ ...t, trip_date: t.trip_date ? formatDate(t.trip_date) : '' }))} filename="trips" title="Trips" columns={[
            { label: 'Trip #', key: 'trip_number' },
            { label: 'Date', key: 'trip_date' },
            { label: 'Driver', key: 'driver_name' },
            { label: 'Vehicle', key: 'vehicle_plate' },
            { label: 'Client', key: 'client_name' },
            { label: 'From', key: 'from_location' },
            { label: 'To', key: 'to_location' },
            { label: 'Revenue', key: 'revenue' },
            { label: 'Status', key: 'status' },
            { label: 'Payment', key: 'payment_status' }]
          } />
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {STATUSES.map((s) => (
            <FilterPill
              key={s}
              active={filter === s}
              label={s === 'all' ? 'All' : t(s)}
              count={s === 'all' ? undefined : trips.filter((tr) => tr.status === s).length}
              onClick={() => setFilter(s)}
            />
          ))}
        </div>
      </div>

      {loading ?
        <LoadingSpinner /> :
        filtered.length === 0 ?
        <EmptyState
          icon={Truck}
          title={t('no_data')}
          description="Create your first trip to get started"
          action={
          <Button onClick={() => {setEditTrip(null);setFormOpen(true);}} variant="outline" className="border-border">
            <Plus className="w-4 h-4 mr-1.5" /> {t('new_trip')}
            </Button>
          } /> :

        viewMode === 'card' ?
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((trip) =>
          <TripCard key={trip.id} trip={trip} onClick={setDetailTrip} driverMap={driverMap} vehicleMap={vehicleMap} clientMap={clientMap} invoiceMap={invoiceMap} onInvoicesChanged={() => refetchInvoices()} />
          )}
        </div> :

        <div className="space-y-2">
          {filtered.map((trip) =>
          <TripListRow key={trip.id} trip={trip} onClick={setDetailTrip} driverMap={driverMap} vehicleMap={vehicleMap} clientMap={clientMap} invoiceMap={invoiceMap} onInvoicesChanged={() => refetchInvoices()} />
          )}
        </div>
        }

      </PullToRefresh>

      <TripFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        editTrip={editTrip} />
      

      <TripDetailSheet
        trip={detailTrip}
        contactPersons={clientsList.find((c) => c.name === detailTrip?.client_name)?.contact_persons}
        onClose={() => setDetailTrip(null)}
        onEdit={(trip) => {setDetailTrip(null);setEditTrip(trip);setFormOpen(true);}}
        onDelete={async (trip) => {
          await deleteTrip.mutateAsync(trip.id);
          setDetailTrip(null);
        }} />
      
    </div>);

}