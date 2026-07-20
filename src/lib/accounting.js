// Financial accounting helpers for dashboard cards

export function computeBalancesFromTransactions(cashTxns, bankTxns) {
  const cash = (cashTxns || []).reduce(
    (sum, t) => sum + (t.type === 'inflow' ? (t.amount || 0) : -(t.amount || 0)),
    0
  );
  const bank = (bankTxns || []).reduce(
    (sum, t) => sum + (t.type === 'credit' ? (t.amount || 0) : -(t.amount || 0)),
    0
  );
  return { cash, bank, total: cash + bank };
}

export function computePeriodStats(invoices) {
  const revenue = (invoices || [])
    .filter((i) => i.status === 'paid')
    .reduce((s, i) => s + (i.paid_amount || i.total_amount || 0), 0);
  const outstanding = (invoices || [])
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((s, i) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0);
  return { revenue, outstanding };
}

export function computeUserBalances(transactions) {
  const map = {};
  (transactions || []).forEach((t) => {
    const key = t.customer_name || 'Unknown';
    if (!map[key]) {
      map[key] = { customer_name: key, total: 0, received: 0, balance: 0, count: 0 };
    }
    map[key].total += t.amount || 0;
    map[key].received += t.amount_received || 0;
    map[key].count += 1;
  });
  Object.values(map).forEach((v) => {
    v.balance = v.total - v.received;
  });
  return Object.values(map)
    .filter((v) => v.balance > 0)
    .sort((a, b) => b.balance - a.balance);
}