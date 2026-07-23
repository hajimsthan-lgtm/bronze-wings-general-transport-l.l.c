import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { useTripUpdate } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { User, Truck as TruckIcon, Building2, FileText, ChevronDown, Check, Copy, Send, Undo2, Calendar } from 'lucide-react';
import { useState } from 'react';
import { setTripInvoiceSent } from '@/lib/tripInvoice';
import MetaChip from '@/components/operations/MetaChip';
import { statusVariant } from '@/components/operations/StatusPill';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Canceled' },
];

const TYPE_STYLE = {
  one_way: 'text-blue-400 bg-blue-500/10',
  hourly: 'text-amber-400 bg-amber-500/10',
  contract: 'text-blue-400 bg-blue-500/10',
  return: 'text-emerald-400 bg-emerald-500/10',
};

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
  const revenue = Number(trip.revenue) || 0;

  return (
    <div
      onClick={() => onClick?.(trip)}
      className="group relative flex flex-col justify-between cursor-pointer rounded-2xl p-5 bg-card/60 backdrop-blur-xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300"
    >
      {/* Header: route lead + date */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <span className="text-[15px] font-semibold text-foreground truncate">{trip.from_location || '—'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 pl-4 min-w-0">
            <span className="w-px h-3 bg-border flex-shrink-0" />
            <span className="text-[15px] font-semibold text-foreground truncate">{trip.to_location || '—'}</span>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-flex items-center px-2 h-5 rounded-md text-[10px] font-medium ${TYPE_STYLE[trip.trip_type] || TYPE_STYLE.one_way}`}>
              {t(trip.trip_type || 'one_way')}
            </span>
            {trip.trip_type === 'hourly' && trip.hours > 0 && (
              <span className="text-[11px] text-muted-foreground tabular-nums">{trip.hours}h</span>
            )}
            <button onClick={copyTripNumber} className="text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors flex items-center gap-1" title="Click to copy trip number">
              <span className="truncate max-w-[120px]">{trip.trip_number || `#${trip.id?.slice(-6)}`}</span>
              <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
            {trip.is_draft && (
              <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1.5 h-4 rounded inline-flex items-center uppercase tracking-wider">Draft</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-shrink-0">
          <Calendar className="w-3 h-3" />
          {formatDate(trip.trip_date)}
        </div>
      </div>

      {/* Amount anchor */}
      <div className="flex items-baseline justify-between mt-4">
        <span className="text-2xl font-bold text-foreground tabular-nums tracking-tight">{formatCurrency(revenue)}</span>
      </div>

      {/* Status + sent grouped */}
      <div className="flex items-center gap-1.5 flex-wrap mt-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${statusVariant(trip.status) === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : statusVariant(trip.status) === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : statusVariant(trip.status) === 'red' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${trip.status === 'completed' ? 'bg-emerald-400' : trip.status === 'in_transit' ? 'bg-amber-400' : trip.status === 'cancelled' ? 'bg-red-400' : 'bg-blue-400'}`} />
              {statusLabel}
              <ChevronDown className="w-2.5 h-2.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt.value} onClick={(e) => handleStatusChange(e, opt.value)} className="text-xs cursor-pointer flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${opt.value === 'completed' ? 'bg-emerald-400' : opt.value === 'in_transit' ? 'bg-amber-400' : opt.value === 'cancelled' ? 'bg-red-400' : 'bg-blue-400'}`} />
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
                className={`inline-flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${isSent ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20'}`}
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

      {/* Chips footer */}
      <div className="flex items-center gap-1.5 flex-wrap pt-3 mt-4 border-t border-border">
        {trip.driver_name && <MetaChip icon={User} label={trip.driver_name} onClick={(e) => handleLink(e, driverMap, trip.driver_name, '/admin/drivers')} />}
        {trip.vehicle_plate && <MetaChip icon={TruckIcon} label={trip.vehicle_plate} onClick={(e) => handleLink(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')} />}
        {trip.client_name && <MetaChip icon={Building2} label={trip.client_name} onClick={(e) => handleLink(e, clientMap, trip.client_name, '/admin/clients')} />}
        {trip.delivery_note_number && <MetaChip icon={FileText} label={trip.delivery_note_number} />}
      </div>
    </div>
  );
}