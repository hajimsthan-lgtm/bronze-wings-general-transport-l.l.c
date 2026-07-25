import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
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
import { Inbox, Wallet, Receipt, Truck, Route as RouteIcon, TrendingUp, Percent, ChevronRight } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ProfitSummary from '@/components/admin/ProfitSummary';
import DriverTripMap from '@/components/drivers/DriverTripMap';
import DriverTripsPanel from '@/components/drivers/DriverTripsPanel';

const fmtDT = (v) =>
  v
    ? new Date(v).toLocaleString(undefined, { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
    : '—';

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
  const completionRate = fTrips.length ? Math.round((completedTrips / fTrips.length) * 100) : 0;

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

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Vehicle card */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Assigned Vehicle</h3>
            </div>
            {vehicle ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-40 h-28 rounded-xl bg-muted/40 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Truck className="w-10 h-10 text-primary/40" />
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Model</p>
                    <p className="text-sm font-semibold text-foreground">{vehicle.make} {vehicle.model} {vehicle.year || ''}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Plate</p>
                    <p className="text-sm font-semibold text-foreground">{vehicle.plate_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Type</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{vehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Odometer</p>
                    <p className="text-sm font-semibold text-foreground tabular-nums">{Number(vehicle.odometer_km || 0).toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fuel</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{vehicle.fuel_type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
                    <div className="mt-0.5"><StatusBadge status={vehicle.status} /></div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState icon={Truck} title="No vehicle assigned" />
            )}
          </div>

          {/* Metrics bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="stat-tile p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <RouteIcon className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Trips</span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{fTrips.length}</p>
            </div>
            <div className="stat-tile p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Revenue</span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(totalTrips)}</p>
            </div>
            <div className="stat-tile p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <Wallet className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Avg / Trip</span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(avgPerTrip)}</p>
            </div>
            <div className="stat-tile p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
                <Percent className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider font-semibold">Completion</span>
              </div>
              <p className="text-2xl font-bold text-foreground tabular-nums">{completionRate}%</p>
            </div>
          </div>

          {/* Trip map */}
          <DriverTripMap from={recentTrip?.from_location} to={recentTrip?.to_location} />

          {/* Trip timeline */}
          {recentTrip && (
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <RouteIcon className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Latest Trip Timeline</h3>
              </div>
              <div className="relative pl-6">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" />
                <div className="relative mb-5">
                  <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-primary ring-2 ring-primary/20" />
                  <p className="text-xs text-muted-foreground">{fmtDT(recentTrip.load_datetime || recentTrip.trip_date)}</p>
                  <p className="text-sm font-medium text-foreground">Start · {recentTrip.from_location || '—'}</p>
                </div>
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                  <p className="text-xs text-muted-foreground">{fmtDT(recentTrip.offload_datetime)}</p>
                  <p className="text-sm font-medium text-foreground">Finish · {recentTrip.to_location || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: trips panel */}
        <div>
          <DriverTripsPanel trips={recentTrips} loading={dataLoading} />
        </div>
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
        <TabsList className="rounded-xl p-1.5 gap-1.5" style={{ background:'#232636', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'-4px -4px 8px rgba(255,255,255,0.04), 4px 4px 12px rgba(0,0,0,0.3)' }}>
          <TabsTrigger value="trips">{t('trips')} ({fTrips.length})</TabsTrigger>
          <TabsTrigger value="salary">{t('salary')} ({fSalaries.length})</TabsTrigger>
          <TabsTrigger value="expenses">{t('expenses')} ({fExpenses.length})</TabsTrigger>
          <TabsTrigger value="documents">{t('documents')}</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fTrips.length === 0 ? <EmptyState icon={Inbox} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fTrips.map((trip) => (
                <div key={trip.id} className="group relative rounded-xl p-3.5 flex items-center gap-3 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 bg-[#232636] hover:bg-[#2a2e42] border border-white/[0.06]">
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: '#3b82f6' }} />
                  <div className="flex-1 min-w-0 pl-2">
                    <p className="text-[15px] font-semibold text-white truncate">{trip.from_location} → {trip.to_location}</p>
                    <p className="text-xs text-white/40 mt-0.5">{formatDate(trip.trip_date)} · {trip.vehicle_plate}</p>
                  </div>
                  <span className="text-base font-bold text-white tabular-nums">{formatCurrency(trip.revenue)}</span>
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
                <div key={rec.id} className="group relative rounded-xl p-3.5 flex items-center gap-3 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 bg-[#232636] hover:bg-[#2a2e42] border border-white/[0.06]">
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: '#3b82f6' }} />
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ml-1.5" style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.25)' }}><Wallet className="w-4 h-4 text-emerald-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-white">{rec.month} {rec.year}</p>
                    <p className="text-xs text-white/40 mt-0.5">Base: {formatCurrency(rec.base_salary)} · OT: {formatCurrency(rec.overtime)}</p>
                  </div>
                  <span className="text-base font-bold text-white tabular-nums">{formatCurrency(rec.net_salary)}</span>
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
                <div key={rec.id} className="group relative rounded-xl p-3.5 flex items-center gap-3 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 bg-[#232636] hover:bg-[#2a2e42] border border-white/[0.06]">
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: '#3b82f6' }} />
                  <div className="flex-1 min-w-0 pl-2">
                    <p className="text-[15px] font-semibold text-white truncate">{rec.description || rec.category}</p>
                    <p className="text-xs text-white/40 mt-0.5 capitalize">{rec.category} · {formatDate(rec.date)}</p>
                  </div>
                  <span className="text-base font-bold text-white tabular-nums">{formatCurrency(rec.amount)}</span>
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