/**
 * Trip Debugger — data-integrity validation engine.
 *
 * Pure functions: given a list of trips + reference data, returns a flat list
 * of issues (one per rule violation per trip). Each issue describes the rule,
 * the conflicting values, and — where a single obvious correction exists —
 * a `fix` descriptor the UI can apply after explicit confirmation.
 *
 * No mutations happen here; the modal owns persistence + audit logging.
 */

import { normalizeDate } from '@/lib/formatters';

// Reasonable date bounds — anything outside is flagged as out-of-range.
const MIN_YEAR = 2015;
const MAX_FUTURE_YEARS = 2;

function parseDate(d) {
  if (!d) return null;
  const norm = normalizeDate(d);
  const dt = new Date(norm + 'T00:00:00');
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function parseDateTime(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function fmtDate(d) {
  const dt = parseDate(d);
  if (!dt) return String(d || '—');
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d) {
  const dt = parseDateTime(d);
  if (!dt) return String(d || '—');
  return dt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isBlank(v) {
  return v == null || String(v).trim() === '';
}

// ─────────────────────────────────────────────────────────
// Individual rule checks. Each returns an issue object or null.
// ─────────────────────────────────────────────────────────

function checkReversedDates(trip) {
  const start = parseDate(trip.trip_date);
  const end = parseDate(trip.delivery_date);
  if (!start || !end) return null;
  if (end.getTime() < start.getTime()) {
    return {
      ruleId: 'reversed_dates',
      severity: 'error',
      title: 'Delivery date is before trip start date',
      detail: `Start: ${fmtDate(trip.trip_date)} · Delivery: ${fmtDate(trip.delivery_date)}`,
      fix: {
        label: 'Swap start & delivery dates',
        description: `Set trip date → ${fmtDate(trip.delivery_date)} and delivery date → ${fmtDate(trip.trip_date)}.`,
        apply: () => ({ trip_date: normalizeDate(trip.delivery_date), delivery_date: normalizeDate(trip.trip_date) }),
      },
    };
  }
  return null;
}

function checkOffloadBeforeLoad(trip) {
  const load = parseDateTime(trip.load_datetime);
  const offload = parseDateTime(trip.offload_datetime);
  if (!load || !offload) return null;
  if (offload.getTime() < load.getTime()) {
    return {
      ruleId: 'offload_before_load',
      severity: 'error',
      title: 'Offload time is before load time',
      detail: `Load: ${fmtDateTime(trip.load_datetime)} · Offload: ${fmtDateTime(trip.offload_datetime)}`,
      fix: {
        label: 'Swap load & offload times',
        description: `Set load → ${fmtDateTime(trip.offload_datetime)} and offload → ${fmtDateTime(trip.load_datetime)}.`,
        apply: () => ({ load_datetime: trip.offload_datetime, offload_datetime: trip.load_datetime }),
      },
    };
  }
  return null;
}

function checkDateOutOfRange(trip) {
  const start = parseDate(trip.trip_date);
  if (!start) return null;
  const yr = start.getFullYear();
  const now = new Date();
  if (yr < MIN_YEAR) {
    return { ruleId: 'date_out_of_range_past', severity: 'warning', title: 'Trip date is implausibly old', detail: `Trip date: ${fmtDate(trip.trip_date)}` };
  }
  if (yr > now.getFullYear() + MAX_FUTURE_YEARS) {
    return { ruleId: 'date_out_of_range_future', severity: 'warning', title: 'Trip date is too far in the future', detail: `Trip date: ${fmtDate(trip.trip_date)}` };
  }
  return null;
}

function checkInvalidDate(trip) {
  if (isBlank(trip.trip_date)) return null;
  if (!parseDate(trip.trip_date)) {
    return { ruleId: 'invalid_trip_date', severity: 'error', title: 'Trip date could not be parsed', detail: `Value: "${trip.trip_date}"` };
  }
  return null;
}

function checkVehicleNotFound(trip, ctx) {
  if (isBlank(trip.vehicle_plate)) return null;
  if (ctx.vehicleMap && !ctx.vehicleMap[trip.vehicle_plate]) {
    return { ruleId: 'vehicle_not_found', severity: 'warning', title: 'Vehicle not found in fleet records', detail: `Plate: ${trip.vehicle_plate}` };
  }
  return null;
}

function checkDriverNotFound(trip, ctx) {
  if (isBlank(trip.driver_name)) return null;
  if (ctx.driverMap && !ctx.driverMap[trip.driver_name]) {
    return { ruleId: 'driver_not_found', severity: 'warning', title: 'Driver not found in driver records', detail: `Driver: ${trip.driver_name}` };
  }
  return null;
}

function checkClientNotFound(trip, ctx) {
  if (isBlank(trip.client_name)) return null;
  if (ctx.clientMap && !ctx.clientMap[trip.client_name]) {
    return { ruleId: 'client_not_found', severity: 'warning', title: 'Client not found in client records', detail: `Client: ${trip.client_name}` };
  }
  return null;
}

function checkZeroFareCompleted(trip) {
  if (trip.status === 'completed' && (Number(trip.revenue) || 0) <= 0) {
    return { ruleId: 'zero_fare_completed', severity: 'warning', title: 'Completed trip has zero fare', detail: `Revenue: ${trip.revenue ?? 0}` };
  }
  return null;
}

function checkNegativeRevenue(trip) {
  if (Number(trip.revenue) < 0) {
    return { ruleId: 'negative_revenue', severity: 'error', title: 'Trip fare is negative', detail: `Revenue: ${trip.revenue}` };
  }
  return null;
}

function checkNegativeCosts(trip) {
  const fields = ['fuel_cost', 'toll_cost', 'other_cost', 'base_fare', 'vendor_agreed_rate'];
  const neg = fields.filter((f) => Number(trip[f]) < 0);
  if (neg.length === 0) return null;
  return { ruleId: 'negative_cost', severity: 'error', title: 'Negative amount where none should exist', detail: neg.map((f) => `${f}: ${trip[f]}`).join(' · ') };
}

function checkVendorRateMismatch(trip, ctx) {
  // Only applies to vendor-assigned trips (vendor_name present)
  if (isBlank(trip.vendor_name)) return null;
  const revenue = Number(trip.revenue) || 0;
  if (revenue <= 0) return null;
  const pct = Number(ctx.companySettings?.vendor_rate_percentage) || 80;
  const expected = Math.round(revenue * pct / 100 * 100) / 100;
  const actual = Number(trip.vendor_agreed_rate) || 0;
  // Allow small rounding tolerance
  if (Math.abs(expected - actual) > 0.5) {
    return {
      ruleId: 'vendor_rate_mismatch',
      severity: 'warning',
      title: 'Vendor payment does not match auto-calculated amount',
      detail: `Agreed: ${actual} · Expected (${pct}% of ${revenue}): ${expected}`,
      fix: {
        label: `Set vendor rate to ${expected}`,
        description: `Update vendor agreed rate from ${actual} to the auto-calculated ${expected} (${pct}% of trip fare).`,
        apply: () => ({ vendor_agreed_rate: expected }),
      },
    };
  }
  return null;
}

function checkMissingClient(trip) {
  if (isBlank(trip.client_name)) {
    return { ruleId: 'missing_client', severity: 'warning', title: 'Missing client', detail: 'No client assigned to this trip.' };
  }
  return null;
}

function checkMissingRoute(trip) {
  const missing = [];
  if (isBlank(trip.from_location)) missing.push('From');
  if (isBlank(trip.to_location)) missing.push('To');
  if (missing.length === 0) return null;
  return { ruleId: 'missing_route', severity: 'error', title: 'Missing route location', detail: `Missing: ${missing.join(', ')}` };
}

function checkCompletedMissingOffload(trip) {
  if (trip.status !== 'completed') return null;
  if (isBlank(trip.offload_datetime) && isBlank(trip.offload_date)) {
    return { ruleId: 'completed_missing_offload', severity: 'warning', title: 'Completed trip has no completion timestamp', detail: 'No offload date/time recorded.' };
  }
  return null;
}

function checkCompletedMissingDeliveryNote(trip) {
  if (trip.status !== 'completed') return null;
  if (isBlank(trip.delivery_note_number) && isBlank(trip.delivery_note_url)) {
    return { ruleId: 'completed_missing_pod', severity: 'warning', title: 'Completed trip has no delivery note / POD', detail: 'No delivery note number or document attached.' };
  }
  return null;
}

// Cross-trip: same driver on overlapping non-cancelled trips.
function checkDriverScheduleConflicts(trips) {
  const issues = [];
  const byDriver = {};
  trips.forEach((t) => {
    if (isBlank(t.driver_name) || t.status === 'cancelled') return;
    (byDriver[t.driver_name] ||= []).push(t);
  });
  Object.entries(byDriver).forEach(([driver, list]) => {
    if (list.length < 2) return;
    const windows = list.map((t) => {
      const start = parseDateTime(t.load_datetime) || parseDate(t.trip_date);
      const end = parseDateTime(t.offload_datetime) || parseDate(t.delivery_date) || parseDate(t.trip_date);
      return { trip: t, start, end };
    });
    for (let i = 0; i < windows.length; i++) {
      for (let j = i + 1; j < windows.length; j++) {
        const a = windows[i], b = windows[j];
        if (!a.start || !b.start) continue;
        const aEnd = a.end || a.start;
        const bEnd = b.end || b.start;
        // overlap if a.start < b.end && b.start < aEnd
        if (a.start.getTime() < bEnd.getTime() && b.start.getTime() < aEnd.getTime()) {
          issues.push({
            tripId: a.trip.id,
            tripNumber: a.trip.trip_number,
            ruleId: 'driver_schedule_conflict',
            severity: 'warning',
            title: `Driver "${driver}" double-booked`,
            detail: `Overlaps trip ${b.trip.trip_number || '#' + String(b.trip.id || '').slice(-6)} (${fmtDate(b.trip.trip_date)}).`,
          });
        }
      }
    }
  });
  return issues;
}

// ─────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────

const SINGLE_TRIP_RULES = [
  checkReversedDates,
  checkOffloadBeforeLoad,
  checkDateOutOfRange,
  checkInvalidDate,
  checkVehicleNotFound,
  checkDriverNotFound,
  checkClientNotFound,
  checkZeroFareCompleted,
  checkNegativeRevenue,
  checkNegativeCosts,
  checkVendorRateMismatch,
  checkMissingClient,
  checkMissingRoute,
  checkCompletedMissingOffload,
  checkCompletedMissingDeliveryNote,
];

/**
 * Run all checks across the given trips.
 * @param {Array} trips - trip records to validate
 * @param {Object} ctx - { driverMap, vehicleMap, clientMap, companySettings }
 * @returns {Array} issues — each: { tripId, tripNumber, ruleId, severity, title, detail, fix? }
 */
export function runTripDiagnostics(trips, ctx = {}) {
  const issues = [];
  (trips || []).forEach((trip) => {
    SINGLE_TRIP_RULES.forEach((rule) => {
      const issue = rule(trip, ctx);
      if (issue) {
        issues.push({
          tripId: trip.id,
          tripNumber: trip.trip_number || `#${String(trip.id || '').slice(-6)}`,
          ...issue,
        });
      }
    });
  });
  // Cross-trip conflict checks
  issues.push(...checkDriverScheduleConflicts(trips || []));
  return issues;
}

export function summarizeIssues(issues) {
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const fixable = issues.filter((i) => i.fix).length;
  const tripsAffected = new Set(issues.map((i) => i.tripId)).size;
  return { total: issues.length, errors, warnings, fixable, tripsAffected };
}