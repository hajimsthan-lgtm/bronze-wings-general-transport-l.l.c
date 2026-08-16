import { base44 } from '@/api/base44Client';

/**
 * Overtime calculation engine — shared by DriverOvertimeCard, auto-sync, and SalaryFormSheet.
 *
 * Scenarios:
 *  - standard:          hours × rate
 *  - tiered:            first `threshold` hrs × rate × tier1_mult, remaining × rate × tier2_mult
 *  - flat_daily:        fixed AED per day that has any overtime (hours ignored for amount)
 *  - weekend_multiplier: hours × rate × weekend_mult (only if trip date is weekend)
 */

const WEEKEND_DAYS = [5, 6]; // Friday=5, Saturday=6 (UAE weekend)

export const SCENARIO_META = {
  standard: { label: 'Standard Rate', desc: 'Flat hourly rate × hours over' },
  tiered: { label: 'Tiered Rate', desc: '1.25× first 2 hrs, 1.5× beyond (configurable)' },
  flat_daily: { label: 'Flat Daily Bonus', desc: 'Fixed AED per day with any overtime' },
  weekend_multiplier: { label: 'Weekend/Holiday Multiplier', desc: 'Higher multiplier on weekends' },
};

/**
 * Merge driver-level overtime settings with company defaults.
 * Driver fields override company defaults when > 0 / non-empty.
 */
export function getEffectiveSettings(driver = {}, companySettings = {}) {
  const pick = (driverVal, companyVal, fallback = 0) => {
    if (driverVal != null && Number(driverVal) > 0) return Number(driverVal);
    if (companyVal != null && Number(companyVal) > 0) return Number(companyVal);
    return fallback;
  };

  const scenario = driver.overtime_scenario || companySettings.overtime_scenario || 'standard';

  return {
    scenario,
    rate: pick(driver.overtime_rate, companySettings.overtime_rate, 0),
    tier1_multiplier: pick(driver.overtime_tier1_multiplier, companySettings.overtime_tier1_multiplier, 1.25),
    tier2_multiplier: pick(driver.overtime_tier2_multiplier, companySettings.overtime_tier2_multiplier, 1.5),
    tier2_threshold: pick(driver.overtime_tier2_threshold, companySettings.overtime_tier2_threshold, 2),
    flat_daily: pick(driver.overtime_flat_daily, companySettings.overtime_flat_daily, 0),
    weekend_multiplier: pick(driver.overtime_weekend_multiplier, companySettings.overtime_weekend_multiplier, 1.5),
  };
}

function isWeekend(dateStr) {
  if (!dateStr) return false;
  const day = new Date(dateStr).getDay();
  return WEEKEND_DAYS.includes(day);
}

/**
 * Calculate overtime for a single trip given effective settings.
 * Returns { hours, amount, scenario, rate } or null if no overtime.
 */
export function calculateTripOvertime(trip, settings) {
  if (!trip || !settings) return null;

  const maxAllowed = Number(trip.max_allowed_duration) || 0;
  const actual = Number(trip.calculated_duration) || Number(trip.hours) || 0;
  if (maxAllowed <= 0 || actual <= maxAllowed) return null;

  const overtimeHours = actual - maxAllowed;
  const baseRate = Number(trip.overtime_rate) || settings.rate || 0;
  const date = trip.trip_date || trip.delivery_date || new Date().toISOString().split('T')[0];

  let amount = 0;
  let effectiveScenario = settings.scenario;

  switch (settings.scenario) {
    case 'tiered': {
      const threshold = settings.tier2_threshold || 2;
      const tier1hrs = Math.min(overtimeHours, threshold);
      const tier2hrs = Math.max(0, overtimeHours - threshold);
      amount = tier1hrs * baseRate * (settings.tier1_multiplier || 1.25) +
               tier2hrs * baseRate * (settings.tier2_multiplier || 1.5);
      break;
    }
    case 'flat_daily':
      amount = settings.flat_daily || 0;
      break;
    case 'weekend_multiplier':
      if (isWeekend(date)) {
        amount = overtimeHours * baseRate * (settings.weekend_multiplier || 1.5);
      } else {
        amount = overtimeHours * baseRate; // standard rate on non-weekend days
      }
      break;
    case 'standard':
    default:
      amount = overtimeHours * baseRate;
      effectiveScenario = 'standard';
      break;
  }

  return {
    hours: Math.round(overtimeHours * 100) / 100,
    rate: baseRate,
    amount: Math.round(amount * 100) / 100,
    scenario: effectiveScenario,
    date,
  };
}

/**
 * Sync DriverOvertime entries from trips.
 * For each trip with overtime that doesn't have an entry yet, create one.
 * For existing entries whose trip data changed, update them (only if still pending).
 * Entries already 'applied' are never touched.
 *
 * @param {string} driverName
 * @param {Array}  trips            — all trips for the driver
 * @param {object} settings         — effective overtime settings
 * @param {Array}  existingEntries  — existing DriverOvertime records for the driver
 * @returns {Promise<{created: number, updated: number, entries: Array}>}
 */
export async function syncDriverOvertime(driverName, trips, settings, existingEntries) {
  const tripEntries = (existingEntries || []).filter((e) => e.source === 'trip' && e.trip_id);
  const byTripId = {};
  tripEntries.forEach((e) => { byTripId[e.trip_id] = e; });

  const toCreate = [];
  const toUpdate = [];
  const seenTripIds = new Set();

  (trips || []).forEach((trip) => {
    const ot = calculateTripOvertime(trip, settings);
    if (!ot) return;
    seenTripIds.add(trip.id);

    const existing = byTripId[trip.id];
    if (!existing) {
      toCreate.push({
        driver_name: driverName,
        source: 'trip',
        trip_id: trip.id,
        trip_number: trip.trip_number || '',
        description: `Trip ${trip.trip_number || trip.id.slice(0, 6)}: ${trip.from_location || ''} → ${trip.to_location || ''}`,
        date: ot.date,
        hours: ot.hours,
        rate: ot.rate,
        amount: ot.amount,
        scenario: ot.scenario,
        status: 'pending',
      });
    } else if (existing.status === 'pending') {
      // Update if trip data changed
      const changed = existing.hours !== ot.hours || existing.amount !== ot.amount ||
                      existing.rate !== ot.rate || existing.scenario !== ot.scenario;
      if (changed) {
        toUpdate.push({
          id: existing.id,
          hours: ot.hours,
          rate: ot.rate,
          amount: ot.amount,
          scenario: ot.scenario,
        });
      }
    }
  });

  let created = 0;
  let updated = 0;

  if (toCreate.length > 0) {
    try {
      const res = await base44.entities.DriverOvertime.bulkCreate(toCreate);
      created = Array.isArray(res) ? res.length : (res?.length || 0);
    } catch { /* ignore — will retry next load */ }
  }

  if (toUpdate.length > 0) {
    try {
      await base44.entities.DriverOvertime.bulkUpdate(toUpdate);
      updated = toUpdate.length;
    } catch { /* ignore */ }
  }

  return { created, updated };
}

/**
 * Mark overtime entries as applied after a salary record is saved.
 * @param {Array<string>} entryIds — DriverOvertime IDs to settle
 * @param {string} salaryId
 */
export async function settleOvertimeEntries(entryIds, salaryId) {
  if (!entryIds || entryIds.length === 0) return;
  try {
    await base44.entities.DriverOvertime.bulkUpdate(
      entryIds.map((id) => ({ id, status: 'applied', applied_salary_id: salaryId }))
    );
  } catch { /* ignore — entries remain pending, can be applied next run */ }
}