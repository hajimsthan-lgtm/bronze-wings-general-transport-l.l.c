import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, FileText, Gauge, TrendingUp, Wrench, FileWarning,
  AlertTriangle, ChevronRight, Plus, Route, DollarSign, Users
} from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

/**
 * Mobile-only neumorphic dashboard — soft-UI 3D card system.
 * Renders only on mobile viewports; desktop uses the premium dashboard.
 */
export default function MobileNeumorphicDashboard({
  activeTrips, completedTrips, pendingInvoices, dueAmount,
  healthPct, activeVehicles, totalVehicles, avgTripValue,
  totalTrips, totalRevenue, fleetUtil, assignedVehicles,
  recentTrips, recentInvoices, hasAlerts,
  overdueCount, maintenanceCount, expiringDocCount,
  onNewTrip,
}) {
  const [activeTab, setActiveTab] = useState('trips');

  const quickCards = [
    { icon: Truck, label: 'Trips', count: activeTrips, sub: `${completedTrips} done`, color: 'blue', path: '/trips' },
    { icon: FileText, label: 'Invoices', count: pendingInvoices, sub: formatCurrency(dueAmount), color: 'purple', path: '/accounts/invoices' },
    { icon: Gauge, label: 'Fleet', count: `${healthPct}%`, sub: `${activeVehicles}/${totalVehicles}`, color: 'green', path: '/admin/vehicles' },
    { icon: TrendingUp, label: 'Revenue', count: formatCurrency(totalRevenue), sub: `${totalTrips} trips`, color: 'orange', path: '/reports/pnl' },
  ];

  const COLOR_MAP = {
    blue: { glow: 'rgba(59,130,246,0.4)', tile: 'neu-icon-tile-active' },
    purple: { glow: 'rgba(168,85,247,0.4)', tile: 'neu-icon-tile-active' },
    green: { glow: 'rgba(34,197,94,0.4)', tile: 'neu-icon-tile-active' },
    orange: { glow: 'rgba(249,115,22,0.4)', tile: 'neu-icon-tile-active' },
  };

  return (
    <div className="space-y-5 px-4 pt-4 pb-8">
      {/* === Hero greeting card === */}
      <div className="neu-card p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="neu-icon-tile w-12 h-12" style={{ background: 'linear-gradient(145deg, rgba(var(--panel-accent-rgb),0.22), rgba(var(--panel-accent-rgb),0.08))' }}>
            <Users className="w-5 h-5" style={{ color: 'rgb(var(--panel-accent2-rgb))' }} />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-foreground">Fleet Overview</p>
            <p className="text-xs text-muted-foreground">Manage your transport operations</p>
          </div>
        </div>
        <div className="neu-inset px-4 py-3 mt-3 flex items-center justify-between">
          <div>
            <p className="neu-label">Total Revenue</p>
            <p className="text-xl font-bold text-foreground tabular-nums mt-0.5">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="text-right">
            <p className="neu-label">Avg / Trip</p>
            <p className="text-sm font-semibold text-primary tabular-nums mt-0.5">{formatCurrency(avgTripValue)}</p>
          </div>
        </div>
      </div>

      {/* === Quick stat grid — 2x2 neumorphic cards === */}
      <div className="grid grid-cols-2 gap-4">
        {quickCards.map((card) => {
          const c = COLOR_MAP[card.color];
          return (
            <Link key={card.label} to={card.path} className="neu-stat-card neu-card-tap block">
              <div className="flex items-start justify-between mb-3">
                <div className={`neu-icon-tile w-11 h-11 ${c.tile}`}>
                  <card.icon className="w-5 h-5" style={{ color: card.color === 'blue' ? '#60a5fa' : card.color === 'purple' ? '#a855f7' : card.color === 'green' ? '#34d399' : '#f97316' }} />
                </div>
              </div>
              <p className="neu-value text-2xl">{card.count}</p>
              <p className="neu-label mt-1">{card.label}</p>
              <p className="neu-sub">{card.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* === Fleet utilization circular gauge === */}
      <div className="neu-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="neu-label">Fleet Utilization</p>
          <span className="text-xs text-muted-foreground tabular-nums">{assignedVehicles}/{totalVehicles} assigned</span>
        </div>
        <div className="flex items-center justify-center py-2">
          <div className="neu-gauge-ring p-3" style={{ width: 180, height: 180 }}>
            <div className="neu-gauge-inner w-full h-full flex flex-col items-center justify-center relative">
              <svg viewBox="0 0 120 120" className="absolute inset-0 w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="rgb(var(--panel-accent-rgb))" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - fleetUtil / 100)}
                  style={{ filter: 'drop-shadow(0 0 8px rgba(var(--panel-accent-rgb),0.5))', transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="relative z-10 text-center">
                <p className="text-3xl font-bold text-foreground tabular-nums">{fleetUtil}%</p>
                <p className="neu-label mt-1">Utilized</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="neu-inset px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-emerald-400 tabular-nums">{activeVehicles}</p>
            <p className="neu-label">Active</p>
          </div>
          <div className="neu-inset px-3 py-2.5 text-center">
            <p className="text-lg font-bold text-amber-400 tabular-nums">{totalVehicles - activeVehicles}</p>
            <p className="neu-label">Inactive</p>
          </div>
        </div>
      </div>

      {/* === Alerts card === */}
      {hasAlerts && (
        <div className="neu-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="neu-icon-tile w-8 h-8 neu-icon-tile-active" style={{ background: 'linear-gradient(145deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))' }}>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">Active Alerts</p>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">{overdueCount + maintenanceCount + expiringDocCount}</span>
          </div>
          <div className="space-y-2">
            {overdueCount > 0 && (
              <Link to="/admin/clients" className="neu-inset px-3 py-2.5 flex items-center gap-3 neu-card-tap">
                <FileWarning className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-xs text-foreground flex-1">{overdueCount} overdue invoice{overdueCount !== 1 ? 's' : ''}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            )}
            {maintenanceCount > 0 && (
              <Link to="/admin/vehicles" className="neu-inset px-3 py-2.5 flex items-center gap-3 neu-card-tap">
                <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-foreground flex-1">{maintenanceCount} in maintenance</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            )}
            {expiringDocCount > 0 && (
              <Link to="/admin/documents" className="neu-inset px-3 py-2.5 flex items-center gap-3 neu-card-tap">
                <FileWarning className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-foreground flex-1">{expiringDocCount} expiring doc{expiringDocCount !== 1 ? 's' : ''}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* === Tab pills === */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab('trips')} className={`neu-pill flex-1 ${activeTab === 'trips' ? 'neu-pill-active' : ''}`}>
          Recent Trips
        </button>
        <button onClick={() => setActiveTab('invoices')} className={`neu-pill flex-1 ${activeTab === 'invoices' ? 'neu-pill-active' : ''}`}>
          Invoices
        </button>
      </div>

      {/* === Recent trips list === */}
      {activeTab === 'trips' && (
        <div className="space-y-3">
          {recentTrips.length === 0 ? (
            <div className="neu-card p-6 text-center">
              <Truck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No trips in this period</p>
            </div>
          ) : recentTrips.map((trip) => (
            <Link key={trip.id} to="/trips" className="neu-card neu-card-tap p-4 block">
              <div className="flex items-center gap-3">
                <div className="neu-icon-tile w-10 h-10 shrink-0">
                  <Route className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{trip.trip_number || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{trip.from_location} → {trip.to_location}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(Number(trip.revenue) || 0)}</p>
                  <span className={`text-[10px] font-semibold uppercase ${trip.status === 'completed' ? 'text-emerald-400' : trip.status === 'in_transit' ? 'text-amber-400' : trip.status === 'cancelled' ? 'text-red-400' : 'text-blue-400'}`}>
                    {trip.status?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* === Recent invoices list === */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {recentInvoices.length === 0 ? (
            <div className="neu-card p-6 text-center">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No invoices in this period</p>
            </div>
          ) : recentInvoices.map((inv) => (
            <Link key={inv.id} to="/accounts/invoices" className="neu-card neu-card-tap p-4 block">
              <div className="flex items-center gap-3">
                <div className="neu-icon-tile w-10 h-10 shrink-0">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{inv.invoice_number || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{inv.client_name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(Number(inv.total_amount) || 0)}</p>
                  <span className={`text-[10px] font-semibold uppercase ${inv.status === 'paid' ? 'text-emerald-400' : inv.status === 'overdue' ? 'text-red-400' : 'text-amber-400'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* === Quick action FAB === */}
      <button onClick={onNewTrip} className="neu-fab w-14 h-14 fixed bottom-24 right-4 z-40 flex items-center justify-center">
        <Plus className="w-6 h-6 text-primary" />
      </button>
    </div>
  );
}