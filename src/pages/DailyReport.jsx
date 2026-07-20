import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import KpiCard from '@/components/common/KpiCard';
import { formatCurrency, formatDate } from '@/lib/formatters';
import StatusBadge from '@/components/common/StatusBadge';
import { Input } from '@/components/ui/input';
import { Truck, DollarSign, Fuel, FileText } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ExportButtons from '@/components/common/ExportButtons';

export default function DailyReport() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      base44.entities.Trip.list('-trip_date', 500),
      base44.entities.Expense.list('-date', 500),
      base44.entities.FuelRecord.list('-date', 500),
      base44.entities.Invoice.list('-issue_date', 500),
    ]).then(([t, e, f, i]) => {
      setTrips((t || []).filter(x => !x.trip_date || (x.trip_date >= dateFrom && x.trip_date <= dateTo)));
      setExpenses((e || []).filter(x => !x.date || (x.date >= dateFrom && x.date <= dateTo)));
      setFuelRecords((f || []).filter(x => !x.date || (x.date >= dateFrom && x.date <= dateTo)));
      setInvoices((i || []).filter(x => !x.issue_date || (x.issue_date >= dateFrom && x.issue_date <= dateTo)));
    }).finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  const revenue = trips.reduce((s, t) => s + (t.revenue || 0), 0);
  const expenseTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const fuelTotal = fuelRecords.reduce((s, f) => s + (f.total_cost || 0), 0);
  const invoiceTotal = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);

  return (
    <div>
      <PageHeader title={t('daily_report')} description={`${formatDate(dateFrom)} — ${formatDate(dateTo)}`}
        action={<div className="flex items-center gap-2">
          <ExportButtons
            data={trips.map(tr => ({ trip_date: tr.trip_date, route: `${tr.from_location} → ${tr.to_location}`, driver_name: tr.driver_name, vehicle_plate: tr.vehicle_plate, revenue: tr.revenue }))}
            filename="daily_report"
            columns={[
              { label: 'Date', key: 'trip_date' },
              { label: 'Route', key: 'route' },
              { label: 'Driver', key: 'driver_name' },
              { label: 'Vehicle', key: 'vehicle_plate' },
              { label: 'Revenue', key: 'revenue', numeric: true },
            ]}
            title="Daily Report"
            options={{ dateRange: `${formatDate(dateFrom)} - ${formatDate(dateTo)}` }}
          />
          <DateRangeFilter
            fromValue={dateFrom}
            onFromChange={setDateFrom}
            toValue={dateTo}
            onToChange={setDateTo}
            onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
          />
        </div>} />

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard title="Revenue" value={formatCurrency(revenue)} icon={DollarSign} />
            <KpiCard title={t('trips')} value={trips.length} icon={Truck} />
            <KpiCard title={t('expenses')} value={formatCurrency(expenseTotal)} icon={FileText} />
            <KpiCard title={t('fuel')} value={formatCurrency(fuelTotal)} icon={Fuel} />
          </div>

          {/* Trips section */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">{t('trips')} ({trips.length})</h3>
            {trips.length === 0 ? <p className="text-sm text-muted-foreground">{t('no_data')}</p> : (
              <div className="space-y-2">
                {trips.map(trip => (
                  <div key={trip.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.02]">
                    <div><p className="text-sm text-foreground">{trip.from_location} → {trip.to_location}</p><p className="text-xs text-muted-foreground">{trip.driver_name} · {trip.vehicle_plate}</p></div>
                    <div className="flex items-center gap-2"><StatusBadge status={trip.status} /><span className="text-sm font-medium text-foreground">{formatCurrency(trip.revenue)}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Day Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Revenue</span><span className="text-emerald-400 font-medium">{formatCurrency(revenue)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('expenses')}</span><span className="text-red-400 font-medium">-{formatCurrency(expenseTotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t('fuel')}</span><span className="text-red-400 font-medium">-{formatCurrency(fuelTotal)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between text-sm font-bold"><span className="text-foreground">Net</span><span className={revenue - expenseTotal - fuelTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatCurrency(revenue - expenseTotal - fuelTotal)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}