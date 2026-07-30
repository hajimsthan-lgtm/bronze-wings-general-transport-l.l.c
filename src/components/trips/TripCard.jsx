import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { useTripUpdate } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { User, Truck as TruckIcon, Building2, ChevronDown, Check, Copy, Send, Undo2, Calendar, ArrowRight, Wallet } from 'lucide-react';
import { useState } from 'react';
import { setTripInvoiceSent } from '@/lib/tripInvoice';
import MetaChip from '@/components/operations/MetaChip';
import StatusPill, { statusVariant } from '@/components/operations/StatusPill';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', dot: 'bg-blue-400' },
  { value: 'in_transit', label: 'In Transit', dot: 'bg-amber-400' },
  { value: 'completed', label: 'Completed', dot: 'bg-emerald-400' },
  { value: 'cancelled', label: 'Canceled', dot: 'bg-red-400' },
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

  const statusOpt = STATUS_OPTIONS.find((s) => s.value === trip.status) || STATUS_OPTIONS[0];
  const revenue = Number(trip.revenue) || 0;

  return (
    <div
      onClick={() => onClick?.(trip)}
      className="entity-card group cursor-pointer p-3.5"
    >
      {/* Top row: status + type + invoice */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={(e) => e.stopPropagation()} className="cursor-pointer flex-shrink-0">
                <StatusPill as="span" variant={statusVariant(trip.status)} dot>{statusOpt.label}<ChevronDown className="w-2.5 h-2.5 ml-0.5" /></StatusPill>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuItem key={opt.value} onClick={(e) => handleStatusChange(e, opt.value)} className="text-xs cursor-pointer flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                  {opt.label}
                  {trip.status === opt.value && <Check className="w-3 h-3 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <span className={`inline-flex items-center px-1.5 h-5 rounded-md text-[9px] font-medium flex-shrink-0 ${TYPE_STYLE[trip.trip_type] || TYPE_STYLE.one_way}`}>
            {t(trip.trip_type || 'one_way')}
          </span>
        </div>
        {trip.status === 'completed' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={(e) => e.stopPropagation()} disabled={invoiceBusy} className="cursor-pointer flex-shrink-0">
                <StatusPill as="span" variant={isSent ? 'green' : 'neutral'}>{isSent ? t('sent') : 'Not Sent'}<ChevronDown className="w-2.5 h-2.5 ml-0.5" /></StatusPill>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={(e) => handleInvoiceSent(e, true)} className="text-xs cursor-pointer flex items-center gap-2"><Send className="w-3 h-3" /> Mark Sent</DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleInvoiceSent(e, false)} className="text-xs cursor-pointer flex items-center gap-2"><Undo2 className="w-3 h-3" /> Revert</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Route — from → to */}
      <div className="flex items-center gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{t('from')}</p>
          <p className="text-sm font-semibold text-foreground truncate">{trip.from_location || '—'}</p>
        </div>
        <div className="flex flex-col items-center flex-shrink-0">
          <span className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20">
            <ArrowRight className="w-3.5 h-3.5 text-primary" />
          </span>
        </div>
        <div className="min-w-0 flex-1 text-right">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">{t('to')}</p>
          <p className="text-sm font-semibold text-foreground truncate">{trip.to_location || '—'}</p>
        </div>
      </div>

      {/* Revenue + date + trip no */}
      <div className="flex items-end justify-between gap-2 pt-2.5 border-t border-border/50">
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
            <Wallet className="w-3 h-3" />{t('revenue')}
          </div>
          <p className="text-lg font-bold text-foreground tabular-nums tracking-tight leading-tight">{formatCurrency(revenue)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1 justify-end">
            <Calendar className="w-3 h-3" />{formatDate(trip.trip_date)}
          </p>
          <button onClick={copyTripNumber} className="font-mono text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 justify-end mt-0.5" title="Click to copy trip number">
            <span className="truncate max-w-[100px]">{trip.trip_number || `#${trip.id?.slice(-6)}`}</span>
            <Copy className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Footer: meta chips */}
      <div className="flex items-center gap-1 flex-wrap pt-2.5 mt-2.5 border-t border-border/50">
        {trip.client_name && <MetaChip icon={Building2} label={trip.client_name} onClick={(e) => handleLink(e, clientMap, trip.client_name, '/admin/clients')} />}
        {trip.driver_name && <MetaChip icon={User} label={trip.driver_name} onClick={(e) => handleLink(e, driverMap, trip.driver_name, '/admin/drivers')} />}
        {trip.vehicle_plate && <MetaChip icon={TruckIcon} label={trip.vehicle_plate} onClick={(e) => handleLink(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')} />}
      </div>
    </div>
  );
}