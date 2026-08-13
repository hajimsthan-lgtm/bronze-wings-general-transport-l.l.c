import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Copy, Check, MoreHorizontal, MessageCircle, Printer, User, ArrowRight, Pencil, Trash2, ChevronDown } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import moment from 'moment';

const STATUS_HEX = {
  scheduled: '#60a5fa',
  in_transit: '#fbbf24',
  completed: '#34d399',
  cancelled: '#f87171'
};

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  in_transit: 'In Transit',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const PAYMENT_LABEL = {
  corporate_credit: 'Corp',
  cash_received: 'Cash',
  bank_received: 'Bank'
};

export default function TripsTable({ trips, onOpenDetail, onEdit, onDelete, onStatusChange, driverMap, vehicleMap, clientMap, invoiceMap, onInvoicesChanged }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState(null);
  const [selected, setSelected] = useState(new Set());

  // Column widths (resizable) — all columns always visible, text wraps
  const [widths, setWidths] = useState({
    0: 44, // checkbox
    1: 130, // trip #
    2: 100, // date
    3: 180, // client
    4: 140, // vehicle
    5: 220, // route
    6: 110, // revenue
    7: 130, // status
    8: 90, // payment
    9: 100 // actions
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
    return () => {window.removeEventListener('mousemove', onMove);window.removeEventListener('mouseup', onUp);};
  }, [resizing]);

  const thStyle = (i) => ({ width: widths[i], minWidth: widths[i] });

  const resizeHandle = (i) =>
  <span
    onMouseDown={(e) => startResize(i, e)}
    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-primary/40 transition-colors z-20" />;



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
    setSelected((s) => {const n = new Set(s);n.has(id) ? n.delete(id) : n.add(id);return n;});
  };
  const toggleAll = () => {
    setSelected((s) => s.size === trips.length ? new Set() : new Set(trips.map((t) => t.id)));
  };
  const allSelected = trips.length > 0 && selected.size === trips.length;

  const handleStatusChange = async (trip, newStatus) => {
    if (newStatus === trip.status) return;
    onStatusChange?.(trip, newStatus);
  };

  return (
    <div
      className="rounded-xl border border-border shadow-sm bg-background/40 overflow-auto max-h-[70vh] trips-scroll"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'hsl(var(--primary) / 0.5) transparent' }}
    >
     {/* DATE */}
<TableCell className="text-xs font-mono text-black align-top whitespace-nowrap">
  {trip.trip_date ? moment(trip.trip_date).format('DD MMM YY') : '—'}
  <span className="block text-[10px] text-black/70">{trip.trip_date ? moment(trip.trip_date).format('HH:mm') : ''}</span>
</TableCell>

{/* CLIENT */}
<TableCell className="align-top">
  <button
    onClick={(e) => goTo(e, clientMap, trip.client_name, '/admin/clients')}
    className="text-xs font-medium text-left text-black hover:text-primary transition-colors block break-words leading-tight"
    title={trip.client_name}>
    {trip.client_name?.toUpperCase() || '—'}
  </button>
  <div className="text-[10px] text-black/70 break-words leading-tight mt-0.5">{trip.contact_person || ''}</div>
</TableCell>

{/* VEHICLE + DRIVER */}
<TableCell className="text-xs font-mono align-top">
  <button
    onClick={(e) => goTo(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')}
    className="text-black hover:text-primary transition-colors tabular-nums block text-left break-words leading-tight"
    title="View vehicle">
    {trip.vehicle_plate || '—'}
  </button>
  <button
    onClick={(e) => goTo(e, driverMap, trip.driver_name, '/admin/drivers')}
    className="text-[10px] text-black/70 hover:text-primary transition-colors block text-left break-words leading-tight mt-0.5"
    title="View driver">
    {trip.driver_name || ''}
  </button>
</TableCell>

{/* ROUTE */}
<TableCell className="text-xs align-top">
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-1.5 break-words leading-tight">
      <span className="text-black break-words font-medium">{trip.from_location || '—'}</span>
      <ArrowRight className="w-3 h-3 text-black/40 flex-shrink-0" />
      <span className="text-black break-words font-medium">{trip.to_location || '—'}</span>
    </div>
    {trip.trip_type === 'hourly' && trip.hours ? <div className="text-[10px] text-black/70 uppercase tracking-wider break-words">{trip.hours}h</div> : null}
  </div>
</TableCell>

{/* TRIP FARE */}
<TableCell className="text-left align-top">
  <div className="text-xs font-semibold font-mono tabular-nums text-black">{trip.revenue != null ? Number(trip.revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>
</TableCell>
              </TableRow>);

          })}
        </TableBody>
      </Table>
    </div>);

}