import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import EntityDocumentsTab from '@/components/admin/EntityDocumentsTab';
import DriverProfileCard from '@/components/admin/DriverProfileCard';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import DetailSkeleton from '@/components/detail/DetailMotion';
import EmptyState from '@/components/common/EmptyState';
import ProfitCard from '@/components/common/ProfitCard';
import BreakdownDialog from '@/components/common/BreakdownDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Inbox, Wallet, Receipt } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';

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
  const [breakdown, setBreakdown] = useState(null);
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

  const fTrips = trips.filter((tt) => !tt.trip_date || (tt.trip_date >= dateFrom && tt.trip_date <= dateTo));
  const fSalaries = salaries.filter((r) => !r.payment_date || (r.payment_date >= dateFrom && r.payment_date <= dateTo));
  const fExpenses = expenses.filter((r) => !r.date || (r.date >= dateFrom && r.date <= dateTo));

  const totalTrips = fTrips.reduce((s, x) => s + (Number(x.revenue) || 0), 0);
  const totalExpenses = fExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalSalary = fSalaries.reduce((s, x) => s + (Number(x.net_salary) || 0), 0);
  const netProfit = totalTrips - totalExpenses - totalSalary;
  const avgPerTrip = fTrips.length ? totalTrips / fTrips.length : 0;
  const expYears = yearsSince(driver.join_date);

  return (
    <div className="detail-page">
      <EntityDetailHeader backTo="/admin/drivers" />

      <DriverProfileCard driver={driver} vehicle={vehicle} stats={{ trips: fTrips.length, revenue: totalTrips, avgPerTrip, experience: `${expYears} yr${expYears === 1 ? '' : 's'}` }} />

      <div className="flex flex-wrap items-center gap-3 mt-4 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <ProfitCard
        title={`Driver Profit — ${driver.name}`}
        items={[
          { label: 'Trip Revenue', value: totalTrips, tone: 'text-emerald-400' },
          { label: 'Expenses', value: totalExpenses, tone: 'text-amber-400' },
          { label: 'Salary', value: totalSalary, tone: 'text-sky-400' },
        ]}
        netProfit={netProfit}
        filenameBase={`driver-${driver.name}-profit`}
        dateRange={`${dateFrom} to ${dateTo}`}
        onView={() => setBreakdown({ title: 'Driver Transactions', rows: [...fTrips.map((tt) => ({ label: `${tt.from_location || ''} → ${tt.to_location || ''}`, sub: `Trip · ${formatDate(tt.trip_date)}`, amount: tt.revenue, tone: 'text-emerald-400' })), ...fExpenses.map((r) => ({ label: r.description || r.category, sub: `Expense · ${formatDate(r.date)}`, amount: r.amount, tone: 'text-amber-400' })), ...fSalaries.map((r) => ({ label: `${r.month} ${r.year} Salary`, sub: `Salary · ${formatDate(r.payment_date)}`, amount: r.net_salary, tone: 'text-sky-400' }))] })}
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
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}><Wallet className="w-4 h-4 text-emerald-400" /></div>
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

      <BreakdownDialog
        open={!!breakdown}
        onOpenChange={(o) => !o && setBreakdown(null)}
        title={breakdown?.title}
        rows={breakdown?.rows}
      />
    </div>
  );
}