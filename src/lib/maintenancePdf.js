/**
 * Maintenance Record PDF Generator — uses the shared invoice letterhead.
 */
import { jsPDF } from 'jspdf';
import {
  PAGE_W, MARGIN, CONTENT_X, CONTENT_W, CONTENT_RIGHT, FOOTER_TOP,
  MAROON, DARK_BLUE, BROWN, BLACK, GRAY, LIGHT_GRAY, WHITE, ROW_ALT,
  str, fmtMoney, fmtDate, tc, fc, dc,
  drawPageBorder, drawLetterhead, drawPageNumbers, prepareSettings,
} from './docLetterhead';

function drawMaintenanceBanner(pdf, y) {
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  tc(pdf, DARK_BLUE);
  pdf.text('MAINTENANCE RECORD', PAGE_W / 2, y + 5.5, { align: 'center' });
  return y + 9;
}

function drawDetailsSection(pdf, r, y) {
  const leftX = CONTENT_X + 3;
  const rightX = CONTENT_RIGHT - 3;

  const labels = ['MAINT. REF #:', 'VEHICLE:', 'SERVICE TYPE:', 'DATE:', 'VENDOR:', 'ODOMETER:', 'NEXT SERVICE:', 'STATUS:'];
  const values = [
    str(r.maint_ref || '—'),
    str(r.vehicle_plate || '—'),
    str((r.service_type || 'other').replace(/_/g, ' ')),
    fmtDate(r.date),
    str(r.vendor_name || '—'),
    r.odometer_reading != null ? `${str(r.odometer_reading)} km` : '—',
    fmtDate(r.next_service_date),
    str(r.status || 'completed'),
  ];

  const lineH = 5;
  const h = labels.length * lineH + 6;

  dc(pdf, LIGHT_GRAY);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, CONTENT_W, h);

  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  tc(pdf, MAROON);
  pdf.text('SERVICE DETAILS', leftX, y + 4);
  dc(pdf, MAROON);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, y + 5, leftX + 28, y + 5);

  let ly = y + 10;
  for (let i = 0; i < labels.length; i++) {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(9);
    tc(pdf, BLACK);
    pdf.text(labels[i], leftX, ly);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    tc(pdf, BLACK);
    pdf.text(values[i], leftX + 32, ly);
    ly += lineH;
  }

  // Cost box on the right
  const costBoxW = 40;
  const costBoxX = rightX - costBoxW;
  const costBoxY = y + 6;
  fc(pdf, [240, 240, 240]);
  pdf.rect(costBoxX, costBoxY, costBoxW, 14, 'F');
  dc(pdf, BLACK);
  pdf.setLineWidth(0.3);
  pdf.rect(costBoxX, costBoxY, costBoxW, 14);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(8);
  tc(pdf, BLACK);
  pdf.text('COST', costBoxX + costBoxW / 2, costBoxY + 4, { align: 'center' });
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(11);
  pdf.text(`AED ${fmtMoney(r.cost)}`, costBoxX + costBoxW / 2, costBoxY + 10, { align: 'center' });

  return y + h + 3;
}

function drawDescription(pdf, r, s, y) {
  if (!r.description && !r.notes) return y;
  const leftX = CONTENT_X + 3;

  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  tc(pdf, MAROON);
  pdf.text('DESCRIPTION', leftX, y + 4);
  dc(pdf, MAROON);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, y + 5, leftX + 25, y + 5);

  let cy = y + 9;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  tc(pdf, BLACK);

  if (r.description) {
    const descLines = pdf.splitTextToSize(str(r.description), CONTENT_W - 6);
    for (const dl of descLines) {
      if (cy > FOOTER_TOP - 40) { pdf.addPage(); drawPageBorder(pdf); y = drawLetterhead(pdf, s, MARGIN); cy = y + 5; }
      pdf.text(dl, leftX, cy);
      cy += 4;
    }
  }
  if (r.notes) {
    cy += 2;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(9);
    tc(pdf, GRAY);
    pdf.text('Notes:', leftX, cy);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    tc(pdf, BLACK);
    cy += 4;
    const noteLines = pdf.splitTextToSize(str(r.notes), CONTENT_W - 6);
    for (const nl of noteLines) {
      if (cy > FOOTER_TOP - 40) { pdf.addPage(); drawPageBorder(pdf); y = drawLetterhead(pdf, s, MARGIN); cy = y + 5; }
      pdf.text(nl, leftX, cy);
      cy += 4;
    }
  }

  return cy + 3;
}

