import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { safeListAll } from '@/lib/safeRequest';
import { formatCurrency } from '@/lib/formatters';
import CommandTopBar from '@/components/command-center/CommandTopBar';
import CommandHero from '@/components/command-center/CommandHero';
import CommandAlertBanner from '@/components/command-center/CommandAlertBanner';
import CommandMetrics from '@/components/command-center/CommandMetrics';
import CommandAlertsPanel from '@/components/command-center/CommandAlertsPanel';
import CommandOverview from '@/components/command-center/CommandOverview';
import CommandAnalytics from '@/components/command-center/CommandAnalytics';
import CommandIntelligence from '@/components/command-center/CommandIntelligence';
import CommandActivity from '@/components/command-center/CommandActivity';
import { Truck, FileText, Gauge, TrendingUp, Wrench, FileWarning, DollarSign } from 'lucide-react';

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}
const ALERT_DAYS = 14;

export default function CommandCenter() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [clients, setClients] = useState([]);
  const [user, setUser] = useState(null);
  const [range, setRange] = useState('30D');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const loadData = useCallback(async () => {
    const [tr, inv, v, d, e, dr, cl] = await safeListAll([
      () => base44.entities.Trip.list('-created_date', 50).catch(() => []),
      () => base44.entities.Invoice.list('-created_date', 50).catch(() => []),
      () => base44.entities.Vehicle.list().catch(() => []),
      () => base44.entities.Document.list().catch(() => []),
      () => base44.entities.Expense.list('-created_date', 50).catch(() => []),
      () => base44.entities.Driver.list().catch(() => []),
      () => base44.entities.Client.list().catch(() => [])
    ]);
    setTrips(tr); setInvoices(inv); setVehicles(v); setDocuments(d); setExpenses(e); setDrivers(dr); setClients(cl);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([
          loadData(),
          base44.auth.me().then(u => { if (!cancelled) setUser(u); }).catch(() => {})
        ]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadData]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-[3px] border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );

  // Date filtering
  const inRange = (d) => !d || (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  const fTrips = trips.filter(t => inRange(t.trip_date));
  const fExpenses = expenses.filter(e => inRange(e.date));
  const fInvoices = invoices.filter(i => inRange(i.issue_date));

  // KPIs
  const totalRevenue = fTrips.reduce((s, t) => s + (Number(t.revenue) || 0), 0);
  const activeTrips = fTrips.filter(t => t.status === 'in_transit' || t.status === 'scheduled').length;
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const fleetHealth = totalVehicles > 0 ? Math.round(activeVehicles / totalVehicles * 100) : 100;
  const avgTripValue = fTrips.length ? totalRevenue / fTrips.length : 0;
  const pendingInvoices = fInvoices.filter(i => i.status === 'draft' || i.status === 'sent').length;

  // Sparkline data (last 7 days)
  const revSpark = [], tripsSpark = [], avgSpark = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dayTrips = fTrips.filter(t => t.trip_date === key);
    const dayRev = dayTrips.reduce((s, t) => s + (Number(t.revenue) || 0), 0);
    revSpark.push(dayRev);
    tripsSpark.push(dayTrips.length);
    avgSpark.push(dayTrips.length ? dayRev / dayTrips.length : 0);
  }
  const healthSpark = [88, 90, 87, 92, 94, 91, fleetHealth];

  // Trend deltas
  const computeDelta = (arr) => {
    const first = arr.slice(0, 3).reduce((a, b) => a + b, 0);
    const second = arr.slice(4).reduce((a, b) => a + b, 0);
    return first ? ((second - first) / first * 100) : (second ? 100 : 0);
  };

  const metrics = [
    { icon: DollarSign, label: 'Total Revenue', value: formatCurrency(totalRevenue), delta: computeDelta(revSpark), spark: revSpark, isHero: true, chip: 'chip-revenue', sparkVariant: 'brand' },
    { icon: Truck, label: 'Active Trips', value: activeTrips, delta: computeDelta(tripsSpark), spark: tripsSpark, chip: 'chip-blue', sparkVariant: 'blue' },
    { icon: Gauge, label: 'Fleet Health', value: `${fleetHealth}%`, delta: computeDelta(healthSpark), spark: healthSpark, chip: 'chip-green', sparkVariant: 'green' },
    { icon: TrendingUp, label: 'Avg Trip Value', value: formatCurrency(avgTripValue), delta: computeDelta(avgSpark), spark: avgSpark, chip: 'chip-violet', sparkVariant: 'violet' },
  ];

  const overviewStats = [
    { icon: Truck, label: 'Active Trips', value: activeTrips, chip: 'chip-blue' },
    { icon: FileText, label: 'Pending Invoices', value: pendingInvoices, chip: 'chip-amber' },
    { icon: Gauge, label: 'Fleet Health', value: `${fleetHealth}%`, chip: 'chip-green' },
    { icon: TrendingUp, label: 'Avg Trip Value', value: formatCurrency(avgTripValue), chip: 'chip-violet' },
  ];

  // Analytics chart data — revenue, expenses, profit per day/week
  const rangeDays = range === '7D' ? 7 : range === '30D' ? 30 : 90;
  const perfData = [];
  if (range === '90D') {
    for (let w = 12; w >= 0; w--) {
      let rev = 0, exp = 0;
      for (let i = w * 7 + 6; i >= w * 7; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        rev += fTrips.filter(t => t.trip_date === key).reduce((s, t) => s + (Number(t.revenue) || 0), 0);
        exp += fExpenses.filter(e => e.date === key).reduce((s, e) => s + (Number(e.amount) || 0), 0);
      }
      perfData.push({ label: `W${13 - w}`, revenue: rev, expenses: exp, profit: rev - exp });
    }
  } else {
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = rangeDays <= 7 ? d.toLocaleDateString('en', { weekday: 'short' }) : d.toLocaleDateString('en', { month: 'numeric', day: 'numeric' });
      const rev = fTrips.filter(t => t.trip_date === key).reduce((s, t) => s + (Number(t.revenue) || 0), 0);
      const exp = fExpenses.filter(e => e.date === key).reduce((s, e) => s + (Number(e.amount) || 0), 0);
      perfData.push({ label, revenue: rev, expenses: exp, profit: rev - exp });
    }
  }

  // Fleet utilization
  const assignedVehicles = vehicles.filter(v => v.assigned_driver).length;
  const fleetUtil = totalVehicles ? Math.round(assignedVehicles / totalVehicles * 100) : 0;

  // Cash flow data (last 7 days)
  const cashFlowData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const inflow = fInvoices.filter(inv => inv.issue_date === key).reduce((s, inv) => s + (Number(inv.paid_amount) || 0), 0);
    const outflow = fExpenses.filter(e => e.date === key).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    cashFlowData.push({ label: d.toLocaleDateString('en', { weekday: 'short' }), inflow, outflow });
  }

  // Top performers (vehicles by revenue)
  const vehicleRevenue = {};
  fTrips.forEach(t => {
    if (t.vehicle_plate) vehicleRevenue[t.vehicle_plate] = (vehicleRevenue[t.vehicle_plate] || 0) + (Number(t.revenue) || 0);
  });
  const topPerformers = Object.entries(vehicleRevenue).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));
  const maxPerformer = topPerformers[0]?.value || 1;

  // Alerts
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');
  const expiringDocs = documents.filter(d => d.status === 'expiring_soon' || d.status === 'expired');
  const serviceDueVehicles = vehicles.filter(v => { const days = daysUntil(v.next_service_date); return days !== null && days <= ALERT_DAYS; });
  const driverDocAlerts = [];
  drivers.forEach(d => {
    const licDays = daysUntil(d.license_expiry);
    if (licDays !== null && licDays <= ALERT_DAYS) driverDocAlerts.push({ name: d.name, type: 'License' });
    const visaDays = daysUntil(d.visa_expiry);
    if (visaDays !== null && visaDays <= ALERT_DAYS) driverDocAlerts.push({ name: d.name, type: 'Visa' });
  });

  const criticalAlerts = [];
  if (overdueInvoices.length > 0) criticalAlerts.push({ severity: 'urgent', icon: FileWarning, message: `${overdueInvoices.length} overdue invoice${overdueInvoices.length !== 1 ? 's' : ''} need attention`, link: '/accounts/invoices' });
  else if (expiringDocs.length > 0) criticalAlerts.push({ severity: 'urgent', icon: FileWarning, message: `${expiringDocs.length} expired/expiring document${expiringDocs.length !== 1 ? 's' : ''}`, link: '/admin/documents' });

  const allAlerts = [
    ...overdueInvoices.length > 0 ? [{ severity: 'urgent', icon: FileWarning, message: `${overdueInvoices.length} overdue invoice${overdueInvoices.length !== 1 ? 's' : ''}`, link: '/accounts/invoices' }] : [],
    ...maintenanceVehicles.length > 0 ? [{ severity: 'warning', icon: Wrench, message: `${maintenanceVehicles.length} vehicle${maintenanceVehicles.length !== 1 ? 's' : ''} in maintenance`, link: '/admin/vehicles' }] : [],
    ...expiringDocs.length > 0 ? [{ severity: 'warning', icon: FileWarning, message: `${expiringDocs.length} expiring document${expiringDocs.length !== 1 ? 's' : ''}`, link: '/admin/documents' }] : [],
    ...serviceDueVehicles.length > 0 ? [{ severity: 'warning', icon: Wrench, message: `${serviceDueVehicles.length} vehicle${serviceDueVehicles.length !== 1 ? 's' : ''} due for service`, link: '/admin/vehicles' }] : [],
    ...driverDocAlerts.length > 0 ? [{ severity: 'urgent', icon: FileWarning, message: `${driverDocAlerts.length} driver document${driverDocAlerts.length !== 1 ? 's' : ''} expiring`, link: '/admin/drivers' }] : [],
  ];

  const userName = user?.full_name || user?.email?.split('@')[0] || 'Commander';

  return (
    <div className="min-h-screen bg-background professional-page-bg">
      <CommandTopBar
        dateFrom={dateFrom}
        dateTo={dateTo}
        setDateFrom={setDateFrom}
        setDateTo={setDateTo}
        alertCount={allAlerts.length}
        alerts={allAlerts}
        searchData={{ trips, invoices, drivers, clients }}
        user={user}
      />
      <main className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {criticalAlerts.length > 0 && !bannerDismissed && (
          <CommandAlertBanner alerts={criticalAlerts} onDismiss={() => setBannerDismissed(true)} />
        )}
        <CommandHero userName={userName} />
        <CommandMetrics metrics={metrics} />
        {allAlerts.length > 0 && <CommandAlertsPanel alerts={allAlerts} />}
        <div className="grid grid-cols-1 lg:grid-cols-[35fr_65fr] gap-6">
          <CommandOverview stats={overviewStats} />
          <CommandAnalytics data={perfData} range={range} setRange={setRange} />
        </div>
        <CommandIntelligence fleetUtil={fleetUtil} cashFlowData={cashFlowData} topPerformers={topPerformers} maxPerformer={maxPerformer} />
        <CommandActivity recentTrips={fTrips.slice(0, 6)} recentInvoices={fInvoices.slice(0, 6)} />
      </main>
    </div>
  );
}