import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Home, Route, FileText, Receipt, Truck, Plus, Trash2,
  Bell, Sun, Moon, User, TrendingUp,
} from 'lucide-react';

const FILTERS = ['All', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'];
const STATUS_MAP = {
  'Scheduled': 'scheduled',
  'In Progress': 'in_transit',
  'Completed': 'completed',
  'Cancelled': 'cancelled',
};
const NAV_ITEMS = [
  { icon: Home, label: 'Home', key: 'home' },
  { icon: Route, label: 'Trips', key: 'trips' },
  { icon: FileText, label: 'Invoices', key: 'invoices' },
  { icon: Receipt, label: 'Expenses', key: 'expenses' },
  { icon: Truck, label: 'Fleet', key: 'fleet' },
];

function formatCurrency(val) {
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function StatusBadge({ status }) {
  const styles = {
    completed: 'bg-[#01B574]/10 text-[#01B574] border-[#01B574]/20',
    in_transit: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20',
    scheduled: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  };
  const labels = {
    completed: 'Completed',
    in_transit: 'In Progress',
    scheduled: 'Scheduled',
    cancelled: 'Cancelled',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        styles[status] || styles.scheduled
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  );
}

function SummaryCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="kpi-card rounded-2xl p-4 lg:p-5 relative overflow-hidden">
      <div
        className="kpi-dots absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(var(--panel-accent-rgb), 0.15) 1px, transparent 1px)',
        }}
      />
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-full bg-[rgba(var(--panel-accent-rgb),0.15)] border border-[rgba(var(--panel-accent-rgb),0.25)] flex items-center justify-center mb-3">
          <Icon className="w-5 h-5 text-[rgb(var(--panel-accent-rgb))]" />
        </div>
        <div className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">
          {value}
        </div>
        <div className="text-sm text-muted-foreground mt-1">{label}</div>
        <div className="text-xs text-muted-foreground/60 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}

