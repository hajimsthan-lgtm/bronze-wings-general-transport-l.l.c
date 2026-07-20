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

// Vehicle profit = total trip revenue - (fuel + expenses + services)
export function computeVehicleProfit({ trips, fuelRecords, expenses, serviceRecords }) {
  const map = {};
  const ensure = (plate) => {
    const key = plate || 'Unknown';
    if (!map[key]) map[key] = { vehicle_plate: key, revenue: 0, fuel: 0, expenses: 0, services: 0, trips: 0 };
    return map[key];
  };
  (trips || []).forEach((t) => { const v = ensure(t.vehicle_plate); v.revenue += t.revenue || 0; v.trips += 1; });
  (fuelRecords || []).forEach((f) => { ensure(f.vehicle_plate).fuel += f.total_cost || 0; });
  (expenses || []).forEach((e) => { ensure(e.vehicle_plate).expenses += e.amount || 0; });
  (serviceRecords || []).forEach((s) => { ensure(s.vehicle_plate).services += s.cost || 0; });
  return Object.values(map).map((v) => ({
    ...v,
    cost: v.fuel + v.expenses + v.services,
    profit: v.revenue - (v.fuel + v.expenses + v.services),
  }));
}

// Driver profit = total trip revenue - (base salary + overtime + expenses)
export function computeDriverProfit({ trips, salaryRecords, expenses }) {
  const map = {};
  const ensure = (name) => {
    const key = name || 'Unknown';
    if (!map[key]) map[key] = { driver_name: key, revenue: 0, salary: 0, overtime: 0, expenses: 0, trips: 0 };
    return map[key];
  };
  (trips || []).forEach((t) => { const d = ensure(t.driver_name); d.revenue += t.revenue || 0; d.trips += 1; });
  (salaryRecords || []).forEach((s) => { const d = ensure(s.driver_name); d.salary += s.base_salary || 0; d.overtime += s.overtime || 0; });
  (expenses || []).forEach((e) => { ensure(e.driver_name).expenses += e.amount || 0; });
  return Object.values(map).map((d) => ({
    ...d,
    cost: d.salary + d.overtime + d.expenses,
    profit: d.revenue - (d.salary + d.overtime + d.expenses),
  }));
}