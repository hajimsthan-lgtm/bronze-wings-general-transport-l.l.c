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
import RecentActivityRow from '@/components/dashboard/RecentActivityRow';
import PageInfo from '@/components/common/PageInfo';
import { motion } from 'framer-motion';
import QuickActions from '@/components/dashboard/QuickActions';
import AnalyticsOverview from '@/components/dashboard/AnalyticsOverview';
import PerformanceMetrics from '@/components/dashboard/PerformanceMetrics';
import MiniSparkline from '@/components/dashboard/MiniSparkline';

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

  const completedRecent = recentTrips.filter(tr => tr.status === 'completed').length;
  const tripTrend = (() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      arr.push(trips.filter(tr => tr.trip_date === key).length);
    }
    return arr;
  })();
  const invCounts = { paid: 0, sent: 0, draft: 0, partial: 0 };
  recentInvoices.forEach(inv => { if (invCounts[inv.status] !== undefined) invCounts[inv.status]++; });
  const invTotal = recentInvoices.length || 1;

  const tripTone = (s) => s === 'in_transit' ? { bg: 'bg-blue-500/10', fg: 'text-blue-400' }
    : s === 'completed' ? { bg: 'bg-emerald-500/10', fg: 'text-emerald-400' }
    : s === 'cancelled' ? { bg: 'bg-red-500/10', fg: 'text-red-400' }
    : { bg: 'bg-amber-500/10', fg: 'text-amber-400' };
  const invTone = (s) => s === 'paid' ? { bg: 'bg-emerald-500/10', fg: 'text-emerald-400' }
    : s === 'sent' ? { bg: 'bg-blue-500/10', fg: 'text-blue-400' }
    : s === 'overdue' ? { bg: 'bg-red-500/10', fg: 'text-red-400' }
    : { bg: 'bg-amber-500/10', fg: 'text-amber-400' };

  return (
    <div className="space-y-5 pt-5">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <PageInfo text="Your business at a glance — active trips, pending invoices, fleet health, and receivables." />
      </motion.div>

      {/* KPI grid — Gradient Cards */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <GradientCard to="/trips" variant="green" icon={Truck} label={t('active_trips')} title={String(activeTrips)} subtitle={`of ${trips.length}`} index={0} />
        <GradientCard to="/admin/clients" variant="purple" icon={FileText} label={t('pending_invoices')} title={String(pendingInvoices)} subtitle="tap to review" index={1} />
        <GradientCard to="/admin/vehicles" variant="teal" icon={Activity} label={t('fleet_health')} title={`${healthPct}%`} subtitle={`${activeVehicles}/${totalVehicles}`} index={2} />
        <PendingCustomers />
      </motion.div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Analytics Overview */}
      <AnalyticsOverview />

      {/* Performance Metrics */}
      <PerformanceMetrics />

      {/* Recent lists */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(18,22,34,0.50)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white/80">Recent Trips</h2>
            <Link to="/trips" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-3 mt-2 mb-2">
            <MiniSparkline data={tripTrend} color="#22c55e" />
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[10px] text-white/40 uppercase tracking-wider whitespace-nowrap">{completedRecent}/{recentTrips.length} completed</span>
              <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: `${recentTrips.length ? (completedRecent / recentTrips.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
          {recentTrips.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No trips yet</p>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {recentTrips.map(tr => {
                const tone = tripTone(tr.status);
                return (
                  <RecentActivityRow
                    key={tr.id}
                    to="/trips"
                    icon={Truck}
                    iconBg={tone.bg}
                    iconClass={tone.fg}
                    title={`Trip ${tr.trip_number || '—'} · ${tr.from_location} → ${tr.to_location}`}
                    subtitle={`${tr.driver_name || '—'} · ${(tr.status || '').replace(/_/g, ' ')}`}
                    accent="#22c55e"
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4 md:p-5" style={{ background: 'rgba(18,22,34,0.50)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-semibold text-white/80">Recent Invoices</h2>
            <Link to="/admin/clients" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-1 mt-2 mb-2 h-1.5 rounded-full overflow-hidden bg-white/5">
            <div className="h-full bg-emerald-500" style={{ width: `${(invCounts.paid / invTotal) * 100}%` }} />
            <div className="h-full bg-blue-500" style={{ width: `${(invCounts.sent / invTotal) * 100}%` }} />
            <div className="h-full bg-amber-500" style={{ width: `${((invCounts.draft + invCounts.partial) / invTotal) * 100}%` }} />
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No invoices yet</p>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {recentInvoices.map(inv => {
                const tone = invTone(inv.status);
                const accent = inv.status === 'paid' ? '#22c55e' : inv.status === 'sent' ? '#3b82f6' : inv.status === 'overdue' ? '#ef4444' : '#f59e0b';
                return (
                  <RecentActivityRow
                    key={inv.id}
                    to="/admin/clients"
                    icon={FileText}
                    iconBg={tone.bg}
                    iconClass={tone.fg}
                    title={`Invoice ${inv.invoice_number || '—'} · ${inv.client_name || '—'}`}
                    subtitle={`${(inv.status || '').replace(/_/g, ' ')} · ${formatCurrency(inv.total_amount)}`}
                    accent={accent}
                  />
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

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