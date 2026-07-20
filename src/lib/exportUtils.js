import jsPDF from 'jspdf';
import { getCompanySettings } from './companySettings';

export function exportToCSV(data, filename, columns) {
  const escape = (val, isNumeric) => {
    if (val == null) return '';
    if (isNumeric) {
      const num = Number(String(val).replace(/[^\d.-]/g, ''));
      return isNaN(num) ? '' : num.toFixed(2);
    }
    val = String(val);
    if (val.includes(',') || val.includes('"') || val.includes('\n')) return `"${val.replace(/"/g, '""')}"`;
    return val;
  };
  const headers = columns.map(c => escape(c.label)).join(',');
  const rows = data.map(item => columns.map(c => escape(item[c.key], c.numeric)).join(','));
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportToPDF(data, filename, columns, title, options = {}) {
  const settings = await getCompanySettings();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 14;
  const tableW = pageW - margin * 2;
  const colW = tableW / columns.length;

  // ── Branded Header (logo + Bill From) ────────────────────────────────────
  let headerY = 14;

  if (settings.logo_url) {
    try {
      const logo = await fetchLogoData(settings.logo_url);
      const maxW = 30, maxH = 26;
      const aspect = logo.w / logo.h;
      let lw = maxW, lh = maxW / aspect;
      if (lh > maxH) { lh = maxH; lw = maxH * aspect; }
      doc.addImage(logo.dataUrl, logo.format, margin, headerY, lw, lh);
    } catch (e) {}
  }

  doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(101, 67, 33);
  doc.text(settings.company_name || '', margin + 34, headerY + 4);
  doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(80, 80, 80);
  if (settings.address) doc.text(settings.address, margin + 34, headerY + 9);
  doc.text(`TRN: ${settings.trn || ''}  ·  ${settings.phone1 || ''}  ·  ${settings.email || ''}`, margin + 34, headerY + 13);

  doc.setFontSize(14); doc.setFont(undefined, 'bold'); doc.setTextColor(101, 67, 33);
  doc.text(title, pageW - margin, headerY + 4, { align: 'right' });
  doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(120, 120, 120);
  const dateRange = options.dateRange || new Date().toLocaleDateString('en-GB');
  doc.text(`${data.length} records · ${dateRange}`, pageW - margin, headerY + 9, { align: 'right' });

  doc.setDrawColor(153, 101, 21); doc.setLineWidth(0.8);
  doc.line(margin, headerY + 18, pageW - margin, headerY + 18);

  // ── Table (bronze alternating rows) ──────────────────────────────────────
  const drawHeaders = (y) => {
    doc.setFillColor(101, 67, 33); doc.rect(margin, y - 4, tableW, 7, 'F');
    doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(255, 255, 255);
    columns.forEach((c, i) => {
      const text = String(c.label).substring(0, 30);
      if (c.numeric) doc.text(text, margin + (i + 1) * colW - 1, y, { align: 'right' });
      else doc.text(text, margin + i * colW + 1, y);
    });
    doc.setFont(undefined, 'normal');
    return y + 6;
  };

  let y = drawHeaders(headerY + 24);
  doc.setFontSize(7);

  data.forEach((item, idx) => {
    if (y > pageH - 20) { doc.addPage(); y = drawHeaders(16); doc.setFontSize(7); }
    if (idx % 2 === 0) { doc.setFillColor(245, 240, 232); doc.rect(margin, y - 4, tableW, 5, 'F'); }
    doc.setTextColor(40, 40, 40);
    columns.forEach((c, i) => {
      let val = item[c.key];
      if (val == null) val = '';
      if (c.numeric) {
        const num = Number(String(val).replace(/[^\d.-]/g, ''));
        val = isNaN(num) ? '' : num.toFixed(2);
        doc.text(String(val), margin + (i + 1) * colW - 1, y, { align: 'right' });
      } else {
        doc.text(String(val).substring(0, 30), margin + i * colW + 1, y);
      }
    });
    y += 5;
  });

  // ── Totals row (gold fill, clean borders) ────────────────────────────────
  const hasNumeric = columns.some(c => c.numeric);
  if (hasNumeric && data.length > 0) {
    y += 2;
    doc.setDrawColor(101, 67, 33); doc.setLineWidth(0.5);
    doc.line(margin, y - 2, pageW - margin, y - 2);
    doc.setFillColor(153, 101, 21); doc.rect(margin, y - 2, tableW, 6, 'F');
    doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(255, 255, 255);
    doc.text('TOTAL', margin + 1, y + 2);
    columns.forEach((c, i) => {
      if (c.numeric) {
        const sum = data.reduce((s, item) => {
          const num = Number(String(item[c.key] || '0').replace(/[^\d.-]/g, ''));
          return s + (isNaN(num) ? 0 : num);
        }, 0);
        doc.text(sum.toFixed(2), margin + (i + 1) * colW - 1, y + 2, { align: 'right' });
      }
    });
    doc.setDrawColor(101, 67, 33);
    doc.line(margin, y + 4, pageW - margin, y + 4);
  }

  const dateStr = (options.dateRange || new Date().toISOString().split('T')[0]).replace(/[\/\s-]+/g, '-');
  doc.save(`${filename}-${dateStr}.pdf`);
}

async function fetchLogoData(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  const format = blob.type.includes('jpeg') ? 'JPEG'
    : blob.type.includes('webp') ? 'WEBP'
    : 'PNG';
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const dims = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = dataUrl;
  });
  return { dataUrl, format, ...dims };
}

