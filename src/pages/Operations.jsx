import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import { safeAll } from '@/lib/safeRequest';
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
import OperationsStats from '@/components/operations/OperationsStats';
import MobileOperationsStats from '@/components/operations/MobileOperationsStats';
import MobileAuroraTripsTable from '@/components/operations/MobileAuroraTripsTable';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTrips, useTripDelete, useInvoices } from '@/hooks/useEntityQueries';
import { formatDate, formatCurrency, normalizeDate } from '@/lib/formatters';
import { inGlobalDateRange } from '@/lib/GlobalDateContext';
import { Truck, FileText, Landmark, Building2 } from 'lucide-react';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog';

import { setOpsFilter, deactivateOpsFilter, useOpsSearch, setOpsSearch, setOpsDebug, useOpsBulk } from '@/lib/operationsFilterStore';
import { useMobileFilter } from '@/lib/mobileHeaderFilter';
import { autoStartScheduledTrips, migrateTripStatuses } from '@/lib/tripStatusWorkflow';
import { getCompanySettings } from '@/lib/companySettings';
import { useAuth } from '@/lib/AuthContext';
import TripDebuggerModal from '@/components/operations/TripDebuggerModal';
import TripFilterBar from '@/components/operations/TripFilterBar';

const TRIP_STATUSES = ['all', 'scheduled', 'trip_started', 'trip_ended', 'completed', 'cancelled'];
const CONTRACT_STATUSES = ['all', 'active', 'expired', 'terminated'];

