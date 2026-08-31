import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Wrench, Fuel, Wallet, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { safeListAll } from '@/lib/safeRequest';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const tooltipStyle = {
  background: 'rgba(22,19,49,0.96)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 11,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  padding: '8px 10px',
};

export default function OperationsAnalytics() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [fuelRecords, setFuelRecords] = useState([]);
  const [services, setServices] = useState([]);
  const [salaryRecords, setSalaryRecords] = useState([]);

  const loadData = useCallback(async () => {
    const [t, e, f, s, sal] = await safeListAll([
      () => base44.entities.Trip.list('-trip_date', 50).catch(() => []),
      () => base44.entities.Expense.list('-date', 50).catch(() => []),
      () => base44.entities.FuelRecord.list('-date', 50).catch(() => []),
      () => base44.entities.ServiceRecord.list('-date', 50).catch(() => []),
      () => base44.entities.SalaryRecord.list('-date', 50).catch(() => []),
    ]);
    setTrips(t); setExpenses(e); setFuelRecords(f); setServices(s); setSalaryRecords(sal);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const totalRevenue = trips.reduce((s, t) => s + (Number(t.revenue) || 0), 0);
  const totalFuelCost = fuelRecords.reduce((s, f) => s + (Number(f.total_cost) || 0), 0);
  const totalMaintenanceCost = services.reduce((s, r) => s + (Number(r.cost) || 0), 0);
  const totalSalaryCost = salaryRecords.reduce((s, r) => s + (Number(r.net_salary) || Number(r.gross_salary) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const activeTrips = trips.filter((t) => t.status === 'trip_started').length;
  const scheduledTrips = trips.filter((t) => t.status === 'scheduled').length;
  const completedTrips = trips.filter((t) => t.status === 'completed').length;
  const cancelledTrips = trips.filter((t) => t.status === 'cancelled').length;

  // Bar chart: cost breakdown by category
  const costData = [
    { name: 'Fuel', value: Math.round(totalFuelCost), color: '#f59e0b' },
    { name: 'Maint.', value: Math.round(totalMaintenanceCost), color: '#8b5cf6' },
    { name: 'Salary', value: Math.round(totalSalaryCost), color: '#06b6d4' },
    { name: 'Other', value: Math.round(totalExpenses), color: '#6366f1' },
  ].filter((d) => d.value > 0);

  const quickButtons = [
    { label: 'Trips', icon: Truck, from: '#6366f1', to: '#8b5cf6', path: '/trips', count: trips.length },
    { label: 'Maintenance', icon: Wrench, from: '#8b5cf6', to: '#d946ef', path: '/maintenance', count: services.length },
    { label: 'Fuel Expense', icon: Fuel, from: '#f59e0b', to: '#f97316', path: '/fuel', count: fuelRecords.length },
    { label: 'Salary', icon: Wallet, from: '#06b6d4', to: '#14b8a6', path: '/admin/salary', count: salaryRecords.length },
  ];

  const kpiTiles = [
    { label: 'Revenue', value: totalRevenue, icon: TrendingUp, color: '#22c55e' },
    { label: 'Active', value: activeTrips, icon: Clock, color: '#3b82f6' },
    { label: 'Completed', value: completedTrips, icon: CheckCircle2, color: '#22c55e' },
    { label: 'Cancelled', value: cancelledTrips, icon: AlertCircle, color: '#ef4444' },
  ];

  return (
    <div className="space-y-4">
      {/* Quick navigation buttons */}
      <div className="grid grid-cols-2 gap-3">
        {quickButtons.map((btn, i) => {
          const Icon = btn.icon;
          return (
            <motion.button
              key={btn.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(btn.path)}
              className="bg-white rounded-[18px] p-4 flex items-center gap-3 text-left active:scale-95 transition-transform"
              style={{ border: '1px solid #ececf0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${btn.from}, ${btn.to})`, boxShadow: `0 4px 12px -3px ${btn.from}55` }}
              >
                <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-black leading-tight">{btn.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{btn.count} records</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-4 gap-2">
        {kpiTiles.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white rounded-[14px] p-2.5 flex flex-col items-center text-center"
              style={{ border: '1px solid #ececf0', boxShadow: '0 1px 6px rgba(0,0,0,0.03)' }}
            >
              <Icon className="w-4 h-4 mb-1" style={{ color: kpi.color }} />
              <span className="text-[14px] font-bold text-black tabular-nums leading-none">
                {typeof kpi.value === 'number' && kpi.value > 999
                  ? `${(kpi.value / 1000).toFixed(1)}k`
                  : kpi.value}
              </span>
              <span className="text-[8px] text-slate-400 mt-0.5 uppercase tracking-wider">{kpi.label}</span>
            </div>
          );
        })}
      </div>

      {/* Cost breakdown chart */}
      <div className="bg-white rounded-[22px] p-4" style={{ border: '1px solid #ececf0', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <h3 className="text-[14px] font-bold text-black mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Cost Breakdown
        </h3>
        {costData.length === 0 ? (
          <div className="h-[120px] flex items-center justify-center">
            <p className="text-[12px] text-slate-400">No cost data yet</p>
          </div>
        ) : (
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 999 ? `${(v / 1000).toFixed(0)}k` : v} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`AED ${v.toLocaleString()}`, 'Cost']} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {costData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}