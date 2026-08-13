import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import PullToRefresh from '@/components/common/PullToRefresh';
import TripCard from '@/components/trips/TripCard';
import ContractCard from '@/components/contracts/ContractCard';
import TripsList from '@/components/operations/TripsList';
import TripsTable from '@/components/operations/TripsTable';
import ContractsList from '@/components/operations/ContractsList';
import ContractsTable from '@/components/operations/ContractsTable';
import CollapsibleSection from '@/components/operations/CollapsibleSection';
import TripFormSheet from '@/components/trips/TripFormSheet';
import TripDetailSheet from '@/components/trips/TripDetailSheet';
import ContractDetailSheet from '@/components/contracts/ContractDetailSheet';
import OperationsToolbar from '@/components/operations/OperationsToolbar';
import { useTrips, useTripDelete, useInvoices } from '@/hooks/useEntityQueries';
import { formatDate, formatCurrency, normalizeDate } from '@/lib/formatters';
import { inGlobalDateRange } from '@/lib/GlobalDateContext';
import { Truck, FileText, Landmark, Building2 } from 'lucide-react';

const TRIP_STATUSES = ['all', 'scheduled', 'in_transit', 'completed', 'cancelled'];
const CONTRACT_STATUSES = ['all', 'active', 'expired', 'terminated'];

const TRIP_EXPORT_COLUMNS = [
  { label: 'Trip #', key: 'trip_number' },
  { label: 'Date', key: 'trip_date' },
  { label: 'Driver', key: 'driver_name' },
  { label: 'Vehicle', key: 'vehicle_plate' },
  { label: 'Client', key: 'client_name' },
  { label: 'From', key: 'from_location' },
  { label: 'To', key: 'to_location' },
  { label: 'Revenue', key: 'revenue' },
  { label: 'Status', key: 'status' },
  { label: 'Payment', key: 'payment_status' },
];
const CONTRACT_EXPORT_COLUMNS = [
  { label: 'Contract ID', key: 'contract_id' },
  { label: 'Client', key: 'company_name' },
  { label: 'Start', key: 'start_date' },
  { label: 'End', key: 'end_date' },
  { label: 'Driver', key: 'driver_name' },
  { label: 'Vehicle', key: 'vehicle_plate' },
  { label: 'Monthly Rental', key: 'monthly_rate' },
  { label: 'Total Expenses', key: 'total_expenses' },
  { label: 'Net Profit', key: 'net_profit' },
  { label: 'Margin %', key: 'margin' },
  { label: 'Status', key: 'status' },
];

function SectionLabel({ children, count }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</span>
      <span className="text-xs text-muted-foreground/60 tabular-nums">{count}</span>
      <span className="flex-1 h-px bg-border" />
    </div>
  );
}

