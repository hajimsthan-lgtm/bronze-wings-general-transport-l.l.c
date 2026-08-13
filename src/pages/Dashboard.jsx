import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Truck, FileText, AlertTriangle, Wrench, FileWarning, ChevronRight, ArrowRight } from
'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatCurrency, formatDate } from '@/lib/formatters';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PullToRefresh from '@/components/common/PullToRefresh';
import QuickActions from '@/components/dashboard/QuickActions';
import HeroGreetingCard from '@/components/dashboard/HeroGreetingCard';
import BalanceCard from '@/components/dashboard/BalanceCard';
import GoalsList from '@/components/dashboard/GoalsList';
import { motion } from 'framer-motion';
import { safeListAll } from '@/lib/safeRequest';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell } from
'recharts';

const CARD = {
  background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.72) 0%, rgba(var(--surf-2-rgb),0.86) 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.35)',
  backdropFilter: 'blur(20px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(20px) saturate(1.3)'
};

function ListRow({ to, icon: Icon, grad, glow, title, subtitle, statusText, statusColor }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3.5 rounded-2xl p-3.5 mb-2.5 transition-all duration-300 hover:translate-x-1"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: '3px solid transparent' }}>
      
      <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: `linear-gradient(135deg, ${grad[0]}, ${grad[1]})`, boxShadow: `0 4px 10px ${glow}` }}>
        <Icon className="w-5 h-5" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{title}</p>
        <p className="text-xs text-white/45 truncate">{subtitle}</p>
      </div>
      <span className="text-xs font-medium flex-shrink-0" style={{ color: statusColor }}>{statusText}</span>
      <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors flex-shrink-0" />
    </Link>);

}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date();today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

const ALERT_DAYS = 14;

const tooltipStyle = {
  background: 'rgba(var(--surf-2-rgb),0.95)',
  border: '1px solid rgba(var(--panel-accent-rgb),0.2)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
};

