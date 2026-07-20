import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import EntityDetailHeader from '@/components/admin/EntityDetailHeader';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Inbox, Wallet, Receipt } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';

export default function DriverDetail() {
  const { id } = useParams();
  const { t } = useI18n();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
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
        const [tR, sR, eR] = await Promise.all([
          base44.entities.Trip.filter({ driver_name: d.name }).catch(() => []),
          base44.entities.SalaryRecord.filter({ driver_name: d.name }).catch(() => []),
          base44.entities.Expense.filter({ driver_name: d.name }).catch(() => []),
        ]);
        if (cancelled) return;
        setTrips(tR || []);
        setSalaries(sR || []);
        setExpenses(eR || []);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!driver) return <EmptyState title="Driver not found" />;

  const fTrips = trips.filter(t => !t.trip_date || (t.trip_date >= dateFrom && t.trip_date <= dateTo));
  const fSalaries = salaries.filter(r => !r.payment_date || (r.payment_date >= dateFrom && r.payment_date <= dateTo));
  const fExpenses = expenses.filter(r => !r.date || (r.date >= dateFrom && r.date <= dateTo));

  return (
    <div>
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
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="trips">{t('trips')} ({fTrips.length})</TabsTrigger>
          <TabsTrigger value="salary">{t('salary')} ({fSalaries.length})</TabsTrigger>
          <TabsTrigger value="expenses">{t('expenses')} ({fExpenses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fTrips.length === 0 ? <EmptyState icon={Inbox} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fTrips.map(trip => (
                <div key={trip.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.vehicle_plate}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(trip.revenue)}</span>
                  <StatusBadge status={trip.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fSalaries.length === 0 ? <EmptyState icon={Wallet} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fSalaries.map(rec => (
                <div key={rec.id} className="glass-card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0"><Wallet className="w-4 h-4 text-emerald-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{rec.month} {rec.year}</p>
                    <p className="text-xs text-muted-foreground">Base: {formatCurrency(rec.base_salary)} · OT: {formatCurrency(rec.overtime)}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(rec.net_salary)}</span>
                  <StatusBadge status={rec.status} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fExpenses.length === 0 ? <EmptyState icon={Receipt} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fExpenses.map(rec => (
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
      </Tabs>
    </div>
  );
}