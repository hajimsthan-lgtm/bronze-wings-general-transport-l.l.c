import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PullToRefresh from '@/components/common/PullToRefresh';
import ReportStatCard, { hexToRgba } from '@/components/reports/ReportStatCard';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/formatters';
import { Truck, DollarSign, Fuel, FileText, Trophy } from 'lucide-react';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ExportButtons from '@/components/common/ExportButtons';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import TrendChart from '@/components/reports/TrendChart';
import BarTrendChart from '@/components/reports/BarTrendChart';
import RadialGauge from '@/components/reports/RadialGauge';

const contentCardStyle = {
  background: '#232636',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '24px',
  boxShadow: '-8px -8px 16px rgba(255,255,255,0.05), 8px 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
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

  const loadData = useCallback(async () => {
    const [t, e, f, i] = await Promise.all([
      base44.entities.Trip.list('-trip_date', 500),
      base44.entities.Expense.list('-date', 500),
      base44.entities.FuelRecord.list('-date', 500),
      base44.entities.Invoice.list('-issue_date', 500),
    ]);
    setTrips((t || []).filter(x => !x.trip_date || (x.trip_date >= dateFrom && x.trip_date <= dateTo)));
    setExpenses((e || []).filter(x => !x.date || (x.date >= dateFrom && x.date <= dateTo)));
    setFuelRecords((f || []).filter(x => !x.date || (x.date >= dateFrom && x.date <= dateTo)));
    setInvoices((i || []).filter(x => !x.issue_date || (x.issue_date >= dateFrom && x.issue_date <= dateTo)));
  }, [dateFrom, dateTo]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadData().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadData]);

  const revenue = trips.reduce((s, t) => s + (t.revenue || 0), 0);
  const expenseTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const fuelTotal = fuelRecords.reduce((s, f) => s + (f.total_cost || 0), 0);
  const invoiceTotal = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const net = revenue - expenseTotal - fuelTotal;
  const margin = revenue > 0 ? (net / revenue) * 100 : 0;

  // Daily analytics
  const days = [];
  { let d = new Date(dateFrom); const end = new Date(dateTo); while (d <= end) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1); } }
  const trendData = days.map((d) => ({
    label: formatDateShort(d),
    revenue: trips.filter((t) => t.trip_date === d).reduce((s, t) => s + (t.revenue || 0), 0),
    expenses: expenses.filter((e) => e.date === d).reduce((s, e) => s + (e.amount || 0), 0) + fuelRecords.filter((f) => f.date === d).reduce((s, f) => s + (f.total_cost || 0), 0),
  }));
  const tripCountData = days.map((d) => ({ label: formatDateShort(d), trips: trips.filter((t) => t.trip_date === d).length }));

  // Driver performance
  const driverPerf = {};
  trips.forEach((t) => {
    if (!t.driver_name) return;
    driverPerf[t.driver_name] = driverPerf[t.driver_name] || { trips: 0, revenue: 0 };
    driverPerf[t.driver_name].trips += 1;
    driverPerf[t.driver_name].revenue += (t.revenue || 0);
  });
  const driverRanking = Object.entries(driverPerf).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="relative">
      {/* Ambient handled by app layout */}

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

          {/* Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ReportSectionCard index={4} color="#3b82f6" title="Revenue vs Expenses" className="lg:col-span-2">
              <TrendChart data={trendData} series={[{ key: 'revenue', name: 'Revenue', color: '#3b82f6' }, { key: 'expenses', name: 'Expenses', color: '#f97316' }]} type="line" height={240} />
            </ReportSectionCard>
            <ReportSectionCard index={5} color="#a855f7" title="Profit Margin">
              <div className="flex justify-center py-2"><RadialGauge value={margin} label="Margin" color="#a855f7" size={170} /></div>
            </ReportSectionCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportSectionCard index={6} color="#a855f7" title="Trips per Day">
              <BarTrendChart data={tripCountData} dataKey="trips" color="#a855f7" height={220} />
            </ReportSectionCard>
            <ReportSectionCard index={7} color="#22c55e" title="Driver Performance">
              {driverRanking.length === 0 ? <p className="text-sm text-white/40">No data</p> : (
                <div className="space-y-2">
                  {driverRanking.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.02] transition-colors">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: i === 0 ? 'rgba(234,179,8,0.18)' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#fbbf24' : 'rgba(255,255,255,0.5)', border: `1px solid ${i === 0 ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.06)'}` }}>{i + 1}</div>
                      <span className="flex-1 text-sm text-white/80 truncate">{d.name}</span>
                      <span className="text-xs text-white/40 tabular-nums">{d.trips} trips</span>
                      <span className="text-sm font-semibold text-white/90 tabular-nums">{formatCurrency(d.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </ReportSectionCard>
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
    </PullToRefresh>
  );
}