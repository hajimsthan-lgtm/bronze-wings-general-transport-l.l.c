/**
 * Smart Allowance Calculator for Monthly Contracts.
 *
 * Simplified billing model:
 * - Base = contract_rate (fixed monthly rental)
 * - Over Date Used (actual_days_used) × extra_day_rate = day overage
 * - Over Time Used (overtime_hours) × extra_hour_rate = hour overage
 * - Total = base + day overage + hour overage
 *
 * Works with old contracts that only have monthly_rate — falls back gracefully.
 */

const num = (v) => Number(v) || 0;

export function getContractRate(contract) {
  return num(contract?.contract_rate) || num(contract?.monthly_rate) || 0;
}

/**
 * Calculate the full billing breakdown for a contract.
 */
export function calculateContractBilling(contract) {
  const base = getContractRate(contract);
  const extraDayRate = num(contract?.extra_day_rate);
  const extraHourRate = num(contract?.extra_hour_rate);
  const overDateUsed = num(contract?.actual_days_used);
  const overtimeHours = num(contract?.overtime_hours);

  const overageDaysCharge = Math.round(overDateUsed * extraDayRate * 100) / 100;
  const hourOverageCharge = Math.round(overtimeHours * extraHourRate * 100) / 100;
  const total = Math.round((base + overageDaysCharge + hourOverageCharge) * 100) / 100;

  return {
    base,
    overDateUsed,
    overtimeHours,
    extraDayRate,
    extraHourRate,
    overageDaysCharge,
    hourOverageCharge,
    total,
  };
}

/**
 * Build invoice line items from the calculation result.
 */
export function buildContractInvoiceLineItems(contract, calc, vehicleLabel, driverLabel) {
  const items = [];
  const prefix = vehicleLabel || 'Vehicle';

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
      description: `Extra Days (${calc.overDateUsed} day${calc.overDateUsed !== 1 ? 's' : ''} @ ${calc.extraDayRate}/day)`,
      quantity: calc.overDateUsed,
      unit_price: calc.extraDayRate,
      amount: calc.overageDaysCharge,
    });
  }

  // Hour overage
  if (calc.hourOverageCharge > 0) {
    items.push({
      description: `Overtime Hours (${calc.overtimeHours}h @ ${calc.extraHourRate}/hr)`,
      quantity: calc.overtimeHours,
      unit_price: calc.extraHourRate,
      amount: calc.hourOverageCharge,
    });
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

/** Check whether a contract has enough data to invoice. */
export function hasUsageData(contract) {
  return getContractRate(contract) > 0;
}