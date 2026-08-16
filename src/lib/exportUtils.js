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

const STATUS_DOT_COLORS = {
  active: [34, 197, 94], paid: [34, 197, 94], completed: [34, 197, 94], accepted: [34, 197, 94], signed: [34, 197, 94],
  pending: [239, 68, 68], overdue: [239, 68, 68], rejected: [239, 68, 68], cancelled: [239, 68, 68], voided: [239, 68, 68],
  paused: [245, 158, 11], partially_paid: [245, 158, 11], draft: [150, 150, 150], sent: [59, 130, 246],
  inactive: [150, 150, 150], expired: [150, 150, 150], terminated: [150, 150, 150],
};

export async function exportToPDF(data, filename, columns, title, options = {}) {
  const settings = await getCompanySettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;
  const tableW = pageW - margin * 2;
  const colW = tableW / columns.length;

  const drawPageFooter = (pageNum) => {
    doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(150, 150, 150);
    doc.text(settings.company_name || '', margin, pageH - 8);
    doc.text(`Page ${pageNum}`, pageW / 2, pageH - 8, { align: 'center' });
    doc.text(new Date().toLocaleString('en-GB'), pageW - margin, pageH - 8, { align: 'right' });
  };

  // ── Header ────────────────────────────────────────────────────────────────
  let headerY = 15;
  let logoOffset = 0;

  if (settings.logo_url) {
    try {
      const logo = await fetchLogoData(settings.logo_url);
      const maxW = 25, maxH = 18;
      const aspect = logo.w / logo.h;
      let lw = maxW, lh = maxW / aspect;
      if (lh > maxH) { lh = maxH; lw = maxH * aspect; }
      doc.addImage(logo.dataUrl, logo.format, margin, headerY - 1, lw, lh);
      logoOffset = lw + 4;
    } catch (e) {}
  }

  doc.setFontSize(11); doc.setFont(undefined, 'bold'); doc.setTextColor(30, 30, 30);
  doc.text(settings.company_name || '', margin + logoOffset, headerY + 3);
  doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100);
  if (settings.address) doc.text(settings.address, margin + logoOffset, headerY + 8);
  doc.text(`TRN: ${settings.trn || ''}  ·  ${settings.phone1 || ''}  ·  ${settings.email || ''}`, margin + logoOffset, headerY + 12);

  doc.setFontSize(13); doc.setFont(undefined, 'bold'); doc.setTextColor(30, 30, 30);
  doc.text(title, pageW - margin, headerY + 3, { align: 'right' });
  doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(120, 120, 120);
  const dateRange = options.dateRange || new Date().toLocaleDateString('en-GB');
  doc.text(`${data.length} records · ${dateRange}`, pageW - margin, headerY + 8, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, pageW - margin, headerY + 12, { align: 'right' });

  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5);
  doc.line(margin, headerY + 16, pageW - margin, headerY + 16);

  // ── Table ──────────────────────────────────────────────────────────────────
  const drawHeaders = (y) => {
    doc.setFillColor(240, 240, 240); doc.rect(margin, y - 4, tableW, 7, 'F');
    doc.setFontSize(7.5); doc.setFont(undefined, 'bold'); doc.setTextColor(60, 60, 60);
    columns.forEach((c, i) => {
      const text = String(c.label).substring(0, 25);
      if (c.numeric) doc.text(text, margin + (i + 1) * colW - 1, y, { align: 'right' });
      else doc.text(text, margin + i * colW + 1, y);
    });
    doc.setFont(undefined, 'normal');
    return y + 6;
  };

  let y = drawHeaders(headerY + 22);
  doc.setFontSize(7.5);
  let pageNum = 1;

  data.forEach((item, idx) => {
    if (y > pageH - 25) {
      drawPageFooter(pageNum);
      doc.addPage();
      pageNum++;
      y = drawHeaders(20);
      doc.setFontSize(7.5);
    }
    if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - 4, tableW, 6, 'F'); }
    doc.setTextColor(30, 30, 30);
    columns.forEach((c, i) => {
      let val = item[c.key];
      if (val == null) val = '';
      if (c.numeric) {
        const num = Number(String(val).replace(/[^\d.-]/g, ''));
        val = isNaN(num) ? '' : num.toFixed(2);
        doc.text(String(val), margin + (i + 1) * colW - 1, y, { align: 'right' });
      } else if (c.key === 'status') {
        const color = STATUS_DOT_COLORS[String(val).toLowerCase()] || [100, 100, 100];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.circle(margin + i * colW + 2, y - 1, 0.8, 'F');
        doc.text(String(val).substring(0, 20), margin + i * colW + 5, y);
      } else {
        doc.text(String(val).substring(0, 25), margin + i * colW + 1, y);
      }
    });
    y += 6;
  });

  // ── Summary footer ────────────────────────────────────────────────────────
  if (!options.skipTotal && data.length > 0) {
    y += 2;
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5);
    doc.line(margin, y - 2, pageW - margin, y - 2);
    doc.setFontSize(8); doc.setFont(undefined, 'bold'); doc.setTextColor(30, 30, 30);
    doc.text(`TOTAL RECORDS: ${data.length}`, margin + 1, y + 2);
    columns.forEach((c, i) => {
      if (c.numeric) {
        const sum = data.reduce((s, item) => {
          const num = Number(String(item[c.key] || '0').replace(/[^\d.-]/g, ''));
          return s + (isNaN(num) ? 0 : num);
        }, 0);
        doc.text(sum.toFixed(2), margin + (i + 1) * colW - 1, y + 2, { align: 'right' });
      }
    });
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y + 4, pageW - margin, y + 4);
  }

  drawPageFooter(pageNum);

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
  const settings = await getCompanySettings();
  return downloadInvoicePDF(invoice, clientName, settings);
}