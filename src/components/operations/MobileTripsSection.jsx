import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Copy, Check, Trash2, Shield } from 'lucide-react';
import TripStatusManager from '@/components/trips/TripStatusManager';
import { setOpsBulk } from '@/lib/operationsFilterStore';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';

const STATUS = {
  scheduled:    { label: 'Scheduled',    color: '#60a5fa' },
  trip_started: { label: 'Started',     color: '#fb923c' },
  trip_ended:   { label: 'Ended',       color: '#c084fc' },
  completed:   { label: 'Completed',    color: '#34d399' },
  cancelled:   { label: 'Cancelled',    color: '#f87171' },
};

const TRIP_EXPORT_COLUMNS = [
  { label: 'Trip #',       key: 'trip_number',   w: 22, noWrap: true },
  { label: 'Date',         key: 'trip_date',      w: 20 },
  { label: 'Driver',       key: 'driver_name',    w: 28 },
  { label: 'Driver Phone', key: 'driver_phone',   w: 24, noWrap: true },
  { label: 'Vehicle',      key: 'vehicle_plate',  w: 22, noWrap: true },
  { label: 'Client',       key: 'client_name',    w: 32 },
  { label: 'From',         key: 'from_location',  w: 25 },
  { label: 'To',           key: 'to_location',    w: 25 },
  { label: 'Revenue',      key: 'revenue',        w: 20, numeric: true },
  { label: 'Status',       key: 'status',         w: 20 },
  { label: 'Payment',      key: 'payment_status', w: 19 },
];

/**
 * Mobile-only trips list — clean card-based layout.
 * Replaces the dark, semi-transparent TripsTable overlay on mobile.
 * Fully visible, theme-aware, no content hiding.
 * Self-manages selection state and publishes to opsBulk store.
 */
export default function MobileTripsSection({ trips, onOpenDetail, onEdit, onDelete, onStatusUpdated, driverMap, vehicleMap, clientMap, invoiceMap, onBulkStatus, onBulkDelete }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);

  const toggleOne = (id) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleAll = () => {
    setSelected((s) => s.size === trips.length ? new Set() : new Set(trips.map((t) => t.id)));
  };
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

  // Publish bulk-selection state to the shared store
  useEffect(() => {
    setOpsBulk({
      selectedCount: selected.size,
      totalCount: trips.length,
      onSelectAll: toggleAll,
      onClear: clearSelection,
      onBulkStatus,
      onBulkDelete: handleBulkDelete,
      onBulkExportCSV: handleBulkExportCSV,
      onBulkExportPDF: handleBulkExportPDF,
      selectedTrips,
    });
    return () => setOpsBulk(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, trips]);

  return (
    <div className="md:hidden space-y-2">
      {/* Select-all bar */}
      <div className="flex items-center gap-2 px-1 pb-1">
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} className="border-border/60" />
        <span className="text-[11px] text-muted-foreground font-medium">
          {trips.length} trip{trips.length !== 1 ? 's' : ''}
        </span>
        <AnimatePresence>
          {selected.size > 0 && (
            <motion.span
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.9 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="text-[11px] text-primary font-semibold ml-auto flex items-center gap-1.5"
            >
              <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold tabular-nums">
                {selected.size}
              </span>
              selected
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {trips.map((trip) => {
        const isSelected = selected.has(trip.id);
        const st = STATUS[trip.status] || STATUS.scheduled;
        const revenue = Number(trip.revenue) || 0;
        const ref = trip.trip_number || `#${trip.id?.slice(-6)}`;

        return (
          <div
            key={trip.id}
            onClick={() => toggleOne(trip.id)}
            className="rounded-2xl p-3 cursor-pointer relative overflow-hidden"
            style={{
              background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.90) 0%, rgba(var(--surf-2-rgb),0.95) 100%)',
              border: `1px solid ${isSelected ? 'rgba(var(--panel-accent-rgb),0.45)' : 'rgba(var(--panel-accent-rgb),0.12)'}`,
              boxShadow: isSelected
                ? 'inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 1px rgba(var(--panel-accent-rgb),0.25), 0 4px 16px rgba(0,0,0,0.08)'
                : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 14px rgba(0,0,0,0.06)',
              borderLeft: `3px solid ${st.color}`,
            }}
          >
            <div className="flex items-start gap-2.5">
              {/* Checkbox — visual indicator only (card click toggles) */}
              <div className="pt-0.5 pointer-events-none">
                <Checkbox checked={isSelected} className="border-border/60" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1.5">
                {/* Top row: trip # + status */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => copyRef(e, trip)}
                    className="text-primary font-bold text-[11px] tracking-tight flex items-center gap-1 min-w-0"
                  >
                    <span className="truncate">{ref}</span>
                    {copiedId === trip.id
                      ? <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      : <Copy className="w-3 h-3 opacity-40 shrink-0" />}
                  </button>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ color: st.color, background: `${st.color}1a`, border: `1px solid ${st.color}33` }}
                  >
                    {st.label}
                  </span>
                </div>

                {/* Date */}
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {trip.trip_date ? formatDate(trip.trip_date) : '—'}
                </p>

                {/* Route */}
                <div className="flex items-center gap-1.5 text-[11px] text-foreground/80 flex-wrap">
                  <span className="truncate font-medium">{trip.from_location || '—'}</span>
                  {trip.permit_required && trip.permit_name && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0" title={`Permit: ${trip.permit_name}`}>
                      <Shield className="w-2.5 h-2.5" />
                      {trip.permit_name}
                    </span>
                  )}
                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium">{trip.to_location || '—'}</span>
                </div>

                {/* Client + Vehicle */}
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  {trip.client_name && (
                    <button
                      onClick={(e) => goTo(e, clientMap, trip.client_name, '/admin/clients')}
                      className="text-primary hover:underline truncate"
                    >
                      {trip.client_name}
                    </button>
                  )}
                  {trip.vehicle_plate && (
                    <span className="truncate tabular-nums">{trip.vehicle_plate}</span>
                  )}
                </div>

                {/* Revenue + status manager */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {formatCurrency(revenue)}
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <TripStatusManager trip={trip} onUpdated={onStatusUpdated} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}