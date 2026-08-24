import { base44 } from '@/api/base44Client';

// ═══════════════════════════════════════════════════════
// TRIP STATUS WORKFLOW — constants, validation, audit
// ═══════════════════════════════════════════════════════

export const TRIP_STATUSES = [
  'scheduled',
  'trip_started',
  'trip_ended',
  'completed',
  'cancelled',
];

export const STATUS_META = {
  scheduled:     { label: 'Scheduled',    short: 'Sched',    color: '#60a5fa', dotClass: 'bg-blue-400',    textClass: 'text-blue-400',    bgClass: 'bg-blue-500/10',    borderClass: 'border-blue-500/30',    icon: '◦' },
  trip_started:  { label: 'Trip Started',  short: 'Started',  color: '#fb923c', dotClass: 'bg-orange-400',  textClass: 'text-orange-400',  bgClass: 'bg-orange-500/10',  borderClass: 'border-orange-500/30',  icon: '▶' },
  trip_ended:    { label: 'Trip Ended',    short: 'Ended',    color: '#c084fc', dotClass: 'bg-purple-400', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/30', icon: '■' },
  completed:     { label: 'Completed',     short: 'Done',     color: '#34d399', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/30', icon: '✓' },
  cancelled:     { label: 'Cancelled',     short: 'Cancel',   color: '#f87171', dotClass: 'bg-red-400',    textClass: 'text-red-400',    bgClass: 'bg-red-500/10',    borderClass: 'border-red-500/30',    icon: '✗' },
};

// Statuses that require a modal with additional info before saving
export const STATUS_REQUIRES_MODAL = {
  trip_ended: 'end',
  completed: 'complete',
  cancelled: 'cancel',
};

// Preferred transition workflow
export const VALID_TRANSITIONS = {
  scheduled:     ['trip_started', 'trip_ended', 'completed', 'cancelled'],
  trip_started:  ['trip_ended', 'completed', 'cancelled'],
  trip_ended:    ['completed', 'cancelled', 'trip_started'],
  completed:     ['cancelled'],
  cancelled:     ['scheduled', 'trip_started', 'trip_ended', 'completed'],
};

export function canTransition(from, to) {
  if (!from || !to || from === to) return false;
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

// Migration map for old statuses
const STATUS_MIGRATION = {
  in_transit: 'trip_started',
};

export function migrateStatus(oldStatus) {
  return STATUS_MIGRATION[oldStatus] || oldStatus;
}

// Get trip start datetime — uses load_datetime if available, falls back to trip_date
export function getTripStartDateTime(trip) {
  if (trip.load_datetime) return new Date(trip.load_datetime);
  if (trip.trip_date) {
    const d = new Date(trip.trip_date + 'T00:00:00');
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

// Check if a trip should auto-transition from Scheduled → Trip Started
export function shouldAutoStart(trip) {
  if (trip.status !== 'scheduled') return false;
  if (trip.status_source === 'manual') return false;
  const startDT = getTripStartDateTime(trip);
  if (!startDT) return false;
  return new Date() >= startDT;
}

// ═══════════════════════════════════════════════════════
// CORE STATUS UPDATE — with audit trail
// ═══════════════════════════════════════════════════════

export async function updateTripStatus(trip, newStatus, options = {}) {
  const {
    source = 'manual',
    user = null,
    extraData = {},
    reason = null,
    skipAudit = false,
  } = options;

  const oldStatus = trip.status;
  const now = new Date().toISOString();
  const actorName = user?.full_name || user?.email || (source === 'automatic' ? 'System' : 'User');

  const payload = {
    status: newStatus,
    status_source: source,
    status_updated_at: now,
    status_updated_by: actorName,
    ...extraData,
  };

  // Add cancellation fields
  if (newStatus === 'cancelled') {
    payload.cancelled_at = now;
    payload.cancelled_by = actorName;
  }

  await base44.entities.Trip.update(trip.id, payload);

  // Record audit trail
  if (!skipAudit) {
    try {
      await base44.entities.TripStatusHistory.create({
        trip_id: trip.id,
        trip_number: trip.trip_number || '',
        previous_status: oldStatus || '',
        new_status: newStatus,
        source,
        changed_by: actorName,
        changed_at: now,
        reason: reason || null,
      });
    } catch {}
  }

  return { ...trip, ...payload };
}

// ═══════════════════════════════════════════════════════
// AUTO-CHECK: find scheduled trips that should be started
// ═══════════════════════════════════════════════════════

export async function autoStartScheduledTrips(trips) {
  const toStart = (trips || []).filter(shouldAutoStart);
  if (toStart.length === 0) return [];

  await Promise.all(
    toStart.map((trip) =>
      updateTripStatus(trip, 'trip_started', { source: 'automatic' })
    )
  );
  return toStart;
}

// ═══════════════════════════════════════════════════════
// ONE-TIME MIGRATION: map old statuses to new workflow
// ═══════════════════════════════════════════════════════

export async function migrateTripStatuses(trips) {
  const toMigrate = (trips || []).filter((t) => STATUS_MIGRATION[t.status]);
  if (toMigrate.length === 0) return [];

  const updates = toMigrate.map((t) => ({
    id: t.id,
    status: STATUS_MIGRATION[t.status],
    status_source: 'manual',
  }));

  try {
    await base44.entities.Trip.bulkUpdate(updates);
  } catch {}
  return toMigrate;
}

// ═══════════════════════════════════════════════════════
// FETCH STATUS HISTORY for a trip
// ═══════════════════════════════════════════════════════

export async function fetchTripStatusHistory(tripId) {
  try {
    const rows = await base44.entities.TripStatusHistory.filter({ trip_id: tripId }, '-changed_at', 50);
    return rows || [];
  } catch {
    return [];
  }
}