async function drawAttachment(pdf, r, s, y) {
  if (!r.attachment_url) return y;
  const leftX = CONTENT_X + 3;

  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  tc(pdf, MAROON);
  pdf.text('VENDOR RECEIPT', leftX, y + 4);
  dc(pdf, MAROON);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, y + 5, leftX + 30, y + 5);
  y += 9;

  try {
    const res = await fetch(r.attachment_url);
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const fmt = dataUrl.startsWith('data:image/png') ? 'PNG'
      : dataUrl.startsWith('data:image/webp') ? 'WEBP' : 'JPEG';

    // Fit image within content width, max height 70mm
    const maxW = CONTENT_W - 6;
    const maxH = 70;
    let imgW = maxW;
    let imgH = maxH;
    // jsPDF addImage with width/height scales; we keep aspect by using maxW and auto height
    try {
      const props = pdf.getImageProperties(dataUrl);
      const ratio = props.width / props.height;
      imgW = maxW;
      imgH = imgW / ratio;
      if (imgH > maxH) { imgH = maxH; imgW = imgH * ratio; }
    } catch (e) { /* use defaults */ }

    if (y + imgH > FOOTER_TOP - 30) { pdf.addPage(); drawPageBorder(pdf); y = drawLetterhead(pdf, s, MARGIN); }

    const imgX = CONTENT_X + (CONTENT_W - imgW) / 2;
    dc(pdf, LIGHT_GRAY);
    pdf.setLineWidth(0.3);
    pdf.rect(imgX - 1, y - 1, imgW + 2, imgH + 2);
    pdf.addImage(dataUrl, fmt, imgX, y, imgW, imgH);
    y += imgH + 3;
  } catch (e) {
    pdf.setFont('times', 'italic');
    pdf.setFontSize(9);
    tc(pdf, GRAY);
    pdf.text('(Attachment could not be loaded)', leftX, y);
    y += 5;
  }

  return y;
}

function drawSignatures(pdf, y) {
  const sigW = CONTENT_W / 2;
  const leftX = CONTENT_X;
  const rightX = CONTENT_X + sigW;
  const sigY = Math.max(y + 6, FOOTER_TOP - 28);
  const lineY = sigY + 16;

  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  tc(pdf, [51, 51, 51]);
  pdf.text('PREPARED BY', leftX + sigW / 2, sigY + 4, { align: 'center' });
  dc(pdf, [51, 51, 51]);
  pdf.setLineWidth(0.3);
  pdf.line(leftX + 10, lineY, leftX + sigW - 10, lineY);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, GRAY);
  pdf.text('Authorized Signature', leftX + sigW / 2, lineY + 4, { align: 'center' });
  pdf.setFont('times', 'bold');
  tc(pdf, BLACK);
  pdf.text('BRONZE WINGS GENERAL TRANSPORT L.L.C', leftX + sigW / 2, lineY + 8, { align: 'center' });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  tc(pdf, [51, 51, 51]);
  pdf.text('VENDOR', rightX + sigW / 2, sigY + 4, { align: 'center' });
  dc(pdf, [51, 51, 51]);
  pdf.setLineWidth(0.3);
  pdf.line(rightX + 10, lineY, rightX + sigW - 10, lineY);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, GRAY);
  pdf.text('Vendor Signature / Stamp', rightX + sigW / 2, lineY + 4, { align: 'center' });
}

export async function downloadMaintenancePDF(record, settings = {}) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const s = await prepareSettings(settings);

  drawPageBorder(pdf);
  let y = MARGIN;
  y = drawLetterhead(pdf, s, y);
  y = drawMaintenanceBanner(pdf, y);
  y = drawDetailsSection(pdf, record, y);
  y = drawDescription(pdf, record, s, y);
  y = await drawAttachment(pdf, record, s, y);
  drawSignatures(pdf, y);

  drawPageNumbers(pdf);
  pdf.save(`maintenance-${record.maint_ref || record.id || 'record'}.pdf`);
}

// ═══════════════════════════════════════════════════════════
// TABLE FORMAT — multiple records under letterhead
// ═══════════════════════════════════════════════════════════

