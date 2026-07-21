import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatCurrency } from '@/lib/formatters';

const STATUS_COLORS = {
  draft: '#9ca3af',
  sent: '#3b82f6',
  paid: '#22c55e',
  overdue: '#ef4444',
  cancelled: '#6b7280',
};

const TOOLTIP_STYLE = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  fontSize: 12,
  color: '#e0e0e0',
};

export default function DashboardCharts({ invoices, trips }) {
  const monthlyRevenue = useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { label: d.toLocaleDateString('en', { month: 'short' }), revenue: 0 };
    }
    trips.forEach(t => {
      if (!t.trip_date) return;
      const key = t.trip_date.substring(0, 7);
      if (months[key]) months[key].revenue += t.revenue || 0;
    });
    invoices.forEach(inv => {
      if (inv.status !== 'paid' || !inv.issue_date) return;
      const key = inv.issue_date.substring(0, 7);
      if (months[key]) months[key].revenue += inv.total_amount || 0;
    });
    return Object.values(months);
  }, [invoices, trips]);

  const statusBreakdown = useMemo(() => {
    const counts = { draft: 0, sent: 0, paid: 0, overdue: 0, cancelled: 0 };
    invoices.forEach(inv => { if (counts[inv.status] !== undefined) counts[inv.status]++; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [invoices]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-4 md:p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Revenue by Month</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyRevenue}>
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="glass-card p-4 md:p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Invoice Status Breakdown</h2>
        {statusBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No invoices yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                {statusBreakdown.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#888' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}