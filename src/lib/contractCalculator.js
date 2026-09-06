/**
 * Smart Allowance Calculator for Monthly Rentals.
 *
 * Simplified billing model:
 * - Base = contract_rate (fixed monthly rental)
 * - Over Date Used (actual_days_used) × extra_day_rate = day overage
 * - Over Time Used (overtime_hours) × extra_hour_rate = hour overage
 * - Total = base + day overage + hour overage
 *
 * Works with old contracts that only have monthly_rate — falls back gracefully.
 */
import { formatDateDash } from '@/lib/formatters';
import { shortDriverName } from '@/lib/driverName';

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
 * Build a single Monthly Rental invoice line item whose description mirrors the
 * company's paper invoice format: rental type, monthly charge, period, over-usage
 * lines. Driver and vehicle plate appear on a separate indicator line (D:/V:)
 * via the PDF renderer's buildIndicatorLine — not in the description body.
 */
export function buildContractInvoiceLineItems(contract, calc, vehicleLabel, driverLabel) {
  const monthLabel = contract?.start_date
    ? new Date(contract.start_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).toUpperCase()
    : '';

  const lines = [];
  lines.push(`${(vehicleLabel || 'VEHICLE').toUpperCase()} RENTAL CHARGES`);
  lines.push(`MONTHLY CHARGES = ${calc.base}`);
  if (contract?.start_date && contract?.end_date) {
    lines.push(`(From ${formatDateDash(contract.start_date)} Till ${formatDateDash(contract.end_date)})`);
  }
  if (calc.overageDaysCharge > 0) {
    lines.push(`EXTRA DAYS USED = (${calc.extraDayRate} x ${calc.overDateUsed} = ${calc.overageDaysCharge})`);
  }
  if (calc.hourOverageCharge > 0) {
    lines.push(`EXTRA HOURS USED = (${calc.extraHourRate} x ${calc.overtimeHours} = ${calc.hourOverageCharge})`);
  }

  return [{
    description: lines.join('\n'),
    date: contract?.start_date || '',
    quantity: 1,
    unit_price: calc.total,
    amount: calc.total,
    month_label: monthLabel,
    driver_name: shortDriverName(driverLabel),
    vehicle_no: contract?.vehicle_plate || '',
    show_driver: true,
    show_vehicle: true,
    show_delivery_note: false,
  }];
}

/** Check whether a contract has enough data to invoice. */
export function hasUsageData(contract) {
  return getContractRate(contract) > 0;
}