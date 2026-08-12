import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Truck, ChevronDown } from 'lucide-react';

const STATUS_BUTTONS = [
  { key: 'scheduled', label: 'Scheduled', color: '#1ED760' },
  { key: 'in_transit', label: 'Transit', color: '#a855f7' },
  { key: 'completed', label: 'Complete', color: '#10b981' },
  { key: 'cancelled', label: 'Cancel', color: '#ef4444' },
];

const STATUS_BADGE = {
  scheduled: { label: 'Scheduled', color: '#1ED760' },
  in_transit: { label: 'In Transit', color: '#a855f7' },
  completed: { label: 'Completed', color: '#10b981' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

function isCritical(t) {
  const refStr = t.delivery_date || t.trip_date;
  if (!refStr) return false;
  const ref = new Date(refStr);
  if (isNaN(ref.getTime())) return false;
  ref.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return ref < today;
}

export default function TripsOperationsSection({ expanded, onToggle, onCountChange }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async () => {
    try {
      const all = await base44.entities.Trip.list('-trip_date', 100);
      const active = (all || []).filter(
        (t) => t.status === 'scheduled' || t.status === 'in_transit'
      );
      setTrips(active);
      onCountChange?.({ count: active.length, critical: active.filter(isCritical).length });
    } catch {
      setTrips([]);
      onCountChange?.({ count: 0, critical: 0 });
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Bidirectional sync — refetch when any trip changes (from Trip page or here)
  useEffect(() => {
    const unsubscribe = base44.entities.Trip.subscribe(() => fetchTrips());
    return unsubscribe;
  }, [fetchTrips]);

  const updateStatus = async (tripId, newStatus) => {
    const isRemoving = newStatus === 'completed' || newStatus === 'cancelled';
    setTrips((prev) => {
      if (isRemoving) {
        const next = prev.filter((t) => t.id !== tripId);
        onCountChange?.({ count: next.length, critical: next.filter(isCritical).length });
        return next;
      }
      const next = prev.map((t) => (t.id === tripId ? { ...t, status: newStatus } : t));
      onCountChange?.({ count: next.length, critical: next.filter(isCritical).length });
      return next;
    });
    try {
      await base44.entities.Trip.update(tripId, { status: newStatus });
    } catch {
      fetchTrips();
    }
  };

  const criticalCount = trips.filter(isCritical).length;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Section header — matches existing category header exactly */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2.5 px-2.5 py-2 transition-all hover:bg-white/[0.03]"
      >
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: '#1ED7601a',
            border: '1px solid #1ED76040',
          }}
        >
          <Truck className="w-3.5 h-3.5" style={{ color: '#1ED760' }} />
        </span>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[11px] font-bold text-white/90 uppercase tracking-wide leading-none truncate">
            Trips & Operations
          </p>
          <p className="text-[9px] text-white/40 mt-0.5 leading-none">
            {loading ? 'Loading…' : `${trips.length} item${trips.length !== 1 ? 's' : ''}`}
            {!loading && criticalCount > 0 && (
              <span style={{ color: '#fca5a5' }}> · {criticalCount} critical</span>
            )}
          </p>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-white/40 transition-transform flex-shrink-0 ${expanded ? '' : '-rotate-90'}`}
        />
      </button>

      {/* Section body — smooth max-height transition, no conditional mount */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ maxHeight: expanded ? '320px' : '0', opacity: expanded ? 1 : 0 }}
      >
        <div className="px-1.5 pb-1.5 space-y-1">
          {trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                style={{ background: 'rgba(30,215,96,0.1)', border: '1px solid rgba(30,215,96,0.2)' }}
              >
                <Truck className="w-4 h-4" style={{ color: 'rgba(30,215,96,0.5)' }} />
              </span>
              <p className="text-[10px] text-white/40">No active trips</p>
            </div>
          ) : (
            <div className="max-h-[200px] overflow-y-auto thin-scroll space-y-1">
              {trips.map((t) => {
                const badge = STATUS_BADGE[t.status] || STATUS_BADGE.scheduled;
                const route = `${t.from_location || '—'} → ${t.to_location || '—'}`;
                return (
                  <div
                    key={t.id}
                    className="p-2 rounded-lg transition-colors hover:bg-white/[0.04]"
                  >
                    {/* Row 1: trip number + status badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[12px] font-semibold text-white truncate flex-1 leading-tight">
                        {t.trip_number || route}
                      </p>
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide flex-shrink-0"
                        style={{
                          background: `${badge.color}1a`,
                          border: `1px solid ${badge.color}40`,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                    {/* Row 2: route */}
                    {t.trip_number && (
                      <p className="text-[10.5px] text-white/55 truncate leading-tight">{route}</p>
                    )}
                    {/* Row 3: client + vehicle */}
                    {(t.client_name || t.vehicle_plate) && (
                      <p className="text-[9px] text-white/35 truncate mt-0.5 leading-tight uppercase tracking-wide font-mono">
                        {[t.client_name, t.vehicle_plate].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {/* Status switch buttons */}
                    <div className="flex gap-1 mt-1.5">
                      {STATUS_BUTTONS.map((s) => {
                        const isActive = t.status === s.key;
                        return (
                          <button
                            key={s.key}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(t.id, s.key);
                            }}
                            className="flex-1 px-1 py-1 rounded-md text-[8px] font-bold uppercase tracking-wide transition-colors"
                            style={
                              isActive
                                ? {
                                    background: `${s.color}26`,
                                    border: `1px solid ${s.color}66`,
                                    color: '#fff',
                                  }
                                : {
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    color: 'rgba(255,255,255,0.4)',
                                  }
                            }
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}