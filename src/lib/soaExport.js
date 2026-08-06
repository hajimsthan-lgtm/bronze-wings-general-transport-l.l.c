import { format } from 'date-fns';

const VEHICLE_TYPE_LABEL = {
  truck: 'TRUCK',
  trailer: 'FLATBED TRAILER',
  tanker: 'TANKER',
  pickup: 'PICKUP',
  other: 'OTHER',
};

const STATUS_LABEL = {
  paid: 'RECEIVED',
  sent: 'SENT',
  draft: 'DRAFT',
  partially_paid: 'PARTIAL',
  overdue: 'OVERDUE',
  cancelled: 'CANCELLED',
};

export function buildSoaRows(invoices, trips, vehicles) {
  const vehByPlate = {};
  (vehicles || []).forEach((v) => { if (v.plate_number) vehByPlate[v.plate_number] = v; });
  const tripById = {};
  (trips || []).forEach((t) => { if (t.id) tripById[t.id] = t; });
  return (invoices || []).map((inv, idx) => {
    let vtype = '';
    if (inv.trip_id && tripById[inv.trip_id]) {
      const plate = tripById[inv.trip_id].vehicle_plate;
      if (plate && vehByPlate[plate]) {
        const t = vehByPlate[plate].type;
        vtype = VEHICLE_TYPE_LABEL[t] || (t || '').toUpperCase();
      }
    }
    let month = '';
    if (inv.issue_date) {
      try { month = format(new Date(inv.issue_date), 'MMM-yy').toUpperCase(); } catch { month = ''; }
    }
    return {
      sno: idx + 1,
      invoice_number: inv.invoice_number || '',
      month,
      vehicle_type: vtype,
      status: STATUS_LABEL[inv.status] || (inv.status || '').toUpperCase(),
      raw_status: inv.status || '',
      amount: inv.total_amount || 0,
    };
  });
}

export function exportSoaCSV(rows, filename) {
  const headers = ['S.NO', 'Invoice #', 'MONTH', 'Vehicle type', 'Status', 'Amount'];
  const esc = (v) => { v = String(v ?? ''); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const lines = [headers.join(','), ...rows.map((r) => [r.sno, r.invoice_number, r.month, r.vehicle_type, r.status, Number(r.amount || 0).toFixed(2)].map(esc).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click(); URL.revokeObjectURL(url);
}

export async function exportSoaPDF(rows, filename, meta = {}) {
  // Delegate to the professional letterhead HTML→PDF generator
  const { exportSoaPDF: exportHtml } = await import('./soaHtml');
  return exportHtml(rows, filename, meta);
}