export default function Operations() {
  const location = useLocation();
  const { t } = useI18n();
  const { toast } = useToast();

  const { data: trips = [], isLoading: tripsLoading, refetch: refetchTrips } = useTrips();
  const deleteTrip = useTripDelete();
  const { data: invoices = [], refetch: refetchInvoices } = useInvoices();
  const invoiceMap = useMemo(() => Object.fromEntries((invoices || []).filter((i) => i.trip_id).map((i) => [i.trip_id, i])), [invoices]);

  const { dateFrom, dateTo, setDateFrom, setDateTo } = useGlobalDate();
  const [mode, setMode] = useState(location.pathname === '/contracts' ? 'contract' : 'all');
  const [viewMode, setViewMode] = useState('table');
  const [search, setSearch] = useState('');
  const [tripFilter, setTripFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');

  const [contracts, setContracts] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  const [driverMap, setDriverMap] = useState({});
  const [vehicleMap, setVehicleMap] = useState({});
  const [clientMap, setClientMap] = useState({});
  const [clientsList, setClientsList] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('trip');
  const [editTrip, setEditTrip] = useState(null);
  const [editContract, setEditContract] = useState(null);
  const [detailContract, setDetailContract] = useState(null);
  const [prefill, setPrefill] = useState(null);

  // Trip detail sheet is URL-backed so Android hardware back closes it.
  const detailTripId = searchParams.get('tripId');
  const detailTripOpen = searchParams.get('open') === 'trip-detail';
  const detailTrip = detailTripOpen && detailTripId ? (trips.find((t) => t.id === detailTripId) || null) : null;
  const openDetailTrip = (trip) => {
    const next = new URLSearchParams(searchParams);
    next.set('open', 'trip-detail');
    next.set('tripId', trip.id);
    setSearchParams(next);
  };
  const closeDetailTrip = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('open');
    next.delete('tripId');
    setSearchParams(next, { replace: true });
  };

  const loadContracts = useCallback(async () => {
    setContractsLoading(true);
    try {
      const [list, exp] = await Promise.all([
        base44.entities.MonthlyContract.list('-created_date', 200).catch(() => []),
        base44.entities.ContractExpense.list('-created_date', 500).catch(() => []),
      ]);
      setContracts(list || []);
      setAllExpenses(exp || []);
    } finally {
      setContractsLoading(false);
    }
  }, []);

  const loadMaps = useCallback(async () => {
    try {
      const [drivers, vehicles, clients] = await Promise.all([
        base44.entities.Driver.list('-created_date', 200).catch(() => []),
        base44.entities.Vehicle.list('-created_date', 200).catch(() => []),
        base44.entities.Client.list('-created_date', 200).catch(() => []),
      ]);
      setDriverMap(Object.fromEntries((drivers || []).map((d) => [d.name, d.id])));
      setVehicleMap(Object.fromEntries((vehicles || []).map((v) => [v.plate_number, v.id])));
      setClientMap(Object.fromEntries((clients || []).map((c) => [c.name, c.id])));
      setClientsList(clients || []);
    } catch {}
  }, []);

  useEffect(() => { loadContracts(); loadMaps(); }, [loadContracts, loadMaps]);

  const expensesByContract = useMemo(() => {
    const map = {};
    (allExpenses || []).forEach((e) => {
      if (!map[e.contract_id]) map[e.contract_id] = [];
      map[e.contract_id].push(e);
    });
    return map;
  }, [allExpenses]);

  const filteredTrips = useMemo(() => trips.filter((trip) => {
    if (!inGlobalDateRange(normalizeDate(trip.trip_date), dateFrom, dateTo)) return false;
    if (tripFilter !== 'all' && trip.status !== tripFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return trip.trip_number?.toLowerCase().includes(q) ||
        trip.from_location?.toLowerCase().includes(q) ||
        trip.to_location?.toLowerCase().includes(q) ||
        trip.driver_name?.toLowerCase().includes(q) ||
        trip.vehicle_plate?.toLowerCase().includes(q) ||
        trip.client_name?.toLowerCase().includes(q) ||
        trip.delivery_note_number?.toLowerCase().includes(q) ||
        (trip.id || '').toLowerCase().slice(-6).includes(q);
    }
    return true;
  }).sort((a, b) => {
    const da = new Date(a.trip_date || a.created_date).getTime();
    const db = new Date(b.trip_date || b.created_date).getTime();
    return db - da;
  }), [trips, dateFrom, dateTo, tripFilter, search]);

  const filteredContracts = useMemo(() => contracts.filter((c) => {
    if (contractFilter !== 'all' && c.status !== contractFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.company_name?.toLowerCase().includes(q) ||
        c.vehicle_plate?.toLowerCase().includes(q) ||
        c.driver_name?.toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q);
    }
    return true;
  }), [contracts, contractFilter, search]);

  const tripCounts = useMemo(() => {
    const c = { scheduled: 0, in_transit: 0, completed: 0, cancelled: 0 };
    trips.forEach((tr) => { if (c[tr.status] != null) c[tr.status]++; });
    return c;
  }, [trips]);
  const contractCounts = useMemo(() => {
    const c = { active: 0, expired: 0, terminated: 0 };
    contracts.forEach((cn) => { if (c[cn.status] != null) c[cn.status]++; });
    return c;
  }, [contracts]);



  // Form handlers
  const openNewTrip = () => { setFormMode('trip'); setEditTrip(null); setEditContract(null); setPrefill(null); setFormOpen(true); };
  const openNewContract = () => { setFormMode('contract'); setEditTrip(null); setEditContract(null); setFormOpen(true); };
  const openEditTrip = (trip) => { setFormMode('trip'); setEditTrip(trip); setEditContract(null); setFormOpen(true); };
  const openEditContract = (c) => { setFormMode('contract'); setEditTrip(null); setEditContract(c); setFormOpen(true); };
  const handleFormClose = (v) => { setFormOpen(v); if (!v) { setEditTrip(null); setEditContract(null); } };
  const handleFormSaved = () => { refetchTrips(); loadContracts(); };

  // Auto-open the new-trip form when arriving via ?new=1 (Dashboard quick action / vehicle "New Trip")
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get('new') === '1') {
      setFormMode('trip');
      setEditTrip(null);
      setEditContract(null);
      const vp = p.get('vehicle_plate');
      setPrefill(vp ? { vehicle_plate: vp } : null);
      setFormOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open the new-trip form from the TopBar subnav "New Trip" button
  useEffect(() => {
    const handler = () => { setFormMode('trip'); setEditTrip(null); setEditContract(null); setPrefill(null); setFormOpen(true); };
    window.addEventListener('ops:new-trip', handler);
    return () => window.removeEventListener('ops:new-trip', handler);
  }, []);

  const handleDeleteTrip = async (trip) => {
    await deleteTrip.mutateAsync(trip.id);
    closeDetailTrip();
  };
  const handleTripStatusChange = async (trip, newStatus) => {
    try {
      await base44.entities.Trip.update(trip.id, { status: newStatus });
      toast({ title: 'Status updated', description: `${trip.trip_number || 'Trip'} → ${newStatus.replace('_', ' ')}` });
      refetchTrips();
    } catch {
      toast({ title: 'Could not update status', variant: 'destructive' });
    }
  };
  const deleteContractById = async (c) => {
    try {
      await base44.entities.ContractExpense.deleteMany({ contract_id: c.id }).catch(() => {});
      await base44.entities.MonthlyContract.delete(c.id);
      toast({ title: 'Contract deleted' });
      loadContracts();
    } catch {
      toast({ title: 'Could not delete contract', variant: 'destructive' });
    }
  };
  const handleDeleteContract = async (c) => {
    if (!confirm(`${t('delete')} "${c.company_name}"?`)) return;
    await deleteContractById(c);
  };

  // Export
  const isContractExport = mode === 'contract';
  const exportData = useMemo(() => {
    if (isContractExport) {
      return filteredContracts.map((c) => {
        const expenses = expensesByContract[c.id] || [];
        const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const monthlyRate = Number(c.monthly_rate) || 0;
        const netProfit = monthlyRate - totalExpenses;
        const margin = monthlyRate > 0 ? Math.round((netProfit / monthlyRate) * 100) : 0;
        return {
          contract_id: `#${c.id?.slice(-6).toUpperCase()}`,
          company_name: c.company_name,
          start_date: c.start_date ? formatDate(c.start_date) : '',
          end_date: c.end_date ? formatDate(c.end_date) : '',
          driver_name: c.driver_name,
          vehicle_plate: c.vehicle_plate,
          monthly_rate: c.monthly_rate,
          total_expenses: totalExpenses,
          net_profit: netProfit,
          margin,
          status: c.status,
        };
      });
    }
    return filteredTrips.map((tr) => ({ ...tr, trip_date: tr.trip_date ? formatDate(tr.trip_date) : '' }));
  }, [isContractExport, filteredContracts, filteredTrips, expensesByContract]);

  const statusOptions = mode === 'contract' ? CONTRACT_STATUSES : TRIP_STATUSES;
  const statusValue = mode === 'contract' ? contractFilter : tripFilter;
  const onStatusChange = mode === 'contract' ? setContractFilter : setTripFilter;
  const statusCounts = mode === 'contract' ? contractCounts : tripCounts;

  const loading = tripsLoading || contractsLoading;
  const showTrips = mode === 'all' || mode === 'trip';
  const showContracts = mode === 'all' || mode === 'contract';

  const tripGrid = (list) => (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {list.map((trip) => (
        <TripCard key={trip.id} trip={trip} onClick={openDetailTrip} driverMap={driverMap} vehicleMap={vehicleMap} clientMap={clientMap} invoiceMap={invoiceMap} onInvoicesChanged={() => refetchInvoices()} />
      ))}
    </div>
  );
  const contractGrid = (list) => (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
      {list.map((c) => (
        <ContractCard key={c.id} contract={c} expenses={expensesByContract[c.id] || []} onEdit={() => openEditContract(c)} onDelete={() => handleDeleteContract(c)} onDetails={() => setDetailContract(c)} driverMap={driverMap} vehicleMap={vehicleMap} clientMap={clientMap} />
      ))}
    </div>
  );

  const noTrips = showTrips && filteredTrips.length === 0;
  const noContracts = showContracts && filteredContracts.length === 0;
  const allEmpty = noTrips && (mode === 'trip' || noContracts) && (mode !== 'trip' ? noContracts : true);

  return (
    <div>
      <PullToRefresh onRefresh={() => { refetchTrips(); refetchInvoices(); loadContracts(); }}>
        <div className="mb-4">
          <OperationsToolbar
            mode={mode}
            onModeChange={setMode}
            search={search}
            setSearch={setSearch}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            statusOptions={statusOptions}
            statusValue={statusValue}
            onStatusChange={onStatusChange}
            statusCounts={statusCounts}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onNewTrip={openNewTrip}
            onNewContract={openNewContract}
            exportData={exportData}
            exportFilename={isContractExport ? 'monthly-contracts' : 'trips'}
            exportTitle={isContractExport ? 'Monthly Contracts' : 'Trips'}
            exportColumns={isContractExport ? CONTRACT_EXPORT_COLUMNS : TRIP_EXPORT_COLUMNS}
            onImported={() => { refetchTrips(); refetchInvoices(); }}
          />
        </div>
        {/* All operations controls moved to the sticky sub-head bar (TopBar slot) */}

        {loading ? (
          <LoadingSpinner />
        ) : (mode === 'trip' && noTrips) || (mode === 'contract' && noContracts) || (mode === 'all' && allEmpty) ? (
          <EmptyState
            icon={mode === 'contract' ? FileText : Truck}
            title={t('no_data')}
            description={mode === 'contract' ? 'Create your first monthly contract to track rental profitability' : 'Create your first trip to get started'}
            action={mode === 'contract'
              ? <button onClick={openNewContract} className="clay-btn-ghost text-sm">{t('new_contract')}</button>
              : <button onClick={openNewTrip} className="clay-btn-ghost text-sm">{t('new_trip')}</button>}
          />
        ) : (
          <div className="space-y-4">
            {showTrips && filteredTrips.length > 0 && (
              <CollapsibleSection
                icon={Landmark}
                label={t('trips_section')}
                count={filteredTrips.length}
                accent="blue"
                defaultCollapsed={true}
              >
                {viewMode === 'card'
                  ? tripGrid(filteredTrips)
                  : viewMode === 'table'
                  ? <TripsTable trips={filteredTrips} onOpenDetail={openDetailTrip} onEdit={openEditTrip} onDelete={handleDeleteTrip} onStatusChange={handleTripStatusChange} driverMap={driverMap} vehicleMap={vehicleMap} clientMap={clientMap} invoiceMap={invoiceMap} onInvoicesChanged={() => refetchInvoices()} />
                  : <TripsList trips={filteredTrips} onOpenDetail={openDetailTrip} onEdit={openEditTrip} onDelete={handleDeleteTrip} driverMap={driverMap} vehicleMap={vehicleMap} clientMap={clientMap} invoiceMap={invoiceMap} onInvoicesChanged={() => refetchInvoices()} />}
              </CollapsibleSection>
            )}
            {showContracts && filteredContracts.length > 0 && (
              <CollapsibleSection
                icon={Building2}
                label={t('contracts_section')}
                count={filteredContracts.length}
                accent="violet"
                defaultCollapsed={true}
              >
                {viewMode === 'card'
                  ? contractGrid(filteredContracts)
                  : viewMode === 'table'
                  ? <ContractsTable contracts={filteredContracts} expensesByContract={expensesByContract} onEdit={openEditContract} onDelete={handleDeleteContract} onDetails={setDetailContract} />
                  : <ContractsList contracts={filteredContracts} expensesByContract={expensesByContract} onEdit={openEditContract} onDelete={handleDeleteContract} onDetails={setDetailContract} driverMap={driverMap} vehicleMap={vehicleMap} />}
              </CollapsibleSection>
            )}
          </div>
        )}
      </PullToRefresh>

      <TripFormSheet
        open={formOpen}
        onOpenChange={handleFormClose}
        editTrip={editTrip}
        editContract={editContract}
        initialMode={formMode}
        onSaved={handleFormSaved}
        prefill={prefill}
      />

      <TripDetailSheet
        trip={detailTrip}
        contactPersons={clientsList.find((c) => c.name === detailTrip?.client_name)?.contact_persons}
        onClose={closeDetailTrip}
        onEdit={(trip) => { closeDetailTrip(); openEditTrip(trip); }}
        onDelete={handleDeleteTrip}
      />

      <ContractDetailSheet
        contract={detailContract}
        expenses={detailContract ? (expensesByContract[detailContract.id] || []) : []}
        onClose={() => setDetailContract(null)}
        onEdit={(c) => { setDetailContract(null); openEditContract(c); }}
        onDelete={async (c) => { await deleteContractById(c); setDetailContract(null); }}
      />
    </div>
  );
}