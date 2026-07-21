import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { useTripUpdate } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ChevronDown, Check, Copy, Send, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { setTripInvoiceSent } from '@/lib/tripInvoice';

const TRIP_TYPE_COLORS = {
  one_way: 'text-sky-400',
  hourly: 'text-amber-400',
  contract: 'text-blue-400',
  return: 'text-emerald-400',
};

const STATUS_COLORS = {
  scheduled: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  in_transit: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

const STATUS_DOT = {
  scheduled: 'bg-slate-400',
  in_transit: 'bg-amber-400',
  completed: 'bg-emerald-400',
  cancelled: 'bg-rose-400',
};

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Canceled' },
];

export default function TripListRow({ trip, onClick, driverMap, vehicleMap, clientMap, invoiceMap, onInvoicesChanged }) {
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

  const statusLabel = STATUS_OPTIONS.find(s => s.value === trip.status)?.label || trip.status;

  return (
    <div
      onClick={() => onClick?.(trip)}
      className="glass-card-hover p-3 flex items-center gap-4 cursor-pointer group"
    >
      <button
        onClick={copyTripNumber}
        className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors min-w-[110px] hidden sm:inline flex items-center gap-1.5"
        title="Click to copy trip number"
      >
        {trip.trip_number || `#${trip.id?.slice(-6)}`}
        {trip.is_draft && <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">Draft</span>}
        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{trip.from_location} → {trip.to_location}</p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
          {trip.driver_name && (
            <button onClick={(e) => handleLink(e, driverMap, trip.driver_name, '/admin/drivers')} className="hover:text-primary transition-colors">{trip.driver_name}</button>
          )}
          {trip.vehicle_plate && (
            <button onClick={(e) => handleLink(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')} className="hover:text-primary transition-colors">{trip.vehicle_plate}</button>
          )}
          {trip.client_name && (
            <button onClick={(e) => handleLink(e, clientMap, trip.client_name, '/admin/clients')} className="hover:text-primary transition-colors">{trip.client_name}</button>
          )}
        </div>
      </div>
      <span className={`text-[10px] font-medium uppercase hidden md:inline ${TRIP_TYPE_COLORS[trip.trip_type] || 'text-muted-foreground'}`}>
        {t(trip.trip_type || 'one_way')}
      </span>
      {trip.trip_type === 'hourly' && trip.hours > 0 && (
        <span className="text-xs text-amber-400 hidden sm:inline">{trip.hours}h</span>
      )}
      <span className="text-sm font-semibold text-foreground hidden sm:inline">{formatCurrency(trip.revenue)}</span>
      <span className="text-xs text-muted-foreground hidden md:inline">{formatDate(trip.trip_date)}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors whitespace-nowrap ${STATUS_COLORS[trip.status] || STATUS_COLORS.scheduled}`}
          >
            {statusLabel}
            <ChevronDown className="w-2.5 h-2.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {STATUS_OPTIONS.map(opt => (
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
      {trip.status === 'completed' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              disabled={invoiceBusy}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors whitespace-nowrap ${isSent ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}
            >
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
  );
}