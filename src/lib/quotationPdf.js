/**
 * Quotation PDF Generator — uses the shared invoice letterhead.
 */
import { jsPDF } from 'jspdf';
import { numberToWords } from './numberToWords';
import {
  PAGE_W, MARGIN, CONTENT_X, CONTENT_W, CONTENT_RIGHT, FOOTER_TOP,
  MAROON, DARK_BLUE, BROWN, BLACK, GRAY, LIGHT_GRAY, WHITE, ROW_ALT,
  str, fmtMoney, fmtDate, tc, fc, dc,
  drawPageBorder, drawLetterhead, drawPageNumbers, prepareSettings,
} from './docLetterhead';

const COLS = [
  { label: 'SL.\nNo',    w: 10, align: 'center' },
  { label: 'DESCRIPTION', w: 80, align: 'center' },
  { label: 'QTY',         w: 18, align: 'center' },
  { label: 'UNIT\nPRICE', w: 30, align: 'center' },
  { label: 'AMOUNT',      w: 56, align: 'center' },
];

function colPositions(cols) {
  let x = CONTENT_X;
  return cols.map(c => {
    const pos = { ...c, x, right: x + c.w, center: x + c.w / 2 };
    x += c.w;
    return pos;
  });
}

function drawQuotationBanner(pdf, y) {
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  tc(pdf, DARK_BLUE);
  pdf.text('QUOTATION', PAGE_W / 2, y + 5.5, { align: 'center' });
  return y + 9;
}

function drawBillingSection(pdf, q, y) {
  const leftX = CONTENT_X + 3;
  const rightX = CONTENT_RIGHT - 3;
  const maxTextWidth = CONTENT_W * 0.62;

  const rawLines = [];
  rawLines.push({ text: str(q.client_name || '—'), bold: true });
  if (q.contact_person)  rawLines.push({ text: `ATT: ${str(q.contact_person)}`, bold: false });
  if (q.client_address)  rawLines.push({ text: `ADDRESS: ${str(q.client_address)}`, bold: false });
  if (q.client_phone)    rawLines.push({ text: `PHONE: ${str(q.client_phone)}`, bold: false });
  if (q.client_email)   rawLines.push({ text: `EMAIL: ${str(q.client_email)}`, bold: false });
  if (q.client_trn)     rawLines.push({ text: `TRN: ${str(q.client_trn)}`, bold: false });

  const lineH = 4;
  const wrapped = [];
  let totalLines = 0;
  for (const line of rawLines) {
    pdf.setFont('times', line.bold ? 'bold' : 'normal');
    pdf.setFontSize(10);
    const parts = pdf.splitTextToSize(line.text, maxTextWidth);
    wrapped.push({ parts, bold: line.bold });
    totalLines += parts.length;
  }

  const labelArea = 9;
  const h = Math.max(24, labelArea + totalLines * lineH + 3);

  dc(pdf, LIGHT_GRAY);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, CONTENT_W, h);

  // LEFT: QUOTE TO
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  tc(pdf, MAROON);
  pdf.text('QUOTE TO', leftX, y + 4);
  dc(pdf, MAROON);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, y + 5, leftX + 18, y + 5);

  let ly = y + labelArea;
  for (const line of wrapped) {
    pdf.setFont('times', line.bold ? 'bold' : 'normal');
    pdf.setFontSize(10);
    tc(pdf, BLACK);
    for (const part of line.parts) {
      pdf.text(part, leftX, ly);
      ly += lineH;
    }
  }

  // RIGHT: Quotation #, Date, Valid Until, Subject
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  tc(pdf, BLACK);
  const labels = ['QUOTATION #:', 'DATE:', 'VALID UNTIL:', 'SUBJECT:'];
  const values = [
    str(q.quotation_number || '—'),
    fmtDate(q.issue_date),
    fmtDate(q.valid_until),
    str(q.subject || '—'),
  ];
  const widestLabelW = Math.max(...labels.map(l => pdf.getTextWidth(l)));
  const colonX = rightX - widestLabelW - 1;
  const valueX = colonX + 1.5;
  const yPos = [y + 5, y + 9, y + 13, y + 17];
  for (let i = 0; i < 4; i++) {
    pdf.text(labels[i], colonX, yPos[i], { align: 'right' });
    const valLines = pdf.splitTextToSize(values[i], rightX - valueX);
    pdf.text(valLines[0], valueX, yPos[i], { align: 'left' });
  }

  return y + h + 2;
}

