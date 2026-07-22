import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ReportStatCard, { hexToRgba } from '@/components/reports/ReportStatCard';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Truck, DollarSign, Fuel, FileText } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ExportButtons from '@/components/common/ExportButtons';

const contentCardStyle = {
  background: 'linear-gradient(180deg, rgba(20,24,38,0.60) 0%, rgba(14,18,30,0.70) 100%)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(255,255,255,0.04)',
  borderRadius: '20px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03), 0 8px 32px rgba(0,0,0,0.35)',
};

const topHighlight = 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.04) 0%, transparent 60%)';

const statusMeta = (s) => {
  switch (s) {
    case 'completed': return { color: '#22c55e', text: '#4ade80' };
    case 'in_transit': return { color: '#3b82f6', text: '#60a5fa' };
    case 'cancelled': return { color: '#ef4444', text: '#f87171' };
    default: return { color: '#f59e0b', text: '#fbbf24' };
  }
};

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
    <div className="relative">
      {/* Ambient background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-24 -left-10 w-[420px] h-[420px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(59,130,246,0.05)' }} />
        <div className="absolute top-1/3 -right-24 w-[360px] h-[360px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(168,85,247,0.05)', animationDelay: '7s' }} />
        <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full blur-[130px] md:animate-[float_20s_ease-in-out_infinite]" style={{ background: 'rgba(20,184,166,0.04)', animationDelay: '3s' }} />
      </div>

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
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportStatCard index={0} label="Revenue" value={revenue} format={formatCurrency} icon={DollarSign} color="#3b82f6" />
            <ReportStatCard index={1} label={t('trips')} value={trips.length} icon={Truck} color="#a855f7" />
            <ReportStatCard index={2} label={t('expenses')} value={expenseTotal} format={formatCurrency} icon={FileText} color="#f97316" />
            <ReportStatCard index={3} label={t('fuel')} value={fuelTotal} format={formatCurrency} icon={Fuel} color="#14b8a6" />
          </div>

          {/* Trips section */}
          <div className="relative overflow-hidden p-5" style={contentCardStyle}>
            <div className="absolute inset-x-0 top-0 h-20 pointer-events-none" style={{ background: topHighlight }} />
            <h3 className="relative text-sm font-semibold text-white/80 mb-3">{t('trips')} ({trips.length})</h3>
            {trips.length === 0 ? <p className="relative text-sm text-white/40">{t('no_data')}</p> : (
              <div className="relative space-y-1">
                {trips.map((trip, i) => {
                  const meta = statusMeta(trip.status);
                  return (
                    <div
                      key={trip.id}
                      className="group relative flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors animate-fade-in-up"
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: meta.color, boxShadow: `0 0 8px ${meta.color}` }}
                      />
                      <div className="min-w-0 pr-3">
                        <p className="text-sm text-white/80 truncate">{trip.from_location} → {trip.to_location}</p>
                        <p className="text-[11px] text-white/35 truncate">{trip.driver_name} · {trip.vehicle_plate}</p>
                      </div>
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                          style={{ background: hexToRgba(meta.color, 0.12), border: `1px solid ${hexToRgba(meta.color, 0.20)}`, color: meta.text, letterSpacing: '0.02em' }}
                        >
                          {(trip.status || '').replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-semibold text-white/90 tabular-nums">{formatCurrency(trip.revenue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="relative overflow-hidden p-5" style={contentCardStyle}>
            <div className="absolute inset-x-0 top-0 h-20 pointer-events-none" style={{ background: topHighlight }} />
            <h3 className="relative text-sm font-semibold text-white/80 mb-3">Day Summary</h3>
            <div className="relative space-y-2.5">
              <div className="flex justify-between text-sm"><span className="text-white/50">Revenue</span><span className="text-emerald-400 font-medium tabular-nums">{formatCurrency(revenue)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/50">{t('expenses')}</span><span className="text-red-400 font-medium tabular-nums">-{formatCurrency(expenseTotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-white/50">{t('fuel')}</span><span className="text-red-400 font-medium tabular-nums">-{formatCurrency(fuelTotal)}</span></div>
              <div className="border-t border-white/[0.06] pt-2.5 flex justify-between text-sm font-bold">
                <span className="text-white/80">Net</span>
                <span className={`tabular-nums ${revenue - expenseTotal - fuelTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(revenue - expenseTotal - fuelTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}