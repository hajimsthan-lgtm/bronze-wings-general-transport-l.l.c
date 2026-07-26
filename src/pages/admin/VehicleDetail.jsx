import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import EntityDocumentsTab from '@/components/admin/EntityDocumentsTab';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Inbox, Fuel as FuelIcon, Receipt, Wrench } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ProfitSummary from '@/components/admin/ProfitSummary';
import Vehicle3DModel from '@/components/admin/Vehicle3DModel';
import FleetDashboard from '@/components/fleet/FleetDashboard';
import ExportButtons from '@/components/common/ExportButtons';
import BreakdownDialog from '@/components/common/BreakdownDialog';

const fmtDT = (v) =>
  v
    ? new Date(v).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    : '—';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const yearsSince = (d) =>
  d ? Math.max(0, Math.floor((Date.now() - new Date(d)) / (365.25 * 86400000))) : 0;

export default function VehicleDetail() {
  const { id } = useParams();
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

  const sortedTrips = [...trips].sort((a, b) => (b.trip_date || '').localeCompare(a.trip_date || ''));
  const recentTrip = sortedTrips[0] || null;
  const recentTrips = sortedTrips.slice(0, 5);

  const fTrips = trips.filter((tt) => !tt.trip_date || (tt.trip_date >= dateFrom && tt.trip_date <= dateTo));
  const fFuel = fuelRecords.filter((r) => !r.date || (r.date >= dateFrom && r.date <= dateTo));
  const fExpenses = expenses.filter((r) => !r.date || (r.date >= dateFrom && r.date <= dateTo));
  const fServices = services.filter((r) => !r.date || (r.date >= dateFrom && r.date <= dateTo));

  const totalTrips = fTrips.reduce((s, x) => s + (Number(x.revenue) || 0), 0);
  const totalFuel = fFuel.reduce((s, x) => s + (Number(x.total_cost) || 0), 0);
  const totalExpenses = fExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const netProfit = totalTrips - totalExpenses - totalFuel;

  const completedTrips = fTrips.filter((x) => x.status === 'completed').length;
  const completionRate = fTrips.length ? (completedTrips / fTrips.length) * 100 : 0;
  const rate = completionRate / 20;

  const hero = {
    title: `${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`,
    subtitle: vehicle.plate_number,
    vehicleLabel: vehicle.type,
    rating: rate,
    stats: [
      { label: 'Odometer', value: `${Number(vehicle.odometer_km || 0).toLocaleString()} km` },
      { label: 'Fuel', value: vehicle.fuel_type },
      { label: 'Trips', value: fTrips.length },
      { label: 'Revenue', value: formatCurrency(totalTrips) },
    ],
  };

  const info = {
    rows: [
      { label: 'Trip Revenue', value: formatCurrency(totalTrips), tone: 'text-emerald-400', onClick: () => setBreakdown({ title: 'Trip Revenue Breakdown', rows: fTrips.map((tt) => ({ label: `${tt.from_location || ''} → ${tt.to_location || ''}`, sub: `${formatDate(tt.trip_date)} · ${tt.driver_name || ''}`, amount: tt.revenue, tone: 'text-emerald-400' })) }) },
      { label: 'Expenses', value: formatCurrency(totalExpenses), tone: 'text-amber-400', onClick: () => setBreakdown({ title: 'Expenses Breakdown', rows: fExpenses.map((r) => ({ label: r.description || r.category, sub: `${r.category} · ${formatDate(r.date)}`, amount: r.amount, tone: 'text-amber-400' })) }) },
      { label: 'Net Profit', value: formatCurrency(netProfit), tone: 'text-sky-400', onClick: () => setBreakdown({ title: 'Transactions Breakdown', rows: [...fTrips.map((tt) => ({ label: `${tt.from_location || ''} → ${tt.to_location || ''}`, sub: `Trip · ${formatDate(tt.trip_date)}`, amount: tt.revenue, tone: 'text-emerald-400' })), ...fFuel.map((r) => ({ label: `${r.liters}L Fuel · ${r.station_name || ''}`, sub: `Fuel · ${formatDate(r.date)}`, amount: r.total_cost, tone: 'text-sky-400' })), ...fExpenses.map((r) => ({ label: r.description || r.category, sub: `Expense · ${formatDate(r.date)}`, amount: r.amount, tone: 'text-amber-400' }))] }) },
    ],
    card: {
      bank: 'Fleet',
      last4: vehicle.plate_number || '••••',
      type: 'Plate',
      holder: vehicle.assigned_driver || '',
    },
  };

  const profile = driver ? {
    name: driver.name,
    email: driver.email,
    phone: driver.phone,
    initials: initialsOf(driver.name),
    rating: rate,
    expLabel: 'Experience',
    experience: `${yearsSince(driver.join_date)} yrs`,
    chatHref: driver.email ? `mailto:${driver.email}` : (driver.phone ? `tel:${driver.phone}` : null),
  } : null;

  const route = {
    from: recentTrip?.from_location,
    to: recentTrip?.to_location,
    fromTime: fmtDT(recentTrip?.load_datetime || recentTrip?.trip_date),
    toTime: fmtDT(recentTrip?.offload_datetime),
  };

  const exportRows = [
    ...fTrips.map((tt) => ({ date: tt.trip_date, type: 'Trip', description: `${tt.from_location || ''} → ${tt.to_location || ''}`, amount: tt.revenue })),
    ...fFuel.map((r) => ({ date: r.date, type: 'Fuel', description: `${r.liters}L · ${r.station_name || ''}`, amount: r.total_cost })),
    ...fExpenses.map((r) => ({ date: r.date, type: 'Expense', description: r.description || r.category, amount: r.amount })),
    ...fServices.map((r) => ({ date: r.date, type: 'Service', description: r.service_type, amount: r.cost })),
  ];

  return (
    <div className="detail-page">
      <EntityDetailHeader
        title={`${vehicle.make} ${vehicle.model} ${vehicle.year || ''}`}
        subtitle={vehicle.plate_number}
        badge={<StatusBadge status={vehicle.status} />}
        backTo="/admin/vehicles"
        info={[
          { label: 'Type', value: vehicle.type },
          { label: t('driver'), value: vehicle.assigned_driver },
          { label: 'Fuel Type', value: vehicle.fuel_type },
          { label: 'Odometer', value: vehicle.odometer_km ? `${vehicle.odometer_km} km` : null },
          { label: t('registration'), value: formatDate(vehicle.registration_expiry) },
          { label: t('insurance'), value: formatDate(vehicle.insurance_expiry) },
          { label: t('last_service'), value: formatDate(vehicle.last_service_date) },
          { label: t('next_service'), value: formatDate(vehicle.next_service_date) },
        ]}
      />

      <Vehicle3DModel />

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

      <div>
        <FleetDashboard hero={hero} info={info} profile={profile} route={route} trips={recentTrips} tripsLoading={dataLoading} />
      </div>

      <ProfitSummary
        title={`Vehicle Profit — ${vehicle.plate_number}`}
        items={[
          { label: 'Trip Revenue', value: totalTrips, tone: 'text-emerald-400' },
          { label: 'Expenses', value: totalExpenses, tone: 'text-amber-400' },
          { label: 'Fuel', value: totalFuel, tone: 'text-sky-400' },
        ]}
        netProfit={netProfit}
        filenameBase={`vehicle-${vehicle.plate_number}-profit`}
        dateRange={`${dateFrom} to ${dateTo}`}
      />

      {/* Inline fuel history — always visible */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center"><FuelIcon className="w-4 h-4 text-amber-400" /></div>
          <h3 className="text-sm font-semibold text-foreground">{t('fuel')}</h3>
          <span className="text-xs text-muted-foreground">({fFuel.length})</span>
        </div>
        {dataLoading ? <LoadingSpinner /> : fFuel.length === 0 ? <EmptyState icon={FuelIcon} title={t('no_data')} /> : (
          <div className="space-y-2">
            {fFuel.map((rec) => (
              <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0"><FuelIcon className="w-4 h-4 text-amber-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{rec.liters}L · {rec.station_name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(rec.date)} · {rec.driver_name}</p>
                </div>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.total_cost)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Tabs defaultValue="trips">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="trips">{t('trips')} ({fTrips.length})</TabsTrigger>
          <TabsTrigger value="expenses">{t('expenses')} ({fExpenses.length})</TabsTrigger>
          <TabsTrigger value="services">{t('services')} ({fServices.length})</TabsTrigger>
          <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fTrips.length === 0 ? <EmptyState icon={Inbox} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fTrips.map((trip) => (
                <div key={trip.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.driver_name}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(trip.revenue)}</span>
                  <StatusBadge status={trip.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fExpenses.length === 0 ? <EmptyState icon={Receipt} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fExpenses.map((rec) => (
                <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{rec.description || rec.category}</p>
                    <p className="text-xs text-muted-foreground capitalize">{rec.category} · {formatDate(rec.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.amount)}</span>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="services" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fServices.length === 0 ? <EmptyState icon={Wrench} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fServices.map((rec) => (
                <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Wrench className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">{rec.service_type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(rec.date)} · {rec.vendor_name || '—'}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.cost)}</span>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <EntityDocumentsTab entityType="vehicle" entityId={vehicle.id} />
        </TabsContent>
      </Tabs>

      <BreakdownDialog
        open={!!breakdown}
        onOpenChange={(o) => !o && setBreakdown(null)}
        title={breakdown?.title}
        rows={breakdown?.rows}
      />
    </div>
  );
}