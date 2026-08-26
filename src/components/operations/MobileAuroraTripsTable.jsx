import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Copy, Check, Shield } from 'lucide-react';
import TripStatusManager from '@/components/trips/TripStatusManager';
import { setOpsBulk } from '@/lib/operationsFilterStore';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';

const STATUS = {
  scheduled:    { label: 'Scheduled', color: '#60a5fa' },
  trip_started: { label: 'Started',   color: '#fb923c' },
  trip_ended:   { label: 'Ended',     color: '#c084fc' },
  completed:   { label: 'Done',      color: '#34d399' },
  cancelled:   { label: 'Cancel',    color: '#f87171' },
};

const TRIP_EXPORT_COLUMNS = [
  { label: 'Trip #', key: 'trip_number', w: 22, noWrap: true },
  { label: 'Date', key: 'trip_date', w: 20 },
  { label: 'Driver', key: 'driver_name', w: 28 },
  { label: 'Vehicle', key: 'vehicle_plate', w: 22, noWrap: true },
  { label: 'Client', key: 'client_name', w: 32 },
  { label: 'From', key: 'from_location', w: 25 },
  { label: 'To', key: 'to_location', w: 25 },
  { label: 'Revenue', key: 'revenue', w: 20, numeric: true },
  { label: 'Status', key: 'status', w: 20 },
];

const ACCENT = '#34d399';

/**
 * Aurora Pro — award-grade mobile vertical scroll table.
 * Monochrome dark surfaces, deep emerald glow, sticky header, row dividers,
 * framer-motion micro-interactions, safe-area aware, accessible.
 * Horizontal scroll enabled — table is wider than viewport for full readability.
 */
