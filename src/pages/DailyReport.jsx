import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ReportStatCard, { hexToRgba } from '@/components/reports/ReportStatCard';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/formatters';
import { Truck, DollarSign, Fuel, FileText, Trophy } from 'lucide-react';
import ExportButtons from '@/components/common/ExportButtons';
import SectionExportButtons from '@/components/reports/SectionExportButtons';
import AllTransactionsExport from '@/components/reports/AllTransactionsExport';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import TrendChart from '@/components/reports/TrendChart';
import BarTrendChart from '@/components/reports/BarTrendChart';
import RadialGauge from '@/components/reports/RadialGauge';
import { useReportClient } from '@/lib/reportClientFilter';
import { useGlobalDate } from '@/lib/GlobalDateContext';

const contentCardStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '24px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
};

const topHighlight = 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(30,215,96,0.04) 0%, transparent 60%)';

const statusMeta = (s) => {
  switch (s) {
    case 'completed': return { color: '#22c55e', text: '#4ade80' };
    case 'in_transit': return { color: '#1ED760', text: '#4ADE80' };
    case 'cancelled': return { color: '#ef4444', text: '#f87171' };
    default: return { color: '#f59e0b', text: '#fbbf24' };
  }
};

export default function DailyReport() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const { dateFrom, dateTo } = useGlobalDate();
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const reportClient = useReportClient();

  const loadData = useCallback(async () => {
    // Sequential with small delays to avoid rate-limit bursts.
    // Each call falls back to [] on error so one rate-limited request
    // doesn't crash the whole page.
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    const t = await base44.entities.Trip.list('-trip_date', 500).catch(() => []);
    await delay(400);
    const e = await base44.entities.Expense.list('-date', 500).catch(() => []);
    await delay(400);
    const f = await base44.entities.FuelRecord.list('-date', 500).catch(() => []);
    await delay(400);
    const i = await base44.entities.Invoice.list('-issue_date', 500).catch(() => []);
    const byClient = (x) => reportClient === 'all' || x.client_name === reportClient;
    const _f = dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const _t = dateTo || new Date().toISOString().split('T')[0];
    setTrips((t || []).filter(x => byClient(x) && (!x.trip_date || (x.trip_date >= _f && x.trip_date <= _t))));
    setExpenses((e || []).filter(x => !x.date || (x.date >= _f && x.date <= _t)));
    setFuelRecords((f || []).filter(x => !x.date || (x.date >= _f && x.date <= _t)));
    setInvoices((i || []).filter(x => byClient(x) && (!x.issue_date || (x.issue_date >= _f && x.issue_date <= _t))));
  }, [dateFrom, dateTo, reportClient]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadData().finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loadData]);

  // Listen for global pull-to-refresh (handled by AppLayout)
  useEffect(() => {
    const handler = () => loadData();
    window.addEventListener('global:refresh', handler);
    return () => window.removeEventListener('global:refresh', handler);
  }, [loadData]);

  const revenue = trips.reduce((s, t) => s + (t.revenue || 0), 0);
  const expenseTotal = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const fuelTotal = fuelRecords.reduce((s, f) => s + (f.total_cost || 0), 0);
  const invoiceTotal = invoices.reduce((s, i) => s + (i.total_amount || 0), 0);
  const net = revenue - expenseTotal - fuelTotal;
  const margin = revenue > 0 ? (net / revenue) * 100 : 0;

  // Daily analytics
  const days = [];
  { const _cf = dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]; const _ct = dateTo || new Date().toISOString().split('T')[0]; let d = new Date(_cf); const end = new Date(_ct); while (d <= end) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1); } }
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
  const dateRange = `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;

  return (
    <div className="relative min-h-full">
      {/* Ambient handled by app layout */}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <AllTransactionsExport trips={trips} expenses={expenses} fuelRecords={fuelRecords} dateRange={dateRange} />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ReportStatCard index={0} label="Revenue" value={revenue} format={formatCurrency} icon={DollarSign} color="#1ED760" />
            <ReportStatCard index={1} label={t('trips')} value={trips.length} icon={Truck} color="#a855f7" />
            <ReportStatCard index={2} label={t('expenses')} value={expenseTotal} format={formatCurrency} icon={FileText} color="#f97316" />
            <ReportStatCard index={3} label={t('fuel')} value={fuelTotal} format={formatCurrency} icon={Fuel} color="#14b8a6" />
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ReportSectionCard index={4} color="#1ED760" title="Revenue vs Expenses" className="lg:col-span-2" action={<SectionExportButtons data={trendData} filename="daily_revenue_vs_expenses" columns={[{ label: 'Date', key: 'label' }, { label: 'Revenue', key: 'revenue', numeric: true }, { label: 'Expenses', key: 'expenses', numeric: true }]} title="Revenue vs Expenses" options={{ dateRange }} />}>
              <TrendChart data={trendData} series={[{ key: 'revenue', name: 'Revenue', color: '#1ED760' }, { key: 'expenses', name: 'Expenses', color: '#f97316' }]} type="line" height={240} />
            </ReportSectionCard>
            <ReportSectionCard index={5} color="#a855f7" title="Profit Margin" action={<SectionExportButtons data={[{ metric: 'Profit Margin %', value: margin.toFixed(2) }]} filename="daily_profit_margin" columns={[{ label: 'Metric', key: 'metric' }, { label: 'Value', key: 'value', numeric: true }]} title="Profit Margin" options={{ dateRange }} />}>
              <div className="flex justify-center py-2"><RadialGauge value={margin} label="Margin" color="#a855f7" size={170} /></div>
            </ReportSectionCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportSectionCard index={6} color="#a855f7" title="Trips per Day" action={<SectionExportButtons data={tripCountData} filename="daily_trips_per_day" columns={[{ label: 'Date', key: 'label' }, { label: 'Trips', key: 'trips', numeric: true }]} title="Trips per Day" options={{ dateRange }} />}>
              <BarTrendChart data={tripCountData} dataKey="trips" color="#a855f7" height={220} />
            </ReportSectionCard>
            <ReportSectionCard index={7} color="#22c55e" title="Driver Performance" action={<SectionExportButtons data={driverRanking.map((d) => ({ driver: d.name, trips: d.trips, revenue: d.revenue }))} filename="daily_driver_performance" columns={[{ label: 'Driver', key: 'driver' }, { label: 'Trips', key: 'trips', numeric: true }, { label: 'Revenue', key: 'revenue', numeric: true }]} title="Driver Performance" options={{ dateRange }} />}>
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
  );
}