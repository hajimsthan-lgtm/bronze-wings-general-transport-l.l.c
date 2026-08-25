import { base44 } from '@/api/base44Client';

/**
 * Fetches the petty cash balance for a given driver.
 * Balance = sum(inflows) - sum(outflows) across all CashTransactions linked to the driver.
 * @param {string} driverId
 * @returns {Promise<number>}
 */
export async function fetchDriverWalletBalance(driverId) {
  if (!driverId) return 0;
  try {
    const txns = await base44.entities.CashTransaction.filter({ driver_id: driverId }, '-created_date', 500);
    return (txns || []).reduce((bal, t) => {
      const amt = Number(t.amount) || 0;
      return bal + (t.type === 'inflow' ? amt : -amt);
    }, 0);
  } catch {
    return 0;
  }
}