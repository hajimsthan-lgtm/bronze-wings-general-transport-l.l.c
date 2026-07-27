import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { useTripUpdate } from '@/hooks/useEntityQueries';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Check, Send, Undo2, ArrowRight, ChevronDown } from 'lucide-react';
import { setTripInvoiceSent } from '@/lib/tripInvoice';
import StatusPill, { statusVariant } from '@/components/operations/StatusPill';
import { hexToRgba } from '@/components/reports/ReportStatCard';

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
    <div>
      {trips.map((trip, i) => {
        const invoice = invoiceMap?.[trip.id];
        const isSent = invoice?.status === 'sent';
        const statusOpt = STATUS_OPTIONS.find((s) => s.value === trip.status) || STATUS_OPTIONS[0];
        const color = STATUS_HEX[trip.status] || '#94a3b8';
        const profit = (Number(trip.revenue) || 0) - (Number(trip.fuel_cost) || 0) - (Number(trip.toll_cost) || 0) - (Number(trip.other_cost) || 0);
        return (
          <div
            key={trip.id}
            onClick={() => onOpenDetail?.(trip)}
            className="group row-card row-edge-glow cursor-pointer animate-fade-in-up mb-2"
            style={{
              animationDelay: `${Math.min(i * 0.03, 0.4)}s`,
              ['--row-accent']: color,
            }}
          >
            <span
              className="absolute left-0 top-1/2 -translate-y-1/2 h-9 w-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: color, boxShadow: `0 0 8px ${color}` }}
            />
            <div className="flex items-center gap-3 p-3 sm:p-3.5">
              {/* Route badge */}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(color, 0.12), border: `1px solid ${hexToRgba(color, 0.22)}` }}>
                <ArrowRight className="w-4 h-4" style={{ color }} />
              </div>

              {/* Main */}
              <div className="flex-1 min-w-0">
                {/* Line 1 — trip number + date */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                  <span className="font-mono text-muted-foreground/80 truncate">{trip.trip_number || `#${trip.id?.slice(-6)}`}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="tabular-nums whitespace-nowrap">{formatDate(trip.trip_date)}</span>
                </div>
                {/* Line 2 — from → to */}
                <div className="flex items-center gap-1.5 mt-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{trip.from_location || '—'}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                  <p className="text-sm font-semibold text-foreground truncate">{trip.to_location || '—'}</p>
                </div>
                {/* Line 3 — meta (desktop only, keeps mobile tap target clean) */}
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mt-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 whitespace-nowrap">
                    {t(trip.trip_type || 'one_way')}{trip.trip_type === 'hourly' && trip.hours ? ` · ${trip.hours}h` : ''}
                  </span>
                  {trip.client_name && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <button onClick={(e) => handleLink(e, clientMap, trip.client_name, '/admin/clients')} className="hover:text-primary transition-colors truncate max-w-[140px]">{trip.client_name}</button>
                    </>
                  )}
                  {trip.driver_name && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <button onClick={(e) => handleLink(e, driverMap, trip.driver_name, '/admin/drivers')} className="hover:text-primary transition-colors truncate max-w-[120px]">{trip.driver_name}</button>
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

              {/* Right — status + amount (fixed columns for perfect alignment) */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="w-[104px] sm:w-[168px] flex items-center justify-end gap-1.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                        <StatusPill as="span" variant={statusVariant(trip.status)} dot>{statusOpt.label}<ChevronDown className="w-2.5 h-2.5 ml-0.5" /></StatusPill>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
                    <div className="hidden sm:block">
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
                    </div>
                  )}
                </div>

                <div className="h-6 w-px bg-border/50 hidden sm:block" />

                <div className="w-[82px] sm:w-[96px] text-right">
                  <p className="text-sm font-bold text-foreground tabular-nums whitespace-nowrap leading-tight">{formatCurrency(trip.revenue)}</p>
                  <p className={`text-[10px] tabular-nums leading-tight ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCurrency(profit)}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}