const TRIP_EXPORT_COLUMNS = [
  { label: 'Trip #',       key: 'trip_number',     w: 20, noWrap: true },
  { label: 'Date',         key: 'trip_date',        w: 20 },
  { label: 'Driver',       key: 'driver_name',      w: 22 },
  { label: 'Driver Phone', key: 'driver_phone',     w: 24 },
  { label: 'Vehicle',      key: 'vehicle_plate',    w: 18 },
  { label: 'Client',       key: 'client_name',      w: 22 },
  { label: 'From',         key: 'from_location',    w: 22 },
  { label: 'To',           key: 'to_location',      w: 22 },
  { label: 'Revenue',      key: 'revenue',          w: 20, numeric: true },
  { label: 'Status',       key: 'status',           w: 22 },
  { label: 'Payment',      key: 'payment_status',   w: 27 },
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
  const { user } = useAuth();
  const { data: invoices = [], refetch: refetchInvoices } = useInvoices();
  const invoiceMap = useMemo(() => {
    const map = {};
    (invoices || []).forEach(inv => {
      if (!inv.trip_id) return;
      String(inv.trip_id).split(',').forEach(tn => { const v = tn.trim(); if (v) map[v] = inv; });
    });
    return map;
  }, [invoices]);

  const { dateFrom, dateTo, setDateFrom, setDateTo } = useGlobalDate();
  const isMobile = useIsMobile();
  const [mode, setMode] = useState(location.pathname === '/contracts' ? 'contract' : 'all');
  const [viewMode, setViewMode] = useState('table');
  const search = useOpsSearch();
  const mobileFilter = useMobileFilter();
  const [tripFilter, setTripFilter] = useState('all');
  const [contractFilter, setContractFilter] = useState('all');

  const [contracts, setContracts] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [contractsLoading, setContractsLoading] = useState(true);

  const [driverMap, setDriverMap] = useState({});
  const [vehicleMap, setVehicleMap] = useState({});
  const [clientMap, setClientMap] = useState({});
  const [clientsList, setClientsList] = useState([]);
  const [driversList, setDriversList] = useState([]);
  const [vehiclesList, setVehiclesList] = useState([]);
  const [filterStatuses, setFilterStatuses] = useState(new Set());
  const [filterClient, setFilterClient] = useState('all');
  const [filterDriver, setFilterDriver] = useState('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const clientContactMap = useMemo(() => Object.fromEntries((clientsList || []).map((c) => [c.name, c.contact_person || ''])), [clientsList]);
  const [companySettings, setCompanySettings] = useState({ vendor_rate_percentage: 80 });
  const [debuggerOpen, setDebuggerOpen] = useState(false);
  const opsBulk = useOpsBulk();

  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('trip');
  const [editTrip, setEditTrip] = useState(null);
  const [editContract, setEditContract] = useState(null);
  const [detailContract, setDetailContract] = useState(null);
  const [prefill, setPrefill] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [pendingBulkIds, setPendingBulkIds] = useState([]);

  // Sync mobile header filter → ops search
  useEffect(() => { if (isMobile) setOpsSearch(mobileFilter); }, [mobileFilter, isMobile]);

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
      const [list, exp] = await safeAll([
        () => base44.entities.MonthlyContract.list('-created_date', 100).catch(() => []),
        () => base44.entities.ContractExpense.list('-created_date', 200).catch(() => []),
      ], 2);
      setContracts(list || []);
      setAllExpenses(exp || []);
    } finally {
      setContractsLoading(false);
    }
  }, []);

  const loadMaps = useCallback(async () => {
    try {
      const [drivers, vehicles, clients] = await safeAll([
        () => base44.entities.Driver.list('-created_date', 100).catch(() => []),
        () => base44.entities.Vehicle.list('-created_date', 100).catch(() => []),
        () => base44.entities.Client.list('-created_date', 100).catch(() => []),
      ], 2);
      setDriverMap(Object.fromEntries((drivers || []).map((d) => [d.name, d.id])));
      setVehicleMap(Object.fromEntries((vehicles || []).map((v) => [v.plate_number, v.id])));
      setClientMap(Object.fromEntries((clients || []).map((c) => [c.name, c.id])));
      setClientsList(clients || []);
      setDriversList(drivers || []);
      setVehiclesList(vehicles || []);
    } catch {}
  }, []);

  useEffect(() => { (async () => { await loadContracts(); await loadMaps(); })(); }, [loadContracts, loadMaps]);

  // Load company settings once (needed for vendor-rate validation in debugger)
  useEffect(() => { getCompanySettings().then(setCompanySettings); }, []);

  // One-time migration of old statuses (in_transit → trip_started)
  const didMigration = useRef(false);
  useEffect(() => {
    if (didMigration.current || !trips || trips.length === 0) return;
    didMigration.current = true;
    migrateTripStatuses(trips).then((migrated) => {
      if (migrated.length > 0) refetchTrips();
    });
  }, [trips, refetchTrips]);

  // Auto-status: Scheduled → Trip Started when start time is reached
  const tripsRef = useRef(trips);
  tripsRef.current = trips;
  useEffect(() => {
    const check = () => {
      if (!tripsRef.current || tripsRef.current.length === 0) return;
      autoStartScheduledTrips(tripsRef.current).then((started) => {
        if (started.length > 0) refetchTrips();
      });
    };
    const t = setTimeout(check, 3000);
    const interval = setInterval(check, 60000);
    return () => { clearTimeout(t); clearInterval(interval); };
  }, [refetchTrips]);

  const expensesByContract = useMemo(() => {
    const map = {};
    (allExpenses || []).forEach((e) => {
      if (!map[e.contract_id]) map[e.contract_id] = [];
      map[e.contract_id].push(e);
    });
    return map;
  }, [allExpenses]);

  const filteredTrips = useMemo(() => trips.filter((trip) => {
    if (trip.is_draft) return false;
    if (trip.deleted_at) return false;
    if (!inGlobalDateRange(normalizeDate(trip.trip_date), dateFrom, dateTo)) return false;
    // Multi-select status from filter bar takes precedence; fall back to single-select tripFilter
    if (filterStatuses.size > 0) {
      if (!filterStatuses.has(trip.status)) return false;
    } else if (tripFilter !== 'all' && trip.status !== tripFilter) return false;
    if (filterClient !== 'all' && trip.client_name !== filterClient) return false;
    if (filterDriver !== 'all' && trip.driver_name !== filterDriver) return false;
    if (filterVehicle !== 'all' && trip.vehicle_plate !== filterVehicle) return false;
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
  }), [trips, dateFrom, dateTo, tripFilter, search, filterStatuses, filterClient, filterDriver, filterVehicle]);

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
    const c = { scheduled: 0, trip_started: 0, trip_ended: 0, completed: 0, cancelled: 0 };
    trips.forEach((tr) => { if (!tr.is_draft && c[tr.status] != null) c[tr.status]++; });
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
  const handleDuplicateTrip = async (trip) => {
    try {
      const { id, created_date, updated_date, created_by_id, trip_number, status, status_source, status_updated_at, status_updated_by, cancellation_reason, cancelled_at, cancelled_by, deleted_at, ...rest } = trip;
      const payload = {
        ...rest,
        status: 'scheduled',
        status_source: 'manual',
        status_updated_at: new Date().toISOString(),
        status_updated_by: user?.full_name || user?.email || 'User',
        is_draft: true,
      };
      await base44.entities.Trip.create(payload);
      toast({ title: 'Trip duplicated', description: 'A draft copy has been created — edit and publish it.' });
      refetchTrips();
    } catch {
      toast({ title: 'Duplicate failed', variant: 'destructive' });
    }
  };
  const openEditContract = (c) => { setFormMode('contract'); setEditTrip(null); setEditContract(c); setFormOpen(true); };
  const handleContinueDraft = (draft) => { openEditTrip(draft); };
  const handleDeleteDraft = async (draft) => { await base44.entities.Trip.delete(draft.id); refetchTrips(); };
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

  // Open the new-trip / new-contract form from the TopBar subnav or mobile search bar button
  useEffect(() => {
    const tripHandler = () => { setFormMode('trip'); setEditTrip(null); setEditContract(null); setPrefill(null); setFormOpen(true); };
    const contractHandler = () => { setFormMode('contract'); setEditTrip(null); setEditContract(null); setFormOpen(true); };
    const debugHandler = () => setDebuggerOpen(true);
    const refreshHandler = () => { refetchTrips(); refetchInvoices(); loadContracts(); };
    const continueDraftHandler = (e) => { setFormMode('trip'); setEditTrip(e.detail); setEditContract(null); setFormOpen(true); };
    window.addEventListener('ops:new-trip', tripHandler);
    window.addEventListener('ops:new-contract', contractHandler);
    window.addEventListener('ops:debug', debugHandler);
    window.addEventListener('ops:refresh', refreshHandler);
    window.addEventListener('ops:continue-draft', continueDraftHandler);
    return () => {
      window.removeEventListener('ops:new-trip', tripHandler);
      window.removeEventListener('ops:new-contract', contractHandler);
      window.removeEventListener('ops:debug', debugHandler);
      window.removeEventListener('ops:refresh', refreshHandler);
      window.removeEventListener('ops:continue-draft', continueDraftHandler);
    };
  }, []);

  const requestDeleteTrip = (trip) => setDeleteTarget(trip);
  const handleDeleteTrip = async (trip) => {
    // Soft-delete: set deleted_at instead of hard-deleting
    try {
      await base44.entities.Trip.update(trip.id, { deleted_at: new Date().toISOString() });
      toast({ title: 'Trip moved to trash', description: 'Restore from Trash anytime' });
      refetchTrips();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
    closeDetailTrip();
    setDeleteTarget(null);
  };
  const handleBulkTripStatus = async (ids, newStatus) => {
    if (!ids.length) return;
    try {
      await base44.entities.Trip.updateMany({ id: { $in: ids } }, { $set: { status: newStatus, status_source: 'manual', status_updated_at: new Date().toISOString() } });
      toast({ title: `${ids.length} trip${ids.length !== 1 ? 's' : ''} updated`, description: `Status → ${newStatus.replace(/_/g, ' ')}` });
      refetchTrips();
    } catch {
      toast({ title: 'Bulk update failed', variant: 'destructive' });
    }
  };
  const handleBulkTripDelete = async (ids) => {
    if (!ids.length) return;
    setPendingBulkIds(ids);
    setBulkDeleteOpen(true);
  };
  const confirmBulkTripDelete = async () => {
    const ids = pendingBulkIds;
    if (!ids.length) return;
    try {
      await base44.entities.Trip.updateMany({ id: { $in: ids } }, { $set: { deleted_at: new Date().toISOString() } });
      toast({ title: `${ids.length} trip${ids.length !== 1 ? 's' : ''} moved to trash` });
      refetchTrips();
    } catch {
      toast({ title: 'Bulk delete failed', variant: 'destructive' });
    }
    setBulkDeleteOpen(false);
    setPendingBulkIds([]);
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

  // Keep latest export data in a ref so the store-publish effect doesn't
  // re-run on every data change (which caused an infinite update loop).
  const exportDataRef = useRef(exportData);
  exportDataRef.current = exportData;

  // Publish status-filter state to the shared store so the TopBar can render
  // the filter pills on the left edge of the sub-nav.
  useEffect(() => {
    setOpsFilter({
      active: true, options: statusOptions, value: statusValue, onChange: onStatusChange, counts: statusCounts,
      mode,
      exportConfig: {
        get data() { return exportDataRef.current; },
        filename: isContractExport ? 'monthly-contracts' : 'trips',
        title: isContractExport ? 'Monthly Contracts' : 'Trips',
        columns: isContractExport ? CONTRACT_EXPORT_COLUMNS : TRIP_EXPORT_COLUMNS,
      },
      onImported: () => { refetchTrips(); refetchInvoices(); },
    });
    // Debugger is only relevant for trips (not contracts)
    setOpsDebug(mode !== 'contract' ? { onRun: () => setDebuggerOpen(true) } : null);
    return () => { deactivateOpsFilter(); setOpsDebug(null); };
  }, [statusOptions, statusValue, onStatusChange, statusCounts, mode, isContractExport]);

  const loading = tripsLoading || contractsLoading;
  const showTrips = mode === 'all' || mode === 'trip';
  const showContracts = mode === 'all' || mode === 'contract';

  const tripGrid = (list) => (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {list.map((trip) => (
        <TripCard key={trip.id} trip={trip} onClick={openDetailTrip} onDelete={requestDeleteTrip} onStatusUpdated={refetchTrips} driverMap={driverMap} vehicleMap={vehicleMap} clientMap={clientMap} invoiceMap={invoiceMap} onInvoicesChanged={() => refetchInvoices()} />
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

  const totalRevenue = filteredTrips.reduce((s, t) => s + (Number(t.revenue) || 0), 0);

  const toggleFilterStatus = (status) => {
    setFilterStatuses(prev => {
      const n = new Set(prev);
      if (n.has(status)) n.delete(status); else n.add(status);
      return n;
    });
  };
  const clearAllFilters = () => {
    setFilterStatuses(new Set());
    setFilterClient('all');
    setFilterDriver('all');
    setFilterVehicle('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div>
      <PullToRefresh onRefresh={() => { refetchTrips(); refetchInvoices(); loadContracts(); }}>
        {showTrips && !isMobile && (
          <TripFilterBar
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            selectedStatuses={filterStatuses}
            onToggleStatus={toggleFilterStatus}
            clients={clientsList}
            drivers={driversList}
            vehicles={vehiclesList}
            clientFilter={filterClient}
            onClientFilterChange={setFilterClient}
            driverFilter={filterDriver}
            onDriverFilterChange={setFilterDriver}
            vehicleFilter={filterVehicle}
            onVehicleFilterChange={setFilterVehicle}
            onClearAll={clearAllFilters}
            totalCount={trips.filter(t => !t.is_draft && !t.deleted_at).length}
            filteredCount={filteredTrips.length}
          />
        )}
        <div className="mb-3">
          {isMobile ? (
            <MobileOperationsStats
              mode={mode}
              tripsCount={filteredTrips.length}
              totalRevenue={totalRevenue}
              tripCounts={tripCounts}
              contractsCount={filteredContracts.length}
              contractCounts={contractCounts}
              activeFilter={mode === 'contract' ? contractFilter : tripFilter}
              onStatClick={(filter) => {
                if (mode === 'contract') setContractFilter(filter);
                else setTripFilter(filter);
              }}
            />
          ) : (
            <OperationsStats
              mode={mode}
              tripsCount={filteredTrips.length}
              totalRevenue={totalRevenue}
              tripCounts={tripCounts}
              contractsCount={filteredContracts.length}
              contractCounts={contractCounts}
            />
          )}
        </div>
        {/* Search & filter controls moved to the sticky sub-header (TopBar) */}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3">
            {/* Empty state — when no trips/contracts */}
            {((mode === 'trip' && noTrips) || (mode === 'contract' && noContracts) || (mode === 'all' && allEmpty)) && (
              <EmptyState
                icon={mode === 'contract' ? FileText : Truck}
                title={t('no_data')}
                description={mode === 'contract' ? 'Create your first monthly contract to track rental profitability' : 'Create your first trip to get started'}
                action={mode === 'contract'
                  ? <button onClick={openNewContract} className="clay-btn-ghost text-sm">{t('new_contract')}</button>
                  : <button onClick={openNewTrip} className="clay-btn-ghost text-sm">{t('new_trip')}</button>}
              />
            )}
            {showTrips && filteredTrips.length > 0 && (
              isMobile ? (
                <MobileAuroraTripsTable
                 trips={filteredTrips}
                 onOpenDetail={openDetailTrip}
                 onEdit={openEditTrip}
                 onDelete={requestDeleteTrip}
                  onStatusUpdated={refetchTrips}
                  driverMap={driverMap}
                  vehicleMap={vehicleMap}
                  clientMap={clientMap}
                  invoiceMap={invoiceMap}
                  onBulkStatus={handleBulkTripStatus}
                  onBulkDelete={handleBulkTripDelete}
                />
              ) : (
                <CollapsibleSection
                  icon={Landmark}
                  label={t('trips_section')}
                  count={filteredTrips.length}
                  accent="blue"
                  defaultCollapsed={false}
                >
                  {viewMode === 'card'
                    ? tripGrid(filteredTrips)
                    : viewMode === 'table'
                    ? <TripsTable trips={filteredTrips} onOpenDetail={openDetailTrip} onEdit={openEditTrip} onDuplicate={handleDuplicateTrip} onDelete={requestDeleteTrip} onStatusUpdated={refetchTrips} driverMap={driverMap} vehicleMap={vehicleMap} clientMap={clientMap} clientContactMap={clientContactMap} invoiceMap={invoiceMap} onInvoicesChanged={() => refetchInvoices()} onBulkStatus={handleBulkTripStatus} onBulkDelete={handleBulkTripDelete} />
                    : <TripsList trips={filteredTrips} onOpenDetail={openDetailTrip} onEdit={openEditTrip} onDelete={requestDeleteTrip} onStatusUpdated={refetchTrips} driverMap={driverMap} vehicleMap={vehicleMap} clientMap={clientMap} invoiceMap={invoiceMap} onInvoicesChanged={() => refetchInvoices()} onBulkStatus={handleBulkTripStatus} onBulkDelete={handleBulkTripDelete} />}
                </CollapsibleSection>
              )
            )}
            {showContracts && filteredContracts.length > 0 && (
              <CollapsibleSection
                icon={Building2}
                label={t('contracts_section')}
                count={filteredContracts.length}
                accent="violet"
                defaultCollapsed={false}
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
        onDelete={requestDeleteTrip}
      />

      <ContractDetailSheet
        contract={detailContract}
        expenses={detailContract ? (expensesByContract[detailContract.id] || []) : []}
        onClose={() => setDetailContract(null)}
        onEdit={(c) => { setDetailContract(null); openEditContract(c); }}
        onDelete={async (c) => { await deleteContractById(c); setDetailContract(null); }}
      />

      {/* Single trip delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteTrip(deleteTarget)}
        title="Move to Trash"
        description={`"${deleteTarget?.trip_number || deleteTarget?.from_location || 'This trip'}" will be moved to trash. You can restore it later.`}
        confirmLabel="Move to Trash"
      />

      {/* Bulk trip delete confirmation */}
      <DeleteConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={(o) => { if (!o) { setBulkDeleteOpen(false); setPendingBulkIds([]); } }}
        onConfirm={confirmBulkTripDelete}
        title="Move to Trash"
        description={`${pendingBulkIds.length} trip${pendingBulkIds.length !== 1 ? 's' : ''} will be moved to trash. You can restore them later.`}
        confirmLabel="Move to Trash"
        count={pendingBulkIds.length}
      />

      {/* Data-integrity Debugger */}
      <TripDebuggerModal
        open={debuggerOpen}
        onOpenChange={setDebuggerOpen}
        allTrips={filteredTrips}
        selectedTrips={opsBulk?.selectedTrips || []}
        driverMap={driverMap}
        vehicleMap={vehicleMap}
        clientMap={clientMap}
        companySettings={companySettings}
        onOpenTrip={openDetailTrip}
        onFixed={refetchTrips}
      />

    </div>
  );
}