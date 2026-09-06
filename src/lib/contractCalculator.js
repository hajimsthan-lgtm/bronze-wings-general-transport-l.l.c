/**
 * Smart Allowance Calculator for Monthly Contracts.
 *
 * Computes billing based on:
 * - Contract Rate Period (allowance): allowance_days, allowance_hours_per_day,
 *   contract_rate, extra_day_rate, extra_hour_rate, prorate_underuse
 * - Actual Usage: daily_usage (per-day hours) or avg_hours_per_day (quick mode)
 *
 * days_used is ALWAYS computed — never typed:
 * - Daily log mode: days_used = daily_usage.length
 * - Quick mode: days_used = calendar days in start_date→end_date range
 * - Migration fallback: old records with actual_days_used (removed field)
 *
 * Works with old contracts that only have monthly_rate — falls back gracefully.
 */

const num = (v) => Number(v) || 0;

export function getContractRate(contract) {
  return num(contract?.contract_rate) || num(contract?.monthly_rate) || 0;
}

/** Calendar days in the contract date range (inclusive). */
function getDaysInDateRange(contract) {
  if (!contract?.start_date || !contract?.end_date) return 0;
  const start = new Date(contract.start_date);
  const end = new Date(contract.end_date);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diff = Math.round((end - start) / 86400000) + 1;
  return diff > 0 ? diff : 0;
}

/** days_used: daily log count → manual entry → date range fallback. */
export function getDaysUsed(contract) {
  if (Array.isArray(contract?.daily_usage) && contract.daily_usage.length > 0) {
    return contract.daily_usage.length;
  }
  // Quick mode: manually entered days used
  if (num(contract?.actual_days_used) > 0) return num(contract?.actual_days_used);
  // Fallback: derive from date range
  return getDaysInDateRange(contract);
}

/** True when the contract has real per-day entries (not quick mode). */
export function hasRealDailyUsage(contract) {
  return Array.isArray(contract?.daily_usage) && contract.daily_usage.length > 0;
}

/**
 * Calculate the full billing breakdown for a contract.
 */
export function calculateContractBilling(contract) {
  const base = getContractRate(contract);
  const allowanceDays = num(contract?.allowance_days);
  const allowanceHoursPerDay = num(contract?.allowance_hours_per_day);
  const extraDayRate = num(contract?.extra_day_rate);
  const extraHourRate = num(contract?.extra_hour_rate);
  const prorateUnderuse = !!contract?.prorate_underuse;
  const daysUsed = getDaysUsed(contract);
  const realDaily = hasRealDailyUsage(contract);

  // Day overage / under-use
  const dayDelta = allowanceDays > 0 ? daysUsed - allowanceDays : 0;
  let overageDaysCharge = 0;
  let underuseDaysCredit = 0;

  if (dayDelta > 0) {
    overageDaysCharge = dayDelta * extraDayRate;
  } else if (dayDelta < 0 && prorateUnderuse && allowanceDays > 0) {
    const perDayValue = base / allowanceDays;
    underuseDaysCredit = Math.abs(dayDelta) * perDayValue;
  }

  // Hour overage
  const hourOverageBreakdown = [];
  let hourOverageCharge = 0;
  let totalHoursUsed = 0;

  if (realDaily) {
    // Per-day breakdown — only flagged days
    for (const entry of contract.daily_usage) {
      const hoursUsed = num(entry?.hours_used);
      totalHoursUsed += hoursUsed;
      if (allowanceHoursPerDay > 0 && hoursUsed > allowanceHoursPerDay) {
        const hoursOver = hoursUsed - allowanceHoursPerDay;
        const charge = hoursOver * extraHourRate;
        hourOverageCharge += charge;
        hourOverageBreakdown.push({
          date: entry?.date || null,
          hoursUsed,
          hoursOver,
          charge,
          isQuickMode: false,
        });
      }
    }
  } else {
    // Quick mode — lump sum
    const avg = num(contract?.avg_hours_per_day);
    totalHoursUsed = avg * daysUsed;
    if (allowanceHoursPerDay > 0 && avg > allowanceHoursPerDay && daysUsed > 0) {
      const hoursOver = avg - allowanceHoursPerDay;
      const charge = hoursOver * daysUsed * extraHourRate;
      hourOverageCharge = charge;
      hourOverageBreakdown.push({
        date: null,
        hoursUsed: avg,
        hoursOver,
        charge,
        isQuickMode: true,
        days: daysUsed,
      });
    }
  }

  // Total allowed hours for the used days
  const totalAllowanceHours = allowanceHoursPerDay * daysUsed;
  const hourDelta = totalHoursUsed - totalAllowanceHours;

  const total = base + overageDaysCharge - underuseDaysCredit + hourOverageCharge;

  return {
    base,
    daysUsed,
    allowanceDays,
    dayDelta,
    overageDaysCharge,
    underuseDaysCredit,
    hourOverageCharge,
    hourOverageBreakdown,
    totalHoursUsed,
    totalAllowanceHours,
    hourDelta,
    isQuickMode: !realDaily,
    total,
  };
}

/**
 * Build invoice line items from the calculation result.
 */
export function buildContractInvoiceLineItems(contract, calc, vehicleLabel, driverLabel) {
  const items = [];
  const prefix = vehicleLabel || 'Vehicle';
  const extraDayRate = num(contract?.extra_day_rate);
  const extraHourRate = num(contract?.extra_hour_rate);

  // Base contract rate
  if (calc.base > 0) {
    items.push({
      description: `${prefix} Rental — Base Contract Rate${driverLabel ? ` — ${driverLabel}` : ''}`,
      quantity: 1,
      unit_price: calc.base,
      amount: calc.base,
    });
  }

  // Day overage
  if (calc.overageDaysCharge > 0) {
    items.push({
      description: `Extra Days (${calc.dayDelta} day${calc.dayDelta !== 1 ? 's' : ''} over allowance @ ${extraDayRate}/day)`,
      quantity: calc.dayDelta,
      unit_price: extraDayRate,
      amount: calc.overageDaysCharge,
    });
  }

  // Under-use credit
  if (calc.underuseDaysCredit > 0) {
    const underDays = Math.abs(calc.dayDelta);
    items.push({
      description: `Under-usage Credit (${underDays} day${underDays !== 1 ? 's' : ''} under allowance)`,
      quantity: underDays,
      unit_price: -(calc.underuseDaysCredit / underDays),
      amount: -calc.underuseDaysCredit,
    });
  }

  // Hour overage
  for (const br of calc.hourOverageBreakdown) {
    if (br.isQuickMode) {
      items.push({
        description: `Hour Overage (approx — ${br.days} days × ${br.hoursOver}h over @ ${extraHourRate}/hr)`,
        quantity: br.hoursOver * br.days,
        unit_price: extraHourRate,
        amount: br.charge,
      });
    } else {
      const dateLabel = br.date ? ` (${br.date})` : '';
      items.push({
        description: `Hour Overage${dateLabel} — ${br.hoursUsed}h used, ${br.hoursOver}h over @ ${extraHourRate}/hr`,
        quantity: br.hoursOver,
        unit_price: extraHourRate,
        amount: br.charge,
      });
    }
  }

  if (items.length === 0) {
    items.push({
      description: `${prefix} Rental`,
      quantity: 1,
      unit_price: 0,
      amount: 0,
    });
  }

  return items;
}

/** Check whether a contract has enough usage data to invoice. */
export function hasUsageData(contract) {
  return hasRealDailyUsage(contract) || num(contract?.avg_hours_per_day) > 0 || num(contract?.actual_days_used) > 0;
}