function drawTableHeader(pdf, cols, y) {
  const h = 12;
  pdf.setFont('times', 'bold');
  fc(pdf, [240, 240, 240]);
  pdf.rect(CONTENT_X, y, CONTENT_W, h, 'F');
  tc(pdf, BLACK);
  pdf.setFontSize(9);

  for (const col of cols) {
    const lines = col.label.split('\n');
    const lineH = 4;
    const startY = y + (h - lines.length * lineH) / 2 + lineH;
    const textX = col.align === 'right' ? col.right - 2
                : col.align === 'center' ? col.center : col.x + 2;
    const align = col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left';
    for (let i = 0; i < lines.length; i++) {
      pdf.text(lines[i], textX, startY + i * lineH, { align });
    }
  }

  dc(pdf, BLACK);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, CONTENT_W, h);
  for (let i = 1; i < cols.length; i++) {
    pdf.line(cols[i].x, y, cols[i].x, y + h);
  }
  return y + h;
}

function drawTableRow(pdf, item, cols, y, idx) {
  const descCol = cols.find(c => c.label.startsWith('DESCRIPTION'));
  const descText = str(item.description ?? '');
  const descLines = pdf.splitTextToSize(descText, descCol.w - 4);
  const lineH = 3.5;
  const rowH = Math.max(10, descLines.length * lineH + 3);

  fc(pdf, idx % 2 === 0 ? WHITE : ROW_ALT);
  pdf.rect(CONTENT_X, y, CONTENT_W, rowH, 'F');

  const qty = Number(item.quantity) || 0;
  const unitPrice = Number(item.unit_price) || 0;
  const amount = Number(item.amount ?? (qty * unitPrice));

  const vCenter = y + rowH / 2 + 1;
  pdf.setFontSize(9);
  tc(pdf, BLACK);

  // SL.No
  pdf.setFont('times', 'normal');
  pdf.text(String(idx + 1), cols[0].center, vCenter, { align: 'center' });

  // Description
  pdf.setFont('times', 'bold');
  const descStartY = y + (rowH - descLines.length * lineH) / 2 + lineH;
  for (let i = 0; i < descLines.length; i++) {
    pdf.text(descLines[i], descCol.x + 2, descStartY + i * lineH, { align: 'left' });
  }

  // Qty
  pdf.setFont('times', 'normal');
  pdf.text(String(qty), cols[2].center, vCenter, { align: 'center' });

  // Unit Price + Amount
  pdf.setFont('courier', 'bold');
  pdf.text(fmtMoney(unitPrice), cols[3].center, vCenter, { align: 'center' });
  pdf.text(fmtMoney(amount), cols[4].center, vCenter, { align: 'center' });

  dc(pdf, BLACK);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, CONTENT_W, rowH);
  for (let i = 1; i < cols.length; i++) {
    pdf.line(cols[i].x, y, cols[i].x, y + rowH);
  }
  return y + rowH;
}

function drawTotals(pdf, y, totals) {
  const wordsBoxW = CONTENT_W - 80;
  const colX = CONTENT_X + wordsBoxW;
  const rowH = 7;
  const totalRowH = 9;
  const boxH = rowH * 2 + totalRowH;

  // Amount in Words
  dc(pdf, [51, 51, 51]);
  pdf.setLineWidth(0.3);
  pdf.setLineDashPattern([1.5, 1], 0);
  pdf.rect(CONTENT_X, y, wordsBoxW, boxH);
  pdf.setLineDashPattern([], 0);

  pdf.setFont('times', 'bold');
  pdf.setFontSize(8);
  tc(pdf, [51, 51, 51]);
  pdf.text('Amount in Words:', CONTENT_X + 3, y + 4);

  const words = numberToWords(totals.total).toUpperCase();
  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  tc(pdf, BLACK);
  const wordsLines = pdf.splitTextToSize(`AED ${words} ONLY`, wordsBoxW - 6);
  let wy = y + 8;
  for (const wl of wordsLines) {
    pdf.text(wl, CONTENT_X + 3, wy);
    wy += 4;
  }

  let ry = y;
  // Subtotal
  dc(pdf, [224, 224, 224]);
  pdf.setLineWidth(0.2);
  pdf.line(colX, ry, CONTENT_RIGHT, ry);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, [51, 51, 51]);
  pdf.text('Subtotal:', colX + 2, ry + 4.5);
  pdf.setFont('courier', 'bold');
  tc(pdf, BLACK);
  pdf.text(`AED ${fmtMoney(totals.subtotal)}`, CONTENT_RIGHT - 2, ry + 4.5, { align: 'right' });
  ry += rowH;

  // VAT
  dc(pdf, [224, 224, 224]);
  pdf.setLineWidth(0.2);
  pdf.line(colX, ry, CONTENT_RIGHT, ry);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, [51, 51, 51]);
  pdf.text(`VAT (${totals.vatRate}%):`, colX + 2, ry + 4.5);
  pdf.setFont('courier', 'bold');
  tc(pdf, BLACK);
  pdf.text(`AED ${fmtMoney(totals.vat)}`, CONTENT_RIGHT - 2, ry + 4.5, { align: 'right' });
  ry += rowH;

  // Total
  dc(pdf, BLACK);
  pdf.setLineWidth(0.5);
  pdf.line(colX, ry, CONTENT_RIGHT, ry);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  tc(pdf, BLACK);
  pdf.text('Total Amount:', colX + 2, ry + 5.5);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(10);
  pdf.text(`AED ${fmtMoney(totals.total)}`, CONTENT_RIGHT - 2, ry + 5.5, { align: 'right' });
  dc(pdf, BLACK);
  pdf.setLineWidth(0.5);
  pdf.line(colX, ry + totalRowH, CONTENT_RIGHT, ry + totalRowH);

  return y + boxH;
}

