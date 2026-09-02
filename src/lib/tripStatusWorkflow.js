import { base44 } from '@/api/base44Client';

// ═══════════════════════════════════════════════════════
// TRIP STATUS WORKFLOW — automated status engine + audit
// ═══════════════════════════════════════════════════════
// Status is system-derived, never manually settable via the
// regular UI. Admins may override (forward only) with a reason.
// Flow (one-directional):
//   scheduled → trip_started → trip_ended → completed
//   (+ cancelled as a side branch from scheduled/started/ended)
// ═══════════════════════════════════════════════════════

export const TRIP_STATUSES = [
  'scheduled',
  'trip_started',
  'trip_ended',
  'completed',
  'cancelled',
];

// Forward-only order (excludes cancelled, which is a side branch)
export const TRIP_STATUS_FLOW = [
  'scheduled',
  'trip_started',
  'trip_ended',
  'completed',
];

export const STATUS_META = {
  scheduled:     { label: 'Scheduled',    short: 'Sched',    color: '#60a5fa', dotClass: 'bg-blue-400',    textClass: 'text-blue-400',    bgClass: 'bg-blue-500/10',    borderClass: 'border-blue-500/30',    icon: '◦' },
  reached:       { label: 'Reached',       short: 'Reached', color: '#22d3ee', dotClass: 'bg-cyan-400',    textClass: 'text-cyan-400',    bgClass: 'bg-cyan-500/10',    borderClass: 'border-cyan-500/30',    icon: '◉' },
  trip_started:  { label: 'Trip Started', short: 'Started',  color: '#fb923c', dotClass: 'bg-orange-400',  textClass: 'text-orange-400',  bgClass: 'bg-orange-500/10',  borderClass: 'border-orange-500/30',  icon: '▶' },
  trip_ended:    { label: 'Trip Ended',    short: 'Ended',    color: '#c084fc', dotClass: 'bg-purple-400', textClass: 'text-purple-400', bgClass: 'bg-purple-500/10', borderClass: 'border-purple-500/30', icon: '■' },
  completed:     { label: 'Completed',     short: 'Done',     color: '#34d399', dotClass: 'bg-emerald-400', textClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/30', icon: '✓' },
  cancelled:     { label: 'Cancelled',     short: 'Cancel',   color: '#f87171', dotClass: 'bg-red-400',    textClass: 'text-red-400',    bgClass: 'bg-red-500/10',    borderClass: 'border-red-500/30',    icon: '✗' },
};

// Statuses that require a modal with additional info before saving (legacy)
export const STATUS_REQUIRES_MODAL = {
  trip_ended: 'end',
  completed: 'complete',
  cancelled: 'cancel',
};

// ═══════════════════════════════════════════════════════
// STRICT ONE-WAY TRANSITION TABLE
// ═══════════════════════════════════════════════════════
export const VALID_TRANSITIONS = {
  scheduled:     ['trip_started', 'cancelled'],
  trip_started:  ['trip_ended', 'cancelled'],
  trip_ended:    ['completed', 'cancelled'],
  completed:     [],
  cancelled:     [],
};

export function canTransition(from, to) {
  if (!from || !to || from === to) return false;
  const allowed = VALID_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

export function getTransitionError(from, to) {
  if (!from || !to) return 'Invalid status values.';
  if (from === to) return null;
  const fromIdx = TRIP_STATUS_FLOW.indexOf(from);
  const toIdx = TRIP_STATUS_FLOW.indexOf(to);
  if (from === 'cancelled' || from === 'completed') {
    return 'This status change is not allowed. Trip statuses cannot move backwards.';
  }
  if (to === 'scheduled' && from !== 'scheduled') {
    return 'This status change is not allowed. Trip statuses cannot move backwards.';
  }
  if (fromIdx !== -1 && toIdx !== -1 && toIdx < fromIdx && to !== 'cancelled') {
    return 'This status change is not allowed. Trip statuses cannot move backwards.';
  }
  if (!canTransition(from, to)) {
    return 'This status change is not allowed. Trip statuses cannot move backwards.';
  }
  return null;
}

// Migration map for old statuses
const STATUS_MIGRATION = {
  in_transit: 'trip_started',
  reached: 'trip_started',
};

export function migrateStatus(oldStatus) {
  return STATUS_MIGRATION[oldStatus] || oldStatus;
}

// ═══════════════════════════════════════════════════════
// AUTOMATED STATUS ENGINE — condition checks
// ═══════════════════════════════════════════════════════

// Load Date & Time reached (current time >= load_datetime)
export function loadReached(trip) {
  if (!trip || !trip.load_datetime) return false;
  const d = new Date(trip.load_datetime);
  if (isNaN(d.getTime())) return false;
  return new Date() >= d;
}

// Offload Date & Time both filled
export function offloadFilled(trip) {
  if (!trip) return false;
  return !!trip.offload_datetime;
}

// Financial section fully filled (revenue present + payment status set)
export function financialsComplete(trip) {
  if (!trip) return false;
  return Number(trip.revenue) > 0 && !!trip.payment_status;
}

/**
 * Returns the NEXT status (one step forward) if its trigger condition
 * is met, otherwise null.
 */
export function nextStatus(trip) {
  if (!trip || !trip.status) return null;
  switch (trip.status) {
    case 'scheduled':    return loadReached(trip) ? 'trip_started' : null;
    case 'trip_started': return offloadFilled(trip) ? 'trip_ended' : null;
    case 'trip_ended':   return financialsComplete(trip) ? 'completed' : null;
    default:             return null; // completed / cancelled are terminal
  }
}

/**
 * Returns the final target status the trip should reach given its current
 * data. Used for live preview in the form.
 */
export function computeTargetStatus(trip) {
  if (!trip) return 'scheduled';
  if (financialsComplete(trip) && offloadFilled(trip) && loadReached(trip)) return 'completed';
  if (offloadFilled(trip) && loadReached(trip)) return 'trip_ended';
  if (loadReached(trip)) return 'trip_started';
  return 'scheduled';
}

// ═══════════════════════════════════════════════════════
// CORE STATUS UPDATE — with audit trail + strict validation
// ═══════════════════════════════════════════════════════

export async function updateTripStatus(trip, newStatus, options = {}) {
  const {
    source = 'manual', user = null, extraData = {}, reason = null,
    skipAudit = false, skipValidation = false,
  } = options;

  const oldStatus = trip.status;
  if (!skipValidation) {
    const error = getTransitionError(oldStatus, newStatus);
    if (error) throw new Error(error);
  }

  const now = new Date().toISOString();
  const actorName = user?.full_name || user?.email || (source === 'automatic' ? 'System' : 'User');

  const payload = {
    status: newStatus,
    status_source: source,
    status_updated_at: now,
    status_updated_by: actorName,
    ...extraData,
  };

  if (newStatus === 'cancelled') {
    payload.cancelled_at = now;
    payload.cancelled_by = actorName;
    if (reason) payload.cancellation_reason = reason;
  }

  await base44.entities.Trip.update(trip.id, payload);

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
// ADMIN OVERRIDE — force-advance status with a required reason.
// Logged to the audit trail (TripStatusHistory) + override fields.
// ═══════════════════════════════════════════════════════

export async function overrideTripStatus(trip, newStatus, reason, user) {
  if (!reason || !reason.trim()) throw new Error('A reason is required to override the trip status.');
  const now = new Date().toISOString();
  const actor = user?.full_name || user?.email || 'Admin';
  const oldStatus = trip.status;

  const payload = {
    status: newStatus,
    status_source: 'manual',
    status_updated_at: now,
    status_updated_by: actor,
    status_override_reason: reason.trim(),
    status_override_by: actor,
    status_override_at: now,
  };
  if (newStatus === 'cancelled') {
    payload.cancelled_at = now;
    payload.cancelled_by = actor;
    payload.cancellation_reason = reason.trim();
  }

  await base44.entities.Trip.update(trip.id, payload);

  try {
    await base44.entities.TripStatusHistory.create({
      trip_id: trip.id,
      trip_number: trip.trip_number || '',
      previous_status: oldStatus || '',
      new_status: newStatus,
      source: 'manual',
      changed_by: actor,
      changed_at: now,
      reason: reason.trim(),
    });
  } catch {}

  return { ...trip, ...payload };
}

// ═══════════════════════════════════════════════════════
// AUTO-ADVANCE: move every trip one step forward if its next
// trigger condition is met. Used by recompute-on-load + scheduled job.
// ═══════════════════════════════════════════════════════

export async function advanceTripStatuses(trips) {
  const candidates = (trips || []).filter((t) => t && !t.is_draft && !t.deleted_at && nextStatus(t) !== null);
  if (candidates.length === 0) return [];

  await Promise.all(
    candidates.map((trip) => {
      const ns = nextStatus(trip);
      return updateTripStatus(trip, ns, { source: 'automatic', skipValidation: true }).catch(() => {});
    })
  );
  return candidates;
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
  try { await base44.entities.Trip.bulkUpdate(updates); } catch {}
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