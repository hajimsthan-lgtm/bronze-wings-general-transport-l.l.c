/**
 * Tax calculation helpers for amount entry with include/exclude VAT toggle.
 *
 * @param {number} amount - The entered amount
 * @param {number} rate  - VAT rate percentage (e.g. 5 for 5%)
 * @param {boolean} inclusive - true if amount already includes VAT
 * @returns {{ subtotal: number, vatAmount: number, total: number }}
 */
export function calcTaxBreakdown(amount, rate, inclusive) {
  const amt = Number(amount) || 0;
  const r = Number(rate) || 0;
  if (inclusive) {
    const subtotal = r > 0 ? Math.round((amt / (1 + r / 100)) * 100) / 100 : amt;
    const vatAmount = Math.round((amt - subtotal) * 100) / 100;
    return { subtotal, vatAmount, total: amt };
  }
  const vatAmount = Math.round((amt * (r / 100)) * 100) / 100;
  const total = Math.round((amt + vatAmount) * 100) / 100;
  return { subtotal: amt, vatAmount, total };
}