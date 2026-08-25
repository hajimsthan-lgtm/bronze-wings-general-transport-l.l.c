import { base44 } from '@/api/base44Client';

/**
 * Fetches the petty wallet balance for a given driver.
 *
 * Flow:
 *   1. Admin funds the petty cash pool  → CashTransaction type=inflow (no driver_id)
 *   2. Op manager sends money to driver → CashTransaction type=outflow + driver_id
 *   3. Driver spends on fuel/maintenance → FuelRecord / ServiceRecord with payment_method=petty_wallet
 *
 * Driver wallet balance =
 *   sum(outflows  linked to driver)   ← money given TO driver
 * − sum(inflows   linked to driver)   ← money returned BY driver
 * − sum(fuel      petty_wallet costs) ← spent on fuel
 * − sum(maintenance petty_wallet costs) ← spent on maintenance
 *
 * @param {string} driverId
 * @returns {Promise<number>}
 */
export async function fetchDriverWalletBalance(driverId) {
  if (!driverId) return 0;
  try {
    // Get driver name for matching fuel/maintenance records (they store name, not id)
    const driver = await base44.entities.Driver.get(driverId).catch(() => null);
    const driverName = driver?.name || '';

    // 1. CashTransactions linked to this driver
    const txns = await base44.entities.CashTransaction.filter({ driver_id: driverId }, '-created_date', 500);
    let balance = (txns || []).reduce((bal, t) => {
      const amt = Number(t.amount) || 0;
      // outflow from petty cash → credit to driver wallet
      // inflow from driver back to pool → debit from driver wallet
      return bal + (t.type === 'outflow' ? amt : -amt);
    }, 0);

    if (driverName) {
      // 2. Subtract fuel expenses paid via petty wallet
      const fuel = await base44.entities.FuelRecord.filter(
        { payment_method: 'petty_wallet', driver_name: driverName },
        '-created_date', 500
      ).catch(() => []);
      balance -= (fuel || []).reduce((s, r) => s + (Number(r.total_with_vat) || Number(r.total_cost) || 0), 0);

      // 3. Subtract maintenance expenses paid via petty wallet
      const services = await base44.entities.ServiceRecord.filter(
        { payment_method: 'petty_wallet', driver_name: driverName },
        '-created_date', 500
      ).catch(() => []);
      balance -= (services || []).reduce((s, r) => s + (Number(r.total_with_vat) || Number(r.cost) || 0), 0);
    }

    return balance;
  } catch {
    return 0;
  }
}