import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Truck, FileText, AlertTriangle, Wrench, FileWarning, ChevronRight, Gauge, TrendingUp
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatCurrency } from '@/lib/formatters';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import PullToRefresh from '@/components/common/PullToRefresh';
import QuickActions from '@/components/dashboard/QuickActions';
import GoalsList from '@/components/dashboard/GoalsList';
import SalarySummaryCard from '@/components/dashboard/SalarySummaryCard';
import { safeListAll } from '@/lib/safeRequest';
import { useGlobalDate } from '@/lib/GlobalDateContext';
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Cell, Tooltip } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileBankingDashboard from '@/components/dashboard/MobileBankingDashboard';
import '@/lib/mobileNeumorphic.css';
import PremiumCard from '@/components/dashboard/premium/PremiumCard';
import HeroMetricCard from '@/components/dashboard/premium/HeroMetricCard';
import StatTilesCard from '@/components/dashboard/premium/StatTilesCard';
import PerformanceChart from '@/components/dashboard/premium/PerformanceChart';
import TripsTableCard from '@/components/dashboard/premium/TripsTableCard';
import InvoicesListCard from '@/components/dashboard/premium/InvoicesListCard';
import TripsStatusCard from '@/components/dashboard/TripsStatusCard';
import FleetUtilizationGauge from '@/components/dashboard/FleetUtilizationGauge';
import FleetStatusBreakdown from '@/components/dashboard/FleetStatusBreakdown';

