import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Copy, Check, MoreHorizontal, MessageCircle, Printer, User, ArrowRight, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import moment from 'moment';

const STATUS_HEX = {
  scheduled: '#60a5fa',
  in_transit: '#fbbf24',
  completed: '#34d399',
  cancelled: '#f87171',
};

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  in_transit: 'In Transit',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const PAYMENT_LABEL = {
  corporate_credit: 'Corp',
  cash_received: 'Cash',
  bank_received: 'Bank',
};

export default function TripsTable({ trips, onOpenDetail, onEdit, onDelete, onStatusChange, driverMap, vehicleMap, clientMap, invoiceMap, onInvoicesChanged }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState(null);
  const [selected, setSelected] = useState(new Set());

  // Column widths (resizable) — costs & profit removed
  const [widths, setWidths] = useState({
    0: 44,   // checkbox
    1: 150,  // trip #
    2: 110,  // date
    3: 180,  // client
    4: 130,  // vehicle
    5: 200,  // route
    6: 120,  // revenue
    7: 140,  // status (wider for dropdown)
    8: 110,  // payment
    9: 110,  // actions
  });
  const [resizing, setResizing] = useState(null);

  const totalWidth = useMemo(() => Object.values(widths).reduce((a, b) => a + b, 0), [widths]);

  const startResize = (index, e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ index, startX: e.clientX, startW: widths[index] });
  };

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const delta = e.clientX - resizing.startX;
      setWidths((w) => ({ ...w, [resizing.index]: Math.max(60, resizing.startW + delta) }));
    };
    const onUp = () => setResizing(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizing]);

  const thStyle = (i) => ({ width: widths[i], minWidth: widths[i] });

  const resizeHandle = (i) => (
    <span
      onMouseDown={(e) => startResize(i, e)}
      className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 transition-colors z-20"
    />
  );

  const copyRef = (trip) => {
    const ref = trip.trip_number || `#${trip.id?.slice(-6)}`;
    navigator.clipboard?.writeText(ref);
    setCopiedId(trip.id);
    toast({ title: 'Copied', description: ref });
    setTimeout(() => setCopiedId(null), 1500);
  };

  const goTo = (e, map, name, path) => {
    e.stopPropagation();
    const id = map?.[name];
    if (id) navigate(`${path}/${id}`);
  };

  const toggleOne = (id) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    setSelected((s) => s.size === trips.length ? new Set() : new Set(trips.map(t => t.id)));
  };
  const allSelected = trips.length > 0 && selected.size === trips.length;

  const handleStatusChange = async (trip, newStatus) => {
    if (newStatus === trip.status) return;
    onStatusChange?.(trip, newStatus);
  };

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-xl border border-border shadow-sm bg-background/40">
      <Table className="table-fixed" style={{ minWidth: totalWidth }}>
        <TableHeader>
          <TableRow className="bg-muted/60 sticky top-0 z-10 hover:bg-muted/60">
            <TableHead className="relative pl-3" style={thStyle(0)}>
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="border-border/60" />
              {resizeHandle(0)}
            </TableHead>
            {[
              ['TRIP #', 'text-left'],
              ['DATE', 'text-left'],
              ['CLIENT', 'text-left'],
              ['VEHICLE', 'text-left hidden md:table-cell'],
              ['ROUTE', 'text-left hidden lg:table-cell'],
              ['REVENUE', 'text-right'],
              ['STATUS', 'text-left'],
              ['PAYMENT', 'text-left hidden md:table-cell'],
              ['', 'text-center'],
            ].map(([label, align], i) => {
              const index = i + 1;
              return (
                <TableHead key={label || 'actions'} className={cn('relative text-xs font-semibold uppercase tracking-wider text-muted-foreground', align)} style={thStyle(index)}>
                  {label}
                  {resizeHandle(index)}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => {
            const isSelected = selected.has(trip.id);
            const ref = trip.trip_number || `#${trip.id?.slice(-6)}`;
            return (
              <TableRow
                key={trip.id}
                className={cn(
                  'transition-all duration-150 group',
                  isSelected ? 'bg-primary/[0.07]' : 'hover:bg-primary/5',
                  trip.status === 'cancelled' && 'opacity-60 border-l-2 border-l-red-500/50'
                )}
              >
                <TableCell className="pl-3" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(trip.id)} className="border-border/60" />
                </TableCell>
                <TableCell className="text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); copyRef(trip); }}
                      className="text-primary hover:text-cyan-400 font-bold tracking-tight text-[11px] transition-colors flex items-center gap-1 group"
                      title="Click to copy trip number"
                    >
                      {ref}
                      {copiedId === trip.id
                        ? <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        : <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">
                  {trip.trip_date ? moment(trip.trip_date).format('DD MMM YY') : '—'}
                  <span className="block text-[10px] opacity-60">{trip.trip_date ? moment(trip.trip_date).format('HH:mm') : ''}</span>
                </TableCell>
                {/* CLIENT — hyperlink to client detail */}
                <TableCell>
                  <button
                    onClick={(e) => goTo(e, clientMap, trip.client_name, '/admin/clients')}
                    className="text-sm font-medium truncate max-w-[160px] text-left hover:text-primary transition-colors block"
                    title={trip.client_name}
                  >
                    {trip.client_name?.toUpperCase() || '—'}
                  </button>
                  <div className="text-xs text-muted-foreground truncate max-w-[160px]">{trip.contact_person || ''}</div>
                </TableCell>
                {/* VEHICLE + DRIVER — both hyperlinks */}
                <TableCell className="text-xs font-mono hidden md:table-cell">
                  <button
                    onClick={(e) => goTo(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')}
                    className="hover:text-primary transition-colors tabular-nums block text-left"
                    title="View vehicle"
                  >
                    {trip.vehicle_plate || '—'}
                  </button>
                  <button
                    onClick={(e) => goTo(e, driverMap, trip.driver_name, '/admin/drivers')}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors truncate max-w-[110px] block text-left"
                    title="View driver"
                  >
                    {trip.driver_name || ''}
                  </button>
                </TableCell>
                <TableCell className="text-xs hidden lg:table-cell">
                  <div className="flex items-center gap-1 max-w-[180px]">
                    <span className="truncate text-foreground">{trip.from_location || '—'}</span>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                    <span className="truncate text-foreground">{trip.to_location || '—'}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t(trip.trip_type || 'one_way')}{trip.trip_type === 'hourly' && trip.hours ? ` · ${trip.hours}h` : ''}</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="text-sm font-semibold font-mono">{formatCurrency(trip.revenue)}</div>
                  <span className={cn(
                    'text-[9px] font-bold px-1.5 py-0.5 rounded-full border inline-block mt-0.5',
                    trip.payment_status === 'cash_received' && 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                    trip.payment_status === 'bank_received' && 'text-blue-400 border-blue-500/30 bg-blue-500/10',
                    trip.payment_status === 'corporate_credit' && 'text-amber-400 border-amber-500/30 bg-amber-500/10',
                  )}>
                    {trip.payment_status === 'cash_received' ? '✓ Cash' : trip.payment_status === 'bank_received' ? '✓ Bank' : '⏳ Credit'}
                  </span>
                </TableCell>
                {/* STATUS — inline dropdown for direct change */}
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'text-[10px] font-bold px-2 py-1 rounded-full border inline-flex items-center gap-1 transition-colors hover:brightness-125',
                          trip.status === 'completed' && 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                          trip.status === 'in_transit' && 'text-amber-400 border-amber-500/30 bg-amber-500/10',
                          trip.status === 'scheduled' && 'text-blue-400 border-blue-500/30 bg-blue-500/10',
                          trip.status === 'cancelled' && 'text-red-400 border-red-500/30 bg-red-500/10',
                        )}
                      >
                        {trip.status === 'completed' ? '✓ Complete' : trip.status === 'in_transit' ? '⏳ Transit' : trip.status === 'cancelled' ? '✗ Cancel' : '◦ Sched'}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Set Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {['scheduled', 'in_transit', 'completed', 'cancelled'].map((st) => (
                        <DropdownMenuItem
                          key={st}
                          onClick={() => handleStatusChange(trip, st)}
                          className={cn(
                            'gap-2 text-xs',
                            trip.status === st && 'bg-primary/10 font-semibold',
                          )}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: STATUS_HEX[st] }} />
                          {STATUS_LABELS[st]}
                          {trip.status === st && <Check className="w-3 h-3 ml-auto" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary" className="text-[10px]">{PAYMENT_LABEL[trip.payment_status] || trip.payment_status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenDetail?.(trip)}
                      className="rounded-full bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 p-1.5 transition-colors"
                      title="WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenDetail?.(trip)}
                      className="rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 p-1.5 transition-colors"
                      title="View Details"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit?.(trip)}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onOpenDetail?.(trip)}>
                          <User className="w-3.5 h-3.5 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onDelete?.(trip)} className="text-destructive">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}