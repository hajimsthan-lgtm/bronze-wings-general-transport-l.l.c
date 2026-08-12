import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PullToRefresh from '@/components/common/PullToRefresh';
import { formatCurrency, formatDate, formatDateShort } from '@/lib/formatters';
import { Wallet, Receipt, PiggyBank, TrendingUp, TrendingDown } from 'lucide-react';
import ExportButtons from '@/components/common/ExportButtons';
import SectionExportButtons from '@/components/reports/SectionExportButtons';
import AllTransactionsExport from '@/components/reports/AllTransactionsExport';
import ReportSectionCard from '@/components/reports/ReportSectionCard';
import ReportStatCard from '@/components/reports/ReportStatCard';
import CountUpText from '@/components/reports/CountUpText';
import DonutChart from '@/components/reports/DonutChart';
import Sparkline from '@/components/reports/Sparkline';
import ProgressBar from '@/components/reports/ProgressBar';
import TrendChart from '@/components/reports/TrendChart';
import RadialGauge from '@/components/reports/RadialGauge';
import { hexToRgba } from '@/components/reports/ReportStatCard';
import { useReportClient } from '@/lib/reportClientFilter';
import { safeAll } from '@/lib/safeRequest';
import { useGlobalDate } from '@/lib/GlobalDateContext';

const addDays = (iso, n) => { const d = new Date(iso); if (isNaN(d)) return iso; d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; };

