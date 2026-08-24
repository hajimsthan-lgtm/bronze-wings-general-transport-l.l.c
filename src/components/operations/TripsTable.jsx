import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Copy, Check, Pencil, Trash2, Eye, ChevronDown, Save } from 'lucide-react';

import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import moment from 'moment';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { formatDate } from '@/lib/formatters';
import BulkActionBar from '@/components/operations/BulkActionBar';
import TripStatusManager from '@/components/trips/TripStatusManager';

// Column widths in mm — total = 247mm (landscape A4 usable width)
const TRIP_EXPORT_COLUMNS = [
  { label: 'Trip #',       key: 'trip_number',    w: 22, noWrap: true },
  { label: 'Date',         key: 'trip_date',       w: 20 },
  { label: 'Driver',       key: 'driver_name',     w: 28 },
  { label: 'Driver Phone', key: 'driver_phone',    w: 24, noWrap: true },
  { label: 'Vehicle',      key: 'vehicle_plate',   w: 22, noWrap: true },
  { label: 'Client',       key: 'client_name',     w: 32 },
  { label: 'From',         key: 'from_location',   w: 25 },
  { label: 'To',           key: 'to_location',     w: 25 },
  { label: 'Revenue',      key: 'revenue',         w: 20, numeric: true },
  { label: 'Status',       key: 'status',          w: 20 },
  { label: 'Payment',      key: 'payment_status',  w: 19 },
];

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

