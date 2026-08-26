import { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { Trash2, RotateCcw, ArrowRight, Shield, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS = {
  scheduled:    { label: 'Scheduled', color: '#60a5fa' },
  trip_started: { label: 'Started',   color: '#fb923c' },
  trip_ended:   { label: 'Ended',     color: '#c084fc' },
  completed:    { label: 'Done',      color: '#34d399' },
  cancelled:    { label: 'Cancel',    color: '#f87171' },
};

export default function Trash() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [purgeTarget, setPurgeTarget] = useState(null);
  const [purgeAllOpen, setPurgeAllOpen] = useState(false);

  const loadTrash = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.Trip.list('-updated_date', 500);
      setTrips((all || []).filter((t) => t.deleted_at));
    } catch {
      toast({ title: 'Failed to load trash', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTrash(); }, []);

  const handleRestore = async (trip) => {
    try {
      await base44.entities.Trip.update(trip.id, { deleted_at: null });
      toast({ title: 'Trip restored', description: trip.trip_number || '' });
      loadTrash();
    } catch {
      toast({ title: 'Restore failed', variant: 'destructive' });
    }
    setRestoreTarget(null);
  };

  const handlePurge = async (trip) => {
    try {
      await base44.entities.Trip.delete(trip.id);
      toast({ title: 'Trip permanently deleted' });
      loadTrash();
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' });
    }
    setPurgeTarget(null);
  };

  const handlePurgeAll = async () => {
    try {
      const ids = trips.map((t) => t.id);
      if (ids.length > 0) {
        await base44.entities.Trip.deleteMany({ id: { $in: ids } });
      }
      toast({ title: `${ids.length} trip${ids.length !== 1 ? 's' : ''} permanently deleted` });
      loadTrash();
    } catch {
      toast({ title: 'Bulk delete failed', variant: 'destructive' });
    }
    setPurgeAllOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Trash"
        subtitle="Deleted trips — restore or permanently remove"
        icon={Trash2}
        accent="red"
      />

      {trips.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setPurgeAllOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/30 text-red-500 text-sm font-semibold hover:bg-red-500/25 transition active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            Empty Trash ({trips.length})
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : trips.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="Deleted trips will appear here. You can restore them or permanently delete them."
        />
      ) : (
        <div className="space-y-2">
          {trips.map((trip) => {
            const st = STATUS[trip.status] || STATUS.scheduled;
            const ref = trip.trip_number || `#${trip.id?.slice(-6)}`;
            const deletedDate = trip.deleted_at ? new Date(trip.deleted_at).toLocaleString('en-GB') : '';
            return (
              <div
                key={trip.id}
                className="row-card flex items-center gap-3 p-3.5 opacity-75 hover:opacity-100 transition-opacity"
              >
                {/* Trip info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{ref}</span>
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
                      style={{ background: `${st.color}22`, color: st.color }}
                    >
                      {st.label}
                    </span>
                    {trip.permit_required && (
                      <Shield className="w-3 h-3 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <span className="font-medium">{trip.from_location || '—'}</span>
                    <ArrowRight className="w-3 h-3" />
                    <span className="font-medium">{trip.to_location || '—'}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                    {trip.trip_date && <span>{formatDate(trip.trip_date)}</span>}
                    {trip.driver_name && <span>D: {trip.driver_name}</span>}
                    {trip.vehicle_plate && <span>V: {trip.vehicle_plate}</span>}
                    {trip.client_name && <span>C: {trip.client_name}</span>}
                    {Number(trip.revenue) > 0 && <span className="font-semibold text-foreground">{formatCurrency(trip.revenue)}</span>}
                  </div>
                  {deletedDate && (
                    <div className="text-[9px] text-red-400/70 mt-1">Deleted: {deletedDate}</div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/trips?open=trip-detail&tripId=${trip.id}`)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/15 border border-blue-500/30 text-blue-500 hover:bg-blue-500/25 transition active:scale-90"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRestoreTarget(trip)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/25 transition active:scale-90"
                    title="Restore"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPurgeTarget(trip)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/15 border border-red-500/30 text-red-500 hover:bg-red-500/25 transition active:scale-90"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Restore confirmation */}
      <DeleteConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
        onConfirm={() => restoreTarget && handleRestore(restoreTarget)}
        title="Restore Trip"
        description={`Restore "${restoreTarget?.trip_number || restoreTarget?.from_location || 'this trip'}" back to the active list?`}
        confirmLabel="Restore"
      />

      {/* Permanent delete confirmation */}
      <DeleteConfirmDialog
        open={!!purgeTarget}
        onOpenChange={(o) => !o && setPurgeTarget(null)}
        onConfirm={() => purgeTarget && handlePurge(purgeTarget)}
        title="Delete Permanently"
        description="This action cannot be undone. The trip will be permanently removed."
        confirmLabel="Delete Forever"
      />

      {/* Empty trash confirmation */}
      <DeleteConfirmDialog
        open={purgeAllOpen}
        onOpenChange={setPurgeAllOpen}
        onConfirm={handlePurgeAll}
        title="Empty Trash"
        description={`Permanently delete all ${trips.length} trip${trips.length !== 1 ? 's' : ''} in the trash? This cannot be undone.`}
        confirmLabel="Empty Trash"
        count={trips.length}
      />
    </div>
  );
}