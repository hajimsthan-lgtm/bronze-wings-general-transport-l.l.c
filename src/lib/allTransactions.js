export const ALL_TX_COLUMNS = [
  { label: 'Date', key: 'date' },
  { label: 'Type', key: 'type' },
  { label: 'Reference', key: 'reference' },
  { label: 'Description', key: 'description' },
  { label: 'Client / Vehicle', key: 'party' },
  { label: 'Inflow (AED)', key: 'inflow', numeric: true },
  { label: 'Outflow (AED)', key: 'outflow', numeric: true },
];

export function buildAllTransactions(trips = [], expenses = [], fuelRecords = []) {
  const rows = [];
  (trips || []).forEach((t) => rows.push({
    date: t.trip_date,
    type: 'Trip',
    reference: t.trip_number || t.id || '',
    description: `${t.from_location || ''} → ${t.to_location || ''}`,
    party: t.client_name || t.vehicle_plate || '',
    inflow: t.revenue || 0,
    outflow: 0,
  }));
  (expenses || []).forEach((e) => rows.push({
    date: e.date,
    type: 'Expense',
    reference: e.reference_number || e.id || '',
    description: e.description || e.category || '',
    party: e.vendor_name || e.vehicle_plate || '',
    inflow: 0,
    outflow: e.amount || 0,
  }));
  (fuelRecords || []).forEach((f) => rows.push({
    date: f.date,
    type: 'Fuel',
    reference: f.id || '',
    description: `${f.liters || 0} L @ ${f.price_per_liter || 0}`,
    party: f.vehicle_plate || '',
    inflow: 0,
    outflow: f.total_cost || 0,
  }));
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return rows;
}