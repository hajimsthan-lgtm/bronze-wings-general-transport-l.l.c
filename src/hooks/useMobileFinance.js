import { useMemo } from 'react';

/**
 * Aggregates mobile finance data: net balance, deposits/withdrawals,
 * a 7-day cash-flow series for the sparkline, and income/outflow breakdowns
 * for the tap-to-expand balance card.
 */
export function useMobileFinance({ clientPayments, cashTxns, bankRecs, vendorTxns, expenses }) {
  return useMemo(() => {
    const clientPayTotal = clientPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const bankDepTotal = bankRecs.reduce((s, r) => s + (Number(r.deposit) || 0), 0);
    const cashInTotal = cashTxns.filter((t) => t.type === 'inflow').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const expTotal = expenses.reduce((s, e) => s + (Number(e.total_with_vat) || Number(e.amount) || 0), 0);
    const bankWdTotal = bankRecs.reduce((s, r) => s + (Number(r.withdrawal) || 0), 0);
    const cashOutTotal = cashTxns.filter((t) => t.type === 'outflow').reduce((s, t) => s + (Number(t.amount) || 0), 0);
    const vendorTotal = vendorTxns.reduce((s, v) => s + (Number(v.amount) || 0), 0);

    const deposits = clientPayTotal + bankDepTotal + cashInTotal;
    const withdrawals = expTotal + bankWdTotal + cashOutTotal + vendorTotal;
    const netBalance = deposits - withdrawals;

    // 7-day net cash-flow series
    const dailySeries = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      let v = 0;
      clientPayments.forEach((p) => { if (p.date === key) v += Number(p.amount) || 0; });
      bankRecs.forEach((r) => { if (r.date === key) v += (Number(r.deposit) || 0) - (Number(r.withdrawal) || 0); });
      cashTxns.forEach((t) => { if (t.date === key) v += t.type === 'inflow' ? (Number(t.amount) || 0) : -(Number(t.amount) || 0); });
      expenses.forEach((e) => { if (e.date === key) v -= Number(e.total_with_vat) || Number(e.amount) || 0; });
      vendorTxns.forEach((vt) => { if (vt.date === key) v -= Number(vt.amount) || 0; });
      dailySeries.push({ label: d.toLocaleDateString('en', { weekday: 'short' }), v });
    }

    const incomeBreakdown = [
      { label: 'Client Payments', amount: clientPayTotal, color: '#22c55e' },
      { label: 'Bank Deposits', amount: bankDepTotal, color: '#06b6d4' },
      { label: 'Cash Inflow', amount: cashInTotal, color: '#84cc16' },
    ].filter((x) => x.amount > 0);

    const outflowBreakdown = [
      { label: 'Expenses', amount: expTotal, color: '#f97316' },
      { label: 'Bank Withdrawals', amount: bankWdTotal, color: '#ef4444' },
      { label: 'Cash Outflow', amount: cashOutTotal, color: '#eab308' },
      { label: 'Vendor Payments', amount: vendorTotal, color: '#a855f7' },
    ].filter((x) => x.amount > 0);

    return { netBalance, deposits, withdrawals, dailySeries, incomeBreakdown, outflowBreakdown };
  }, [clientPayments, cashTxns, bankRecs, vendorTxns, expenses]);
}