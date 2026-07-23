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
import ProfitSummary from '@/components/admin/ProfitSummary';

const RAIL_COLORS = { active:'#22c55e', completed:'#22c55e', paid:'#22c55e', done:'#22c55e', pending:'#f59e0b', partial:'#f59e0b', maintenance:'#f59e0b', on_leave:'#f59e0b', scheduled:'#3b82f6', in_transit:'#3b82f6', in_progress:'#3b82f6', sent:'#3b82f6', draft:'#3b82f6', expired:'#ef4444', terminated:'#ef4444', cancelled:'#ef4444', rejected:'#ef4444', inactive:'#64748b' };
const railColor = (s) => RAIL_COLORS[s] || '#3b82f6';

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

  const totalTrips = fTrips.reduce((s, x) => s + (Number(x.revenue) || 0), 0);
  const totalExpenses = fExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
  const totalSalary = fSalaries.reduce((s, x) => s + (Number(x.net_salary) || 0), 0);
  const netProfit = totalTrips - totalExpenses - totalSalary;

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

      <Tabs defaultValue={initialTab}>
        <TabsList className="bg-transparent border-0 p-0 h-auto">
          <TabsTrigger value="trips">{t('trips')} ({fTrips.length})</TabsTrigger>
          <TabsTrigger value="salary">{t('salary')} ({fSalaries.length})</TabsTrigger>
          <TabsTrigger value="expenses">{t('expenses')} ({fExpenses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fTrips.length === 0 ? <EmptyState icon={Inbox} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fTrips.map(trip => {
                const accent = railColor(trip.status);
                return (
                <div key={trip.id} className="group relative rounded-2xl p-3.5 flex items-center gap-3 overflow-hidden transition-all duration-300 hover:-translate-y-0.5" style={{ background:'linear-gradient(180deg,#1c1c20,#161618)', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full" style={{ background: accent, boxShadow:`0 0 8px ${accent}80` }} />
                  <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow:'0 0 0 1px rgba(59,130,246,0.25), 0 0 22px -6px rgba(59,130,246,0.35)' }} />
                  <div className="flex-1 min-w-0 pl-2">
                    <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)} · {trip.vehicle_plate}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(trip.revenue)}</span>
                  <StatusBadge status={trip.status} />
                </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fSalaries.length === 0 ? <EmptyState icon={Wallet} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fSalaries.map(rec => {
                const accent = railColor(rec.status);
                return (
                <div key={rec.id} className="group relative rounded-2xl p-3.5 flex items-center gap-3 overflow-hidden transition-all duration-300 hover:-translate-y-0.5" style={{ background:'linear-gradient(180deg,#1c1c20,#161618)', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full" style={{ background: accent, boxShadow:`0 0 8px ${accent}80` }} />
                  <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow:'0 0 0 1px rgba(59,130,246,0.25), 0 0 22px -6px rgba(59,130,246,0.35)' }} />
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 ml-1.5"><Wallet className="w-4 h-4 text-emerald-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{rec.month} {rec.year}</p>
                    <p className="text-xs text-muted-foreground">Base: {formatCurrency(rec.base_salary)} · OT: {formatCurrency(rec.overtime)}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(rec.net_salary)}</span>
                  <StatusBadge status={rec.status} />
                </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          {dataLoading ? <LoadingSpinner /> : fExpenses.length === 0 ? <EmptyState icon={Receipt} title={t('no_data')} /> : (
            <div className="space-y-2">
              {fExpenses.map(rec => {
                const accent = railColor(rec.status);
                return (
                <div key={rec.id} className="group relative rounded-2xl p-3.5 flex items-center gap-3 overflow-hidden transition-all duration-300 hover:-translate-y-0.5" style={{ background:'linear-gradient(180deg,#1c1c20,#161618)', border:'1px solid rgba(255,255,255,0.07)', boxShadow:'0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full" style={{ background: accent, boxShadow:`0 0 8px ${accent}80` }} />
                  <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow:'0 0 0 1px rgba(59,130,246,0.25), 0 0 22px -6px rgba(59,130,246,0.35)' }} />
                  <div className="flex-1 min-w-0 pl-2">
                    <p className="text-sm font-medium text-foreground truncate">{rec.description || rec.category}</p>
                    <p className="text-xs text-muted-foreground capitalize">{rec.category} · {formatDate(rec.date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(rec.amount)}</span>
                  <StatusBadge status={rec.status} />
                </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}