import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import EntityDocumentsTab from '@/components/admin/EntityDocumentsTab';
import VehicleProfileCard from '@/components/admin/VehicleProfileCard';
import StatusBadge from '@/components/common/StatusBadge';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import RecordSectionCard from '@/components/common/RecordSectionCard';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Inbox, Fuel as FuelIcon, Receipt, Wrench, Truck, FileText } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ProfitCard from '@/components/common/ProfitCard';
import ExportButtons from '@/components/common/ExportButtons';
import BreakdownDialog from '@/components/common/BreakdownDialog';
import RecordsViewerSheet from '@/components/common/RecordsViewerSheet';
import { exportToPDF } from '@/lib/exportUtils';
import { hexToRgba } from '@/components/reports/ReportStatCard';

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [services, setServices] = useState([]);
  const [driver, setDriver] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [breakdown, setBreakdown] = useState(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Vehicle.get(id).then(async (v) => {
      if (cancelled) return;
      setVehicle(v);
      setLoading(false);
      const plate = v.plate_number;
      setDataLoading(true);
      try {
        const [tR, fR, eR, sR, dR] = await Promise.all([
          base44.entities.Trip.filter({ vehicle_plate: plate }).catch(() => []),
          base44.entities.FuelRecord.filter({ vehicle_plate: plate }).catch(() => []),
          base44.entities.Expense.filter({ vehicle_plate: plate }).catch(() => []),
          base44.entities.ServiceRecord.filter({ vehicle_plate: plate }).catch(() => []),
          v.assigned_driver ? base44.entities.Driver.filter({ name: v.assigned_driver }).catch(() => []) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setTrips(tR || []);
        setFuelRecords(fR || []);
        setExpenses(eR || []);
        setServices(sR || []);
        setDriver((dR && dR[0]) || null);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!vehicle) return <EmptyState title="Vehicle not found" />;

  const fTrips = trips.filter((tt) => !tt.trip_date || (tt.trip_date >= dateFrom && tt.trip_date <= dateTo));
  const fFuel = fuelRecords.filter((r) => !r.date || (r.date >= dateFrom && r.date <= dateTo));
  const fExpenses = expenses.filter((r) => !r.date || (r.date >= dateFrom && r.date <= dateTo));
  const fServices = services.filter((r) => !r.date || (r.date >= dateFrom && r.date <= dateTo));

  const totalTrips = fTrips.reduce((s, x) => s + (Number(x.revenue) || 0), 0);
  const totalFuel = fFuel.reduce((s, x) => s + (Number(x.total_cost) || 0), 0);
  const totalExpenses = fExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const netProfit = totalTrips - totalExpenses - totalFuel;

  const saveOwnership = async (front, back) => {
    try {
      await base44.entities.Vehicle.update(vehicle.id, { ownership_front_url: front, ownership_back_url: back });
      setVehicle((prev) => ({ ...prev, ownership_front_url: front, ownership_back_url: back }));
    } catch {}
  };

  const exportRows = [
    ...fTrips.map((tt) => ({ date: tt.trip_date, type: 'Trip', description: `${tt.from_location || ''} → ${tt.to_location || ''}`, amount: tt.revenue })),
    ...fFuel.map((r) => ({ date: r.date, type: 'Fuel', description: `${r.liters}L · ${r.station_name || ''}`, amount: r.total_cost })),
    ...fExpenses.map((r) => ({ date: r.date, type: 'Expense', description: r.description || r.category, amount: r.amount })),
    ...fServices.map((r) => ({ date: r.date, type: 'Service', description: r.service_type, amount: r.cost })),
  ];

  const viewerConfig = {
    trips: {
      title: 'Trips Timeline', icon: Truck, accent: '#3b82f6', records: fTrips, dateField: 'trip_date',
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
    },
  };

  const pdfExport = (key, records) => exportToPDF(
    records.map((r) => { const o = {}; viewerConfig[key].columns.forEach((c) => { o[c.key] = r[c.key]; }); return o; }),
    viewerConfig[key].filename,
    viewerConfig[key].columns,
    viewerConfig[key].title,
    { dateRange: `${dateFrom} to ${dateTo}` }
  );

  return (
    <div className="detail-page">
      <EntityDetailHeader backTo="/admin/vehicles" />

      <VehicleProfileCard vehicle={vehicle} driver={driver} stats={{ trips: fTrips.length, revenue: totalTrips }} onSaveOwnership={saveOwnership} />

      <div className="flex flex-wrap items-center gap-3 mt-4 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecordSectionCard title={t('trips')} icon={Truck} accent="#3b82f6" count={fTrips.length} collapsible onView={() => setViewer('trips')} onPdf={() => pdfExport('trips', fTrips)} onNew={() => navigate(`/trips?new=1&vehicle_plate=${encodeURIComponent(vehicle.plate_number)}`)} newLabel="New Trip" loading={dataLoading} emptyIcon={Inbox} emptyLabel={t('no_data')} className="h-full">
          <div className="space-y-2">
            {fTrips.slice(0, 5).map((trip, i, arr) => (
              <div key={trip.id} className="flex gap-3">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full mt-3" style={{ background: '#3b82f6', boxShadow: '0 0 0 3px rgba(59,130,246,0.18)' }} />
                  {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-blue-500/15 mt-1" />}
                </div>
                <div className="flex-1 rounded-xl p-3 flex items-center gap-3" style={{ background: hexToRgba('#3b82f6', 0.06), border: `1px solid ${hexToRgba('#3b82f6', 0.16)}` }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.driver_name}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(trip.revenue)}</span>
                  <StatusBadge status={trip.status} />
                </div>
              </div>
            ))}
          </div>
        </RecordSectionCard>

        <RecordSectionCard title={t('fuel')} icon={FuelIcon} accent="#f59e0b" count={fFuel.length} collapsible onView={() => setViewer('fuel')} onPdf={() => pdfExport('fuel', fFuel)} onNew={() => navigate(`/fuel?new=1&vehicle_plate=${encodeURIComponent(vehicle.plate_number)}`)} newLabel="New Fuel" loading={dataLoading} emptyIcon={FuelIcon} emptyLabel={t('no_data')} className="h-full">
          <div className="space-y-2">
            {fFuel.slice(0, 5).map((rec) => (
              <div key={rec.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: hexToRgba('#f59e0b', 0.06), border: `1px solid ${hexToRgba('#f59e0b', 0.16)}` }}>
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><FuelIcon className="w-4 h-4 text-amber-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{rec.liters}L · {rec.station_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(rec.date)} · {rec.driver_name || ''}</p>
                </div>
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(rec.total_cost)}</span>
              </div>
            ))}
          </div>
        </RecordSectionCard>

        <RecordSectionCard title={t('maintenance')} icon={Wrench} accent="#10b981" count={fServices.length} collapsible onView={() => setViewer('services')} onPdf={() => pdfExport('services', fServices)} onNew={() => navigate(`/admin/vehicles?tab=services&new=1&vehicle_plate=${encodeURIComponent(vehicle.plate_number)}`)} newLabel="New Maintenance" loading={dataLoading} emptyIcon={Wrench} emptyLabel={t('no_data')} className="h-full">
          <div className="space-y-2">
            {fServices.slice(0, 5).map((rec) => (
              <div key={rec.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: hexToRgba('#10b981', 0.06), border: `1px solid ${hexToRgba('#10b981', 0.16)}` }}>
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><Wrench className="w-4 h-4 text-emerald-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize">{rec.service_type}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(rec.date)} · {rec.vendor_name || '—'}</p>
                </div>
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(rec.cost)}</span>
                <StatusBadge status={rec.status} />
              </div>
            ))}
          </div>
        </RecordSectionCard>

        <RecordSectionCard title={t('expenses')} icon={Receipt} accent="#f43f5e" count={fExpenses.length} collapsible onView={() => setViewer('expenses')} onPdf={() => pdfExport('expenses', fExpenses)} onNew={() => navigate('/expenses?open=expense')} newLabel="New Expense" loading={dataLoading} emptyIcon={Receipt} emptyLabel={t('no_data')} className="h-full">
          <div className="space-y-2">
            {fExpenses.slice(0, 5).map((rec) => (
              <div key={rec.id} className="rounded-xl p-3 flex items-center gap-3" style={{ background: hexToRgba('#f43f5e', 0.06), border: `1px solid ${hexToRgba('#f43f5e', 0.16)}` }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{rec.description || rec.category}</p>
                  <p className="text-xs text-muted-foreground capitalize">{rec.category} · {formatDate(rec.date)}</p>
                </div>
                <span className="text-sm font-semibold text-foreground whitespace-nowrap">{formatCurrency(rec.amount)}</span>
                <StatusBadge status={rec.status} />
              </div>
            ))}
          </div>
        </RecordSectionCard>

        <ProfitCard
          className="h-full"
          title={`Vehicle Profit — ${vehicle.plate_number}`}
          items={[
            { label: 'Trip Revenue', value: totalTrips, tone: 'text-emerald-400' },
            { label: 'Expenses', value: totalExpenses, tone: 'text-amber-400' },
            { label: 'Fuel', value: totalFuel, tone: 'text-sky-400' },
          ]}
          netProfit={netProfit}
          filenameBase={`vehicle-${vehicle.plate_number}-profit`}
          dateRange={`${dateFrom} to ${dateTo}`}
          onView={() => setBreakdown({ title: 'Transactions Breakdown', rows: [...fTrips.map((tt) => ({ label: `${tt.from_location || ''} → ${tt.to_location || ''}`, sub: `Trip · ${formatDate(tt.trip_date)}`, amount: tt.revenue, tone: 'text-emerald-400' })), ...fFuel.map((r) => ({ label: `${r.liters}L Fuel · ${r.station_name || ''}`, sub: `Fuel · ${formatDate(r.date)}`, amount: r.total_cost, tone: 'text-sky-400' })), ...fExpenses.map((r) => ({ label: r.description || r.category, sub: `Expense · ${formatDate(r.date)}`, amount: r.amount, tone: 'text-amber-400' }))] })}
        />

        <div className="glass-card p-4 relative overflow-hidden flex flex-col h-full" style={{ borderTop: '3px solid #a855f7' }}>
          <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none opacity-20" style={{ background: 'radial-gradient(circle, ' + hexToRgba('#a855f7', 0.5) + ' 0%, transparent 70%)' }} />
          <div className="flex items-center gap-2 mb-3 relative">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba('#a855f7', 0.14), border: '1px solid ' + hexToRgba('#a855f7', 0.3) }}>
              <FileText className="w-4 h-4" style={{ color: '#a855f7' }} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{t('documents')}</h3>
          </div>
          <EntityDocumentsTab entityType="vehicle" entityId={vehicle.id} />
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