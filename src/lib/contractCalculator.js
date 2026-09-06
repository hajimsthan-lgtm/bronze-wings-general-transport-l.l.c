/**
 * Smart Allowance Calculator for Monthly Contracts.
 *
 * Computes billing based on:
 * - Contract Rate Period (allowance): allowance_days, allowance_hours_per_day,
 *   contract_rate, extra_day_rate, extra_hour_rate, prorate_underuse
 * - Actual Usage: actual_days_used + daily_usage (per-day hours) or avg_hours_per_day (quick mode)
 *
 * Works with old contracts that only have monthly_rate — falls back gracefully.
 */

const num = (v) => Number(v) || 0;

/**
 * Resolve the effective contract rate — falls back to monthly_rate for old contracts.
 */
export function getContractRate(contract) {
  return num(contract?.contract_rate) || num(contract?.monthly_rate) || 0;
}

/**
 * Build the effective daily usage array.
 * If daily_usage is populated, use it. Otherwise, if avg_hours_per_day is set,
 * generate one entry per actual_days_used with that average (quick mode).
 */
function getEffectiveDailyUsage(contract) {
  const actualDays = num(contract?.actual_days_used);
  if (Array.isArray(contract?.daily_usage) && contract.daily_usage.length > 0) {
    return contract.daily_usage;
  }
  const avg = num(contract?.avg_hours_per_day);
  if (avg > 0 && actualDays > 0) {
    return Array.from({ length: actualDays }, () => ({ date: null, hours_used: avg }));
  }
  return [];
}

/**
 * Calculate the full billing breakdown for a contract.
 *
 * @param {object} contract - The MonthlyContract record
 * @returns {{
 *   base: number,
 *   dayDelta: number,
 *   overageDaysCharge: number,
 *   underuseDaysCredit: number,
 *   hourOverageCharge: number,
 *   hourOverageBreakdown: Array<{ date, hoursUsed, hoursOver, charge }>,
 *   total: number
 * }}
 */
export function calculateContractBilling(contract) {
  const base = getContractRate(contract);
  const allowanceDays = num(contract?.allowance_days);
  const allowanceHoursPerDay = num(contract?.allowance_hours_per_day);
  const extraDayRate = num(contract?.extra_day_rate);
  const extraHourRate = num(contract?.extra_hour_rate);
  const prorateUnderuse = !!contract?.prorate_underuse;
  const actualDays = num(contract?.actual_days_used);

  // Day overage / under-use
  const dayDelta = allowanceDays > 0 ? actualDays - allowanceDays : 0;
  let overageDaysCharge = 0;
  let underuseDaysCredit = 0;

  if (dayDelta > 0) {
    overageDaysCharge = dayDelta * extraDayRate;
  } else if (dayDelta < 0 && prorateUnderuse && allowanceDays > 0) {
    const perDayValue = base / allowanceDays;
    underuseDaysCredit = Math.abs(dayDelta) * perDayValue;
  }

  // Hour overage — per day
  const dailyUsage = getEffectiveDailyUsage(contract);
  const hourOverageBreakdown = [];
  let hourOverageCharge = 0;

  for (const entry of dailyUsage) {
    const hoursUsed = num(entry?.hours_used);
    if (allowanceHoursPerDay > 0 && hoursUsed > allowanceHoursPerDay) {
      const hoursOver = hoursUsed - allowanceHoursPerDay;
      const charge = hoursOver * extraHourRate;
      hourOverageCharge += charge;
      hourOverageBreakdown.push({
        date: entry?.date || null,
        hoursUsed,
        hoursOver,
        charge,
      });
    }
  }

  const total = base + overageDaysCharge - underuseDaysCredit + hourOverageCharge;

  return {
    base,
    dayDelta,
    overageDaysCharge,
    underuseDaysCredit,
    hourOverageCharge,
    hourOverageBreakdown,
    total,
  };
}

/**
 * Build invoice line items from the calculation result.
 * Each charge component becomes a separate line item so the client can see
 * exactly what they're being charged for.
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

  // Hour overage — one line per day that exceeded
  for (const br of calc.hourOverageBreakdown) {
    const dateLabel = br.date ? ` (${br.date})` : '';
    items.push({
      description: `Hour Overage${dateLabel} — ${br.hoursUsed}h used, ${br.hoursOver}h over @ ${extraHourRate}/hr`,
      quantity: br.hoursOver,
      unit_price: extraHourRate,
      amount: br.charge,
    });
  }

  // Fallback: if no line items at all, add a zero-amount placeholder
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