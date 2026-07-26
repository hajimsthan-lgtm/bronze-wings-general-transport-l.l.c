import { Link } from 'react-router-dom';
import { Search, History, ChevronRight, Plus } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/formatters';

const initials = (name = '') =>
  name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';

export default function DriverTripsPanel({ trips = [], loading = false, newTripHref }) {
  return (
    <div className="glass-card p-4 flex flex-col" style={{ maxHeight: 580 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Trips</h3>
          <span className="text-xs text-muted-foreground">({trips.length})</span>
        </div>
        <button
          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          title="Search trips"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scroll -mr-2 pr-2 space-y-2">
        {loading ? (
          <LoadingSpinner />
        ) : trips.length === 0 ? (
          <EmptyState icon={ChevronRight} title="No trips yet" />
        ) : (
          trips.map((trip) => (
            <Link
              key={trip.id}
              to="/trips"
              className="group block rounded-xl p-3 bg-muted/40 border border-white/[0.06] hover:border-primary/40 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full entity-avatar flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {initials(trip.client_name || trip.contact_person || '—')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {trip.client_name || trip.contact_person || 'Trip'}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(trip.trip_date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground tabular-nums">{formatCurrency(trip.revenue)}</p>
                  <div className="mt-1 flex justify-end"><StatusBadge status={trip.status} /></div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <Link
        to={newTripHref || '/trips'}
        className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl bg-primary text-white text-sm font-semibold py-2.5 hover:brightness-110 transition-all"
      >
        {newTripHref ? <Plus className="w-4 h-4" /> : <History className="w-4 h-4" />}
        {newTripHref ? 'New Trip' : 'View history'}
      </Link>
    </div>
  );
}