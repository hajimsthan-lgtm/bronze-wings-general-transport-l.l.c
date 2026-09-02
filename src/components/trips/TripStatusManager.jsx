import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import TripStatusDropdown from './TripStatusDropdown';
import EndTripDialog from './EndTripDialog';
import CompleteTripDialog from './CompleteTripDialog';
import CancelTripDialog from './CancelTripDialog';
import { updateTripStatus, STATUS_REQUIRES_MODAL, canTransition, getTransitionError } from '@/lib/tripStatusWorkflow';

/**
 * Manages the full status workflow: dropdown + conditional modals.
 * Enforces strict one-way transition rules via centralized validation.
 */
export default function TripStatusManager({ trip, onUpdated, size = 'sm' }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [modalType, setModalType] = useState(null);
  const tripRef = useRef(trip);
  tripRef.current = trip;

  const handleSelectStatus = useCallback((selectedTrip, newStatus) => {
    // Guard: enforce transitions at UI level too
    const err = getTransitionError(selectedTrip.status, newStatus);
    if (err) {
      toast({ title: 'Status change not allowed', description: err, variant: 'destructive' });
      return;
    }
    // Guard: Trip Ended requires offload date & time to be filled
    if (newStatus === 'trip_ended' && !selectedTrip.offload_datetime) {
      toast({ title: 'Offload date & time required', description: 'Fill the offload date & time in the schedule before ending the trip.', variant: 'destructive' });
      return;
    }
    // Guard: Completed requires the financial section to be filled (revenue)
    if (newStatus === 'completed' && (!selectedTrip.revenue || Number(selectedTrip.revenue) <= 0)) {
      toast({ title: 'Financial section required', description: 'Fill the financial section (revenue) before completing the trip.', variant: 'destructive' });
      return;
    }
    const modalKey = STATUS_REQUIRES_MODAL[newStatus];
    if (modalKey) {
      setModalType(modalKey);
    } else {
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
    } catch (e) {
      toast({ title: 'Could not update status', description: e?.message || 'Unknown error', variant: 'destructive' });
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