export default function TripsTable({ trips, onOpenDetail, onEdit, onDelete, onStatusUpdated, driverMap, vehicleMap, clientMap, invoiceMap, onInvoicesChanged, onBulkStatus, onBulkDelete }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Progressive rendering — only render a window of rows to keep the DOM
  // small when the transaction count grows. Selection / bulk actions / export
  // all operate on the full `trips` array, so nothing is lost.
  const PAGE = 50;
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const sentinelRef = useRef(null);
  useEffect(() => { setVisibleCount(PAGE); }, [trips]);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisibleCount((c) => c + PAGE);
    }, { root: tableScrollRef.current, rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [trips]);
  const visibleTrips = trips.slice(0, visibleCount);

  // Column widths (resizable) — all columns always visible, text wraps
  const [widths, setWidths] = useState(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (saved) return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_WIDTHS;
  });
  const [resizing, setResizing] = useState(null);
  const [savedSnapshot, setSavedSnapshot] = useState(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (saved) return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_WIDTHS;
  });
  const hasLayoutChanges = useMemo(
    () => JSON.stringify(widths) !== JSON.stringify(savedSnapshot),
    [widths, savedSnapshot]
  );

  // Save column layout to localStorage
  const saveLayout = () => {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(widths));
    setSavedSnapshot(widths);
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
  const clearSelection = () => setSelected(new Set());
  const selectedIds = Array.from(selected);
  const handleBulkStatus = async (status) => {
    if (onBulkStatus) await onBulkStatus(selectedIds, status);
    clearSelection();
  };
  const handleBulkDelete = async () => {
    if (onBulkDelete) await onBulkDelete(selectedIds);
    clearSelection();
  };

  const selectedTrips = trips.filter((t) => selected.has(t.id));
  const handleBulkExportCSV = () => {
    if (selectedTrips.length === 0) return;
    const data = selectedTrips.map((tr) => ({ ...tr, trip_date: tr.trip_date ? formatDate(tr.trip_date) : '' }));
    exportToCSV(data, 'selected-trips', TRIP_EXPORT_COLUMNS);
    toast({ title: `Exported ${selectedTrips.length} trip${selectedTrips.length !== 1 ? 's' : ''} to CSV` });
  };
  const handleBulkExportPDF = () => {
    if (selectedTrips.length === 0) return;
    const data = selectedTrips.map((tr) => ({ ...tr, trip_date: tr.trip_date ? formatDate(tr.trip_date) : '' }));
    exportToPDF(data, 'selected-trips', TRIP_EXPORT_COLUMNS, 'Selected Trips', { landscape: true });
    toast({ title: `Exported ${selectedTrips.length} trip${selectedTrips.length !== 1 ? 's' : ''} to PDF` });
  };

  return (
    <div className="relative">
      {/* Bulk action bar — sticky sub-header */}
      <BulkActionBar
        selectedCount={selected.size}
        totalCount={trips.length}
        onSelectAll={toggleAll}
        onClear={clearSelection}
        onBulkStatus={handleBulkStatus}
        onBulkDelete={handleBulkDelete}
        onBulkExportCSV={handleBulkExportCSV}
        onBulkExportPDF={handleBulkExportPDF}
      />

      {/* Top horizontal scrollbar — stays fixed, doesn't scroll with vertical */}
      <div className="relative mb-1.5">
        <div
          ref={topScrollRef}
          onScroll={() => syncScroll(topScrollRef.current, tableScrollRef.current)}
          className="overflow-x-auto overflow-y-hidden trips-scroll-top rounded-md">
          
          <div style={{ width: totalWidth, height: '1px' }} />
        </div>
        {hasLayoutChanges &&
        <Button
          variant="outline"
          size="icon"
          onClick={saveLayout}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 shrink-0 z-10 bg-background/80 backdrop-blur-sm"
          title="Save Layout">
          
            <Save className="w-3.5 h-3.5" />
          </Button>
        }
      </div>
      {/* Main scrollable table */}
      <div
        ref={tableScrollRef}
        onScroll={() => syncScroll(tableScrollRef.current, topScrollRef.current)}
        className="rounded-xl border border-border shadow-sm bg-background/40 overflow-auto max-h-[70vh] trips-scroll trips-grid">
        
      <Table className="table-fixed trips-grid-table" style={{ minWidth: totalWidth }}>
        <TableHeader>
          {(() => {
            const headerBg = 'linear-gradient(180deg, rgba(var(--surf-1-rgb),0.96) 0%, rgba(var(--surf-2-rgb),0.99) 100%)';
            const headerShadow = 'inset 0 -1.5px 0 rgba(var(--panel-accent-rgb),0.30), inset 0 1px 0 rgba(255,255,255,0.06)';
            return (
            <TableRow
              className="hover:bg-transparent"
              style={{
                background: headerBg,
                backdropFilter: 'blur(16px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
                boxShadow: headerShadow,
                position: 'sticky',
                top: 0,
                zIndex: 20,
              }}
            >
            <TableHead
              className="relative pl-3 trips-grid-th"
              style={{ ...thStyle(0), background: headerBg, backdropFilter: 'blur(16px) saturate(1.3)', WebkitBackdropFilter: 'blur(16px) saturate(1.3)', boxShadow: headerShadow, position: 'sticky', top: 0, zIndex: 20 }}
            >
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="border-border/60" />
              {resizeHandle(0)}
            </TableHead>
            {[
              ['TRIP #', 'text-left'],
              ['DATE', 'text-left'],
              ['CLIENT', 'text-left'],
              ['VEHICLE & DRIVER', 'text-left'],
              ['FROM', 'text-left'],
              ['TO', 'text-left'],
              ['TRIP FARE', 'text-left'],
              ['STATUS', 'text-left'],
              ['ACTIONS', 'text-center']].
              map(([label, align], i) => {
                 const index = i + 1;
                 return (
                   <TableHead
                     key={label || 'actions'}
                     className={cn('relative text-xs font-bold uppercase tracking-wider text-foreground/80 trips-grid-th', align)}
                     style={{ ...thStyle(index), background: headerBg, backdropFilter: 'blur(16px) saturate(1.3)', WebkitBackdropFilter: 'blur(16px) saturate(1.3)', boxShadow: headerShadow, position: 'sticky', top: 0, zIndex: 20 }}
                   >
                     <span className="relative z-10">{label}</span>
                     {resizeHandle(index)}
                   </TableHead>
                 );
               })}
            </TableRow>
            );
          })()}
        </TableHeader>
        <TableBody>
          {visibleTrips.map((trip) => {
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
                        className="text-primary hover:text-cyan-400 font-bold tracking-tight text-[11px] transition-colors flex items-center gap-1 group min-w-0 whitespace-normal break-words"
                        title="Click to copy trip number">
                      <span className="whitespace-normal break-words">{ref}</span>
                      {copiedId === trip.id ?
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" /> :
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />}
                    </button>
                  </div>
                </TableCell>
                <TableCell className="text-xs font-mono text-foreground align-top whitespace-nowrap trips-grid-td">
                  {trip.trip_date ? moment(trip.trip_date).format('DD MMM YY') : '—'}
                  <span className="block text-[10px] text-[#000000]">{trip.trip_date ? moment(trip.trip_date).format('HH:mm') : ''}</span>
                </TableCell>
                {/* CLIENT — hyperlink to client detail */}
                <TableCell className="align-top trips-grid-td">
                  <button
                      onClick={(e) => goTo(e, clientMap, trip.client_name, '/admin/clients')}
                      className="text-xs font-medium text-left text-foreground hover:text-primary transition-colors block leading-tight whitespace-normal break-words"
                      title={trip.client_name}>
                    {trip.client_name?.toUpperCase() || '—'}
                  </button>
                  <div className="text-[10px] text-muted-foreground leading-tight mt-0.5 whitespace-normal break-words">{trip.contact_person || ''}</div>
                </TableCell>
                {/* VEHICLE + DRIVER — both hyperlinks */}
                <TableCell className="text-xs font-mono align-top trips-grid-td">
                  <button
                      onClick={(e) => goTo(e, vehicleMap, trip.vehicle_plate, '/admin/vehicles')}
                      className="text-foreground hover:text-primary transition-colors tabular-nums block text-left whitespace-normal break-words leading-tight text-sm"
                      title="View vehicle">
                    {trip.vehicle_plate || '—'}
                  </button>
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    <button
                        onClick={(e) => goTo(e, driverMap, trip.driver_name, '/admin/drivers')}
                        className="hover:text-primary transition-colors block text-left whitespace-normal break-words leading-tight text-[#000000] text-sm"
                        title="View driver">
                      {trip.driver_name || ''}
                    </button>
                    {trip.vendor_name && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0" title={`Vendor: ${trip.vendor_name}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        {trip.vendor_name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs align-top trips-grid-td">
                   <div className="text-foreground font-medium leading-tight whitespace-normal break-words" title={trip.from_location || ''}>
                     {trip.from_location || '—'}
                   </div>
                   {trip.trip_type === 'hourly' && trip.hours ? <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{trip.hours}h</div> : null}
                 </TableCell>
                 <TableCell className="text-xs align-top trips-grid-td">
                   <div className="text-foreground font-medium leading-tight whitespace-normal break-words" title={trip.to_location || ''}>
                     {trip.to_location || '—'}
                   </div>
                 </TableCell>
                <TableCell className="text-left align-top trips-grid-td">
                   <div className="text-xs font-semibold font-mono tabular-nums text-foreground whitespace-normal break-words">{trip.revenue != null ? Number(trip.revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</div>
                 </TableCell>
                  {/* STATUS — workflow dropdown with conditional modals */}
                  <TableCell onClick={(e) => e.stopPropagation()} className="align-top trips-grid-td">
                    <TripStatusManager trip={trip} onUpdated={onStatusUpdated} />
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
                        onClick={() => setDeleteTarget(trip)}
                        className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 p-1.5 transition-colors"
                        title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>);

            })}
            {visibleCount < trips.length && (
            <TableRow ref={sentinelRef} className="hover:bg-transparent">
             <TableCell colSpan={10} className="text-center text-xs text-muted-foreground py-3">
               Loading more… ({visibleCount}/{trips.length})
             </TableCell>
            </TableRow>
            )}
            </TableBody>
            </Table>
            </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete trip {deleteTarget?.trip_number || `#${deleteTarget?.id?.slice(-6)}`}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {onDelete?.(deleteTarget);setDeleteTarget(null);}}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>);

}