function drawTermsAndSignatures(pdf, q, s, y) {
  const PAGE_BOTTOM = FOOTER_TOP - 4;
  const TERMS_LINE_H = 4;

  // Terms & Conditions
  if (q.terms_conditions || q.notes) {
    y += 4;
    // If not enough room for terms header + at least 2 lines, start new page
    if (y + 12 > PAGE_BOTTOM) {
      pdf.addPage();
      drawPageBorder(pdf);
      y = MARGIN;
    }

    fc(pdf, [240, 240, 240]);
    pdf.rect(CONTENT_X, y, CONTENT_W, 5, 'F');
    pdf.setFont('times', 'bold');
    pdf.setFontSize(9);
    tc(pdf, BLACK);
    pdf.text('TERMS & CONDITIONS', CONTENT_X + 3, y + 3.5);

    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    tc(pdf, [51, 51, 51]);
    const termsText = str(q.terms_conditions || q.notes);
    const termsLines = pdf.splitTextToSize(termsText, CONTENT_W - 6);
    let ty = y + 8;
    for (const tl of termsLines) {
      if (ty > PAGE_BOTTOM) {
        pdf.addPage();
        drawPageBorder(pdf);
        ty = MARGIN + 2;
      }
      pdf.text(tl, CONTENT_X + 3, ty);
      ty += TERMS_LINE_H;
    }
    y = ty;
  }

  // Signatures — ensure they fit on the current page
  const sigH = 28;
  if (y + sigH > PAGE_BOTTOM) {
    pdf.addPage();
    drawPageBorder(pdf);
    y = MARGIN;
  }

  const sigW = CONTENT_W / 2;
  const leftX = CONTENT_X;
  const rightX = CONTENT_X + sigW;
  const sigY = y + 6;
  const lineY = sigY + 16;

  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  tc(pdf, [51, 51, 51]);
  pdf.text('AUTHORIZED BY', leftX + sigW / 2, sigY + 4, { align: 'center' });
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
  pdf.text('ACCEPTED BY', rightX + sigW / 2, sigY + 4, { align: 'center' });
  dc(pdf, [51, 51, 51]);
  pdf.setLineWidth(0.3);
  pdf.line(rightX + 10, lineY, rightX + sigW - 10, lineY);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, GRAY);
  pdf.text('Client Signature', rightX + sigW / 2, lineY + 4, { align: 'center' });
  pdf.setFont('times', 'bold');
  tc(pdf, BLACK);
  const clientText = str(q.client_name);
  const clientLines = pdf.splitTextToSize(clientText, sigW - 4);
  for (let i = 0; i < Math.min(clientLines.length, 2); i++) {
    pdf.text(clientLines[i], rightX + sigW / 2, lineY + 8 + i * 3.5, { align: 'center' });
  }
}

export async function downloadQuotationPDF(quotation, settings = {}) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const s = await prepareSettings(settings);

  drawPageBorder(pdf);
  let y = MARGIN;
  y = drawLetterhead(pdf, s, y);
  y = drawQuotationBanner(pdf, y);
  y = drawBillingSection(pdf, quotation, y);

  // Table
  const cols = colPositions(COLS);
  const items = quotation.line_items || [];
  const vatRate = quotation.vat_rate ?? s.default_vat_rate ?? 5;
  y = drawTableHeader(pdf, cols, y);

  const contentBottom = 250;
  for (let idx = 0; idx < items.length; idx++) {
    const descLines = pdf.splitTextToSize(str(items[idx].description ?? ''), cols[1].w - 4);
    const estH = Math.max(10, descLines.length * 3.5 + 3);
    if (y + estH > contentBottom) {
      pdf.addPage();
      drawPageBorder(pdf);
      y = drawLetterhead(pdf, s, MARGIN);
      y = drawTableHeader(pdf, cols, y);
    }
    y = drawTableRow(pdf, items[idx], cols, y, idx);
  }

  // Totals
  const subtotal = items.reduce((sum, i) => {
    const q = Number(i.quantity) || 0;
    const p = Number(i.unit_price) || 0;
    return sum + Number(i.amount ?? (q * p));
  }, 0);
  const vat = subtotal * vatRate / 100;
  const total = subtotal + vat;
  y = drawTotals(pdf, y, { subtotal, vat, total, vatRate });

  // Terms + Signatures
  drawTermsAndSignatures(pdf, quotation, s, y);

  drawPageNumbers(pdf);
  pdf.save(`quotation-${quotation.quotation_number || quotation.id || 'draft'}.pdf`);
}