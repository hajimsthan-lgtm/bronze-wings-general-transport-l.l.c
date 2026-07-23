import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { useTripUpdate } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { User, Truck as TruckIcon, Building2, FileText, ChevronDown, Check, Copy, Send, Undo2, Calendar } from 'lucide-react';
import { useState } from 'react';
import { setTripInvoiceSent } from '@/lib/tripInvoice';

const TRIP_TYPE_COLORS = {
  one_way: 'text-sky-500 dark:text-sky-400',
  hourly: 'text-amber-500 dark:text-amber-400',
  contract: 'text-blue-500 dark:text-blue-400',
  return: 'text-emerald-500 dark:text-emerald-400'
};

const STATUS_COLORS = {
  scheduled: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/25',
  in_transit: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/25',
  completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/25',
  cancelled: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/25'
};

const STATUS_DOT = {
  scheduled: 'bg-slate-400',
  in_transit: 'bg-amber-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-rose-400'
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Canceled' }
];

export default function TripCard({ trip, onClick, driverMap, vehicleMap, clientMap, invoiceMap, onInvoicesChanged }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const updateTrip = useTripUpdate();
  const { toast } = useToast();
  const [invoiceBusy, setInvoiceBusy] = useState(false);
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

  const statusLabel = STATUS_OPTIONS.find((s) => s.value === trip.status)?.label || trip.status;

  return (
    <div
      onClick={() => onClick?.(trip)}
      className="group relative flex flex-col justify-between cursor-pointer rounded-[20px] p-5 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1"
      style={{
        background: 'linear-gradient(170deg, rgba(30,41,59,0.50) 0%, rgba(15,23,42,0.75) 100%)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      {/* Inner top highlight */}
      <div className="absolute inset-x-0 top-0 h-16 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(59,130,246,0.10) 0%, transparent 60%)' }} />
      {/* Hover accent ring + blue radial glow */}
      <div className="absolute inset-0 rounded-[20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.30), 0 12px 40px rgba(0,0,0,0.5), 0 0 24px -6px rgba(59,130,246,0.25)' }} />

      {/* Header: type badge + trip id (left), status / sent / draft (right) */}
      <div className="relative flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-500/15 border border-blue-400/30 text-blue-300 flex-shrink-0">
            {t(trip.trip_type || 'one_way')}
          </span>
          <button
            onClick={copyTripNumber}
            className="text-xs font-mono font-semibold text-white/85 tracking-wider hover:text-[#60a5fa] transition-colors flex items-center gap-1 min-w-0"
            title="Click to copy trip number"
          >
            <span className="truncate">{trip.trip_number || `#${trip.id?.slice(-6)}`}</span>
            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${STATUS_COLORS[trip.status] || STATUS_COLORS.scheduled}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[trip.status] || 'bg-slate-400'}`} />
                {statusLabel}
                <ChevronDown className="w-2.5 h-2.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={(e) => handleStatusChange(e, opt.value)}
                  className="text-xs cursor-pointer flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[opt.value]}`} />
                  {opt.label}
                  {trip.status === opt.value && <Check className="w-3 h-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {trip.is_draft && (
            <span className="text-[9px] text-amber-500 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
              Draft
            </span>
          )}
          {trip.status === 'completed' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  disabled={invoiceBusy}
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${isSent ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/25' : 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/25'}`}
                >
                  <FileText className="w-3 h-3" />
                  {isSent ? 'Sent' : 'Not Sent'}
                  <ChevronDown className="w-2.5 h-2.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={(e) => handleInvoiceSent(e, true)} className="text-xs cursor-pointer flex items-center gap-2">
                  <Send className="w-3 h-3" /> Mark Sent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleInvoiceSent(e, false)} className="text-xs cursor-pointer flex items-center gap-2">
                  <Undo2 className="w-3 h-3" /> Revert to Not Sent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Revenue capsule */}
      {trip.revenue > 0 && (
        <div className="relative flex justify-center mb-4">
          <div
            className="inline-flex flex-col items-center px-5 py-2 rounded-full"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(37,99,235,0.15))', border: '1px solid rgba(59,130,246,0.25)', boxShadow: '0 0 16px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.15)' }}
          >
            <span className="text-lg font-bold text-white tabular-nums leading-tight">{formatCurrency(trip.revenue)}</span>
            {trip.trip_type === 'hourly' && trip.hours > 0 && (
              <span className="text-[10px] text-white/85 leading-tight">({trip.hours} Hours)</span>
            )}
          </div>
        </div>
      )}

      {/* Route visualizer */}
      <div className="relative flex items-center gap-2 mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-wider text-white/60 mb-0.5">from</p>
          <p className="text-sm font-semibold text-white truncate">{trip.from_location}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 pb-1">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6]" style={{ boxShadow: '0 0 8px rgba(59,130,246,0.7)' }} />
          <span className="w-8 h-px bg-gradient-to-r from-[#3b82f6] via-[#22d3ee] to-[#f59e0b]" />
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" style={{ boxShadow: '0 0 8px rgba(245,158,11,0.7)' }} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[9px] uppercase tracking-wider text-white/60 mb-0.5">to</p>
          <p className="text-sm font-semibold text-white truncate">{trip.to_location}</p>
        </div>
      </div>

      {/* Metadata footer chips */}
      <div className="relative flex items-center gap-2 flex-wrap pt-3 mt-auto border-t border-white/[0.06]">
        {trip.driver_name && (
          <button
            onClick={(e) => handleLink(e, driverMap, trip.driver_name, '/admin/drivers')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 hover:bg-white/10 hover:border-blue-500/30 transition-colors"
          >
            <User className="w-3 h-3 text-[#60a5fa]" /> {trip.driver_name}
          </button>
        )}
        {trip.vehicle_plate && (
          <button
            onClick={(e) => handleLink(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 hover:bg-white/10 hover:border-blue-500/30 transition-colors"
          >
            <TruckIcon className="w-3 h-3 text-[#60a5fa]" /> {trip.vehicle_plate}
          </button>
        )}
        {trip.client_name && (
          <button
            onClick={(e) => handleLink(e, clientMap, trip.client_name, '/admin/clients')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90 hover:bg-white/10 hover:border-blue-500/30 transition-colors"
          >
            <Building2 className="w-3 h-3 text-[#60a5fa]" /> {trip.client_name}
          </button>
        )}
        {trip.delivery_note_number && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90">
            <FileText className="w-3 h-3 text-[#60a5fa]" /> {trip.delivery_note_number}
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/90">
          <Calendar className="w-3 h-3 text-[#60a5fa]" /> {formatDate(trip.trip_date)}
        </span>
      </div>
    </div>
  );
}