import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  Truck, FileText, Activity, AlertTriangle, Wrench, FileWarning, ChevronRight, ArrowRight
} from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatCurrency, formatDate } from '@/lib/formatters';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import KpiCard from '@/components/common/KpiCard';
import PendingCustomers from '@/components/dashboard/PendingCustomers';
import GradientCard from '@/components/dashboard/GradientCard';
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

  const recentTrips = trips.slice(0, 5);
  const recentInvoices = invoices.slice(0, 5);

  return (
    <div className="space-y-5 pt-5">
      <PageInfo text="Your business at a glance — active trips, pending invoices, fleet health, and receivables." />

      {/* KPI grid — Gradient Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GradientCard to="/trips" variant="blue" icon={Truck} label={t('active_trips')} title={String(activeTrips)} subtitle={`of ${trips.length}`} index={0} />
        <GradientCard to="/admin/clients" variant="purple" icon={FileText} label={t('pending_invoices')} title={String(pendingInvoices)} subtitle="tap to review" index={1} />
        <GradientCard to="/admin/vehicles" variant="green" icon={Activity} label={t('fleet_health')} title={`${healthPct}%`} subtitle={`${activeVehicles}/${totalVehicles}`} index={2} />
        <PendingCustomers />
      </div>

      {/* Recent lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-foreground">Recent Trips</h2>
            <Link to="/trips" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No trips yet</p>
          ) : (
            <div className="divide-y divide-border/20">
              {recentTrips.map(tr => (
                <Link key={tr.id} to="/trips" className="flex items-center justify-between py-2.5 group">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {tr.from_location} → {tr.to_location}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {tr.vehicle_plate} · {formatDate(tr.trip_date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">
                    {formatCurrency(tr.revenue)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-foreground">Recent Invoices</h2>
            <Link to="/admin/clients" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No invoices yet</p>
          ) : (
            <div className="divide-y divide-border/20">
              {recentInvoices.map(inv => (
                <Link key={inv.id} to="/admin/clients" className="flex items-center justify-between py-2.5 group">
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-medium text-foreground truncate">
                      {inv.invoice_number || inv.client_name || 'Invoice'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {inv.client_name} · {formatDate(inv.issue_date)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">
                    {formatCurrency(inv.total_amount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
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
              <Link to="/admin/clients" className="flex items-center justify-between p-3 rounded-lg bg-red-500/[0.06] border border-red-500/10 hover:bg-red-500/[0.1] transition-colors group">
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
    </div>
  );
}