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
  const rawRange = options.dateRange || new Date().toLocaleDateString('en-GB');
  const dateRange = rawRange.replace(/\s*[→➜]\s*/g, ' - ');
  doc.text(`${data.length} record${data.length !== 1 ? 's' : ''} · ${dateRange}`, pageW - margin, headerY + 8, { align: 'right' });
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

/**
 * Deductions-specific PDF export.
 * Expands each deduction into instalment rows sourced from salary history.
 * @param {object[]} deductions - DriverDeduction records
 * @param {object[]} salaryRecords - SalaryRecord records for this driver (all)
 * @param {string} driverName
 * @param {{ from: string, to: string }} dateRange
 * @param {string} filename
 */
export async function exportDeductionsPDF(deductions, salaryRecords, driverName, dateRange, filename) {
  const settings = await getCompanySettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;

  const drawPageFooter = (pageNum) => {
    doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(150, 150, 150);
    doc.text(settings.company_name || '', margin, pageH - 8);
    doc.text(`Page ${pageNum}`, pageW / 2, pageH - 8, { align: 'center' });
    doc.text(new Date().toLocaleString('en-GB'), pageW - margin, pageH - 8, { align: 'right' });
  };

  // ── Header ─────────────────────────────────────────────────────────────────
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
  doc.text('Pending Deductions — Quick View', pageW - margin, headerY + 3, { align: 'right' });
  doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(120, 120, 120);

  const rangeLabel = (dateRange.from && dateRange.to)
    ? `${dateRange.from} - ${dateRange.to}`
    : (dateRange.from ? `From ${dateRange.from}` : (dateRange.to ? `Until ${dateRange.to}` : 'All time'));
  doc.text(`${deductions.length} record${deductions.length !== 1 ? 's' : ''} · Date range: ${rangeLabel}`, pageW - margin, headerY + 8, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, pageW - margin, headerY + 12, { align: 'right' });
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5);
  doc.line(margin, headerY + 16, pageW - margin, headerY + 16);

  // ── Build instalment rows ──────────────────────────────────────────────────
  // For each deduction, find applied instalments from salary records
  const rows = [];
  for (const d of deductions) {
    const instalments = [];
    for (const sr of salaryRecords) {
      if (!sr.applied_deductions) continue;
      const match = sr.applied_deductions.find(
        (ad) => ad.description === (d.description || d.type) || ad.type === d.type
      );
      if (match) {
        instalments.push({
          appliedDate: sr.payment_date || sr.created_date || '',
          salaryMonth: `${sr.month || ''} ${sr.year || ''}`.trim(),
          amountApplied: Number(match.amount) || 0,
          paymentMethod: (sr.payment_method || '').replace(/_/g, ' '),
        });
      }
    }
    if (instalments.length === 0) {
      rows.push({
        driver: driverName,
        refId: d.id ? String(d.id).substring(0, 8).toUpperCase() : '-',
        description: d.description || d.type || '-',
        type: (d.type || '').replace(/_/g, ' '),
        status: d.status || 'active',
        issueDate: d.issue_date || '-',
        appliedDate: '-',
        salaryMonth: '-',
        paymentMethod: '-',
        amountApplied: 0,
        totalAmount: Number(d.total_amount) || 0,
        remaining: Number(d.remaining_balance) || 0,
      });
    } else {
      instalments.forEach((inst) => {
        rows.push({
          driver: driverName,
          refId: d.id ? String(d.id).substring(0, 8).toUpperCase() : '-',
          description: d.description || d.type || '-',
          type: (d.type || '').replace(/_/g, ' '),
          status: d.status || 'active',
          issueDate: d.issue_date || '-',
          appliedDate: inst.appliedDate || '-',
          salaryMonth: inst.salaryMonth || '-',
          paymentMethod: inst.paymentMethod || '-',
          amountApplied: inst.amountApplied,
          totalAmount: Number(d.total_amount) || 0,
          remaining: Number(d.remaining_balance) || 0,
        });
      });
    }
  }

  // ── Column definitions ─────────────────────────────────────────────────────
  const cols = [
    { label: 'Driver', key: 'driver', w: 22 },
    { label: 'Ref', key: 'refId', w: 14 },
    { label: 'Description', key: 'description', w: 28 },
    { label: 'Type', key: 'type', w: 18 },
    { label: 'Status', key: 'status', w: 14 },
    { label: 'Issue Date', key: 'issueDate', w: 18 },
    { label: 'Applied Date', key: 'appliedDate', w: 18 },
    { label: 'Salary Month', key: 'salaryMonth', w: 20 },
    { label: 'Method', key: 'paymentMethod', w: 16 },
    { label: 'Applied (AED)', key: 'amountApplied', w: 22, numeric: true },
    { label: 'Total (AED)', key: 'totalAmount', w: 20, numeric: true },
    { label: 'Remaining', key: 'remaining', w: 20, numeric: true },
  ];

  const tableW = pageW - margin * 2;
  const totalColW = cols.reduce((s, c) => s + c.w, 0);
  const scale = tableW / totalColW;
  const scaledCols = cols.map((c) => ({ ...c, sw: c.w * scale }));

  const drawTableHeaders = (y) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 4, tableW, 7, 'F');
    doc.setFontSize(6.5); doc.setFont(undefined, 'bold'); doc.setTextColor(60, 60, 60);
    let x = margin;
    scaledCols.forEach((c) => {
      if (c.numeric) doc.text(c.label, x + c.sw - 1, y, { align: 'right' });
      else doc.text(c.label.substring(0, 16), x + 1, y);
      x += c.sw;
    });
    doc.setFont(undefined, 'normal');
    return y + 6;
  };

  let y = drawTableHeaders(headerY + 22);
  doc.setFontSize(6.5);
  let pageNum = 1;

  rows.forEach((row, idx) => {
    if (y > pageH - 30) {
      drawPageFooter(pageNum);
      doc.addPage();
      pageNum++;
      y = drawTableHeaders(20);
      doc.setFontSize(6.5);
    }
    if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - 4, tableW, 6, 'F'); }
    doc.setTextColor(30, 30, 30);
    let x = margin;
    scaledCols.forEach((c) => {
      let val = row[c.key];
      if (val == null) val = '';
      if (c.numeric) {
        const num = Number(val);
        const str = isNaN(num) ? '-' : num.toFixed(2);
        doc.text(str, x + c.sw - 1, y, { align: 'right' });
      } else if (c.key === 'status') {
        const color = STATUS_DOT_COLORS[String(val).toLowerCase()] || [100, 100, 100];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.circle(x + 2, y - 1, 0.8, 'F');
        doc.text(String(val).substring(0, 12), x + 5, y);
      } else {
        doc.text(String(val).substring(0, 20), x + 1, y);
      }
      x += c.sw;
    });
    y += 6;
  });

  // ── Summary footer ─────────────────────────────────────────────────────────
  if (rows.length > 0) {
    y += 3;
    if (y > pageH - 35) {
      drawPageFooter(pageNum);
      doc.addPage();
      pageNum++;
      y = 20;
    }
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5);
    doc.line(margin, y - 1, pageW - margin, y - 1);

    const totalOriginal = deductions.reduce((s, d) => s + (Number(d.total_amount) || 0), 0);
    const totalDeducted = deductions.reduce((s, d) => s + (Number(d.total_amount) || 0) - (Number(d.remaining_balance) || 0), 0);
    const totalRemaining = deductions.reduce((s, d) => s + (Number(d.remaining_balance) || 0), 0);

    doc.setFontSize(7.5); doc.setFont(undefined, 'bold'); doc.setTextColor(30, 30, 30);
    doc.text(`TOTAL RECORDS: ${deductions.length}`, margin + 1, y + 4);
    doc.text(`Instalments: ${rows.length}`, margin + 1, y + 10);

    const colRight = pageW - margin;
    doc.text(`Total Original Amount:`, colRight - 70, y + 4);
    doc.text(`AED ${totalOriginal.toFixed(2)}`, colRight, y + 4, { align: 'right' });
    doc.text(`Total Deducted to Date:`, colRight - 70, y + 10);
    doc.text(`AED ${totalDeducted.toFixed(2)}`, colRight, y + 10, { align: 'right' });
    doc.setTextColor(200, 0, 0);
    doc.text(`Total Remaining Outstanding:`, colRight - 70, y + 16);
    doc.text(`AED ${totalRemaining.toFixed(2)}`, colRight, y + 16, { align: 'right' });
    doc.setTextColor(30, 30, 30);

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y + 19, pageW - margin, y + 19);
  }

  drawPageFooter(pageNum);

  const fileDateStr = new Date().toISOString().split('T')[0];
  doc.save(`${filename}-${fileDateStr}.pdf`);
}