export default function FinTrackPro() {
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [filter, setFilter] = useState('All');
  const [dark, setDark] = useState(true);
  const [activeNav, setActiveNav] = useState('trips');

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.Trip.list('-trip_date', 50);
        setTrips(data || []);
      } catch {
        setTrips([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = trips.filter((t) =>
    filter === 'All' ? true : t.status === STATUS_MAP[filter]
  );

  const activeTrips = trips.filter((t) => t.status === 'in_transit').length;
  const totalRevenue = trips.reduce(
    (sum, t) => sum + (t.revenue || t.base_fare || 0),
    0
  );
  const completedTrips = trips.filter((t) => t.status === 'completed').length;

  return (
    <div className="min-h-screen professional-page-bg">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 morph-sidebar flex-col p-5 z-50">
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="w-10 h-10 rounded-xl skeuo-brand-frame flex items-center justify-center">
            <Truck className="w-5 h-5 text-[rgb(var(--panel-accent-rgb))]" />
          </div>
          <div>
            <div className="font-bold text-gradient">FinTrack Pro</div>
            <div className="text-xs text-muted-foreground">Fleet Management</div>
          </div>
        </div>
        <nav className="space-y-1.5 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all skeuo-nav-row ${
                  active ? 'skeuo-nav-row-active' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    active
                      ? 'text-[rgb(var(--panel-accent-rgb))]'
                      : 'text-muted-foreground'
                  }`}
                />
                <span className={active ? 'text-foreground' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 p-3 rounded-xl morph-row">
          <div className="w-9 h-9 rounded-full bg-[rgba(var(--panel-accent-rgb),0.15)] flex items-center justify-center">
            <User className="w-4 h-4 text-[rgb(var(--panel-accent-rgb))]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              Admin User
            </div>
            <div className="text-xs text-muted-foreground truncate">
              admin@fintrack.pro
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-[rgba(var(--panel-accent-rgb),0.12)]">
          <div className="flex items-center justify-between px-5 lg:px-10 py-4">
            <div className="flex items-center gap-3">
              <div className="lg:hidden w-9 h-9 rounded-full bg-[rgba(var(--panel-accent-rgb),0.15)] flex items-center justify-center">
                <User className="w-4 h-4 text-[rgb(var(--panel-accent-rgb))]" />
              </div>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-gradient">
                  Trips
                </h1>
                <p className="text-xs lg:text-sm text-muted-foreground hidden sm:block">
                  Operations & logistics
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <button className="relative w-9 h-9 rounded-full skeuo-toggle flex items-center justify-center">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[rgb(var(--panel-accent-rgb))] text-white text-[10px] font-bold flex items-center justify-center">
                  9+
                </span>
              </button>
              <button
                onClick={() => setDark(!dark)}
                className="w-9 h-9 rounded-full skeuo-toggle flex items-center justify-center"
              >
                {dark ? (
                  <Sun className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Moon className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <button className="w-9 h-9 rounded-full skeuo-toggle flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <main className="px-5 lg:px-10 py-5 pb-24 lg:pb-10 max-w-7xl mx-auto space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            <SummaryCard
              label="Active Trips"
              value={activeTrips}
              sub="in progress"
              icon={Route}
            />
            <SummaryCard
              label="Revenue"
              value={`AED ${formatCurrency(totalRevenue)}`}
              sub="period total"
              icon={Receipt}
            />
            <SummaryCard
              label="Completed"
              value={completedTrips}
              sub="this period"
              icon={TrendingUp}
            />
            <SummaryCard
              label="Active Fleet"
              value="4"
              sub="vehicles"
              icon={Truck}
            />
          </div>

          {/* Filter pills + FAB */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`filter-chip ${filter === f ? 'filter-chip-active' : ''}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button className="flex-shrink-0 w-10 h-10 rounded-full clay-btn flex items-center justify-center !p-0 !px-0">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-muted border-t-[rgb(var(--panel-accent-rgb))] rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground mt-4">
                Loading trips...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full empty-orb flex items-center justify-center mb-4">
                <Route className="w-8 h-8 text-[rgb(var(--panel-accent-rgb))]" />
              </div>
              <p className="text-muted-foreground">No trips found.</p>
            </div>
          ) : (
            <>
              {/* Mobile list */}
              <div className="lg:hidden space-y-3">
                {filtered.map((trip) => (
                  <div key={trip.id} className="row-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-[rgba(var(--panel-accent-rgb),0.12)] flex items-center justify-center flex-shrink-0">
                          <Truck className="w-5 h-5 text-[rgb(var(--panel-accent-rgb))]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground text-sm truncate">
                            {trip.trip_number || `TRP-${trip.id?.slice(-5)}`}
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {trip.client_name || 'Unknown'} ·{' '}
                            {formatDate(trip.trip_date)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {trip.from_location} → {trip.to_location}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-[rgb(var(--panel-accent-rgb))] text-sm">
                          AED {formatCurrency(trip.revenue || trip.base_fare)}
                        </div>
                        <div className="mt-1.5">
                          <StatusBadge status={trip.status} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                      <span className="text-xs text-muted-foreground">
                        {trip.status === 'completed'
                          ? 'Ready to invoice'
                          : trip.vehicle_plate || '—'}
                      </span>
                      <button className="text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block glass-panel rounded-2xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[rgba(var(--panel-accent-rgb),0.06)]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Trip
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Client
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Route
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((trip) => (
                      <tr
                        key={trip.id}
                        className="border-t border-border/40 hover:bg-[rgba(var(--panel-accent-rgb),0.05)] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[rgba(var(--panel-accent-rgb),0.12)] flex items-center justify-center">
                              <Truck className="w-4 h-4 text-[rgb(var(--panel-accent-rgb))]" />
                            </div>
                            <span className="font-medium text-foreground text-sm">
                              {trip.trip_number || `TRP-${trip.id?.slice(-5)}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {trip.client_name || '—'}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {trip.from_location} → {trip.to_location}
                        </td>
                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {formatDate(trip.trip_date)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={trip.status} />
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-[rgb(var(--panel-accent-rgb))] text-sm">
                          AED {formatCurrency(trip.revenue || trip.base_fare)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button className="text-muted-foreground hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
        <div className="glass border border-[rgba(var(--panel-accent-rgb),0.12)] rounded-full shadow-lg flex items-center justify-around py-2 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveNav(item.key)}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-1.5 rounded-full transition-all ${
                  active
                    ? 'bg-[rgb(var(--panel-accent-rgb))] text-white'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}