import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { useTripUpdate } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Eye, Pencil, Trash2, MoreVertical, Check, Send, Undo2, ArrowRight } from 'lucide-react';
import { setTripInvoiceSent } from '@/lib/tripInvoice';
import StatusPill, { statusVariant } from '@/components/operations/StatusPill';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', dot: 'bg-blue-400' },
  { value: 'in_transit', label: 'In Transit', dot: 'bg-amber-400' },
  { value: 'completed', label: 'Completed', dot: 'bg-emerald-400' },
  { value: 'cancelled', label: 'Canceled', dot: 'bg-red-400' },
];

const STATUS_HEX = {
  scheduled: '#60a5fa',
  in_transit: '#fbbf24',
  completed: '#34d399',
  cancelled: '#f87171',
};

export default function TripsList({ trips, onOpenDetail, onEdit, onDelete, driverMap, vehicleMap, clientMap, invoiceMap, onInvoicesChanged }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const updateTrip = useTripUpdate();
  const { toast } = useToast();
  const [busy, setBusy] = useState({});

  const handleInvoiceSent = async (e, trip, sent) => {
    e.stopPropagation();
    if (busy[trip.id]) return;
    setBusy((b) => ({ ...b, [trip.id]: true }));
    try {
      await setTripInvoiceSent(trip, sent);
      toast({ title: sent ? 'Invoice marked as sent' : 'Invoice reverted to not sent' });
      onInvoicesChanged?.();
    } catch {
      toast({ title: 'Could not update invoice', variant: 'destructive' });
    } finally {
      setBusy((b) => ({ ...b, [trip.id]: false }));
    }
  };

  const handleLink = (e, map, name, path) => {
    e.stopPropagation();
    const id = map?.[name];
    if (id) navigate(`${path}/${id}`);
  };

  const handleStatusChange = (e, trip, newStatus) => {
    e.stopPropagation();
    updateTrip.mutate({ id: trip.id, data: { status: newStatus } });
  };

  return (
    <div className="space-y-1.5">
      {trips.map((trip, i) => {
        const invoice = invoiceMap?.[trip.id];
        const isSent = invoice?.status === 'sent';
        const statusOpt = STATUS_OPTIONS.find((s) => s.value === trip.status) || STATUS_OPTIONS[0];
        const color = STATUS_HEX[trip.status] || '#94a3b8';
        return (
          <div
            key={trip.id}
            onClick={() => onOpenDetail?.(trip)}
            className="row-card group cursor-pointer animate-fade-in-up"
            style={{ animationDelay: `${Math.min(i * 0.03, 0.4)}s` }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">
                    {trip.from_location || '—'} <ArrowRight className="inline w-3 h-3 text-muted-foreground/60 mx-0.5 -mt-px" /> {trip.to_location || '—'}
                  </p>
                  <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap">
                    {t(trip.trip_type || 'one_way')}{trip.trip_type === 'hourly' && trip.hours ? ` · ${trip.hours}h` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 min-w-0 overflow-hidden">
                  <span className="font-mono text-muted-foreground/80 whitespace-nowrap">{trip.trip_number || `#${trip.id?.slice(-6)}`}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="tabular-nums whitespace-nowrap">{formatDate(trip.trip_date)}</span>
                  {trip.client_name && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <button onClick={(e) => handleLink(e, clientMap, trip.client_name, '/admin/clients')} className="hover:text-primary transition-colors truncate max-w-[120px]">{trip.client_name}</button>
                    </>
                  )}
                  {trip.driver_name && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <button onClick={(e) => handleLink(e, driverMap, trip.driver_name, '/admin/drivers')} className="hover:text-primary transition-colors truncate max-w-[100px]">{trip.driver_name}</button>
                    </>
                  )}
                  {trip.vehicle_plate && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <button onClick={(e) => handleLink(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')} className="hover:text-primary transition-colors tabular-nums whitespace-nowrap">{trip.vehicle_plate}</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                    <StatusPill as="span" variant={statusVariant(trip.status)} dot>{statusOpt.label}</StatusPill>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                  {STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuItem key={opt.value} onClick={(e) => handleStatusChange(e, trip, opt.value)} className="text-xs cursor-pointer flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                      {opt.label}
                      {trip.status === opt.value && <Check className="w-3 h-3 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {trip.status === 'completed' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button onClick={(e) => e.stopPropagation()} disabled={busy[trip.id]} className="cursor-pointer">
                      <StatusPill as="span" variant={isSent ? 'green' : 'neutral'}>{isSent ? t('sent') : 'Not Sent'}</StatusPill>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={(e) => handleInvoiceSent(e, trip, true)} className="text-xs cursor-pointer flex items-center gap-2"><Send className="w-3 h-3" /> Mark Sent</DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => handleInvoiceSent(e, trip, false)} className="text-xs cursor-pointer flex items-center gap-2"><Undo2 className="w-3 h-3" /> Revert</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <span className="text-sm font-semibold text-foreground tabular-nums whitespace-nowrap">{formatCurrency(trip.revenue)}</span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button onClick={(e) => e.stopPropagation()} className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenDetail?.(trip); }} className="cursor-pointer flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> {t('details')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(trip); }} className="cursor-pointer flex items-center gap-2"><Pencil className="w-3.5 h-3.5" /> {t('edit')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(trip); }} className="cursor-pointer flex items-center gap-2 text-red-400"><Trash2 className="w-3.5 h-3.5" /> {t('delete')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        );
      })}
    </div>
  );
}