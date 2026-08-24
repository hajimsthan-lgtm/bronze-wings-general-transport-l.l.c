import { useState, useCallback, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import TripStatusDropdown from './TripStatusDropdown';
import EndTripDialog from './EndTripDialog';
import CompleteTripDialog from './CompleteTripDialog';
import CancelTripDialog from './CancelTripDialog';
import { updateTripStatus, STATUS_REQUIRES_MODAL } from '@/lib/tripStatusWorkflow';

/**
 * Manages the full status workflow: dropdown + conditional modals.
 * Renders the status dropdown for a single trip, and when a status
 * requiring a modal is selected, opens the appropriate dialog.
 *
 * Usage: <TripStatusManager trip={trip} onUpdated={refetch} />
 */
export default function TripStatusManager({ trip, onUpdated, size = 'sm' }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [modalType, setModalType] = useState(null); // 'end' | 'complete' | 'cancel' | null
  const tripRef = useRef(trip);
  tripRef.current = trip;

  const handleSelectStatus = useCallback((selectedTrip, newStatus) => {
    const modalKey = STATUS_REQUIRES_MODAL[newStatus];
    if (modalKey) {
      setModalType(modalKey);
    } else {
      // Save immediately (scheduled, trip_started)
      doStatusChange(selectedTrip, newStatus, {});
    }
  }, []);

  const doStatusChange = async (trip, newStatus, extraData) => {
    try {
      await updateTripStatus(trip, newStatus, {
        source: 'manual',
        user,
        extraData,
        reason: extraData.cancellation_reason || null,
      });
      toast({
        title: 'Status updated',
        description: `${trip.trip_number || 'Trip'} → ${newStatus.replace(/_/g, ' ')}`,
      });
      onUpdated?.();
    } catch {
      toast({ title: 'Could not update status', variant: 'destructive' });
    }
  };

  const handleModalConfirm = async (extraData) => {
    const trip = tripRef.current;
    if (!trip || !modalType) return;
    const statusMap = { end: 'trip_ended', complete: 'completed', cancel: 'cancelled' };
    const newStatus = statusMap[modalType];
    await doStatusChange(trip, newStatus, extraData);
    setModalType(null);
  };

  return (
    <>
      <TripStatusDropdown trip={trip} onSelectStatus={handleSelectStatus} size={size} />

      <EndTripDialog
        trip={trip}
        open={modalType === 'end'}
        onOpenChange={(v) => !v && setModalType(null)}
        onConfirm={handleModalConfirm}
      />
      <CompleteTripDialog
        trip={trip}
        open={modalType === 'complete'}
        onOpenChange={(v) => !v && setModalType(null)}
        onConfirm={handleModalConfirm}
      />
      <CancelTripDialog
        trip={trip}
        open={modalType === 'cancel'}
        onOpenChange={(v) => !v && setModalType(null)}
        onConfirm={handleModalConfirm}
      />
    </>
  );
}