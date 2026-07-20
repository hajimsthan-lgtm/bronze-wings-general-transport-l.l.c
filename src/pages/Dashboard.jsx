import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Truck, FileText, Activity, AlertTriangle, Wrench, FileWarning, ChevronRight
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import KpiCard from '@/components/common/KpiCard';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import ProfitAnalytics from '@/components/dashboard/ProfitAnalytics';
import PendingCustomers from '@/components/dashboard/PendingCustomers';
import PageInfo from '@/components/common/PageInfo';

export default function Dashboard() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch sequentially to avoid the API rate limit
        const t = await base44.entities.Trip.list('-created_date', 50).catch(() => []);
        const i = await base44.entities.Invoice.list('-created_date', 50).catch(() => []);
        const v = await base44.entities.Vehicle.list().catch(() => []);
        const d = await base44.entities.Document.list().catch(() => []);
        if (cancelled) return;
        setTrips(t);
        setInvoices(i);
        setVehicles(v);
        setDocuments(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingSpinner />;

  const activeTrips = trips.filter(t => t.status === 'in_transit' || t.status === 'scheduled').length;
  const pendingInvoices = invoices.filter(i => i.status === 'draft' || i.status === 'sent').length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalVehicles = vehicles.length;
  const healthPct = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 100;

  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance');
  const expiringDocs = documents.filter(d => d.status === 'expiring_soon' || d.status === 'expired');

  return (
    <div className="space-y-6 pt-5">
      <PageInfo text="Your business at a glance — active trips, pending invoices, fleet health, and profitability. Tap any card to jump to the related section." />

      {/* Clickable KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link to="/trips" className="block group">
          <div className="transition-all duration-200 group-hover:border-primary/30 rounded-[1.1rem]">
            <KpiCard title={t('active_trips')} value={activeTrips} icon={Truck} subtitle={`of ${trips.length} total`} />
          </div>
        </Link>
        <Link to="/invoices" className="block group">
          <div className="transition-all duration-200 group-hover:border-primary/30 rounded-[1.1rem]">
            <KpiCard title={t('pending_invoices')} value={pendingInvoices} icon={FileText} subtitle="tap to review" />
          </div>
        </Link>
        <Link to="/admin/vehicles" className="block group">
          <div className="transition-all duration-200 group-hover:border-primary/30 rounded-[1.1rem]">
            <KpiCard title={t('fleet_health')} value={`${healthPct}%`} icon={Activity} subtitle={`${activeVehicles}/${totalVehicles} active`} />
          </div>
        </Link>
      </div>

      {/* Pending customers (clickable card) */}
      <PendingCustomers />

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

      {/* Profit analytics */}
      <ProfitAnalytics />

      {/* Charts */}
      <DashboardCharts invoices={invoices} trips={trips} />
    </div>
  );
}