export default function MobileAuroraTripsTable({ trips, onOpenDetail, onEdit, onDelete, onStatusUpdated, driverMap, vehicleMap, clientMap, invoiceMap, onBulkStatus, onBulkDelete }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const scrollRef = useRef(null);

  const toggleOne = (id) => setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((s) => s.size === trips.length ? new Set() : new Set(trips.map((t) => t.id)));
  const clearSelection = () => setSelected(new Set());
  const allSelected = trips.length > 0 && selected.size === trips.length;
  const selectedTrips = trips.filter((t) => selected.has(t.id));
  const selectedIds = Array.from(selected);

  const copyRef = (e, trip) => {
    e.stopPropagation();
    const ref = trip.trip_number || `#${trip.id?.slice(-6)}`;
    navigator.clipboard?.writeText(ref);
    setCopiedId(trip.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const goTo = (e, map, name, path) => {
    e.stopPropagation();
    const id = map?.[name];
    if (id) navigate(`${path}/${id}`);
  };

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
  const handleBulkDelete = async () => {
    if (onBulkDelete) await onBulkDelete(selectedIds);
    clearSelection();
  };

  useEffect(() => {
    setOpsBulk({
      selectedCount: selected.size, totalCount: trips.length,
      onSelectAll: toggleAll, onClear: clearSelection,
      onBulkStatus, onBulkDelete: handleBulkDelete,
      onBulkExportCSV: handleBulkExportCSV, onBulkExportPDF: handleBulkExportPDF,
      selectedTrips,
    });
    return () => setOpsBulk(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, trips]);

  return (
    <div
      className="md:hidden relative rounded-2xl overflow-hidden bg-card border border-primary/15"
      style={{
        boxShadow: '0 12px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Horizontal scroll wrapper — table is wider than viewport, scroll to see all columns */}
      <div className="overflow-x-auto thin-scroll">
        <div style={{ minWidth: 520 }}>

      {/* Aurora glow — animated emerald aurora at top */}
      <div
        className="absolute top-0 left-0 right-0 h-32 pointer-events-none overflow-hidden"
        style={{ borderRadius: '1rem' }}
      >
        <motion.div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-[140%] h-40 rounded-full"
          style={{
            background: `radial-gradient(ellipse at center, ${ACCENT}40 0%, ${ACCENT}08 40%, transparent 70%)`,
            filter: 'blur(30px)',
          }}
          animate={{ x: ['-8%', '8%', '-8%'], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Sticky header */}
      <div
        className="sticky top-0 z-10 grid items-center px-4 py-3 bg-card/95 backdrop-blur-xl border-b border-primary/20"
        style={{
          gridTemplateColumns: '36px 60px 1fr 88px 104px',
          gap: '8px',
        }}
      >
        <div className="flex justify-center">
          <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="border-white/20 data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-400" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Date</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">Trip / Route</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 text-right">Revenue</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 text-right">Status</span>
      </div>

      {/* Select-all count */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40">
        <span className="text-[10px] text-muted-foreground font-medium tabular-nums">
          {trips.length} trip{trips.length !== 1 ? 's' : ''}
        </span>
        {selected.size > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[10px] font-semibold ml-auto flex items-center gap-1"
            style={{ color: ACCENT }}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-black tabular-nums" style={{ background: ACCENT }}>
              {selected.size}
            </span>
            selected
          </motion.span>
        )}
      </div>

      {/* Vertical scroll body */}
      <div
        ref={scrollRef}
        className="overflow-y-auto thin-scroll"
        style={{ maxHeight: 'calc(100dvh - 280px)' }}
        role="table"
        aria-label="Trips"
      >
        {trips.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-xs text-muted-foreground">No trips found</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {trips.map((trip, i) => {
              const isSelected = selected.has(trip.id);
              const st = STATUS[trip.status] || STATUS.scheduled;
              const revenue = Number(trip.revenue) || 0;
              const ref = trip.trip_number || `#${trip.id?.slice(-6)}`;
              return (
                <motion.div
                  key={trip.id}
                  role="row"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => toggleOne(trip.id)}
                  className="grid items-start px-4 py-3 cursor-pointer relative group"
                  style={{
                    gridTemplateColumns: '36px 60px 1fr 88px 104px',
                    gap: '8px',
                    background: isSelected ? 'rgba(52,211,153,0.06)' : 'transparent',
                    borderLeft: isSelected ? '2px solid #34d399' : '2px solid transparent',
                  }}
                  whileTap={{ backgroundColor: 'rgba(52,211,153,0.04)' }}
                >
                  {/* Checkbox */}
                  <div className="flex justify-center pt-0.5 pointer-events-none">
                    <Checkbox checked={isSelected} className="border-white/20 data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-400" />
                  </div>

                  {/* Date */}
                  <span className="text-[10px] text-muted-foreground tabular-nums leading-tight pt-0.5">
                    {trip.trip_date ? formatDate(trip.trip_date).split('/')[0] + '/' + formatDate(trip.trip_date).split('/')[1] : '—'}
                  </span>

                  {/* Trip # + Route — wraps text instead of truncating */}
                  <div className="min-w-0 pr-1">
                    <button
                      onClick={(e) => copyRef(e, trip)}
                      className="text-emerald-400 font-bold text-[11px] tracking-tight flex items-center gap-1 mb-1"
                    >
                      <span className="break-all">{ref}</span>
                      {copiedId === trip.id
                        ? <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        : <Copy className="w-3 h-3 opacity-30 shrink-0" />}
                    </button>
                    <div className="flex items-start gap-1 text-[10px] text-foreground/70 leading-snug">
                      <span className="break-words font-medium">{trip.from_location || '—'}</span>
                      {trip.permit_required && trip.permit_name && (
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[7px] font-semibold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5" title={`Permit: ${trip.permit_name}`}>
                          <Shield className="w-2 h-2" />
                        </span>
                      )}
                      <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0 mt-0.5" />
                      <span className="break-words font-medium">{trip.to_location || '—'}</span>
                    </div>
                  </div>

                  {/* Revenue */}
                  <span className="text-[11px] font-bold text-foreground tabular-nums text-right leading-tight pt-0.5 whitespace-nowrap">
                    {formatCurrency(revenue)}
                  </span>

                  {/* Status */}
                  <div className="flex justify-end pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <TripStatusManager trip={trip} onUpdated={onStatusUpdated} size="sm" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
        {/* Safe-area bottom spacer */}
        <div style={{ height: 'env(safe-area-inset-bottom)' }} />
      </div>

        </div>
      </div>
    </div>
  );
}