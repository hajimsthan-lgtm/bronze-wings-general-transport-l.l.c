import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import DocumentsSection from '@/components/admin/DocumentsSection';
import VehicleProfileCard from '@/components/admin/VehicleProfileCard';
import ContractsSection from '@/components/contracts/ContractsSection';
import StatusBadge from '@/components/common/StatusBadge';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import RecordSectionCard from '@/components/common/RecordSectionCard';
import TabTableCard from '@/components/admin/TabTableCard';
import CollapsibleSection from '@/components/common/CollapsibleSection';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Inbox, Fuel as FuelIcon, Receipt, Wrench, Truck, FileText, Plus } from 'lucide-react';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import ProfitCard from '@/components/common/ProfitCard';
import ExportButtons from '@/components/common/ExportButtons';
import BreakdownDialog from '@/components/common/BreakdownDialog';
import RecordsViewerSheet from '@/components/common/RecordsViewerSheet';

import { exportToPDF } from '@/lib/exportUtils';
import { downloadMaintenanceTablePDF } from '@/lib/maintenancePdf';
import { getCompanySettings } from '@/lib/companySettings';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import { safeAll } from '@/lib/safeRequest';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expandDocs = searchParams.get('expand') === 'documents';
  const flashDocId = searchParams.get('doc');
  const { t } = useI18n();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [services, setServices] = useState([]);
  const [driver, setDriver] = useState(null);
  const [license, setLicense] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const { dateFrom, dateTo, setDateFrom, setDateTo } = useGlobalDate();
  const [breakdown, setBreakdown] = useState(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Vehicle.get(id).then(async (v) => {
      if (cancelled) return;
      setVehicle(v);
      setLoading(false);
      await loadRelated(v, cancelled);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const loadRelated = async (v, cancelled = false) => {
    const plate = v.plate_number;
    setDataLoading(true);
    try {
      // Stagger calls with limited concurrency + retry to avoid API rate-limit bursts
      const tasks = [
        () => base44.entities.Trip.filter({ vehicle_plate: plate }).catch(() => []),
        () => base44.entities.FuelRecord.filter({ vehicle_plate: plate }).catch(() => []),
        () => base44.entities.Expense.filter({ vehicle_plate: plate }).catch(() => []),
        () => base44.entities.ServiceRecord.filter({ vehicle_plate: plate }).catch(() => []),
        () => v.assigned_driver ? base44.entities.Driver.filter({ name: v.assigned_driver }).catch(() => []) : Promise.resolve([]),
      ];
      const [tR, fR, eR, sR, dR] = await safeAll(tasks, 2);
      if (cancelled) return;
      setTrips(tR || []);
      setFuelRecords(fR || []);
      setExpenses(eR || []);
      setServices(sR || []);
      setDriver((dR && dR[0]) || null);
      // Fetch license record (holds vehicleType e.g. "TOYOTA HI ACE")
      base44.entities.VehicleLicense.filter({ trafficPlateNo: plate })
        .then((res) => { if (!cancelled) setLicense(res?.[0] || null); })
        .catch(() => {});
    } finally {
      if (!cancelled) setDataLoading(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!vehicle) return <EmptyState title="Vehicle not found" />;

  const fTrips = trips.filter((tt) => !tt.trip_date || ((!dateFrom || tt.trip_date >= dateFrom) && (!dateTo || tt.trip_date <= dateTo)));
  const fFuel = fuelRecords.filter((r) => !r.date || ((!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo)));
  const fExpenses = expenses.filter((r) => !r.date || ((!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo)));
  const fServices = services.filter((r) => !r.date || ((!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo)));

  const totalTrips = fTrips.reduce((s, x) => s + (Number(x.revenue) || 0), 0);
  const totalFuel = fFuel.reduce((s, x) => s + (Number(x.total_cost) || 0), 0);
  const totalServices = fServices.reduce((s, x) => s + (Number(x.cost) || 0), 0);
  const totalExpenses = fExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const netProfit = totalTrips - totalServices - totalFuel;

  const saveOwnership = async (front, back) => {
    try {
      await base44.entities.Vehicle.update(vehicle.id, { ownership_front_url: front, ownership_back_url: back });
      setVehicle((prev) => ({ ...prev, ownership_front_url: front, ownership_back_url: back }));
    } catch {}
  };

  // Called AFTER VehicleEditModal has already persisted the update — just refresh local state.
  const saveVehicle = (data, licenseData) => {
    const updated = { ...vehicle, ...data };
    setVehicle(updated);
    if (licenseData) setLicense((prev) => ({ ...prev, ...licenseData }));
    if (data.plate_number && data.plate_number !== vehicle.plate_number) {
      loadRelated(updated);
    }
  };

  const exportRows = [
    ...fTrips.map((tt) => ({ date: tt.trip_date, type: 'Trip', description: `${tt.from_location || ''} → ${tt.to_location || ''}`, amount: tt.revenue })),
    ...fFuel.map((r) => ({ date: r.date, type: 'Fuel', description: `${r.liters}L · ${r.station_name || ''}`, amount: r.total_cost })),
    ...fExpenses.map((r) => ({ date: r.date, type: 'Expense', description: r.description || r.category, amount: r.amount })),
    ...fServices.map((r) => ({ date: r.date, type: 'Service', description: r.service_type, amount: r.cost })),
  ];

  const viewerConfig = {
    trips: {
      title: 'Trips Timeline', icon: Truck, accent: '#1ED760', records: fTrips, dateField: 'trip_date',
      filename: `vehicle-${vehicle.plate_number}-trips`,
      columns: [
        { label: 'Date', key: 'trip_date' },
        { label: 'From', key: 'from_location' },
        { label: 'To', key: 'to_location' },
        { label: 'Driver', key: 'driver_name' },
        { label: 'Revenue', key: 'revenue', numeric: true },
        { label: 'Status', key: 'status' },
      ],
    },
    fuel: {
      title: 'Fuel Records', icon: FuelIcon, accent: '#f59e0b', records: fFuel, dateField: 'date',
      filename: `vehicle-${vehicle.plate_number}-fuel`,
      columns: [
        { label: 'Date', key: 'date' },
        { label: 'Liters', key: 'liters', numeric: true },
        { label: 'Station', key: 'station_name' },
        { label: 'Cost', key: 'total_cost', numeric: true },
      ],
    },
    expenses: {
      title: 'Expenses', icon: Receipt, accent: '#f43f5e', records: fExpenses, dateField: 'date',
      filename: `vehicle-${vehicle.plate_number}-expenses`,
      columns: [
        { label: 'Date', key: 'date' },
        { label: 'Category', key: 'category' },
        { label: 'Description', key: 'description' },
        { label: 'Amount', key: 'amount', numeric: true },
      ],
    },
    services: {
      title: 'Maintenance Records', icon: Wrench, accent: '#10b981', records: fServices, dateField: 'date',
      filename: `vehicle-${vehicle.plate_number}-maintenance`,
      columns: [
        { label: 'Date', key: 'date' },
        { label: 'Type', key: 'service_type' },
        { label: 'Vendor', key: 'vendor_name' },
        { label: 'Cost', key: 'cost', numeric: true },
      ],
      onPdfExport: async (recs) => {
        try {
          const settings = await getCompanySettings();
          await downloadMaintenanceTablePDF(recs, vehicle.plate_number, settings);
        } catch {
          exportToPDF(
            recs.map((r) => { const o = {}; ['date', 'service_type', 'vendor_name', 'cost'].forEach((k) => { o[k] = r[k]; }); return o; }),
            `vehicle-${vehicle.plate_number}-maintenance`,
            viewerConfig.services.columns,
            'Maintenance Records',
            { dateRange: `${dateFrom} to ${dateTo}` }
          );
        }
      },
    },
  };

  const pdfExport = async (key, records) => {
    if (key === 'services') {
      try {
        const settings = await getCompanySettings();
        await downloadMaintenanceTablePDF(records, vehicle.plate_number, settings);
      } catch {
        exportToPDF(
          records.map((r) => { const o = {}; viewerConfig[key].columns.forEach((c) => { o[c.key] = r[c.key]; }); return o; }),
          viewerConfig[key].filename,
          viewerConfig[key].columns,
          viewerConfig[key].title,
          { dateRange: `${dateFrom} to ${dateTo}` }
        );
      }
      return;
    }
    exportToPDF(
      records.map((r) => { const o = {}; viewerConfig[key].columns.forEach((c) => { o[c.key] = r[c.key]; }); return o; }),
      viewerConfig[key].filename,
      viewerConfig[key].columns,
      viewerConfig[key].title,
      { dateRange: `${dateFrom} to ${dateTo}` }
    );
  };

  return (
    <div className="detail-page space-y-4">
      <EntityDetailHeader backTo="/admin/vehicles" />

      {/* toolbar */}
      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="ml-auto">
          <ExportButtons
            data={exportRows}
            filename={`vehicle-${vehicle.plate_number}-transactions`}
            title={`${vehicle.make} ${vehicle.model} Transactions`}
            columns={[
              { label: 'Date', key: 'date' },
              { label: 'Type', key: 'type' },
              { label: 'Description', key: 'description' },
              { label: 'Amount', key: 'amount' },
            ]}
          />
        </div>
      </div>

      {/* Grid: profile (left) | sections (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
        <VehicleProfileCard vehicle={vehicle} license={license} driver={driver} stats={{ trips: fTrips.length, revenue: totalTrips }} onSaveOwnership={saveOwnership} onSaved={saveVehicle} />
        <div className="space-y-4">
          {/* Trips */}
          <CollapsibleSection title="Trips" icon={Truck} accent="#1ED760" count={fTrips.length} actions={
            <ExportButtons data={fTrips} filename={`vehicle-${vehicle.plate_number}-trips`} title={`Trips — ${vehicle.plate_number}`} columns={viewerConfig.trips.columns} />
          }>
            {dataLoading ? <LoadingSpinner /> : fTrips.length === 0 ? <EmptyState icon={Truck} title={t('no_data')} /> : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto thin-scroll pr-1">
                {fTrips.map((trip) => (
                  <div key={trip.id} className="row-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 18px -6px rgba(var(--panel-accent-rgb),0.35)' }}><Truck className="w-4 h-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.driver_name || '—'}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">{formatCurrency(trip.revenue)}</span>
                    <StatusBadge status={trip.status} />
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Contracts */}
          <ContractsSection filter={{ vehicle_plate: vehicle.plate_number }} />

          {/* Fuel */}
          <CollapsibleSection title={t('fuel')} icon={FuelIcon} accent="#f59e0b" count={fFuel.length} actions={
            <>
              <button onClick={() => navigate(`/fuel?new=1&vehicle_plate=${encodeURIComponent(vehicle.plate_number)}`)} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="New Fuel"><Plus className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewer('fuel')} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="View all"><Inbox className="w-3.5 h-3.5" /></button>
              <button onClick={() => pdfExport('fuel', fFuel)} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Export PDF"><FileText className="w-3.5 h-3.5" /></button>
            </>
          }>
            {dataLoading ? <LoadingSpinner /> : fFuel.length === 0 ? <EmptyState icon={FuelIcon} title={t('no_data')} /> : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto thin-scroll pr-1">
                {fFuel.map((rec) => (
                  <div key={rec.id} className="row-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 18px -6px rgba(245,158,11,0.35)' }}><FuelIcon className="w-4 h-4 text-amber-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{rec.liters}L · {rec.station_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(rec.date)} · {rec.driver_name || ''}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(rec.total_cost)}</span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Maintenance */}
          <CollapsibleSection title={t('maintenance')} icon={Wrench} accent="#10b981" count={fServices.length} actions={
            <>
              <button onClick={() => navigate(`/admin/vehicles?tab=services&new=1&vehicle_plate=${encodeURIComponent(vehicle.plate_number)}`)} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="New Maintenance"><Plus className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewer('services')} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="View all"><Inbox className="w-3.5 h-3.5" /></button>
              <button onClick={() => pdfExport('services', fServices)} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Export PDF"><FileText className="w-3.5 h-3.5" /></button>
            </>
          }>
            {dataLoading ? <LoadingSpinner /> : fServices.length === 0 ? <EmptyState icon={Wrench} title={t('no_data')} /> : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto thin-scroll pr-1">
                {fServices.map((rec) => (
                  <div key={rec.id} className="row-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 18px -6px rgba(16,185,129,0.35)' }}><Wrench className="w-4 h-4 text-emerald-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">{rec.service_type}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(rec.date)} · {rec.vendor_name || '—'}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(rec.cost)}</span>
                    <StatusBadge status={rec.status} />
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Expenses */}
          <CollapsibleSection title={t('expenses')} icon={Receipt} accent="#f43f5e" count={fExpenses.length} actions={
            <>
              <button onClick={() => navigate('/expenses?open=expense')} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="New Expense"><Plus className="w-3.5 h-3.5" /></button>
              <button onClick={() => setViewer('expenses')} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="View all"><Inbox className="w-3.5 h-3.5" /></button>
              <button onClick={() => pdfExport('expenses', fExpenses)} className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-colors" title="Export PDF"><FileText className="w-3.5 h-3.5" /></button>
            </>
          }>
            {dataLoading ? <LoadingSpinner /> : fExpenses.length === 0 ? <EmptyState icon={Receipt} title={t('no_data')} /> : (
              <div className="space-y-2 max-h-[440px] overflow-y-auto thin-scroll pr-1">
                {fExpenses.map((rec) => (
                  <div key={rec.id} className="row-card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl glass flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 18px -6px rgba(244,63,94,0.35)' }}><Receipt className="w-4 h-4 text-rose-400" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{rec.description || rec.category}</p>
                      <p className="text-xs text-muted-foreground capitalize">{rec.category} · {formatDate(rec.date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(rec.amount)}</span>
                    <StatusBadge status={rec.status} />
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Documents — small card, collapsed by default */}
          <DocumentsSection entityType="vehicle" entityId={vehicle.id} accent="#a855f7" defaultOpen={false} autoExpand={expandDocs} flashDocId={flashDocId} />

          {/* Profit summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProfitCard
              className="h-full md:col-span-2"
              title={`Vehicle Profit — ${vehicle.plate_number}`}
              items={[
                { label: 'Trip Revenue', value: totalTrips, tone: 'text-emerald-400' },
                { label: 'Maintenance', value: totalServices, tone: 'text-amber-400' },
                { label: 'Fuel', value: totalFuel, tone: 'text-sky-400' },
              ]}
              netProfit={netProfit}
              filenameBase={`vehicle-${vehicle.plate_number}-profit`}
              dateRange={`${dateFrom} to ${dateTo}`}
              onView={() => setBreakdown({ title: 'Transactions Breakdown', rows: [...fTrips.map((tt) => ({ label: `${tt.from_location || ''} → ${tt.to_location || ''}`, sub: `Trip · ${formatDate(tt.trip_date)}`, amount: tt.revenue, tone: 'text-emerald-400' })), ...fFuel.map((r) => ({ label: `${r.liters}L Fuel · ${r.station_name || ''}`, sub: `Fuel · ${formatDate(r.date)}`, amount: r.total_cost, tone: 'text-sky-400' })), ...fServices.map((r) => ({ label: r.service_type, sub: `Maintenance · ${formatDate(r.date)}`, amount: r.cost, tone: 'text-amber-400' }))] })}
            />
          </div>
        </div>
      </div>

      <BreakdownDialog
        open={!!breakdown}
        onOpenChange={(o) => !o && setBreakdown(null)}
        title={breakdown?.title}
        rows={breakdown?.rows}
      />

      <RecordsViewerSheet
        open={!!viewer}
        onOpenChange={(o) => !o && setViewer(null)}
        {...(viewer ? viewerConfig[viewer] : {})}
      />
    </div>
  );
}