// CONTENT_W = 194mm  — columns must sum to exactly this
// REF(18) + DATE(20) + TYPE(22) + DESC(42) + VENDOR(34) + ODO(16) + NEXT(20) + STATUS(20) + COST(22) = 214  too wide
// Scale down: REF(16)+DATE(18)+TYPE(20)+DESC(38)+VENDOR(30)+ODO(14)+NEXT(18)+STATUS(18)+COST(22)=194 ✓
const TABLE_COLS = [
  { header: 'REF #',      key: 'maint_ref',          w: 16,             pad: 1.5 },
  { header: 'DATE',       key: 'date',               w: 18, fmt: 'date', pad: 1.5 },
  { header: 'TYPE',       key: 'service_type',       w: 20, fmt: 'title',pad: 1.5 },
  { header: 'DESCRIPTION',key: 'description',        w: 38,             pad: 1.5 },
  { header: 'VENDOR',     key: 'vendor_name',        w: 30,             pad: 1.5 },
  { header: 'ODO (km)',   key: 'odometer_reading',   w: 14, align:'right',pad:1.5 },
  { header: 'NEXT SVC',  key: 'next_service_date',   w: 18, fmt: 'date', pad:1.5, align:'right' },
  { header: 'STATUS',     key: 'status',             w: 18, fmt: 'title',pad: 1.5 },
  { header: 'COST (AED)', key: 'cost',               w: 22, align:'right', fmt:'money', pad:1.5 },
];
// Verify: 16+18+20+38+30+14+18+18+22 = 194 ✓

function drawTableBanner(pdf, vehiclePlate, y) {
  // Small gap so the separator line doesn't sit on top of the letterhead border
  y += 3;
  // Thin separator line above title
  dc(pdf, LIGHT_GRAY);
  pdf.setLineWidth(0.2);
  pdf.line(CONTENT_X, y, CONTENT_RIGHT, y);
  y += 4;

  pdf.setFont('times', 'bold');
  pdf.setFontSize(13);
  tc(pdf, DARK_BLUE);
  pdf.text('MAINTENANCE RECORDS', PAGE_W / 2, y + 5, { align: 'center' });
  y += 8;

  if (vehiclePlate) {
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    tc(pdf, GRAY);
    pdf.text(`Vehicle: ${vehiclePlate}`, PAGE_W / 2, y + 1, { align: 'center' });
    y += 5;
  }

  return y + 3; // gap before table
}

function drawTableHeader(pdf, y) {
  const tableW = CONTENT_W; // exact fit
  const headerH = 7;
  fc(pdf, MAROON);
  dc(pdf, MAROON);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, tableW, headerH, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  tc(pdf, WHITE);
  let cx = CONTENT_X;
  for (const c of TABLE_COLS) {
    const isRight = c.align === 'right';
    const tx = isRight ? cx + c.w - c.pad : cx + c.pad;
    pdf.text(c.header, tx, y + 4.6, { align: isRight ? 'right' : 'left' });
    cx += c.w;
  }
  return y + headerH;
}

