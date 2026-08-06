import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { getCompanySettings } from './companySettings';

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
  const settings = await getCompanySettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;
  const tableW = pageW - margin * 2;
  const cols = ['S.NO', 'Invoice #', 'MONTH', 'Vehicle type', 'Status', 'Amount'];
  const colW = [tableW * 0.10, tableW * 0.20, tableW * 0.15, tableW * 0.25, tableW * 0.18, tableW * 0.12];
  const rowH = 8;

  let y = 18;
  // Company header (left)
  doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
  doc.text(settings.company_name || meta.companyName || '', margin, y);
  doc.setFontSize(9); doc.setFont(undefined, 'normal');
  if (settings.address) doc.text(settings.address, margin, y + 5);
  doc.text('ATTN: ACCOUNTS DEPARTMENT', margin, y + 10);
  const attnW = doc.getTextWidth('ATTN: ACCOUNTS DEPARTMENT');
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
  doc.line(margin, y + 11, margin + attnW, y + 11);

  // Date (right)
  const dateStr = meta.date || format(new Date(), 'dd-MM-yyyy');
  doc.setFontSize(10); doc.setFont(undefined, 'normal'); doc.setTextColor(0, 0, 0);
  doc.text(`Date: ${dateStr}`, pageW - margin, y, { align: 'right' });

  // Title centered underlined
  y += 24;
  doc.setFontSize(16); doc.setFont(undefined, 'bold');
  const title = 'Sub: Account Statement';
  const titleW = doc.getTextWidth(title);
  doc.text(title, pageW / 2, y, { align: 'center' });
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
  doc.line(pageW / 2 - titleW / 2, y + 1.5, pageW / 2 + titleW / 2, y + 1.5);

  // Table
  y += 10;
  const startY = y;
  doc.setFillColor(255, 255, 255);
  doc.rect(margin, y, tableW, rowH, 'F');
  doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(0, 0, 0);
  let x = margin;
  cols.forEach((c, i) => { doc.text(c, x + colW[i] / 2, y + 5.5, { align: 'center' }); x += colW[i]; });
  y += rowH;
  doc.setFontSize(9); doc.setFont(undefined, 'normal'); doc.setTextColor(204, 0, 0);
  rows.forEach((r) => {
    if (y > pageH - 24) { doc.addPage(); y = 20; }
    const cells = [String(r.sno), String(r.invoice_number), r.month, r.vehicle_type, r.status, Number(r.amount || 0).toFixed(2)];
    let cx = margin;
    cells.forEach((val, i) => { doc.text(val, cx + colW[i] / 2, y + 5.5, { align: i === 5 ? 'right' : 'center' }); cx += colW[i]; });
    y += rowH;
  });
  const tableBottom = y;
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);
  doc.rect(margin, startY, tableW, tableBottom - startY);
  for (let yy = startY; yy <= tableBottom + 0.1; yy += rowH) doc.line(margin, yy, margin + tableW, yy);
  let xv = margin;
  cols.forEach((_, i) => { doc.line(xv, startY, xv, tableBottom); xv += colW[i]; });
  doc.line(margin + tableW, startY, margin + tableW, tableBottom);

  // Total
  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  if (rows.length > 0) {
    y = tableBottom + 8;
    doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(204, 0, 0);
    doc.text(`Total: ${total.toFixed(2)}`, pageW - margin, y, { align: 'right' });
  }

  const dateStrFile = (meta.date || new Date().toISOString().split('T')[0]).replace(/[\/\s-]+/g, '-');
  doc.save(`${filename}-${dateStrFile}.pdf`);
}