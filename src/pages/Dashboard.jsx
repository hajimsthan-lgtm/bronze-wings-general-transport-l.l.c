import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Truck, FileText, AlertTriangle, Wrench, FileWarning, ChevronRight,
  Car, Heart, Users, CheckCircle, TrendingUp, ArrowRight,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatCurrency } from '@/lib/formatters';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PullToRefresh from '@/components/common/PullToRefresh';
import QuickActions from '@/components/dashboard/QuickActions';
import HeroGreetingCard from '@/components/dashboard/HeroGreetingCard';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from 'recharts';

const CARD = {
  background: '#232636',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '-8px -8px 16px rgba(255,255,255,0.05), 8px 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)',
};
const CARD_SM = {
  background: '#232636',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: '-6px -6px 12px rgba(255,255,255,0.04), 6px 6px 18px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)',
};

function StatCard({ icon: Icon, grad, glow, value, subtitle, label, to }) {
  return (
    <Link to={to} className="group relative block rounded-3xl p-5 sm:p-6 overflow-hidden transition-all duration-400 hover:-translate-y-1" style={CARD}>
      <span
        className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white"
        style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`, boxShadow: `0 4px 12px ${glow}` }}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </span>
      <div className="pr-10 sm:pr-14">
        <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.08em] font-semibold text-[#6b7280]">{label}</p>
        <p className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mt-2 leading-none tabular-nums truncate">{value}</p>
        <p className="text-[11px] sm:text-[13px] text-[#a0a5b8] mt-2 truncate">{subtitle}</p>
      </div>
    </Link>
  );
}

function MetricCard({ icon: Icon, grad, glow, value, label, subtitle }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl p-5 sm:p-6 min-w-0 transition-all duration-300 hover:-translate-y-0.5" style={CARD_SM}>
      <span
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`, boxShadow: `0 4px 12px ${glow}` }}
      >
        <Icon className="w-6 h-6" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl sm:text-3xl font-light text-white leading-none tabular-nums truncate">{value}</p>
        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#6b7280] mt-1.5">{label}</p>
        <p className="text-[11px] sm:text-[13px] text-[#a0a5b8] mt-0.5 truncate">{subtitle}</p>
      </div>
    </div>
  );
}

