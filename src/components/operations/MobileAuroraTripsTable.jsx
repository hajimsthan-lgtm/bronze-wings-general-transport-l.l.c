import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Copy, Check, Shield, Eye, Pencil, Trash2, X, FileSpreadsheet, FileText, CheckSquare, Square } from 'lucide-react';
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
  { label: 'Driver Phone', key: 'driver_phone', w: 24 },
  { label: 'Vehicle', key: 'vehicle_plate', w: 22, noWrap: true },
  { label: 'Client', key: 'client_name', w: 32 },
  { label: 'From', key: 'from_location', w: 25 },
  { label: 'To', key: 'to_location', w: 25 },
  { label: 'Revenue', key: 'revenue', w: 20, numeric: true },
  { label: 'Status', key: 'status', w: 20 },
];

const ACCENT = '#34d399';
const AUTO_VANISH_MS = 1500;

/**
 * Inline row action overlay — renders INSIDE the pressed row (position: absolute).
 * Uses left:50% / top:50% / translate(-50%,-50%) to center within the row.
 * Icons follow the row naturally during horizontal scroll — no refs or calculations needed.
 * Auto-vanishes after 1.5s.
 */
function RowActionOverlay({ trip, onOpenDetail, onEdit, onDelete, onClose }) {
  const vanishTimer = useRef(null);

  useEffect(() => {
    vanishTimer.current = setTimeout(() => onClose(), AUTO_VANISH_MS);
    return () => clearTimeout(vanishTimer.current);
  }, [onClose]);

  const actions = [
    { icon: Eye, label: 'View', color: '#3b82f6', onClick: () => { onOpenDetail?.(trip); onClose(); } },
    { icon: Pencil, label: 'Edit', color: '#fbbf24', onClick: () => { onEdit?.(trip); onClose(); } },
    { icon: Trash2, label: 'Delete', color: '#ef4444', onClick: () => { onDelete?.(trip); onClose(); } },
  ];

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 flex items-center justify-center gap-2"
      style={{ zIndex: 50 }}
      initial={{ opacity: 0, scale: 0.7, x: '-50%', y: '-50%' }}
      animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
      exit={{ opacity: 0, scale: 0.7, x: '-50%', y: '-50%' }}
      transition={{ type: 'spring', damping: 18, stiffness: 300, duration: 0.25 }}
      onClick={(e) => e.stopPropagation()}
    >
      {actions.map((action, i) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.label}
            onClick={(e) => { e.stopPropagation(); action.onClick(); }}
            className="flex items-center justify-center active:scale-90 transition-transform"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, ${action.color}, ${action.color}cc)`,
                boxShadow: `0 4px 14px -3px ${action.color}80, 0 0 0 2px rgba(255,255,255,0.12), inset 0 1px 0 rgba(255,255,255,0.25)`,
              }}
            >
              <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}

/**
 * Aurora Pro — award-grade mobile vertical scroll table.
 */
export default function MobileAuroraTripsTable({ trips, onOpenDetail, onEdit, onDelete, onStatusUpdated, driverMap, vehicleMap, clientMap, invoiceMap, onBulkStatus, onBulkDelete }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [longPressTrip, setLongPressTrip] = useState(null);
  const scrollRef = useRef(null);
  const longPressTimer = useRef(null);

  // Long-press (0.7s) to reveal per-row action buttons
  const startLongPress = (trip) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressTrip(trip);
      if (navigator.vibrate) navigator.vibrate(40);
    }, 700);
  };
  const cancelLongPress = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

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
        <div style={{ minWidth: 560 }}>

      {/* Bulk action bar — appears when trips are selected */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="sticky top-0 z-30 flex items-center gap-2 px-3 py-2.5 border-b border-emerald-500/25"
            style={{
              background: 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.06))',
              backdropFilter: 'blur(16px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(16px) saturate(1.4)',
            }}
          >
            <span
              className="flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold text-black tabular-nums shrink-0"
              style={{ background: ACCENT, boxShadow: `0 0 12px -2px ${ACCENT}80` }}
            >
              {selected.size}
            </span>
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider shrink-0">selected</span>
            <div className="flex-1" />
            <button onClick={toggleAll} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold uppercase tracking-wide active:scale-95 transition">
              {allSelected ? <Square className="w-3 h-3" /> : <CheckSquare className="w-3 h-3" />}
              {allSelected ? 'Deselect' : 'All'}
            </button>
            <button onClick={handleBulkExportCSV} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[10px] font-semibold uppercase tracking-wide active:scale-95 transition">
              <FileSpreadsheet className="w-3 h-3" /> CSV
            </button>
            <button onClick={handleBulkExportPDF} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[10px] font-semibold uppercase tracking-wide active:scale-95 transition">
              <FileText className="w-3 h-3" /> PDF
            </button>
            <button onClick={handleBulkDelete} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-semibold uppercase tracking-wide active:scale-95 transition">
              <Trash2 className="w-3 h-3" /> Del
            </button>
            <button onClick={clearSelection} className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/8 border border-white/15 text-muted-foreground active:scale-95 transition shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
                  onTouchStart={() => startLongPress(trip)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  className="relative cursor-pointer group select-none px-4 py-3"
                  style={{
                    background: isSelected ? 'rgba(52,211,153,0.06)' : 'transparent',
                    borderLeft: isSelected ? '2px solid #34d399' : '2px solid transparent',
                    overflow: longPressTrip?.id === trip.id ? 'hidden' : 'visible',
                  }}
                >
                  {/* LAYER 1 — Row content (BLURRED on long-press). filter:blur only
                      affects THIS element's children, NOT the sibling icon overlay. */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 60px 1fr 88px 104px',
                      gap: '8px',
                      alignItems: 'start',
                      filter: longPressTrip?.id === trip.id ? 'blur(8px)' : 'none',
                      opacity: longPressTrip?.id === trip.id ? 0.8 : 1,
                      transition: 'filter 0.2s ease, opacity 0.2s ease',
                    }}
                  >
                    {/* Checkbox — toggles selection for bulk actions */}
                    <div className="flex justify-center pt-0.5" onClick={(e) => { e.stopPropagation(); toggleOne(trip.id); }}>
                      <Checkbox checked={isSelected} className="border-white/20 data-[state=checked]:bg-emerald-400 data-[state=checked]:border-emerald-400" />
                    </div>

                    {/* Date */}
                    <span className="text-[10px] text-muted-foreground tabular-nums leading-tight pt-0.5">
                      {trip.trip_date ? formatDate(trip.trip_date).split('/')[0] + '/' + formatDate(trip.trip_date).split('/')[1] : '—'}
                    </span>

                    {/* Trip # + Route + Vehicle + Driver */}
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
                      {/* Vehicle + Driver details */}
                      <div className="flex flex-col gap-0.5 mt-1 text-[9px] text-muted-foreground/80 leading-snug">
                        {trip.vehicle_plate && (
                          <span className="flex items-center gap-1">
                            <span className="text-emerald-400/60 font-semibold uppercase tracking-wide">V</span>
                            <span className="break-words">{trip.vehicle_plate}</span>
                          </span>
                        )}
                        {trip.driver_name && (
                          <span className="flex items-center gap-1">
                            <span className="text-emerald-400/60 font-semibold uppercase tracking-wide">D</span>
                            <span className="break-words">{trip.driver_name}</span>
                          </span>
                        )}
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
                  </div>

                  {/* LAYER 2 — Sharp action icons overlay (NO blur). Sibling of content,
                      so filter:blur on content does NOT affect these icons. */}
                  <AnimatePresence>
                    {longPressTrip?.id === trip.id && (
                      <RowActionOverlay
                        key={`overlay-${trip.id}`}
                        trip={trip}
                        onOpenDetail={onOpenDetail}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onClose={() => setLongPressTrip(null)}
                      />
                    )}
                  </AnimatePresence>
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