function drawMaintenanceTable(pdf, records, s, y) {
  const tableW = CONTENT_W;
  const headerH = 7;
  const rowH = 7; // taller rows = less truncation
  const tableStartY = y;

  y = drawTableHeader(pdf, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  let totalCost = 0;
  let rowCount = 0;

  for (let i = 0; i < records.length; i++) {
    const r = records[i];

    // page break — leave 30mm for signatures
    if (y + rowH > FOOTER_TOP - 32) {
      // close current table border
      dc(pdf, LIGHT_GRAY);
      pdf.setLineWidth(0.3);
      pdf.rect(CONTENT_X, tableStartY, tableW, y - tableStartY);

      pdf.addPage();
      drawPageBorder(pdf);
      const newLetterY = drawLetterhead(pdf, s, MARGIN);
      y = drawTableBanner(pdf, null, newLetterY);
      y = drawTableHeader(pdf, y);
      rowCount = 0;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
    }

    // alternating row background
    if (i % 2 === 1) {
      fc(pdf, ROW_ALT);
      dc(pdf, ROW_ALT);
      pdf.rect(CONTENT_X, y, tableW, rowH, 'F');
    }

    // cell values
    let cx = CONTENT_X;
    for (const c of TABLE_COLS) {
      let val = r[c.key];
      if (c.fmt === 'date') val = fmtDate(val);
      else if (c.fmt === 'money') { totalCost += Number(r[c.key] || 0); val = fmtMoney(val); }
      else if (c.fmt === 'title') val = str(val || '').replace(/_/g, ' ');
      else val = str(val ?? '—');
      if (!val || val === 'undefined') val = '—';

      // safe truncation using jsPDF width check
      const availW = c.w - c.pad * 2;
      const truncated = pdf.splitTextToSize(val, availW)[0] || val;

      const isRight = c.align === 'right';
      const tx = isRight ? cx + c.w - c.pad : cx + c.pad;
      tc(pdf, BLACK);
      pdf.text(truncated, tx, y + 4.6, { align: isRight ? 'right' : 'left' });
      cx += c.w;
    }

    // bottom row divider
    dc(pdf, LIGHT_GRAY);
    pdf.setLineWidth(0.15);
    pdf.line(CONTENT_X, y + rowH, CONTENT_X + tableW, y + rowH);

    y += rowH;
    rowCount++;
  }

  // outer border around entire table (header + rows)
  dc(pdf, [180, 180, 180]);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, tableStartY, tableW, y - tableStartY);

  // vertical column dividers (light)
  dc(pdf, [210, 210, 210]);
  pdf.setLineWidth(0.15);
  let cx2 = CONTENT_X;
  for (let ci = 0; ci < TABLE_COLS.length - 1; ci++) {
    cx2 += TABLE_COLS[ci].w;
    pdf.line(cx2, tableStartY, cx2, y);
  }

  // TOTAL row
  const totalRowH = 8;
  fc(pdf, [245, 245, 245]);
  dc(pdf, [180, 180, 180]);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, tableW, totalRowH, 'FD');

  // "TOTAL" label centred across all cols except last
  const labelW = tableW - TABLE_COLS[TABLE_COLS.length - 1].w;
  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  tc(pdf, MAROON);
  pdf.text('TOTAL', CONTENT_X + labelW / 2, y + 5.2, { align: 'center' });

  // cost value right-aligned in last col
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  tc(pdf, DARK_BLUE);
  pdf.text(`AED ${fmtMoney(totalCost)}`, CONTENT_RIGHT - 1.5, y + 5.2, { align: 'right' });

  return y + totalRowH + 4;
}

function drawTableSignatures(pdf, contentEndY) {
  // Place signatures in fixed zone: 32mm above FOOTER_TOP (which is 279)
  // So signature block occupies y = 247 → 277, safely above footer at 279
  const SIGN_BLOCK_H = 28;
  const sigY = Math.min(contentEndY + 8, FOOTER_TOP - SIGN_BLOCK_H - 2);

  const half = CONTENT_W / 2;
  const leftMid = CONTENT_X + half / 2;
  const rightMid = CONTENT_X + half + half / 2;

  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  tc(pdf, [60, 60, 60]);
  pdf.text('PREPARED BY', leftMid, sigY, { align: 'center' });
  pdf.text('VERIFIED BY', rightMid, sigY, { align: 'center' });

  const lineY = sigY + SIGN_BLOCK_H - 12;
  dc(pdf, [80, 80, 80]);
  pdf.setLineWidth(0.4);
  pdf.line(CONTENT_X + 8, lineY, CONTENT_X + half - 8, lineY);
  pdf.line(CONTENT_X + half + 8, lineY, CONTENT_RIGHT - 8, lineY);

  pdf.setFont('times', 'normal');
  pdf.setFontSize(8);
  tc(pdf, GRAY);
  pdf.text('Authorized Signature', leftMid, lineY + 4, { align: 'center' });
  pdf.text('Manager Signature / Stamp', rightMid, lineY + 4, { align: 'center' });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(8);
  tc(pdf, BLACK);
  pdf.text('BRONZE WINGS GENERAL TRANSPORT L.L.C', leftMid, lineY + 9, { align: 'center' });
}

export async function downloadMaintenanceTablePDF(records, vehiclePlate, settings = {}) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const s = await prepareSettings(settings);

  drawPageBorder(pdf);
  let y = MARGIN;
  y = drawLetterhead(pdf, s, y);
  y = drawTableBanner(pdf, vehiclePlate, y);
  if (records.length === 0) {
    pdf.setFont('times', 'italic');
    pdf.setFontSize(10);
    tc(pdf, GRAY);
    pdf.text('No maintenance records found.', PAGE_W / 2, y + 10, { align: 'center' });
  } else {
    y = drawMaintenanceTable(pdf, records, s, y);
    drawTableSignatures(pdf, y);
  }

  drawPageNumbers(pdf);
  pdf.save(`maintenance-${vehiclePlate || 'records'}.pdf`);
}