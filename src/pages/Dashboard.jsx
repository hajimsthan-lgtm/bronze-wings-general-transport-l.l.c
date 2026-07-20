import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useI18n } from '@/lib/i18n';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/formatters';
import KpiCard from '@/components/common/KpiCard';
import StatusBadge from '@/components/common/StatusBadge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Truck, FileText, DollarSign, Activity, AlertTriangle, Wrench, FileWarning, ArrowRight, ChevronRight, Plus } from 'lucide-react';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

export default function Dashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Trip.list('-created_date', 50),
      base44.entities.Invoice.list('-created_date', 50),
      base44.entities.Vehicle.list(),
      base44.entities.Document.list(),
    ]).then(([t, i, v, d]) => {
      setTrips(t);
      setInvoices(i);
      setVehicles(v);
      setDocuments(d);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
  const activeTrips = trips.filter(t => t.status === 'in_transit' || t.status === 'scheduled').length;
  const pendingInvoices = invoices.filter(i => i.status === 'draft' || i.status === 'sent').length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalVehicles = vehicles.length;
  const healthPct = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 100;

  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');
  const expiringDocs = documents.filter(d => d.status === 'expiring_soon' || d.status === 'expired');

  const recentTrips = trips.slice(0, 5);
  const outstandingAmount = invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + (i.total_amount || 0), 0);
  const now = new Date();
  const paidThisMonth = invoices.filter(i => i.status === 'paid' && i.issue_date && i.issue_date.substring(0, 7) === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`).reduce((s, i) => s + (i.total_amount || 0), 0);
  const overdueCount = invoices.filter(i => i.status === 'overdue').length;
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-6 pt-5">
      {/* KPI Cards */}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          title={t('total_revenue')}
          value={formatCurrency(totalRevenue)}
          icon={DollarSign}
          subtitle="this month"
        />
        <KpiCard
          title={t('active_trips')}
          value={activeTrips}
          icon={Truck}
          subtitle={`of ${trips.length} total`}
        />
        <KpiCard
          title={t('pending_invoices')}
          value={pendingInvoices}
          icon={FileText}
          subtitle={`${formatCurrency(invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total_amount || 0), 0))} outstanding`}
        />
        <KpiCard
          title={t('fleet_health')}
          value={`${healthPct}%`}
          icon={Activity}
          subtitle={`${activeVehicles}/${totalVehicles} active`}
        />
      </div>

      {/* Alerts */}
      {(overdueInvoices.length > 0 || maintenanceVehicles.length > 0 || expiringDocs.length > 0) && (
        <div className="glass-card p-4 md:p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {t('actionable_alerts')}
          </h2>
          <div className="space-y-2">
            {overdueInvoices.length > 0 && (
              <Link to="/invoices" className="flex items-center justify-between p-3 rounded-lg bg-red-500/[0.06] border border-red-500/10 hover:bg-red-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3">
                  <FileWarning className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-foreground">{overdueInvoices.length} {t('overdue_invoices')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            )}
            {maintenanceVehicles.length > 0 && (
              <Link to="/admin/vehicles" className="flex items-center justify-between p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/10 hover:bg-amber-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-foreground">{maintenanceVehicles.length} {t('maintenance_due')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            )}
            {expiringDocs.length > 0 && (
              <Link to="/admin/documents" className="flex items-center justify-between p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/10 hover:bg-amber-500/[0.1] transition-colors group">
                <div className="flex items-center gap-3">
                  <FileWarning className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-foreground">{expiringDocs.length} {t('expiring_docs')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Invoice KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <KpiCard title="Outstanding" value={formatCurrency(outstandingAmount)} icon={FileText} subtitle={`${invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').length} unpaid`} />
        <KpiCard title="Paid This Month" value={formatCurrency(paidThisMonth)} icon={DollarSign} subtitle={`${invoices.filter(i => i.status === 'paid').length} total paid`} />
        <KpiCard title="Overdue" value={overdueCount} icon={AlertTriangle} subtitle="needs attention" />
      </div>

      {/* Charts */}
      <DashboardCharts invoices={invoices} trips={trips} />

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Link to="/invoices" className="flex-1 glass-card-hover p-3 flex items-center justify-center gap-2 text-sm font-medium text-foreground">
          <Plus className="w-4 h-4 text-primary" /> New Invoice
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="glass-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">{t('recent_activity')}</h2>
          <Link to="/trips" className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            {t('view_all')} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentTrips.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t('no_data')}</p>
        ) : (
          <div className="space-y-2">
            {recentTrips.map(trip => (
              <div key={trip.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {trip.from_location} → {trip.to_location}
                    </p>
                    <p className="text-xs text-muted-foreground">{trip.driver_name} · {formatDate(trip.trip_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={trip.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="glass-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Recent Invoices</h2>
          <Link to="/invoices" className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">{t('no_data')}</p>
        ) : (
          <div className="space-y-2">
            {recentInvoices.map(inv => (
              <Link key={inv.id} to="/invoices" className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.invoice_number || '—'}</p>
                    <p className="text-xs text-muted-foreground">{inv.client_name} · {formatDate(inv.issue_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-foreground">{formatCurrency(inv.total_amount)}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}