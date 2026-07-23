import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { useTripUpdate } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Eye, Pencil, Trash2, MoreVertical, ChevronDown, Check, Send, Undo2 } from 'lucide-react';
import { setTripInvoiceSent } from '@/lib/tripInvoice';
import StatusPill, { statusVariant } from '@/components/operations/StatusPill';

const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled', dot: 'bg-blue-400' },
  { value: 'in_transit', label: 'In Transit', dot: 'bg-amber-400' },
  { value: 'completed', label: 'Completed', dot: 'bg-emerald-400' },
  { value: 'cancelled', label: 'Canceled', dot: 'bg-red-400' },
];

export default function TripsTable({ trips, onOpenDetail, onEdit, onDelete, driverMap, vehicleMap, clientMap, invoiceMap, onInvoicesChanged }) {
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
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-md overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap">{t('record_id')} / {t('date')}</th>
            <th className="text-left text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap">{t('route')}</th>
            <th className="text-left text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap hidden md:table-cell">{t('client')}</th>
            <th className="text-left text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap hidden lg:table-cell">{t('driver')} / {t('vehicle')}</th>
            <th className="text-right text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap">{t('amount')}</th>
            <th className="text-left text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap">{t('status')} / {t('billing')}</th>
            <th className="text-right text-xs text-muted-foreground tracking-wider font-semibold uppercase px-4 py-3 whitespace-nowrap">{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => {
            const invoice = invoiceMap?.[trip.id];
            const isSent = invoice?.status === 'sent';
            const statusOpt = STATUS_OPTIONS.find((s) => s.value === trip.status) || STATUS_OPTIONS[0];
            return (
              <tr
                key={trip.id}
                onClick={() => onOpenDetail?.(trip)}
                className="border-b border-border/60 hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className="font-mono text-xs text-foreground">{trip.trip_number || `#${trip.id?.slice(-6)}`}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{formatDate(trip.trip_date)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-foreground font-medium truncate max-w-[220px]">{trip.from_location || '—'} → {trip.to_location || '—'}</p>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t(trip.trip_type || 'one_way')}{trip.trip_type === 'hourly' && trip.hours ? ` · ${trip.hours}h` : ''}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <button onClick={(e) => handleLink(e, clientMap, trip.client_name, '/admin/clients')} className="text-foreground hover:text-primary transition-colors truncate max-w-[140px] block">
                    {trip.client_name || '—'}
                  </button>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <button onClick={(e) => handleLink(e, driverMap, trip.driver_name, '/admin/drivers')} className="text-foreground hover:text-primary transition-colors block truncate max-w-[140px]">{trip.driver_name || '—'}</button>
                  <button onClick={(e) => handleLink(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')} className="text-xs text-muted-foreground hover:text-primary transition-colors tabular-nums">{trip.vehicle_plate || ''}</button>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span className="font-semibold text-foreground tabular-nums">{formatCurrency(trip.revenue)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}