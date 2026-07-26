import jsPDF from 'jspdf';
import { getCompanySettings } from './companySettings';
import { downloadInvoicePDF } from './invoiceHtml';

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
      const maxW = 30, maxH = 20;
      const aspect = logo.w / logo.h;
      let lw = maxW, lh = maxW / aspect;
      if (lh > maxH) { lh = maxH; lw = maxH * aspect; }
      doc.addImage(logo.dataUrl, logo.format, margin, headerY - 1, lw, lh);
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
  if (!options.skipTotal && hasNumeric && data.length > 0) {
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
  // Unified with the branded bulk "TAX INVOICE" format (see invoiceHtml.js).
  const settings = await getCompanySettings();
  return downloadInvoicePDF(invoice, clientName, settings);
}