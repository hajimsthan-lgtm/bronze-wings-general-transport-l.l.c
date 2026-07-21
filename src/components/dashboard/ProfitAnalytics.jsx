import { useMemo, useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatters';
import { computeVehicleProfit, computeDriverProfit } from '@/lib/accounting';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const TOOLTIP_STYLE = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  fontSize: 12,
  color: '#e0e0e0',
};

function ProfitBar({ data, nameKey }) {
  const chartData = data.map((d) => ({ name: d[nameKey], profit: d.profit }));
  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No data yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 38)}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} width={92} />
        <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
          {chartData.map((d, i) => (
            <Cell key={i} fill={d.profit >= 0 ? '#22c55e' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function ProfitAnalytics() {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    const safe = (fn) => fn.catch(() => []);
    let cancelled = false;
    (async () => {
      try {
        // Fetch sequentially to avoid bursting the API rate limit
        const trips = await safe(base44.entities.Trip.list('-created_date', 500));
        const fuel = await safe(base44.entities.FuelRecord.list('-created_date', 500));
        const expenses = await safe(base44.entities.Expense.list('-created_date', 500));
        const services = await safe(base44.entities.ServiceRecord.list('-created_date', 500));
        const salaries = await safe(base44.entities.SalaryRecord.list('-created_date', 500));
        if (cancelled) return;
        setVehicles(computeVehicleProfit({ trips, fuelRecords: fuel, expenses, serviceRecords: services }));
        setDrivers(computeDriverProfit({ trips, salaryRecords: salaries, expenses }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const topVehicles = useMemo(() => [...vehicles].sort((a, b) => b.profit - a.profit).slice(0, 6), [vehicles]);
  const topDrivers = useMemo(() => [...drivers].sort((a, b) => b.profit - a.profit).slice(0, 6), [drivers]);
  const totalVehicleProfit = vehicles.reduce((s, v) => s + v.profit, 0);
  const totalDriverProfit = drivers.reduce((s, d) => s + d.profit, 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Vehicle Profitability</h2>
          <span className={`text-xs font-bold tabular-nums ${totalVehicleProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(totalVehicleProfit)}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">Revenue − (Fuel + Expenses + Services)</p>
        <ProfitBar data={topVehicles} nameKey="vehicle_plate" />
      </div>
      <div className="glass-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Driver Profitability</h2>
          <span className={`text-xs font-bold tabular-nums ${totalDriverProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(totalDriverProfit)}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">Revenue − (Salary + Overtime + Expenses)</p>
        <ProfitBar data={topDrivers} nameKey="driver_name" />
      </div>
    </div>
  );
}