function ListRow({ to, icon: Icon, grad, glow, title, subtitle, statusText, statusColor }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 rounded-2xl p-3.5 mb-2.5 bg-[#1e2130] border border-white/[0.04] border-l-[3px] border-l-transparent hover:bg-[#2a2e42] hover:border-l-[#3b82f6] hover:translate-x-1 transition-all duration-300"
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`, boxShadow: `0 4px 10px ${glow}` }}
      >
        <Icon className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <p className="text-xs text-[#6b7280] truncate">{subtitle}</p>
      </div>
      <span className="text-xs font-medium flex-shrink-0" style={{ color: statusColor }}>{statusText}</span>
      <ChevronRight className="w-4 h-4 text-[#6b7280] group-hover:text-[#3b82f6] transition-colors flex-shrink-0" />
    </Link>
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

const ALERT_DAYS = 14;

const tooltipStyle = {
  background: '#232636',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
};

export default function Dashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const loadData = useCallback(async () => {
    const tr = await base44.entities.Trip.list('-created_date', 50).catch(() => []);
    const inv = await base44.entities.Invoice.list('-created_date', 50).catch(() => []);
    const v = await base44.entities.Vehicle.list().catch(() => []);
    const d = await base44.entities.Document.list().catch(() => []);
    const e = await base44.entities.Expense.list('-created_date', 50).catch(() => []);
    const dr = await base44.entities.Driver.list().catch(() => []);
    setTrips(tr); setInvoices(inv); setVehicles(v); setDocuments(d); setExpenses(e); setDrivers(dr);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { await loadData(); } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [loadData]);

  if (loading) return <LoadingSpinner />;

  // --- KPIs ---
  const activeTrips = trips.filter(t => t.status === 'in_transit' || t.status === 'scheduled').length;
  const pendingInvoices = invoices.filter(i => i.status === 'draft' || i.status === 'sent').length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalVehicles = vehicles.length;
  const healthPct = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 100;

  const unpaidInv = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled');
  const pendingCustCount = new Set(unpaidInv.map(i => i.client_name).filter(Boolean)).size;
  const dueAmount = unpaidInv.reduce((s, i) => s + ((Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0)), 0);

  // --- Metrics ---
  const totalTrips = trips.length;
  const completedTrips = trips.filter(t => t.status === 'completed').length;
  const onTimePct = totalTrips ? Math.round((completedTrips / totalTrips) * 100) : 100;
  const totalRevenue = trips.reduce((s, t) => s + (Number(t.revenue) || 0), 0);
  const avgTripValue = totalTrips ? totalRevenue / totalTrips : 0;
  const assignedVehicles = vehicles.filter(v => v.assigned_driver).length;
  const fleetUtil = totalVehicles ? Math.round((assignedVehicles / totalVehicles) * 100) : 0;

  // --- Revenue trend (last 7 days) ---
  const revData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const rev = trips.filter(tr => tr.trip_date === key).reduce((s, tr) => s + (Number(tr.revenue) || 0), 0);
    revData.push({ day: label, revenue: rev });
  }

  // --- Expense breakdown donut ---
  const expByCat = { Maintenance: 0, Fuel: 0, Trip: 0, Other: 0 };
  expenses.forEach((e) => {
    const amt = Number(e.amount) || 0;
    if (e.category === 'fuel') expByCat.Fuel += amt;
    else if (e.category === 'maintenance') expByCat.Maintenance += amt;
    else if (e.category === 'toll') expByCat.Trip += amt;
    else expByCat.Other += amt;
  });
  const donutData = [
    { name: 'Maintenance', value: Math.round(expByCat.Maintenance * 100) / 100, color: '#3b82f6' },
    { name: 'Fuel', value: Math.round(expByCat.Fuel * 100) / 100, color: '#f97316' },
    { name: 'Trip Costs', value: Math.round(expByCat.Trip * 100) / 100, color: '#ec4899' },
    { name: 'Other', value: Math.round(expByCat.Other * 100) / 100, color: '#6b7280' },
  ];
  const expTotal = donutData.reduce((s, d) => s + d.value, 0);

  // --- Lists ---
  const recentTrips = trips.slice(0, 5);
  const recentInvoices = invoices.slice(0, 5);
  const completedRecent = recentTrips.filter(tr => tr.status === 'completed').length;
  const paidRecent = recentInvoices.filter(i => i.status === 'paid').length;
  const tripPct = recentTrips.length ? (completedRecent / recentTrips.length) * 100 : 0;
  const invPct = recentInvoices.length ? (paidRecent / recentInvoices.length) * 100 : 0;

  // --- Alerts ---
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');
  const expiringDocs = documents.filter(d => d.status === 'expiring_soon' || d.status === 'expired');

  // Vehicle service-date alerts (next_service_date within 14 days or overdue)
  const serviceDueVehicles = vehicles.filter(v => {
    const days = daysUntil(v.next_service_date);
    return days !== null && days <= ALERT_DAYS;
  });

  // Driver document alerts (license_expiry / visa_expiry within 14 days or overdue)
  const driverDocAlerts = [];
  drivers.forEach(d => {
    const licDays = daysUntil(d.license_expiry);
    if (licDays !== null && licDays <= ALERT_DAYS) driverDocAlerts.push({ name: d.name, type: 'License', days: licDays });
    const visaDays = daysUntil(d.visa_expiry);
    if (visaDays !== null && visaDays <= ALERT_DAYS) driverDocAlerts.push({ name: d.name, type: 'Visa', days: visaDays });
  });

  const tripStatusColor = (s) => s === 'completed' ? '#10b981' : s === 'in_transit' ? '#3b82f6' : s === 'cancelled' ? '#ef4444' : '#f59e0b';
  const invStatusColor = (s) => s === 'paid' ? '#10b981' : s === 'sent' ? '#3b82f6' : s === 'overdue' ? '#ef4444' : '#f59e0b';

  return (
    <>
    <PullToRefresh onRefresh={loadData}>
    <div className="space-y-6">
      {/* Hero greeting card */}
      <HeroGreetingCard activeTrips={activeTrips} totalRevenue={totalRevenue} pendingInvoices={pendingInvoices} />

      {/* Stat cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
        initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <StatCard icon={Car} grad={['#10b981', '#34d399']} glow="rgba(16,185,129,0.3)" label={t('active_trips')} value={activeTrips} subtitle={`/ ${trips.length}`} to="/trips" />
        <StatCard icon={FileText} grad={['#f97316', '#fb923c']} glow="rgba(249,115,22,0.3)" label={t('pending_invoices')} value={pendingInvoices} subtitle="tap to review" to="/admin/clients" />
        <StatCard icon={Heart} grad={['#ec4899', '#f472b6']} glow="rgba(236,72,153,0.3)" label={t('fleet_health')} value={`${healthPct}%`} subtitle={`${activeVehicles}/${totalVehicles}`} to="/admin/vehicles" />
        <StatCard icon={Users} grad={['#8b5cf6', '#a78bfa']} glow="rgba(139,92,246,0.3)" label={t('pending_customers')} value={pendingCustCount} subtitle={`${formatCurrency(dueAmount)} due - tap to view`} to="/admin/clients" />
      </motion.div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        {/* Revenue trend */}
        <div className="rounded-3xl p-5 sm:p-6" style={CARD}>
          <h2 className="text-base font-semibold text-white mb-5">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(59,130,246,0.18)" />
                  <stop offset="100%" stopColor="rgba(59,130,246,0)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#6b7280' }} formatter={(v) => [formatCurrency(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="url(#revLine)" strokeWidth={3} fill="url(#revFill)"
                dot={{ r: 4, fill: '#fff', stroke: '#3b82f6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expense breakdown donut */}
        <div className="rounded-3xl p-5 sm:p-6" style={CARD}>
          <h2 className="text-base font-semibold text-white mb-5">Expense Breakdown</h2>
          <div className="flex items-center gap-4 h-full">
            <div className="relative" style={{ width: 150, height: 150, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} stroke="none">
                    {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[11px] uppercase tracking-wider text-[#6b7280]">TOTAL</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(expTotal)}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {donutData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[#a0a5b8] truncate">{d.name}</p>
                    <p className="text-[13px] text-white font-semibold">{formatCurrency(d.value)}</p>
                  </div>
                  <span className="text-xs text-[#6b7280]">{expTotal ? Math.round((d.value / expTotal) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <MetricCard icon={CheckCircle} grad={['#10b981', '#34d399']} glow="rgba(16,185,129,0.3)" value={`${onTimePct}%`} label="ON-TIME DELIVERY" subtitle="All trips on schedule" />
        <MetricCard icon={TrendingUp} grad={['#3b82f6', '#60a5fa']} glow="rgba(59,130,246,0.3)" value={formatCurrency(avgTripValue)} label="AVG. TRIP VALUE" subtitle="Per trip average" />
        <MetricCard icon={Truck} grad={['#f97316', '#fb923c']} glow="rgba(249,115,22,0.3)" value={`${fleetUtil}%`} label="FLEET UTILIZATION" subtitle="Vehicle usage rate" />
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Trips */}
        <div className="rounded-3xl p-5 sm:p-6" style={CARD}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">Recent Trips</h2>
            <Link to="/trips" className="inline-flex items-center gap-1 text-[13px] text-[#3b82f6] font-medium hover:text-[#60a5fa]">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-[#10b981] font-semibold whitespace-nowrap">{completedRecent}/{recentTrips.length} completed</span>
            <div className="flex-1 h-1.5 rounded-full bg-[#1e2130] overflow-hidden" style={{ boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3)' }}>
              <div className="h-full rounded-full" style={{ width: `${tripPct}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', boxShadow: '0 0 8px rgba(16,185,129,0.3)' }} />
            </div>
          </div>
          {recentTrips.length === 0 ? (
            <p className="text-sm text-[#6b7280] py-8 text-center">No trips yet</p>
          ) : recentTrips.map((tr) => (
            <ListRow
              key={tr.id} to="/trips" icon={Truck} grad={['#10b981', '#34d399']} glow="rgba(16,185,129,0.25)"
              title={`Trip ${tr.trip_number || '—'} · ${tr.from_location || ''} → ${tr.to_location || ''}`}
              subtitle={`${tr.driver_name || '—'} · ${(tr.status || '').replace(/_/g, ' ')}`}
              statusText={(tr.status || '').replace(/_/g, ' ')} statusColor={tripStatusColor(tr.status)}
            />
          ))}
        </div>

        {/* Recent Invoices */}
        <div className="rounded-3xl p-5 sm:p-6" style={CARD}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">Recent Invoices</h2>
            <Link to="/admin/clients" className="inline-flex items-center gap-1 text-[13px] text-[#3b82f6] font-medium hover:text-[#60a5fa]">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-[#3b82f6] font-semibold whitespace-nowrap">{paidRecent}/{recentInvoices.length} paid</span>
            <div className="flex-1 h-1.5 rounded-full bg-[#1e2130] overflow-hidden" style={{ boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.3)' }}>
              <div className="h-full rounded-full" style={{ width: `${invPct}%`, background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', boxShadow: '0 0 8px rgba(59,130,246,0.3)' }} />
            </div>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-[#6b7280] py-8 text-center">No invoices yet</p>
          ) : recentInvoices.map((inv) => (
            <ListRow
              key={inv.id} to="/admin/clients" icon={FileText} grad={['#3b82f6', '#60a5fa']} glow="rgba(59,130,246,0.25)"
              title={`Invoice ${inv.invoice_number || '—'} · ${inv.client_name || '—'}`}
              subtitle={`${(inv.status || '').replace(/_/g, ' ')} · ${formatCurrency(inv.total_amount)}`}
              statusText={(inv.status || '').replace(/_/g, ' ')} statusColor={invStatusColor(inv.status)}
            />
          ))}
        </div>
      </div>

      {/* Alerts */}
      {(overdueInvoices.length > 0 || maintenanceVehicles.length > 0 || expiringDocs.length > 0 || serviceDueVehicles.length > 0 || driverDocAlerts.length > 0) && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {t('actionable_alerts')}
          </h2>
          <div className="space-y-2">
            {overdueInvoices.length > 0 && (
              <Link to="/admin/clients" className="flex items-center justify-between p-3 rounded-xl bg-red-500/[0.06] border border-red-500/10 hover:bg-red-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3">
                  <FileWarning className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-foreground">{overdueInvoices.length} {t('overdue_invoices')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            )}
            {maintenanceVehicles.length > 0 && (
              <Link to="/admin/vehicles" className="flex items-center justify-between p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10 hover:bg-amber-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-foreground">{maintenanceVehicles.length} {t('maintenance_due')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            )}
            {expiringDocs.length > 0 && (
              <Link to="/admin/documents" className="flex items-center justify-between p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10 hover:bg-amber-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3">
                  <FileWarning className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-foreground">{expiringDocs.length} {t('expiring_docs')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            )}
            {serviceDueVehicles.length > 0 && (
              <Link to="/admin/vehicles" className="flex items-center justify-between p-3 rounded-xl bg-orange-500/[0.06] border border-orange-500/10 hover:bg-orange-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3">
                  <Wrench className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-foreground">{serviceDueVehicles.length} vehicle{serviceDueVehicles.length !== 1 ? 's' : ''} due for service</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            )}
            {driverDocAlerts.length > 0 && (
              <Link to="/admin/drivers" className="flex items-center justify-between p-3 rounded-xl bg-red-500/[0.06] border border-red-500/10 hover:bg-red-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3">
                  <FileWarning className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-foreground">{driverDocAlerts.length} driver document{driverDocAlerts.length !== 1 ? 's' : ''} expiring</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
    </PullToRefresh>
    </>
  );
}