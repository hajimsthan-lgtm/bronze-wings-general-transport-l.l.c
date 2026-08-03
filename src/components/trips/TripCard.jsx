import { useNavigate } from 'react-router-dom';
import { useId, useState } from 'react';
import { formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { useTripUpdate } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import { setTripInvoiceSent } from '@/lib/tripInvoice';
import { User, Truck as TruckIcon, Building2, Copy, Send, Undo2, Calendar, ArrowRight, Wallet, Route } from 'lucide-react';

const STATUS = {
  scheduled:  { short: 'Sched',   color: '#60a5fa', glow: '96,165,250' },
  in_transit: { short: 'Transit', color: '#fbbf24', glow: '251,191,36' },
  completed:  { short: 'Done',    color: '#34d399', glow: '52,211,153' },
  cancelled:  { short: 'Cancel',  color: '#fb7185', glow: '251,113,133' },
};
const STATUS_LIST = ['scheduled', 'in_transit', 'completed', 'cancelled'];

const TYPE_STYLE = {
  one_way:  { color: '#60a5fa', glow: '96,165,250' },
  hourly:   { color: '#fbbf24', glow: '251,191,36' },
  contract: { color: '#a855f7', glow: '168,85,247' },
  return:   { color: '#34d399', glow: '52,211,153' },
};

/* Circular glowing gauge — 270° arc, colored by trip status */
function TripGauge({ value, color, glow, gid }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <path d="M 34.75 125.25 A 64 64 0 1 1 125.25 125.25" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeLinecap="round" />
        <path d="M 34.75 125.25 A 64 64 0 1 1 125.25 125.25" fill="none" stroke={`url(#${gid})`} strokeWidth="7" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px rgba(${glow},0.65))` }} />
      </svg>
      <div className="relative flex flex-col items-center">
        <div className="flex items-center gap-1 text-[9px] uppercase tracking-[0.14em] text-white/45 font-semibold mb-1">
          <Wallet className="w-3 h-3" />AED
        </div>
        <span className="text-xl font-bold text-white tabular-nums tracking-tight leading-none">{value}</span>
      </div>
    </div>
  );
}

export default function TripCard({ trip, onClick, driverMap, vehicleMap, clientMap, invoiceMap, onInvoicesChanged }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const updateTrip = useTripUpdate();
  const { toast } = useToast();
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const gid = useId().replace(/[:]/g, '');
  const invoice = invoiceMap?.[trip.id];
  const isSent = invoice?.status === 'sent';

  const handleInvoiceSent = async (e, sent) => {
    e.stopPropagation();
    if (invoiceBusy) return;
    setInvoiceBusy(true);
    try {
      await setTripInvoiceSent(trip, sent);
      toast({ title: sent ? 'Invoice marked as sent' : 'Invoice reverted to not sent' });
      onInvoicesChanged?.();
    } catch {
      toast({ title: 'Could not update invoice', variant: 'destructive' });
    } finally {
      setInvoiceBusy(false);
    }
  };

  const handleLink = (e, map, name, path) => {
    e.stopPropagation();
    const id = map?.[name];
    if (id) navigate(`${path}/${id}`);
  };

  const handleStatusChange = (e, newStatus) => {
    e.stopPropagation();
    updateTrip.mutate({ id: trip.id, data: { status: newStatus } });
  };

  const copyTripNumber = (e) => {
    e.stopPropagation();
    if (trip.trip_number) {
      navigator.clipboard.writeText(trip.trip_number);
      toast({ title: 'Trip Number Copied!', description: trip.trip_number });
    }
  };

  const st = STATUS[trip.status] || STATUS.scheduled;
  const tp = TYPE_STYLE[trip.trip_type] || TYPE_STYLE.one_way;
  const revenue = Number(trip.revenue) || 0;
  const revDisplay = new Intl.NumberFormat('en-AE', { maximumFractionDigits: 0 }).format(revenue);

  return (
    <div
      onClick={() => onClick?.(trip)}
      className="group cursor-pointer rounded-[22px] p-3 flex flex-col relative"
      style={{
        background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.94) 0%, rgba(var(--surf-2-rgb),0.97) 100%)',
        border: `1px solid rgba(${st.glow},0.16)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 28px rgba(0,0,0,0.45)`,
        transition: 'transform .3s cubic-bezier(0.16,1,0.3,1), box-shadow .3s ease, border-color .3s ease',
      }}
    >
      {/* ── Top bar: route icon + trip no + type badge ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(160deg, rgba(${st.glow},0.22), rgba(${st.glow},0.06))`, border: `1px solid rgba(${st.glow},0.3)`, color: st.color }}>
            <Route className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/40 font-semibold leading-none">Trip</p>
            <button onClick={copyTripNumber} className="font-mono text-[11px] text-white/80 hover:text-white transition-colors flex items-center gap-1 mt-0.5" title="Copy trip number">
              <span className="truncate max-w-[96px]">{trip.trip_number || `#${trip.id?.slice(-6)}`}</span>
              <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          </div>
        </div>
        <span className="inline-flex items-center px-2 h-6 rounded-full text-[10px] font-semibold flex-shrink-0"
          style={{ background: `rgba(${tp.glow},0.14)`, border: `1px solid rgba(${tp.glow},0.32)`, color: tp.color }}>
          {t(trip.trip_type || 'one_way')}
        </span>
      </div>

      {/* ── Central glowing gauge ── */}
      <div className="flex justify-center my-1">
        <TripGauge value={revDisplay} color={st.color} glow={st.glow} gid={gid} />
      </div>

      {/* ── From → To ── */}
      <div className="flex items-center gap-1.5 mb-3 px-1">
        <span className="text-xs font-medium text-white/85 truncate flex-1 text-left">{trip.from_location || '—'}</span>
        <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: st.color }} />
        <span className="text-xs font-medium text-white/85 truncate flex-1 text-right">{trip.to_location || '—'}</span>
      </div>

      {/* ── Bottom pill: status selector ── */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-black/30 border border-white/5">
        {STATUS_LIST.map((s) => {
          const opt = STATUS[s];
          const active = trip.status === s;
          return (
            <button
              key={s}
              onClick={(e) => handleStatusChange(e, s)}
              className="flex-1 flex items-center justify-center h-7 rounded-full text-[10px] font-semibold transition-all"
              style={active
                ? { background: `linear-gradient(135deg, rgba(${opt.glow},0.28), rgba(${opt.glow},0.1))`, color: '#fff', boxShadow: `inset 0 0 0 1px rgba(${opt.glow},0.42), 0 0 12px -2px rgba(${opt.glow},0.5)` }
                : { color: 'rgba(255,255,255,0.4)' }}
            >
              {opt.short}
            </button>
          );
        })}
      </div>

      {/* ── Footer meta ── */}
      <div className="flex items-center gap-1.5 flex-wrap pt-3 mt-1 border-t border-white/5">
        {trip.client_name && (
          <button onClick={(e) => handleLink(e, clientMap, trip.client_name, '/admin/clients')} className="inline-flex items-center gap-1 text-[10px] text-white/55 hover:text-white transition-colors">
            <Building2 className="w-3 h-3" />{trip.client_name}
          </button>
        )}
        {trip.driver_name && (
          <button onClick={(e) => handleLink(e, driverMap, trip.driver_name, '/admin/drivers')} className="inline-flex items-center gap-1 text-[10px] text-white/55 hover:text-white transition-colors">
            <User className="w-3 h-3" />{trip.driver_name}
          </button>
        )}
        {trip.vehicle_plate && (
          <button onClick={(e) => handleLink(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')} className="inline-flex items-center gap-1 text-[10px] text-white/55 hover:text-white transition-colors">
            <TruckIcon className="w-3 h-3" />{trip.vehicle_plate}
          </button>
        )}
        <span className="inline-flex items-center gap-1 text-[10px] text-white/40 ml-auto tabular-nums">
          <Calendar className="w-3 h-3" />{formatDate(trip.trip_date)}
        </span>
      </div>

      {/* ── Invoice toggle (completed only) ── */}
      {trip.status === 'completed' && (
        <button
          onClick={(e) => handleInvoiceSent(e, !isSent)}
          disabled={invoiceBusy}
          className="mt-2 self-end inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full text-[10px] font-semibold transition-all"
          style={isSent
            ? { background: 'rgba(52,211,153,0.18)', border: '1px solid rgba(52,211,153,0.45)', color: '#34d399' }
            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
        >
          {isSent ? <Send className="w-3 h-3" /> : <Undo2 className="w-3 h-3" />}
          {isSent ? 'Sent' : 'Not Sent'}
        </button>
      )}
    </div>
  );
}