export default function ProfitLoss() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const { dateFrom, dateTo } = useGlobalDate();
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const reportClient = useReportClient();

  const loadData = useCallback(async () => {
    const [t, e, f] = await safeAll([
      () => base44.entities.Trip.list('-trip_date', 500),
      () => base44.entities.Expense.list('-date', 500),
      () => base44.entities.FuelRecord.list('-date', 500),
    ], 1);
    setTrips(t); setExpenses(e); setFuelRecords(f);
  }, []);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  if (loading) return <LoadingSpinner />;

  const _f = dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const _t = dateTo || new Date().toISOString().split('T')[0];
  const fTrips = trips.filter(t => (reportClient === 'all' || t.client_name === reportClient) && (!t.trip_date || (t.trip_date >= _f && t.trip_date <= _t)));
  const fExpenses = expenses.filter(e => !e.date || (e.date >= _f && e.date <= _t));
  const fFuel = fuelRecords.filter(f => !f.date || (f.date >= _f && f.date <= _t));

  const totalRevenue = fTrips.reduce((s, t) => s + (t.revenue || 0), 0);
  const totalExpenses = fExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalFuel = fFuel.reduce((s, f) => s + (f.total_cost || 0), 0);
  const tripCosts = fTrips.reduce((s, t) => s + (t.fuel_cost || 0) + (t.toll_cost || 0) + (t.other_cost || 0), 0);
  const totalCosts = totalExpenses + totalFuel + tripCosts;
  const netProfit = totalRevenue - totalCosts;

  const categories = {};
  fExpenses.forEach(e => { categories[e.category] = (categories[e.category] || 0) + (e.amount || 0); });
  const chartData = Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Daily series for sparklines
  const days = [];
  { const _cf = dateFrom || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]; const _ct = dateTo || new Date().toISOString().split('T')[0]; let d = new Date(_cf); const end = new Date(_ct); while (d <= end) { days.push(d.toISOString().split('T')[0]); d.setDate(d.getDate() + 1); } }
  const incomeSeries = days.map(d => fTrips.filter(t => t.trip_date === d).reduce((s, t) => s + (t.revenue || 0), 0));
  const expenseSeries = days.map(d => fExpenses.filter(e => e.date === d).reduce((s, e) => s + (e.amount || 0), 0) + fFuel.filter(f => f.date === d).reduce((s, f) => s + (f.total_cost || 0), 0));
  const netSeries = days.map((_, i) => incomeSeries[i] - expenseSeries[i]);

  // Donut groups
  const maintVal = categories['maintenance'] || 0;
  const otherVal = totalExpenses - maintVal;
  const donutData = [
    { name: 'Maintenance', value: maintVal, color: '#1ED760' },
    { name: 'Fuel', value: totalFuel, color: '#f97316' },
    { name: 'Trip Costs', value: tripCosts, color: '#a855f7' },
    { name: 'Other', value: otherVal, color: '#22c55e' },
  ].filter(d => d.value > 0);
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  // Period-over-period net comparison
  const computeNet = (start, end) => {
    const rT = trips.filter(t => !t.trip_date || (t.trip_date >= start && t.trip_date <= end)).reduce((s, t) => s + (t.revenue || 0), 0);
    const rE = expenses.filter(e => !e.date || (e.date >= start && e.date <= end)).reduce((s, e) => s + (e.amount || 0), 0);
    const rF = fuelRecords.filter(f => !f.date || (f.date >= start && f.date <= end)).reduce((s, f) => s + (f.total_cost || 0), 0);
    const rC = trips.filter(t => !t.trip_date || (t.trip_date >= start && t.trip_date <= end)).reduce((s, t) => s + (t.fuel_cost || 0) + (t.toll_cost || 0) + (t.other_cost || 0), 0);
    return rT - (rE + rF + rC);
  };
  const cmp = (shift) => { if (!dateFrom || !dateTo) return null; const prev = computeNet(addDays(dateFrom, -shift), addDays(dateTo, -shift)); if (!prev) return null; return ((netProfit - prev) / Math.abs(prev)) * 100; };
  const cmpWeek = cmp(7), cmpMonth = cmp(30), cmpYear = cmp(365);
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const trendData = days.map((d, i) => ({ label: formatDateShort(d), income: incomeSeries[i], expenses: expenseSeries[i] }));
  const netTrendData = days.map((d, i) => ({ label: formatDateShort(d), net: netSeries[i] }));
  const dateRange = `${formatDate(dateFrom)} - ${formatDate(dateTo)}`;

  const Badge = ({ pct }) => pct == null ? null : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium" style={{ background: pct >= 0 ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)', border: `1px solid ${pct >= 0 ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.20)'}`, color: pct >= 0 ? '#16a34a' : '#dc2626' }}>
      {pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(pct).toFixed(1)}%
    </span>
  );

  const Row = ({ label, amount, positive }) => (
    <div className="group relative flex justify-between items-center py-3 hover:bg-muted/60 rounded-lg px-2 -mx-2 transition-colors border-b border-border">
      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: positive ? '#22c55e' : '#ef4444' }} />
      <span className="text-sm font-medium text-foreground pl-2">{label}</span>
      <span className="text-sm font-semibold tabular-nums" style={{ color: positive ? '#16a34a' : '#dc2626' }}>{formatCurrency(amount)}</span>
    </div>
  );

  const TotalRow = ({ label, amount, color, positive }) => (
    <div className="flex justify-between items-center mt-3 px-4 py-3.5 rounded-xl" style={{ background: hexToRgba(color, 0.06), border: `1px solid ${hexToRgba(color, 0.12)}` }}>
      <span className="text-sm font-bold text-foreground">{label}</span>
      <span className="text-sm font-bold tabular-nums" style={{ color: positive ? '#16a34a' : '#dc2626' }}><CountUpText value={amount} /></span>
    </div>
  );

  return (
    <PullToRefresh onRefresh={loadData}>
    <div className="relative">
      {/* Ambient handled by app layout */}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <AllTransactionsExport trips={fTrips} expenses={fExpenses} fuelRecords={fFuel} dateRange={dateRange} />
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ReportStatCard index={0} label="Income" value={totalRevenue} format={formatCurrency} icon={Wallet} color="#22c55e"
          extra={<Sparkline data={incomeSeries} type="bar" color="#22c55e" />} />
        <ReportStatCard index={1} label={t('expenses')} value={totalCosts} format={formatCurrency} icon={Receipt} color="#ef4444"
          extra={<Sparkline data={expenseSeries} type="area" color="#ef4444" />} />
        <ReportStatCard index={2} label="Net Profit" value={netProfit} format={formatCurrency} icon={PiggyBank} color="#1ED760"
          extra={<Badge pct={cmpWeek} />} />
      </div>

      {/* Income & Expenses sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ReportSectionCard index={3} color="#22c55e" title="Income" action={<SectionExportButtons data={[{ label: 'Trip Revenue', amount: totalRevenue }]} filename="pnl_income" columns={[{ label: 'Item', key: 'label' }, { label: 'Amount (AED)', key: 'amount', numeric: true }]} title="Income" options={{ dateRange }} />}>
          <Row label="Trip Revenue" amount={totalRevenue} positive />
          <TotalRow label="Total Income" amount={totalRevenue} color="#22c55e" positive />
        </ReportSectionCard>

        <ReportSectionCard index={4} color="#ef4444" title={t('expenses')} action={<SectionExportButtons data={[...chartData.map((c) => ({ item: c.name, amount: c.value })), { item: 'Fuel (trip-linked)', amount: totalFuel }, { item: 'Trip Costs (tolls, other)', amount: tripCosts }]} filename="pnl_expenses" columns={[{ label: 'Item', key: 'item' }, { label: 'Amount (AED)', key: 'amount', numeric: true }]} title="Expenses" options={{ dateRange }} />}>
          {chartData.map(item => (
            <Row key={item.name} label={item.name.replace(/_/g, ' ')} amount={item.value} positive={false} />
          ))}
          <Row label={`${t('fuel')} (trip-linked)`} amount={totalFuel} positive={false} />
          <Row label="Trip Costs (tolls, other)" amount={tripCosts} positive={false} />
          <TotalRow label={`Total ${t('expenses')}`} amount={totalCosts} color="#ef4444" positive={false} />
        </ReportSectionCard>
      </div>

      {/* Net Profit section */}
      <ReportSectionCard index={5} color="#1ED760" title="Net Profit / Loss" className="mb-4" action={<SectionExportButtons data={[{ label: 'Net Profit', amount: netProfit }]} filename="pnl_net_profit" columns={[{ label: 'Item', key: 'label' }, { label: 'Amount (AED)', key: 'amount', numeric: true }]} title="Net Profit / Loss" options={{ dateRange }} />}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className="text-3xl font-bold tabular-nums mt-1" style={{ color: netProfit >= 0 ? '#16a34a' : '#dc2626' }}>
              <CountUpText value={netProfit} />
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Sparkline data={netSeries} type="line" color="#1ED760" width={120} height={40} />
            <Badge pct={cmpWeek} />
          </div>
        </div>
      </ReportSectionCard>

      {/* Income vs Expenses area + Net profit trend + margin gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ReportSectionCard index={7} color="#22c55e" title="Income vs Expenses" className="lg:col-span-2" action={<SectionExportButtons data={trendData} filename="pnl_income_vs_expenses" columns={[{ label: 'Date', key: 'label' }, { label: 'Income', key: 'income', numeric: true }, { label: 'Expenses', key: 'expenses', numeric: true }]} title="Income vs Expenses" options={{ dateRange }} />}>
          <TrendChart data={trendData} series={[{ key: 'income', name: 'Income', color: '#22c55e' }, { key: 'expenses', name: 'Expenses', color: '#ef4444' }]} type="area" height={240} />
        </ReportSectionCard>
        <ReportSectionCard index={8} color="#1ED760" title="Profit Margin" action={<SectionExportButtons data={[{ metric: 'Profit Margin %', value: margin.toFixed(2) }]} filename="pnl_profit_margin" columns={[{ label: 'Metric', key: 'metric' }, { label: 'Value', key: 'value', numeric: true }]} title="Profit Margin" options={{ dateRange }} />}>
          <div className="flex justify-center py-2"><RadialGauge value={margin} label="Margin" color="#1ED760" size={170} /></div>
        </ReportSectionCard>
      </div>

      <ReportSectionCard index={9} color="#1ED760" title="Net Profit Trend" className="mb-4" action={<SectionExportButtons data={netTrendData} filename="pnl_net_profit_trend" columns={[{ label: 'Date', key: 'label' }, { label: 'Net Profit', key: 'net', numeric: true }]} title="Net Profit Trend" options={{ dateRange }} />}>
        <TrendChart data={netTrendData} series={[{ key: 'net', name: 'Net Profit', color: '#1ED760' }]} type="line" height={220} />
      </ReportSectionCard>

      {/* Expense Breakdown donut + progress */}
      {donutData.length > 0 && (
        <ReportSectionCard index={6} color="#a855f7" title="Expense Breakdown" action={<SectionExportButtons data={donutData.map((d) => ({ category: d.name, amount: d.value }))} filename="pnl_expense_breakdown" columns={[{ label: 'Category', key: 'category' }, { label: 'Amount (AED)', key: 'amount', numeric: true }]} title="Expense Breakdown" options={{ dateRange }} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex justify-center">
              <DonutChart data={donutData} total={formatCurrency(donutTotal)} height={200} />
            </div>
            <div className="space-y-3">
              {donutData.map(d => {
                const pct = donutTotal > 0 ? (d.value / donutTotal) * 100 : 0;
                return (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-2 text-foreground"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span>
                      <span className="text-foreground tabular-nums">{formatCurrency(d.value)} · {pct.toFixed(1)}%</span>
                    </div>
                    <ProgressBar pct={pct} color={d.color} />
                  </div>
                );
              })}
            </div>
          </div>
        </ReportSectionCard>
      )}

      {/* Comparison mini-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {[{ label: 'vs Last Week', pct: cmpWeek }, { label: 'vs Last Month', pct: cmpMonth }, { label: 'vs Last Year', pct: cmpYear }].map((c, i) => (
          <div key={c.label} className="rounded-2xl p-4 animate-fade-in-up bg-card border border-border shadow-sm" style={{ animationDelay: `${0.4 + i * 0.08}s` }}>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="text-lg font-bold mt-1 tabular-nums" style={{ color: c.pct == null ? 'hsl(var(--muted-foreground))' : c.pct >= 0 ? '#16a34a' : '#dc2626' }}>
              {c.pct == null ? '—' : `${c.pct >= 0 ? '↑' : '↓'} ${Math.abs(c.pct).toFixed(1)}%`}
            </p>
          </div>
        ))}
      </div>
    </div>
    </PullToRefresh>
  );
}