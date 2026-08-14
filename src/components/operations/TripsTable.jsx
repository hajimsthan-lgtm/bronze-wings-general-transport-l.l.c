import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Copy, Check, Pencil, Trash2, Eye, ChevronDown, Save } from 'lucide-react';

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

const DEFAULT_WIDTHS = {
  0: 44, 1: 120, 2: 90, 3: 220, 4: 130, 5: 160, 6: 160, 7: 100, 8: 120, 9: 100
};
const LAYOUT_KEY = 'trips-table-layout-v1';

export default function TripsTable({ trips, onOpenDetail, onEdit, onDelete, onStatusChange, driverMap, vehicleMap, clientMap, invoiceMap, onInvoicesChanged }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState(null);
  const [selected, setSelected] = useState(new Set());

  // Column widths (resizable) — all columns always visible, text wraps
  const [widths, setWidths] = useState(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (saved) return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_WIDTHS;
  });
  const [resizing, setResizing] = useState(null);

  // Save column layout to localStorage
  const saveLayout = () => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(widths));
    toast({ title: 'Layout Saved', description: 'Column widths saved for future sessions' });
  };

  // Scroll sync — top scrollbar ↔ table container
  const topScrollRef = useRef(null);
  const tableScrollRef = useRef(null);
  const syncScroll = (source, target) => {
    if (!target) return;
    if (Math.abs(target.scrollLeft - source.scrollLeft) < 1) return;
    target.scrollLeft = source.scrollLeft;
  };

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
    <div className="relative">
      {/* Top horizontal scrollbar — stays fixed, doesn't scroll with vertical */}
      <div className="flex items-center gap-2 mb-1.5">
        <div
          ref={topScrollRef}
          onScroll={() => syncScroll(topScrollRef.current, tableScrollRef.current)}
          className="flex-1 overflow-x-auto overflow-y-hidden trips-scroll-top rounded-md"
        >
          <div style={{ width: totalWidth, height: '1px' }} />
        </div>
        <Button variant="outline" size="sm" onClick={saveLayout} className="shrink-0 h-7 text-xs gap-1">
          <Save className="w-3.5 h-3.5" /> Save Layout
        </Button>
      </div>
      {/* Main scrollable table */}
      <div
        ref={tableScrollRef}
        onScroll={() => syncScroll(tableScrollRef.current, topScrollRef.current)}
        className="rounded-xl border border-border shadow-sm bg-background/40 overflow-auto max-h-[70vh] trips-scroll trips-grid"
      >
      <Table className="table-fixed trips-grid-table" style={{ minWidth: totalWidth }}>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="relative pl-3 trips-grid-th sticky top-0 z-10 bg-muted" style={thStyle(0)}>
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="border-border/60" />
              {resizeHandle(0)}
            </TableHead>
            {[
            ['TRIP #', 'text-left'],
            ['DATE', 'text-left'],
            ['CLIENT', 'text-left'],
            ['VEHICLE', 'text-left'],
            ['FROM', 'text-left'],
            ['TO', 'text-left'],
            ['TRIP FARE', 'text-left'],
            ['STATUS', 'text-left'],
            ['ACTIONS', 'text-center']].
            map(([label, align], i) => {
              const index = i + 1;
              return (
                <TableHead key={label || 'actions'} className={cn('relative text-xs font-semibold uppercase tracking-wider text-foreground/75 trips-grid-th sticky top-0 z-10 bg-muted', align)} style={thStyle(index)}>
                  {label}
                  {resizeHandle(index)}
                </TableHead>);

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
                )}>
                
                <TableCell className="pl-3 trips-grid-td" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(trip.id)} className="border-border/60" />
                </TableCell>
                <TableCell className="text-xs font-mono align-top trips-grid-td">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <button
                      onClick={(e) => {e.stopPropagation();copyRef(trip);}}
                      className="text-primary hover:text-cyan-400 font-bold tracking-tight text-[11px] transition-colors flex items-center gap-1 group min-w-0 truncate"
                      title="Click to copy trip number">
                      <span className="truncate">{ref}</span>
                      {copiedId === trip.id ?
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" /> :
                      <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-black align-top whitespace-nowrap trips-grid-td">
                  {trip.trip_date ? moment(trip.trip_date).format('DD MMM YY') : '—'}
                  <span className="block text-[10px] text-black/70">{trip.trip_date ? moment(trip.trip_date).format('HH:mm') : ''}</span>
                </TableCell>
                {/* CLIENT — hyperlink to client detail */}
                <TableCell className="align-top trips-grid-td">
                  <button
                    onClick={(e) => goTo(e, clientMap, trip.client_name, '/admin/clients')}
                    className="text-xs font-medium text-left text-black hover:text-primary transition-colors block truncate leading-tight"
                    title={trip.client_name}>
                    {trip.client_name?.toUpperCase() || '—'}
                  </button>
                  <div className="text-[10px] text-black/70 truncate leading-tight mt-0.5">{trip.contact_person || ''}</div>
                </TableCell>
                {/* VEHICLE + DRIVER — both hyperlinks */}
                <TableCell className="text-xs font-mono align-top trips-grid-td">
                  <button
                    onClick={(e) => goTo(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')}
                    className="text-black hover:text-primary transition-colors tabular-nums block text-left truncate leading-tight"
                    title="View vehicle">
                    {trip.vehicle_plate || '—'}
                  </button>
                  <button
                    onClick={(e) => goTo(e, driverMap, trip.driver_name, '/admin/drivers')}
                    className="text-[10px] text-black/70 hover:text-primary transition-colors block text-left truncate leading-tight mt-0.5"
                    title="View driver">
                    {trip.driver_name || ''}
                  </button>
                </TableCell>
                <TableCell className="text-xs align-top trips-grid-td">
                  <div className="text-black truncate font-medium leading-tight" title={trip.from_location || ''}>
                    {trip.from_location || '—'}
                  </div>
                  {trip.trip_type === 'hourly' && trip.hours ? <div className="text-[10px] text-black/70 uppercase tracking-wider truncate mt-0.5">{trip.hours}h</div> : null}
                </TableCell>
                <TableCell className="text-xs align-top trips-grid-td">
                  <div className="text-black truncate font-medium leading-tight" title={trip.to_location || ''}>
                    {trip.to_location || '—'}
                  </div>
                </TableCell>
                <TableCell className="text-left align-top trips-grid-td">
                  <div className="text-xs font-semibold font-mono tabular-nums text-black truncate">{trip.revenue != null ? Number(trip.revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>
                </TableCell>
                  {/* STATUS — inline dropdown for direct change */}
                  <TableCell onClick={(e) => e.stopPropagation()} className="align-top trips-grid-td">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          'text-[10px] font-bold px-2 py-1 rounded-full border inline-flex items-center gap-1 transition-colors hover:brightness-125',
                          trip.status === 'completed' && 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                          trip.status === 'in_transit' && 'text-amber-400 border-amber-500/30 bg-amber-500/10',
                          trip.status === 'scheduled' && 'text-blue-400 border-blue-500/30 bg-blue-500/10',
                          trip.status === 'cancelled' && 'text-red-400 border-red-500/30 bg-red-500/10'
                        )}>
                        
                        {trip.status === 'completed' ? '✓ Complete' : trip.status === 'in_transit' ? '⏳ Transit' : trip.status === 'cancelled' ? '✗ Cancel' : '◦ Sched'}
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Set Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {['scheduled', 'in_transit', 'completed', 'cancelled'].map((st) =>
                      <DropdownMenuItem
                        key={st}
                        onClick={() => handleStatusChange(trip, st)}
                        className={cn(
                          'gap-2 text-xs',
                          trip.status === st && 'bg-primary/10 font-semibold'
                        )}>
                        
                          <span className="w-2 h-2 rounded-full" style={{ background: STATUS_HEX[st] }} />
                          {STATUS_LABELS[st]}
                          {trip.status === st && <Check className="w-3 h-3 ml-auto" />}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="align-top trips-grid-td" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onOpenDetail?.(trip)}
                      className="rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 p-1.5 transition-colors"
                      title="View">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onEdit?.(trip)}
                      className="rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 p-1.5 transition-colors"
                      title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete?.(trip)}
                      className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 p-1.5 transition-colors"
                      title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>);

          })}
        </TableBody>
      </Table>
      </div>
    </div>);

}