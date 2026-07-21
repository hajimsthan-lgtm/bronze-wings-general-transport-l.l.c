import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import ExportButtons from '@/components/common/ExportButtons';

export default function ProfitLoss() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Trip.list('-trip_date', 500),
      base44.entities.Expense.list('-date', 500),
      base44.entities.FuelRecord.list('-date', 500),
    ]).then(([t, e, f]) => { setTrips(t); setExpenses(e); setFuelRecords(f); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const fTrips = trips.filter(t => !t.trip_date || (t.trip_date >= dateFrom && t.trip_date <= dateTo));
  const fExpenses = expenses.filter(e => !e.date || (e.date >= dateFrom && e.date <= dateTo));
  const fFuel = fuelRecords.filter(f => !f.date || (f.date >= dateFrom && f.date <= dateTo));

  const totalRevenue = fTrips.reduce((s, t) => s + (t.revenue || 0), 0);
  const totalExpenses = fExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalFuel = fFuel.reduce((s, f) => s + (f.total_cost || 0), 0);
  const tripCosts = fTrips.reduce((s, t) => s + (t.fuel_cost || 0) + (t.toll_cost || 0) + (t.other_cost || 0), 0);
  const totalCosts = totalExpenses + totalFuel + tripCosts;
  const netProfit = totalRevenue - totalCosts;

  // Category breakdown
  const categories = {};
  fExpenses.forEach(e => { categories[e.category] = (categories[e.category] || 0) + (e.amount || 0); });
  const chartData = Object.entries(categories).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return (
    <div>
      <PageHeader title={t('profit_loss')} description="Financial overview"
        action={<ExportButtons
          data={[
            { category: 'Trip Revenue', amount: totalRevenue },
            ...chartData.map(c => ({ category: `Expense: ${c.name}`, amount: -c.value })),
            { category: 'Fuel (trip-linked)', amount: -totalFuel },
            { category: 'Trip Costs (tolls, other)', amount: -tripCosts },
            { category: 'Net Profit', amount: netProfit },
          ]}
          filename="profit_loss"
          columns={[
            { label: 'Category', key: 'category' },
            { label: 'Amount (AED)', key: 'amount', numeric: true },
          ]}
          title="Profit & Loss"
          options={{ dateRange: `${formatDate(dateFrom)} - ${formatDate(dateTo)}` }}
        />} />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <DateRangeFilter
          fromValue={dateFrom}
          onFromChange={setDateFrom}
          toValue={dateTo}
          onToChange={setDateTo}
          onToday={() => { const today = new Date().toISOString().split('T')[0]; setDateFrom(today); setDateTo(today); }}
        />
      </div>

      <div className="space-y-6">
        {/* Income section */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Income</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-foreground">Trip Revenue</span><span className="text-emerald-400 font-medium">{formatCurrency(totalRevenue)}</span></div>
          </div>
          <div className="border-t border-border mt-3 pt-3 flex justify-between text-sm font-bold">
            <span className="text-foreground">{t('total')} Income</span><span className="text-emerald-400">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        {/* Expenses section */}
        <div className="glass-card p-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('expenses')}</h3>
          <div className="space-y-2">
            {chartData.map(item => (
              <div key={item.name} className="flex justify-between text-sm">
                <span className="text-foreground capitalize">{item.name.replace(/_/g, ' ')}</span>
                <span className="text-red-400">{formatCurrency(item.value)}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm"><span className="text-foreground">{t('fuel')} (trip-linked)</span><span className="text-red-400">{formatCurrency(totalFuel)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-foreground">Trip Costs (tolls, other)</span><span className="text-red-400">{formatCurrency(tripCosts)}</span></div>
          </div>
          <div className="border-t border-border mt-3 pt-3 flex justify-between text-sm font-bold">
            <span className="text-foreground">{t('total')} {t('expenses')}</span><span className="text-red-400">{formatCurrency(totalCosts)}</span>
          </div>
        </div>

        {/* Net */}
        <div className="glass-card p-5 stat-glow">
          <div className="flex justify-between items-center">
            <div><h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Profit / Loss</h3></div>
            <span className={`text-2xl font-display font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(netProfit)}</span>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Expense Breakdown</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 20% 18%)" />
                <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <YAxis tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(220 20% 8%)', border: '1px solid hsl(215 20% 18%)', borderRadius: 8, color: '#fafafa', fontSize: 12 }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}