const donutTooltip = {
  background: 'rgba(var(--surf-2-rgb),0.95)',
  border: '1px solid rgba(var(--panel-accent-rgb),0.2)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

const ALERT_DAYS = 14;

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
  const isMobile = useIsMobile();
  const [range, setRange] = useState('7D');

  const loadData = useCallback(async () => {
    const [tr, inv, v, d, e, dr] = await safeListAll([
      () => base44.entities.Trip.list('-created_date', 50).catch(() => []),
      () => base44.entities.Invoice.list('-created_date', 50).catch(() => []),
      () => base44.entities.Vehicle.list().catch(() => []),
      () => base44.entities.Document.list().catch(() => []),
      () => base44.entities.Expense.list('-created_date', 50).catch(() => []),
      () => base44.entities.Driver.list().catch(() => [])
    ]);
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
  const activeTripsTransit = fTrips.filter((t) => t.status === 'in_transit').length;
  const pendingTripsScheduled = fTrips.filter((t) => t.status === 'scheduled').length;

  const goals = [
    { label: 'On-Time Delivery', pct: onTimePct, color: '#34d399' },
    { label: 'Fleet Utilization', pct: fleetUtil, color: '#4ADE80' },
    { label: 'Completed Trips', pct: completedPct, color: '#a855f7' },
    { label: 'Invoice Collection', pct: invCollectionPct, color: '#fbbf24' }
  ];

  // --- Revenue trend by selected range ---
  const rangeDays = range === '7D' ? 7 : range === '30D' ? 30 : 90;
  const sumForDay = (key) => fTrips.filter((tr) => tr.trip_date === key).reduce((s, tr) => s + (Number(tr.revenue) || 0), 0);
  const revData = (() => {
    const arr = [];
    if (range === '90D') {
      for (let w = 12; w >= 0; w--) {
        let rev = 0;
        for (let i = w * 7 + 6; i >= w * 7; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          rev += sumForDay(d.toISOString().split('T')[0]);
        }
        arr.push({ label: `W${13 - w}`, revenue: rev });
      }
    } else {
      for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = rangeDays <= 7
          ? d.toLocaleDateString('en', { weekday: 'short' })
          : d.toLocaleDateString('en', { month: 'numeric', day: 'numeric' });
        arr.push({ label, revenue: sumForDay(key) });
      }
    }
    return arr;
  })();

  const curSum = revData.reduce((s, d) => s + d.revenue, 0);
  const prevSum = (() => {
    let s = 0;
    if (range === '90D') {
      for (let w = 12; w >= 0; w--) {
        for (let i = (w + 13) * 7 + 6; i >= (w + 13) * 7; i--) {
          const d = new Date(); d.setDate(d.getDate() - i);
          s += sumForDay(d.toISOString().split('T')[0]);
        }
      }
    } else {
      for (let i = rangeDays * 2 - 1; i >= rangeDays; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        s += sumForDay(d.toISOString().split('T')[0]);
      }
    }
    return s;
  })();
  const deltaPct = prevSum ? (curSum - prevSum) / prevSum * 100 : (curSum ? 100 : 0);

  // --- Stat tiles ---
  const tiles = [
    { icon: Truck, value: activeTrips, label: 'Active Trips', sub: `${completedTrips} completed` },
    { icon: FileText, value: pendingInvoices, label: 'Pending Invoices', sub: `${formatCurrency(dueAmount)} due` },
    { icon: Gauge, value: `${healthPct}%`, label: 'Fleet Health', sub: `${activeVehicles}/${totalVehicles} active` },
    { icon: TrendingUp, value: formatCurrency(avgTripValue), label: 'Avg Trip Value', sub: `${totalTrips} trips` }
  ];

  // --- Per-trip sparkline (cost build-up → revenue) ---
  const sparkData = {};
  fTrips.forEach((tr) => {
    sparkData[tr.id] = [Number(tr.fuel_cost) || 0, Number(tr.toll_cost) || 0, Number(tr.other_cost) || 0, Number(tr.revenue) || 0];
  });

  // --- Expense breakdown donut ---
  const expByCat = { Maintenance: 0, Fuel: 0, Trip: 0, Other: 0 };
  fExpenses.forEach((e) => {
    const amt = Number(e.amount) || 0;
    if (e.category === 'fuel') expByCat.Fuel += amt;
    else if (e.category === 'maintenance') expByCat.Maintenance += amt;
    else if (e.category === 'toll') expByCat.Trip += amt;
    else expByCat.Other += amt;
  });
  const donutData = [
    { name: 'Maintenance', value: Math.round(expByCat.Maintenance * 100) / 100, color: '#1ED760' },
    { name: 'Fuel', value: Math.round(expByCat.Fuel * 100) / 100, color: '#f97316' },
    { name: 'Trip Costs', value: Math.round(expByCat.Trip * 100) / 100, color: '#ec4899' },
    { name: 'Other', value: Math.round(expByCat.Other * 100) / 100, color: '#6b7280' }
  ];
  const expTotal = donutData.reduce((s, d) => s + d.value, 0);

  // --- Lists ---
  const recentTrips = fTrips.slice(0, 6);
  const recentInvoices = fInvoices.slice(0, 6);

  // --- Alerts ---
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const maintenanceVehicles = vehicles.filter((v) => v.status === 'maintenance');
  const expiringDocs = documents.filter((d) => d.status === 'expiring_soon' || d.status === 'expired');
  const serviceDueVehicles = vehicles.filter((v) => { const days = daysUntil(v.next_service_date); return days !== null && days <= ALERT_DAYS; });
  const driverDocAlerts = [];
  drivers.forEach((d) => {
    const licDays = daysUntil(d.license_expiry);
    if (licDays !== null && licDays <= ALERT_DAYS) driverDocAlerts.push({ name: d.name, type: 'License', days: licDays });
    const visaDays = daysUntil(d.visa_expiry);
    if (visaDays !== null && visaDays <= ALERT_DAYS) driverDocAlerts.push({ name: d.name, type: 'Visa', days: visaDays });
  });
  const hasAlerts = overdueInvoices.length > 0 || maintenanceVehicles.length > 0 || expiringDocs.length > 0 || serviceDueVehicles.length > 0 || driverDocAlerts.length > 0;

  return (
    <PullToRefresh onRefresh={loadData}>
      {isMobile ? (
        <MobileBankingDashboard
          totalRevenue={totalRevenue}
          totalTrips={totalTrips}
          activeTrips={activeTrips}
          completedTrips={completedTrips}
          pendingInvoices={pendingInvoices}
          dueAmount={dueAmount}
          invoices={fInvoices}
          expenses={fExpenses}
          trips={fTrips}
          overdueCount={overdueInvoices.length}
          maintenanceCount={maintenanceVehicles.length}
          expiringDocCount={expiringDocs.length}
          hasAlerts={hasAlerts}
          onNewTrip={() => window.location.assign('/trips?new=1')}
        />
      ) : (
      <div className="space-y-6">
        <QuickActions />

        {/* Hero row — 55/45 */}
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-5">
          <HeroMetricCard revenue={curSum} deltaPct={deltaPct} range={range} setRange={setRange} />
          <StatTilesCard tiles={tiles} />
        </div>

        {/* Alerts — surfaced high, directly beneath hero metrics */}
        {hasAlerts && (
          <PremiumCard padding="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg chip-red flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-sm font-semibold text-white">{t('actionable_alerts')}</h2>
              <span className="ml-auto text-xs text-muted-foreground">
                {overdueInvoices.length + maintenanceVehicles.length + expiringDocs.length + serviceDueVehicles.length + driverDocAlerts.length} active
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {overdueInvoices.length > 0 && (
                <Link to="/admin/clients" className="flex items-center gap-3 p-3 rounded-xl border-l-[4px] bg-gradient-to-r from-red-500/[0.12] to-rose-500/[0.06] border-red-500 hover:from-red-500/[0.18] hover:to-rose-500/[0.1] transition-all hover:-translate-y-0.5 group">
                  <div className="w-8 h-8 rounded-lg chip-red flex items-center justify-center flex-shrink-0">
                    <FileWarning className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white flex-1">{overdueInvoices.length} {t('overdue_invoices')}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors flex-shrink-0" />
                </Link>
              )}
              {maintenanceVehicles.length > 0 && (
                <Link to="/admin/vehicles" className="flex items-center gap-3 p-3 rounded-xl border-l-[4px] bg-gradient-to-r from-amber-500/[0.12] to-orange-500/[0.06] border-amber-500 hover:from-amber-500/[0.18] hover:to-orange-500/[0.1] transition-all hover:-translate-y-0.5 group">
                  <div className="w-8 h-8 rounded-lg chip-amber flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white flex-1">{maintenanceVehicles.length} {t('maintenance_due')}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors flex-shrink-0" />
                </Link>
              )}
              {expiringDocs.length > 0 && (
                <Link to="/admin/documents" className="flex items-center gap-3 p-3 rounded-xl border-l-[4px] bg-gradient-to-r from-amber-500/[0.12] to-orange-500/[0.06] border-amber-500 hover:from-amber-500/[0.18] hover:to-orange-500/[0.1] transition-all hover:-translate-y-0.5 group">
                  <div className="w-8 h-8 rounded-lg chip-amber flex items-center justify-center flex-shrink-0">
                    <FileWarning className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white flex-1">{expiringDocs.length} {t('expiring_docs')}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors flex-shrink-0" />
                </Link>
              )}
              {serviceDueVehicles.length > 0 && (
                <Link to="/admin/vehicles" className="flex items-center gap-3 p-3 rounded-xl border-l-[4px] bg-gradient-to-r from-amber-500/[0.12] to-orange-500/[0.06] border-amber-500 hover:from-amber-500/[0.18] hover:to-orange-500/[0.1] transition-all hover:-translate-y-0.5 group">
                  <div className="w-8 h-8 rounded-lg chip-amber flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white flex-1">{serviceDueVehicles.length} vehicle{serviceDueVehicles.length !== 1 ? 's' : ''} due for service</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors flex-shrink-0" />
                </Link>
              )}
              {driverDocAlerts.length > 0 && (
                <Link to="/admin/drivers" className="flex items-center gap-3 p-3 rounded-xl border-l-[4px] bg-gradient-to-r from-red-500/[0.12] to-rose-500/[0.06] border-red-500 hover:from-red-500/[0.18] hover:to-rose-500/[0.1] transition-all hover:-translate-y-0.5 group">
                  <div className="w-8 h-8 rounded-lg chip-red flex items-center justify-center flex-shrink-0">
                    <FileWarning className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white flex-1">{driverDocAlerts.length} driver document{driverDocAlerts.length !== 1 ? 's' : ''} expiring</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors flex-shrink-0" />
                </Link>
              )}
            </div>
          </PremiumCard>
        )}

        {/* Performance chart — full width */}
        <PerformanceChart data={revData} range={range} setRange={setRange} />

        {/* Fleet status breakdown — full width */}
        <FleetStatusBreakdown vehicles={vehicles} />

        {/* Fleet utilization gauge + Trips status — side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-[40fr_60fr] gap-5">
          <FleetUtilizationGauge assigned={assignedVehicles} total={totalVehicles} loading={loading} />
          <TripsStatusCard activeCount={activeTripsTransit} pendingCount={pendingTripsScheduled} completedCount={completedTrips} />
        </div>

        {/* Detail row — 65/35 */}
        <div className="grid grid-cols-1 lg:grid-cols-[65fr_35fr] gap-5">
          <TripsTableCard trips={recentTrips} sparkData={sparkData} />
          <InvoicesListCard invoices={recentInvoices} />
        </div>

        {/* Expense donut + Salary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PremiumCard>
            <h2 className="text-sm font-semibold text-white mb-5">Expense Breakdown</h2>
            <div className="flex items-center gap-5">
              <div className="relative" style={{ width: 160, height: 160, flexShrink: 0 }}>
                <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(var(--panel-accent-rgb),0.14) 0%, transparent 68%)', filter: 'blur(10px)' }} />
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart data={donutData} cx="50%" cy="50%" innerRadius="28%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={11}>
                    <PolarAngleAxis type="number" domain={[0, Math.max(expTotal, 1)]} tick={false} />
                    <RadialBar dataKey="value" background={{ fill: 'rgba(255,255,255,0.035)' }} cornerRadius={7} isAnimationActive>
                      {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </RadialBar>
                    <Tooltip contentStyle={donutTooltip} formatter={(v) => formatCurrency(v)} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">TOTAL</span>
                  <span className="text-xl font-bold text-white tabular-nums mt-0.5">{formatCurrency(expTotal)}</span>
                </div>
              </div>
              <div className="flex-1 space-y-3 min-w-0">
                {donutData.map((d) => {
                  const pct = expTotal ? Math.round(d.value / expTotal * 100) : 0;
                  return (
                    <div key={d.name} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                        <p className="text-[13px] text-white/60 truncate flex-1">{d.name}</p>
                        <p className="text-[13px] text-white font-semibold tabular-nums">{formatCurrency(d.value)}</p>
                        <span className="text-xs text-white/40 w-8 text-right tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden ml-4">
                        <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: d.color, boxShadow: `0 0 6px ${d.color}` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </PremiumCard>

          <SalarySummaryCard />
        </div>

        {/* Goals + Pending customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <GoalsList goals={goals} />
          <PremiumCard>
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
                <Link to="/admin/clients" className="inline-flex items-center gap-1 text-[13px] font-medium hover:opacity-80 mt-2" style={{ color: 'rgb(var(--panel-accent-rgb))' }}>
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </PremiumCard>
        </div>

      </div>
      )}
    </PullToRefresh>
  );
}