export default function Dashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const { dateFrom, dateTo } = useGlobalDate();
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const loadData = useCallback(async () => {
    const [tr, inv, v, d, e, dr] = await safeListAll([
    () => base44.entities.Trip.list('-created_date', 50).catch(() => []),
    () => base44.entities.Invoice.list('-created_date', 50).catch(() => []),
    () => base44.entities.Vehicle.list().catch(() => []),
    () => base44.entities.Document.list().catch(() => []),
    () => base44.entities.Expense.list('-created_date', 50).catch(() => []),
    () => base44.entities.Driver.list().catch(() => [])]
    );
    setTrips(tr);setInvoices(inv);setVehicles(v);setDocuments(d);setExpenses(e);setDrivers(dr);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {await loadData();} finally {if (!cancelled) setLoading(false);}
    })();
    return () => {cancelled = true;};
  }, [loadData]);

  if (loading) return <LoadingSpinner />;

  // --- Date-filtered data ---
  const inRange = (d) => !d || (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  const fTrips = trips.filter((t) => inRange(t.trip_date));
  const fExpenses = expenses.filter((e) => inRange(e.date));
  const fInvoices = invoices.filter((i) => inRange(i.issue_date));

  // --- KPIs ---
  const activeTrips = fTrips.filter((t) => t.status === 'in_transit' || t.status === 'scheduled').length;
  const pendingInvoices = fInvoices.filter((i) => i.status === 'draft' || i.status === 'sent').length;
  const activeVehicles = vehicles.filter((v) => v.status === 'active').length;
  const totalVehicles = vehicles.length;
  const healthPct = totalVehicles > 0 ? Math.round(activeVehicles / totalVehicles * 100) : 100;

  const unpaidInv = fInvoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');
  const pendingCustCount = new Set(unpaidInv.map((i) => i.client_name).filter(Boolean)).size;
  const dueAmount = unpaidInv.reduce((s, i) => s + ((Number(i.total_amount) || 0) - (Number(i.paid_amount) || 0)), 0);

  // --- Metrics ---
  const totalTrips = fTrips.length;
  const completedTrips = fTrips.filter((t) => t.status === 'completed').length;
  const onTimePct = totalTrips ? Math.round(completedTrips / totalTrips * 100) : 100;
  const totalRevenue = fTrips.reduce((s, t) => s + (Number(t.revenue) || 0), 0);
  const avgTripValue = totalTrips ? totalRevenue / totalTrips : 0;
  const assignedVehicles = vehicles.filter((v) => v.assigned_driver).length;
  const fleetUtil = totalVehicles ? Math.round(assignedVehicles / totalVehicles * 100) : 0;
  const paidInv = fInvoices.filter((i) => i.status === 'paid').length;
  const invCollectionPct = fInvoices.length ? Math.round(paidInv / fInvoices.length * 100) : 0;
  const completedPct = totalTrips ? Math.round(completedTrips / totalTrips * 100) : 0;

  const goals = [
  { label: 'On-Time Delivery', pct: onTimePct, color: '#34d399' },
  { label: 'Fleet Utilization', pct: fleetUtil, color: '#4ADE80' },
  { label: 'Completed Trips', pct: completedPct, color: '#a855f7' },
  { label: 'Invoice Collection', pct: invCollectionPct, color: '#fbbf24' }];


  // --- Revenue trend (last 7 days) ---
  const revData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const rev = fTrips.filter((tr) => tr.trip_date === key).reduce((s, tr) => s + (Number(tr.revenue) || 0), 0);
    revData.push({ day: label, revenue: rev });
  }

  // --- Expense breakdown donut ---
  const expByCat = { Maintenance: 0, Fuel: 0, Trip: 0, Other: 0 };
  fExpenses.forEach((e) => {
    const amt = Number(e.amount) || 0;
    if (e.category === 'fuel') expByCat.Fuel += amt;else
    if (e.category === 'maintenance') expByCat.Maintenance += amt;else
    if (e.category === 'toll') expByCat.Trip += amt;else
    expByCat.Other += amt;
  });
  const donutData = [
  { name: 'Maintenance', value: Math.round(expByCat.Maintenance * 100) / 100, color: '#1ED760' },
  { name: 'Fuel', value: Math.round(expByCat.Fuel * 100) / 100, color: '#f97316' },
  { name: 'Trip Costs', value: Math.round(expByCat.Trip * 100) / 100, color: '#ec4899' },
  { name: 'Other', value: Math.round(expByCat.Other * 100) / 100, color: '#6b7280' }];

  const expTotal = donutData.reduce((s, d) => s + d.value, 0);

  // --- Lists ---
  const recentTrips = fTrips.slice(0, 5);
  const recentInvoices = fInvoices.slice(0, 5);
  const completedRecent = recentTrips.filter((tr) => tr.status === 'completed').length;
  const paidRecent = recentInvoices.filter((i) => i.status === 'paid').length;
  const tripPct = recentTrips.length ? completedRecent / recentTrips.length * 100 : 0;
  const invPct = recentInvoices.length ? paidRecent / recentInvoices.length * 100 : 0;

  // --- Alerts ---
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance');
  const expiringDocs = documents.filter((d) => d.status === 'expiring_soon' || d.status === 'expired');
  const serviceDueVehicles = vehicles.filter((v) => {const days = daysUntil(v.next_service_date);return days !== null && days <= ALERT_DAYS;});
  const driverDocAlerts = [];
  drivers.forEach((d) => {
    const licDays = daysUntil(d.license_expiry);
    if (licDays !== null && licDays <= ALERT_DAYS) driverDocAlerts.push({ name: d.name, type: 'License', days: licDays });
    const visaDays = daysUntil(d.visa_expiry);
    if (visaDays !== null && visaDays <= ALERT_DAYS) driverDocAlerts.push({ name: d.name, type: 'Visa', days: visaDays });
  });

  const tripStatusColor = (s) => s === 'completed' ? '#10b981' : s === 'in_transit' ? '#1ED760' : s === 'cancelled' ? '#ef4444' : '#f59e0b';
  const invStatusColor = (s) => s === 'paid' ? '#10b981' : s === 'sent' ? '#1ED760' : s === 'overdue' ? '#ef4444' : '#f59e0b';

  return (
    <>
    <PullToRefresh onRefresh={loadData}>
    <div className="space-y-6">
      <QuickActions />

      <HeroGreetingCard activeTrips={activeTrips} totalRevenue={totalRevenue} pendingInvoices={pendingInvoices} dateFrom={dateFrom} dateTo={dateTo} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        

            
      </div>

      {/* Balance card — circular gauge + revenue + mini stats */}
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
        <BalanceCard healthPct={healthPct} totalRevenue={totalRevenue} activeTrips={activeTrips} pendingInvoices={pendingInvoices} avgTripValue={avgTripValue} revData={revData} />
      </motion.div>

      {/* Charts: revenue trend + expense donut */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5">
        <div className="rounded-3xl p-5 sm:p-6" style={CARD}>
          <h2 className="text-base font-semibold text-white mb-5">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="rgb(var(--panel-accent-rgb))" />
                  <stop offset="100%" stopColor="rgb(var(--panel-accent2-rgb))" />
                </linearGradient>
                <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(var(--panel-accent-rgb),0.22)" />
                  <stop offset="100%" stopColor="rgba(var(--panel-accent-rgb),0)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}K` : v} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} formatter={(v) => [formatCurrency(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="url(#revLine)" strokeWidth={3} fill="url(#revFill)"
                  dot={{ r: 4, fill: '#fff', stroke: 'rgb(var(--panel-accent-rgb))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

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
                <span className="text-[11px] uppercase tracking-wider text-white/40">TOTAL</span>
                <span className="text-2xl font-bold text-white">{formatCurrency(expTotal)}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              {donutData.map((d) =>
                  <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-white/60 truncate">{d.name}</p>
                    <p className="text-[13px] text-white font-semibold">{formatCurrency(d.value)}</p>
                  </div>
                  <span className="text-xs text-white/40">{expTotal ? Math.round(d.value / expTotal * 100) : 0}%</span>
                </div>
                  )}
            </div>
          </div>
        </div>
      </div>

      {/* Goals + pending customers */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5">
        <GoalsList goals={goals} />
        <div className="rounded-3xl p-5 sm:p-6" style={CARD}>
          <h2 className="text-sm font-semibold text-white mb-4">Pending Customers</h2>
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0" style={{ width: 110, height: 110 }}>
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#fbbf24" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 50} strokeDashoffset={2 * Math.PI * 50 * (1 - Math.min(1, pendingCustCount / 10))}
                    transform="rotate(-90 60 60)" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.5))', transition: 'stroke-dashoffset 1s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white tabular-nums leading-none">{pendingCustCount}</span>
                <span className="text-[9px] uppercase tracking-wider text-white/40 mt-0.5">customers</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Total Due</p>
              <p className="text-2xl font-bold text-white tabular-nums mt-1">{formatCurrency(dueAmount)}</p>
              <Link to="/admin/clients" className="inline-flex items-center gap-1 text-[13px] text-[var(--primary)] font-medium hover:opacity-80 mt-2" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-3xl p-5 sm:p-6" style={CARD}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">Recent Trips</h2>
            <Link to="/trips" className="inline-flex items-center gap-1 text-[13px] font-medium hover:opacity-80" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-[#10b981] font-semibold whitespace-nowrap">{completedRecent}/{recentTrips.length} completed</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${tripPct}%`, background: 'linear-gradient(90deg,#10b981,#34d399)', boxShadow: '0 0 8px rgba(16,185,129,0.3)' }} />
            </div>
          </div>
          {recentTrips.length === 0 ?
              <p className="text-sm text-white/40 py-8 text-center">No trips yet</p> :
              recentTrips.map((tr) =>
              <ListRow key={tr.id} to="/trips" icon={Truck} grad={['#10b981', '#34d399']} glow="rgba(16,185,129,0.25)"
              title={`Trip ${tr.trip_number || '—'} · ${tr.from_location || ''} → ${tr.to_location || ''}`}
              subtitle={`${tr.driver_name || '—'} · ${(tr.status || '').replace(/_/g, ' ')}`}
              statusText={(tr.status || '').replace(/_/g, ' ')} statusColor={tripStatusColor(tr.status)} />
              )}
        </div>

        <div className="rounded-3xl p-5 sm:p-6" style={CARD}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white">Recent Invoices</h2>
            <Link to="/admin/clients" className="inline-flex items-center gap-1 text-[13px] font-medium hover:opacity-80" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-[#1ED760] font-semibold whitespace-nowrap">{paidRecent}/{recentInvoices.length} paid</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${invPct}%`, background: 'linear-gradient(90deg,#1ED760,#4ADE80)', boxShadow: '0 0 8px rgba(30,215,96,0.3)' }} />
            </div>
          </div>
          {recentInvoices.length === 0 ?
              <p className="text-sm text-white/40 py-8 text-center">No invoices yet</p> :
              recentInvoices.map((inv) =>
              <ListRow key={inv.id} to="/admin/clients" icon={FileText} grad={['#1ED760', '#4ADE80']} glow="rgba(30,215,96,0.25)"
              title={`Invoice ${inv.invoice_number || '—'} · ${inv.client_name || '—'}`}
              subtitle={`${(inv.status || '').replace(/_/g, ' ')} · ${formatCurrency(inv.total_amount)}`}
              statusText={(inv.status || '').replace(/_/g, ' ')} statusColor={invStatusColor(inv.status)} />
              )}
        </div>
      </div>

      {/* Alerts */}
      {(overdueInvoices.length > 0 || maintenanceVehicles.length > 0 || expiringDocs.length > 0 || serviceDueVehicles.length > 0 || driverDocAlerts.length > 0) &&
          <div className="rounded-3xl p-5" style={CARD}>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {t('actionable_alerts')}
          </h2>
          <div className="space-y-2">
            {overdueInvoices.length > 0 &&
              <Link to="/admin/clients" className="flex items-center justify-between p-3 rounded-xl bg-red-500/[0.06] border border-red-500/10 hover:bg-red-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3"><FileWarning className="w-4 h-4 text-red-400" /><span className="text-sm text-white">{overdueInvoices.length} {t('overdue_invoices')}</span></div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
              </Link>
              }
            {maintenanceVehicles.length > 0 &&
              <Link to="/admin/vehicles" className="flex items-center justify-between p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10 hover:bg-amber-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3"><Wrench className="w-4 h-4 text-amber-400" /><span className="text-sm text-white">{maintenanceVehicles.length} {t('maintenance_due')}</span></div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
              </Link>
              }
            {expiringDocs.length > 0 &&
              <Link to="/admin/documents" className="flex items-center justify-between p-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/10 hover:bg-amber-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3"><FileWarning className="w-4 h-4 text-amber-400" /><span className="text-sm text-white">{expiringDocs.length} {t('expiring_docs')}</span></div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
              </Link>
              }
            {serviceDueVehicles.length > 0 &&
              <Link to="/admin/vehicles" className="flex items-center justify-between p-3 rounded-xl bg-orange-500/[0.06] border border-orange-500/10 hover:bg-orange-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3"><Wrench className="w-4 h-4 text-orange-400" /><span className="text-sm text-white">{serviceDueVehicles.length} vehicle{serviceDueVehicles.length !== 1 ? 's' : ''} due for service</span></div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
              </Link>
              }
            {driverDocAlerts.length > 0 &&
              <Link to="/admin/drivers" className="flex items-center justify-between p-3 rounded-xl bg-red-500/[0.06] border border-red-500/10 hover:bg-red-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3"><FileWarning className="w-4 h-4 text-red-400" /><span className="text-sm text-white">{driverDocAlerts.length} driver document{driverDocAlerts.length !== 1 ? 's' : ''} expiring</span></div>
                <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
              </Link>
              }
          </div>
        </div>
          }
    </div>
    </PullToRefresh>
    </>);

}