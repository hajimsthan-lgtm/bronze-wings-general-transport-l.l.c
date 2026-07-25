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
import { Inbox, Wallet, Receipt } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ProfitSummary from '@/components/admin/ProfitSummary';
import FleetDashboard from '@/components/fleet/FleetDashboard';

const fmtDT = (v) =>
  v
    ? new Date(v).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    : '—';

const initialsOf = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

const yearsSince = (d) =>
  d ? Math.max(0, Math.floor((Date.now() - new Date(d)) / (365.25 * 86400000))) : 0;

export default function DriverDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [salaries, setSalaries] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'trips';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    base44.entities.Driver.get(id).then(async (d) => {
      if (cancelled) return;
      setDriver(d);
      setLoading(false);
      setDataLoading(true);
      try {
        const [tR, sR, eR, vR] = await Promise.all([
          base44.entities.Trip.filter({ driver_name: d.name }).catch(() => []),
          base44.entities.SalaryRecord.filter({ driver_name: d.name }).catch(() => []),
          base44.entities.Expense.filter({ driver_name: d.name }).catch(() => []),
          d.assigned_vehicle ? base44.entities.Vehicle.filter({ plate_number: d.assigned_vehicle }).catch(() => []) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setTrips(tR || []);
        setSalaries(sR || []);
        setExpenses(eR || []);
        setVehicle((vR && vR[0]) || null);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (!driver) return <EmptyState title="Driver not found" />;

  const sortedTrips = [...trips].sort((a, b) => (b.trip_date || '').localeCompare(a.trip_date || ''));
  const recentTrip = sortedTrips[0] || null;
  const recentTrips = sortedTrips.slice(0, 5);

  const fTrips = trips.filter((tt) => !tt.trip_date || (tt.trip_date >= dateFrom && tt.trip_date <= dateTo));
  const fSalaries = salaries.filter((r) => !r.payment_date || (r.payment_date >= dateFrom && r.payment_date <= dateTo));
  const fExpenses = expenses.filter((r) => !r.date || (r.date >= dateFrom && r.date <= dateTo));

  const totalTrips = fTrips.reduce((s, x) => s + (Number(x.revenue) || 0), 0);
  const totalExpenses = fExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalSalary = fSalaries.reduce((s, x) => s + (Number(x.net_salary) || 0), 0);
  const netProfit = totalTrips - totalExpenses - totalSalary;

  const completedTrips = fTrips.filter((x) => x.status === 'completed').length;
  const avgPerTrip = fTrips.length ? totalTrips / fTrips.length : 0;
  const completionRate = fTrips.length ? (completedTrips / fTrips.length) * 100 : 0;
  const rate = completionRate / 20; // 0-5
  const expYears = yearsSince(driver.join_date);

  const hero = {
    title: driver.name,
    subtitle: driver.phone,
    vehicleLabel: vehicle ? `${vehicle.make} ${vehicle.model}` : (driver.assigned_vehicle || 'No vehicle'),
    rating: rate,
    stats: [
      { label: 'Mileage', value: vehicle ? `${Number(vehicle.odometer_km || 0).toLocaleString()} km` : '—' },
      { label: 'Trips', value: fTrips.length },
      { label: 'Revenue', value: formatCurrency(totalTrips) },
      { label: 'Avg / Trip', value: formatCurrency(avgPerTrip) },
    ],
  };

  const info = {
    rows: [
      { label: 'Trip Revenue', value: formatCurrency(totalTrips), tone: 'text-emerald-400' },
      { label: 'Expenses', value: formatCurrency(totalExpenses), tone: 'text-amber-400' },
      { label: 'Net Profit', value: formatCurrency(netProfit), tone: 'text-sky-400' },
    ],
    card: {
      bank: 'Driver Account',
      last4: (driver.license_number || '').replace(/\s/g, '').slice(-4) || '••••',
      type: 'License',
      holder: driver.name,
    },
  };

  const profile = {
    name: driver.name,
    email: driver.email,
    phone: driver.phone,
    initials: initialsOf(driver.name),
    rating: rate,
    expLabel: 'Experience',
    experience: `${expYears} year${expYears === 1 ? '' : 's'}`,
    chatHref: driver.email ? `mailto:${driver.email}` : (driver.phone ? `tel:${driver.phone}` : null),
  };

  const route = {
    from: recentTrip?.from_location,
    to: recentTrip?.to_location,
    fromTime: fmtDT(recentTrip?.load_datetime || recentTrip?.trip_date),
    toTime: fmtDT(recentTrip?.offload_datetime),
  };

  return (
    <div className="detail-page">
      <EntityDetailHeader
        title={driver.name}
        subtitle={driver.phone}
        badge={<StatusBadge status={driver.status} />}
        backTo="/admin/drivers"
        info={[
          { label: t('vehicle'), value: driver.assigned_vehicle },
          { label: 'License #', value: driver.license_number },
          { label: 'License Expiry', value: formatDate(driver.license_expiry) },
          { label: 'Nationality', value: driver.nationality },
          { label: 'Base Salary', value: formatCurrency(driver.base_salary) },
          { label: 'Join Date', value: formatDate(driver.join_date) },
          { label: 'Visa Expiry', value: formatDate(driver.visa_expiry) },
          { label: 'Emergency', value: driver.emergency_contact },
        ]}
      />

      <div className="mt-4">
        <FleetDashboard hero={hero} info={info} profile={profile} route={route} trips={recentTrips} tripsLoading={dataLoading} />
      </div>

      {/* Records */}
      <div className="flex flex-wrap items-center gap-3 mt-6 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <ProfitSummary
        title={`Driver Profit — ${driver.name}`}
        items={[
          { label: 'Trip Revenue', value: totalTrips, tone: 'text-emerald-400' },
          { label: 'Expenses', value: totalExpenses, tone: 'text-amber-400' },
          { label: 'Salary', value: totalSalary, tone: 'text-sky-400' },
        ]}
        netProfit={netProfit}
        filenameBase={`driver-${driver.name}-profit`}
        dateRange={`${dateFrom} to ${dateTo}`}
      />

      <Tabs defaultValue={initialTab} className="mt-4">
        <TabsList className="rounded-xl p-1.5 gap-1.5 bg-card border border-border">
          <TabsTrigger value="trips">{t('trips')} ({fTrips.length})</TabsTrigger>
          <TabsTrigger value="salary">{t('salary')} ({fSalaries.length})</TabsTrigger>
          <TabsTrigger value="expenses">{t('expenses')} ({fExpenses.length})</TabsTrigger>
          <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fTrips.length === 0 ? <EmptyState icon={Inbox} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fTrips.map((trip) => (
                <div key={trip.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.vehicle_plate}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(trip.revenue)}</span>
                  <StatusBadge status={trip.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fSalaries.length === 0 ? <EmptyState icon={Wallet} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fSalaries.map((rec) => (
                <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)' }}><Wallet className="w-4 h-4 text-emerald-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{rec.month} {rec.year}</p>
                    <p className="text-xs text-muted-foreground">Base: {formatCurrency(rec.base_salary)} · OT: {formatCurrency(rec.overtime)}</p>
                  </div>
                  <span className="text-base font-bold text-foreground tabular-nums">{formatCurrency(rec.net_salary)}</span>
                  <StatusBadge status={rec.status} />
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
                  <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(rec.amount)}</span>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <EntityDocumentsTab entityType="driver" entityId={driver.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}