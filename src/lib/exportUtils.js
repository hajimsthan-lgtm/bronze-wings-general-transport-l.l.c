import jsPDF from 'jspdf';
import { getCompanySettings } from './companySettings';
import { downloadInvoicePDF } from './invoiceHtml';
import { hasArabicText, renderCellToImage } from './pdfArabicRenderer';

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
  pending: [239, 68, 68], overdue: [239, 68, 68], rejected: [239, 68, 68], cancelled: [239, 68, 68], voided: [239, 68, 68], unpaid: [239, 68, 68],
  paused: [245, 158, 11], partially_paid: [245, 158, 11], draft: [150, 150, 150], sent: [59, 130, 246],
  inactive: [150, 150, 150], expired: [150, 150, 150], terminated: [150, 150, 150],
};

// Truncate long strings like full addresses to a short label
function shortLocation(val) {
  if (!val) return '';
  const s = String(val);
  // If it contains commas (full address), take just the first segment
  if (s.includes(',')) return s.split(',')[0].trim();
  return s.length > 22 ? s.substring(0, 20) + '…' : s;
}

export async function exportToPDF(data, filename, columns, title, options = {}) {
  const settings = await getCompanySettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;
  const tableW = pageW - margin * 2;

  // Compute per-column widths: honour column.w if provided, otherwise equal-split
  const totalFixed = columns.reduce((s, c) => s + (c.w || 0), 0);
  const flexCount = columns.filter((c) => !c.w).length;
  const flexW = flexCount > 0 ? (tableW - totalFixed) / flexCount : 0;
  const colWidths = columns.map((c) => c.w || flexW);
  // Backward-compat alias used below
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
  const GEN_PAD = 2.5;     // increased from 1.5 — prevents cross-column text touch
  const GEN_LINE_H = 3.4;
  const GEN_CELL_PAD = 2.0;

  // Build running x-offsets from colWidths
  const colX = (i) => colWidths.slice(0, i).reduce((s, w) => s + w, margin);

  const drawHeaders = (y) => {
    doc.setFillColor(240, 240, 240); doc.rect(margin, y - 4, tableW, 7, 'F');
    doc.setFontSize(7.5); doc.setFont(undefined, 'bold'); doc.setTextColor(60, 60, 60);
    columns.forEach((c, i) => {
      const x = colX(i);
      const cw = colWidths[i];
      if (c.numeric) doc.text(String(c.label), x + cw - GEN_PAD, y, { align: 'right' });
      else doc.text(String(c.label), x + GEN_PAD, y);
    });
    doc.setFont(undefined, 'normal');
    return y + 6;
  };

  let y = drawHeaders(headerY + 22);
  doc.setFontSize(7.5);
  let pageNum = 1;

  const FRIENDLY_STATUS = { unpaid: 'Unpaid', paid: 'Paid', partially_paid: 'Partial', cash_received: 'Cash', bank_received: 'Bank', corporate_credit: 'Corporate', draft: 'Draft', sent: 'Sent', signed: 'Signed', cancelled: 'Cancelled', active: 'Active', inactive: 'Inactive', expired: 'Expired', completed: 'Completed', overdue: 'Overdue', scheduled: 'Scheduled', in_transit: 'In Transit' };

  data.forEach((item, idx) => {
    doc.setFontSize(7.5);
    const cells = columns.map((c, i) => {
      const cw = colWidths[i];
      let val = c.transform ? c.transform(item) : item[c.key];
      if (val == null) val = '';

      if (c.numeric) {
        const num = Number(String(val).replace(/[^\d.-]/g, ''));
        return { lines: [isNaN(num) ? '' : num.toFixed(2)], numeric: true };
      } else if (c.key === 'status' || c.key === 'payment_status') {
        // Status: single line, dot + friendly label — never wraps
        return { lines: [String(val)], isStatus: true };
      } else if (c.noWrap || c.key === 'trip_number') {
        // IDs must never wrap mid-string
        return { lines: [String(val)], noWrap: true };
      } else if (c.key === 'from_location' || c.key === 'to_location') {
        // Truncate full addresses to short location label
        return { lines: [shortLocation(String(val))] };
      } else {
        const strVal = String(val);
        const maxW = cw - GEN_PAD * 2;
        if (hasArabicText(strVal)) {
          const { dataUrl, linesCount } = renderCellToImage(strVal, 7.5, maxW, GEN_LINE_H, [30, 30, 30]);
          return { lines: new Array(linesCount), isImage: true, dataUrl, cw };
        }
        return { lines: doc.splitTextToSize(strVal, maxW) };
      }
    });

    const maxLines = Math.max(...cells.map((c) => c.lines.length));
    const rowH = maxLines * GEN_LINE_H + GEN_CELL_PAD * 2;

    if (y + rowH > pageH - 25) {
      drawPageFooter(pageNum);
      doc.addPage();
      pageNum++;
      y = drawHeaders(20);
      doc.setFontSize(7.5);
    }

    if (idx % 2 === 0) { doc.setFillColor(250, 250, 250); doc.rect(margin, y - GEN_CELL_PAD, tableW, rowH, 'F'); }
    doc.setTextColor(30, 30, 30);
    const baselineY = y + GEN_LINE_H * 0.3;
    cells.forEach((cell, i) => {
      const x = colX(i);
      const cw = colWidths[i];
      if (cell.numeric) {
        doc.text(cell.lines[0], x + cw - GEN_PAD, baselineY, { align: 'right' });
      } else if (cell.isStatus) {
        const rawStatus = String(cell.lines[0]).toLowerCase();
        const color = STATUS_DOT_COLORS[rawStatus] || [100, 100, 100];
        const label = FRIENDLY_STATUS[rawStatus] || cell.lines[0];
        doc.setFillColor(color[0], color[1], color[2]);
        doc.circle(x + GEN_PAD + 0.8, baselineY - 0.8, 0.9, 'F');
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(label, x + GEN_PAD + 3.5, baselineY);
        doc.setTextColor(30, 30, 30);
      } else if (cell.isImage) {
        const imgW = cw - GEN_PAD * 2;
        const imgH = cell.lines.length * GEN_LINE_H;
        doc.addImage(cell.dataUrl, 'PNG', x + GEN_PAD, y, imgW, imgH);
      } else if (cell.noWrap) {
        doc.text(cell.lines[0], x + GEN_PAD, baselineY);
      } else {
        cell.lines.forEach((line, li) => {
          doc.text(line, x + GEN_PAD, baselineY + li * GEN_LINE_H);
        });
      }
    });
    y += rowH;
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
        doc.text(sum.toFixed(2), colX(i) + colWidths[i] - GEN_PAD, y + 2, { align: 'right' });
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

  // ── Build ledger rows: adding (loan issued) + deduction (instalment) ────────
  // For each deduction, emit an "Adding" row (green) for the original advance,
  // then a "Deduction" row (red) for each instalment applied via salary records.
  // A running Balance column shows the remaining after each transaction.
  const rows = [];
  for (const d of deductions) {
    const total = Number(d.total_amount) || 0;
    const refId = d.id ? String(d.id).substring(0, 8).toUpperCase() : '-';
    const desc = d.description || d.type || '-';
    const dtype = (d.type || '').replace(/_/g, ' ');

    // Gather instalments from salary history
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

    // Row 1: Adding (the original advance/loan given to employee) — green
    rows.push({
      date: d.issue_date || '-',
      refId,
      description: desc,
      type: dtype,
      txnType: 'Adding',
      debit: total,        // money given to employee
      credit: 0,
      balance: total,      // full amount outstanding
      method: '-',
    });

    // Subsequent rows: Deduction (instalment repaid via salary) — red
    let running = total;
    instalments.sort((a, b) => new Date(a.appliedDate || 0) - new Date(b.appliedDate || 0));
    instalments.forEach((inst) => {
      running -= inst.amountApplied;
      rows.push({
        date: inst.appliedDate || '-',
        refId,
        description: `Instalment — ${inst.salaryMonth || '-'}`,
        type: dtype,
        txnType: 'Deduction',
        debit: 0,
        credit: inst.amountApplied,  // money deducted from salary
        balance: running,
        method: inst.paymentMethod || '-',
      });
    });
  }

  // Sort rows chronologically by date (Adding before Deduction on same date)
  rows.sort((a, b) => {
    const dA = new Date(a.date || 0);
    const dB = new Date(b.date || 0);
    if (dA < dB) return -1;
    if (dA > dB) return 1;
    if (a.txnType === 'Adding' && b.txnType !== 'Adding') return -1;
    if (a.txnType !== 'Adding' && b.txnType === 'Adding') return 1;
    return 0;
  });

  // ── Column definitions (ledger style) ──────────────────────────────────────
  const cols = [
    { label: 'Date', key: 'date', w: 20 },
    { label: 'Ref', key: 'refId', w: 18, noWrap: true },
    { label: 'Description', key: 'description', w: 36 },
    { label: 'Type', key: 'type', w: 18 },
    { label: 'Txn', key: 'txnType', w: 16 },
    { label: 'Method', key: 'method', w: 16 },
    { label: 'Added (AED)', key: 'debit', w: 20, numeric: true },
    { label: 'Deducted (AED)', key: 'credit', w: 22, numeric: true },
    { label: 'Balance (AED)', key: 'balance', w: 22, numeric: true },
  ];

  const tableW = pageW - margin * 2;
  const totalColW = cols.reduce((s, c) => s + c.w, 0);
  const scale = tableW / totalColW;
  const scaledCols = cols.map((c) => ({ ...c, sw: c.w * scale }));

  const ROW_PAD = 1.5;
  const LINE_H = 3.6;
  const CELL_PAD_H = 2;

  // Light green for Adding, light red for Deduction
  const BG_GREEN = [220, 252, 231];   // #dcfce7
  const BG_RED   = [254, 226, 226];    // #fee2e2

  const drawTableHeaders = (y) => {
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y - 4, tableW, 7, 'F');
    doc.setFontSize(6.5); doc.setFont(undefined, 'bold'); doc.setTextColor(60, 60, 60);
    let x = margin;
    scaledCols.forEach((c) => {
      if (c.numeric) doc.text(c.label, x + c.sw - ROW_PAD, y, { align: 'right' });
      else doc.text(c.label, x + ROW_PAD, y);
      x += c.sw;
    });
    doc.setFont(undefined, 'normal');
    return y + 6;
  };

  const computeRow = (row) => {
    doc.setFontSize(6.5);
    return scaledCols.map((c) => {
      let val = row[c.key];
      if (val == null) val = '';
      if (c.numeric) {
        const num = Number(val);
        return { lines: [isNaN(num) ? '-' : num.toFixed(2)], numeric: true };
      } else if (c.noWrap) {
        return { lines: [String(val)], noWrap: true };
      } else {
        const maxW = c.sw - ROW_PAD * 2;
        const strVal = String(val);
        if (hasArabicText(strVal)) {
          const { dataUrl, linesCount } = renderCellToImage(strVal, 6.5, maxW, LINE_H, [30, 30, 30]);
          return { lines: new Array(linesCount), isImage: true, dataUrl };
        }
        const lines = doc.splitTextToSize(strVal, maxW);
        return { lines };
      }
    });
  };

  let y = drawTableHeaders(headerY + 22);
  doc.setFontSize(6.5);
  let pageNum = 1;

  rows.forEach((row) => {
    const cells = computeRow(row);
    const maxLines = Math.max(...cells.map((c) => c.lines.length));
    const rowH = maxLines * LINE_H + CELL_PAD_H * 2;

    if (y + rowH > pageH - 30) {
      drawPageFooter(pageNum);
      doc.addPage();
      pageNum++;
      y = drawTableHeaders(20);
      doc.setFontSize(6.5);
    }

    // Coloured row background: green = Adding, red = Deduction
    const bg = row.txnType === 'Adding' ? BG_GREEN : BG_RED;
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.rect(margin, y - CELL_PAD_H, tableW, rowH, 'F');

    doc.setTextColor(30, 30, 30);
    let x = margin;
    cells.forEach((cell, ci) => {
      const c = scaledCols[ci];
      const cellY = y + LINE_H * 0.4;
      if (cell.numeric) {
        const num = Number(cell.lines[0]);
        if (!isNaN(num) && num === 0) {
          doc.setTextColor(160, 160, 160);
          doc.text('—', x + c.sw - ROW_PAD, cellY, { align: 'right' });
          doc.setTextColor(30, 30, 30);
        } else {
          // Balance column: red text if outstanding > 0, green if settled
          if (c.key === 'balance') {
            doc.setTextColor(num > 0 ? 200 : 22, num > 0 ? 0 : 128, num > 0 ? 0 : 57);
          }
          doc.text(cell.lines[0], x + c.sw - ROW_PAD, cellY, { align: 'right' });
          doc.setTextColor(30, 30, 30);
        }
      } else if (cell.isImage) {
        const imgW = c.sw - ROW_PAD * 2;
        const imgH = cell.lines.length * LINE_H;
        doc.addImage(cell.dataUrl, 'PNG', x + ROW_PAD, y, imgW, imgH);
      } else if (cell.noWrap) {
        doc.text(cell.lines[0], x + ROW_PAD, cellY);
      } else {
        cell.lines.forEach((line, li) => {
          doc.text(line, x + ROW_PAD, cellY + li * LINE_H);
        });
      }
      x += c.sw;
    });

    y += rowH;
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
    doc.text(`TOTAL DEDUCTION RECORDS: ${deductions.length}`, margin + 1, y + 4);
    doc.text(`Transactions: ${rows.length}`, margin + 1, y + 10);

    const colRight = pageW - margin;
    doc.text(`Total Original Amount:`, colRight - 70, y + 4);
    doc.text(`AED ${totalOriginal.toFixed(2)}`, colRight, y + 4, { align: 'right' });
    doc.text(`Total Deducted to Date:`, colRight - 70, y + 10);
    doc.text(`AED ${totalDeducted.toFixed(2)}`, colRight, y + 10, { align: 'right' });
    doc.setTextColor(200, 0, 0);
    doc.text(`Total Remaining Outstanding:`, colRight - 70, y + 16);
    doc.text(`AED ${totalRemaining.toFixed(2)}`, colRight, y + 16, { align: 'right' });
    doc.setTextColor(30, 30, 30);

    // Legend
    doc.setFontSize(6.5); doc.setFont(undefined, 'normal');
    doc.setFillColor(BG_GREEN[0], BG_GREEN[1], BG_GREEN[2]);
    doc.rect(margin + 1, y + 20, 4, 3, 'F');
    doc.setTextColor(30, 30, 30);
    doc.text('Adding = advance/loan issued to employee', margin + 7, y + 22.5);
    doc.setFillColor(BG_RED[0], BG_RED[1], BG_RED[2]);
    doc.rect(margin + 70, y + 20, 4, 3, 'F');
    doc.text('Deduction = instalment repaid via salary', margin + 76, y + 22.5);

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y + 25, pageW - margin, y + 25);
  }

  drawPageFooter(pageNum);

  const fileDateStr = new Date().toISOString().split('T')[0];
  doc.save(`${filename}-${fileDateStr}.pdf`);
}