export async function exportInvoicePDF(invoice, clientName, logoUrl) {
  // Programmatic canvas engine — replicates ReportLab layout in jsPDF
  // Letter size (612 × 792 pt), 140pt top bypass for pre-printed letterhead, 85pt bottom margin
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const width = doc.internal.pageSize.width;    // 612
  const height = doc.internal.pageSize.height; // 792

  const topMargin = 140;
  const leftMargin = 54;
  const rightMargin = 54;
  const bottomMargin = 85;

  const fmtDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00');
    if (isNaN(d.getTime())) return dateStr;
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  };

  let y = topMargin;

  const drawText = (text, x, yPos, { bold = false, fontSize = 10, color = [0, 0, 0], align = 'left' } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(String(text), x, yPos, { align });
  };

  // ── 1. DOCUMENT IDENTIFIER META ───────────────────────────────────────────
  drawText('INVOICE', leftMargin, y, { bold: true, fontSize: 16 });
  drawText(`Invoice Ref: ${invoice.invoice_number || '—'}`, width - rightMargin, y, { fontSize: 11, align: 'right' });

  y += 18;
  drawText(`Date: ${fmtDate(invoice.issue_date)}`, width - rightMargin, y, { fontSize: 9, color: [71, 85, 105], align: 'right' });

  y += 30;

  // ── 2. CLIENT / BILL TO BLOCK ──────────────────────────────────────────────
  drawText('BILL TO:', leftMargin, y, { bold: true, fontSize: 9, color: [100, 116, 139] });
  y += 14;
  drawText(clientName || invoice.client_name || '—', leftMargin, y, { bold: true, fontSize: 11 });

  if (invoice.client_trn) {
    y += 13;
    drawText(`TRN: ${invoice.client_trn}`, leftMargin, y, { fontSize: 9.5 });
  }

  y += 35;

  // ── 3. LINE ITEMS TABULAR GRID (monochrome, no fills) ─────────────────────
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(1);
  doc.line(leftMargin, y, width - rightMargin, y);

  y += 14;
  const colDescX = leftMargin;
  const colQtyX = width - 240;
  const colPriceX = width - 140;
  const colTotalX = width - rightMargin;

  drawText('Description', colDescX, y, { bold: true, fontSize: 9 });
  drawText('Qty', colQtyX, y, { bold: true, fontSize: 9, align: 'right' });
  drawText('Unit Price (AED)', colPriceX, y, { bold: true, fontSize: 9, align: 'right' });
  drawText('Amount (AED)', colTotalX, y, { bold: true, fontSize: 9, align: 'right' });

  y += 8;
  doc.line(leftMargin, y, width - rightMargin, y);

  const items = invoice.line_items || [];
  items.forEach(item => {
    y += 18;
    drawText(String(item.description || '').substring(0, 58), colDescX, y, { fontSize: 9.5 });
    drawText(String(item.quantity || ''), colQtyX, y, { fontSize: 9.5, align: 'right' });
    drawText(Number(item.unit_price || 0).toFixed(2), colPriceX, y, { fontSize: 9.5, align: 'right' });
    drawText(Number(item.amount || 0).toFixed(2), colTotalX, y, { fontSize: 9.5, align: 'right' });
  });

  y += 10;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.line(leftMargin, y, width - rightMargin, y);

  // ── 4. TOTALS SUMMATION MATRIX (double-line accent) ────────────────────────
  y += 20;
  drawText('Subtotal:', colPriceX, y, { fontSize: 9.5, align: 'right' });
  drawText(Number(invoice.subtotal || 0).toFixed(2), colTotalX, y, { fontSize: 9.5, align: 'right' });

  y += 14;
  drawText(`VAT (${invoice.vat_rate || 0}%):`, colPriceX, y, { fontSize: 9.5, align: 'right' });
  drawText(Number(invoice.vat_amount || 0).toFixed(2), colTotalX, y, { fontSize: 9.5, align: 'right' });

  y += 18;
  // Double-line rule above total
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(width - 180, y - 12, width - rightMargin, y - 12);

  drawText('Total (AED):', colPriceX, y, { bold: true, fontSize: 11, align: 'right' });
  drawText(Number(invoice.total_amount || 0).toFixed(2), colTotalX, y, { bold: true, fontSize: 11, align: 'right' });

  // Double-line rule below total
  doc.line(width - 180, y + 4, width - rightMargin, y + 4);

  doc.save(`invoice-${invoice.invoice_number || invoice.id}.pdf`);
}