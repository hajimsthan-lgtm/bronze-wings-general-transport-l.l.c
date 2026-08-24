import { useNavigate } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { useTripUpdate } from '@/hooks/useEntityQueries';
import { useCardLock, useSpotlight, useScrollIntoViewWhenLocked, shouldFlashNew } from '@/hooks/useCardLock';
import { Truck, ArrowRight, Trash2, Check, Copy } from 'lucide-react';
import TripStatusManager from './TripStatusManager';

const STATUS = {
  scheduled:    { label: 'Scheduled',    color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  border: 'rgba(96,165,250,0.40)' },
  trip_started: { label: 'Trip Started', color: '#fb923c', bg: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.40)' },
  trip_ended:   { label: 'Trip Ended',   color: '#c084fc', bg: 'rgba(192,132,252,0.15)', border: 'rgba(192,132,252,0.40)' },
  completed:   { label: 'Completed',    color: '#34d399', bg: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.40)' },
  cancelled:   { label: 'Cancelled',    color: '#f87171', bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.40)' },
};

export default function TripCard({ trip, onClick, onDelete, onStatusUpdated, driverMap, vehicleMap, clientMap }) {
  const navigate = useNavigate();
  const updateTrip = useTripUpdate();

  const st = STATUS[trip.status] || STATUS.scheduled;
  const revenue = Number(trip.revenue) || 0;
  const { locked, handleClick, handleRedirect } = useCardLock(() => onClick?.(trip));
  const { onMouseMove } = useSpotlight();
  const lockRef = useScrollIntoViewWhenLocked(locked);
  const isNew = shouldFlashNew(trip.id, trip.created_date);

  const handleLink = (e, map, name, path) => {
    e.stopPropagation();
    const id = map?.[name];
    if (id) navigate(`${path}/${id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(trip);
  };

  const copyTripNumber = (e) => {
    e.stopPropagation();
    if (trip.trip_number) navigator.clipboard.writeText(trip.trip_number);
  };

  return (
    <div
      ref={lockRef}
      onMouseMove={onMouseMove}
      onClick={handleClick}
      className={`group card-spotlight card-spotlight-glow cursor-pointer rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden ${locked ? 'card-locked' : ''} ${isNew ? 'card-flash' : ''}`}
      style={{
        '--card-accent': st.color,
        '--trip-accent': st.color,
        background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.92) 0%, rgba(var(--surf-2-rgb),0.96) 100%)',
        border: `1px solid ${st.border}`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 24px rgba(0,0,0,0.08)',
        transition: 'transform .3s cubic-bezier(0.16,1,0.3,1), box-shadow .3s ease, border-color .3s ease',
      }}
    >
      {/* Redirect overlay — appears when locked */}
      <div className="card-redirect-overlay" onClick={(e) => e.stopPropagation()}>
        <button className="card-redirect-btn" onClick={handleRedirect}>
          Open Trip <ArrowRight className="w-3 h-3" />
        </button>
      </div>
      {/* ── Header: avatar + trip no + amount/status ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(var(--panel-accent-rgb),0.15)', border: '1px solid rgba(var(--panel-accent-rgb),0.30)', color: 'rgb(var(--panel-accent-rgb))' }}>
            <Truck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <button onClick={copyTripNumber} className="font-mono text-sm font-bold text-white hover:text-primary transition-colors flex items-center gap-1" title="Copy trip number">
              <span className="truncate max-w-[120px]">{trip.trip_number || `#${trip.id?.slice(-6)}`}</span>
              <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
            </button>
            <p className="text-[11px] text-white/45 truncate mt-0.5">
              {trip.client_name || '—'} · {formatDate(trip.trip_date)}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-sm font-bold text-white tabular-nums">{formatCurrency(revenue)}</span>
          <span className="inline-flex items-center px-2 h-5 rounded-full text-[10px] font-semibold whitespace-nowrap"
            style={{ background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>
            {st.label}
          </span>
        </div>
      </div>

      {/* ── Body: route line ── */}
      <div className="flex items-center gap-1.5 text-xs text-white/55 flex-wrap">
        <span className="truncate font-medium text-white/75">{trip.from_location || '—'}</span>
        <ArrowRight className="w-3 h-3 flex-shrink-0" style={{ color: st.color }} />
        <span className="truncate font-medium text-white/75">{trip.to_location || '—'}</span>
        <span className="text-white/25 mx-0.5">·</span>
        <button onClick={(e) => handleLink(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')} className="hover:text-primary transition-colors truncate font-mono">{trip.vehicle_plate}</button>
        <span className="text-white/25">—</span>
        <button onClick={(e) => handleLink(e, driverMap, trip.driver_name, '/admin/drivers')} className="hover:text-primary transition-colors truncate">{trip.driver_name}</button>
      </div>

      {/* ── Footer: status workflow + delete ── */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div onClick={(e) => e.stopPropagation()}>
          <TripStatusManager trip={trip} onUpdated={onStatusUpdated} />
        </div>
        <button onClick={handleDelete}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Delete trip">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}