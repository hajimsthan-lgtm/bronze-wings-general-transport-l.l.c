/**
 * Agreement PDF Generator — uses the shared invoice letterhead.
 */
import { jsPDF } from 'jspdf';
import {
  PAGE_W, MARGIN, CONTENT_X, CONTENT_W, CONTENT_RIGHT, FOOTER_TOP,
  MAROON, DARK_BLUE, BROWN, BLACK, GRAY, LIGHT_GRAY,
  str, fmtMoney, fmtDate, tc, fc, dc,
  drawPageBorder, drawLetterhead, drawPageNumbers, prepareSettings,
} from './docLetterhead';

function drawAgreementBanner(pdf, y) {
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  tc(pdf, DARK_BLUE);
  pdf.text('AGREEMENT', PAGE_W / 2, y + 5.5, { align: 'center' });
  return y + 9;
}

function drawPartiesSection(pdf, a, y) {
  const leftX = CONTENT_X + 3;
  const rightX = CONTENT_RIGHT - 3;
  const maxTextWidth = CONTENT_W * 0.62;

  const rawLines = [];
  rawLines.push({ text: str(a.client_name || '—'), bold: true });
  if (a.contact_person)  rawLines.push({ text: `ATT: ${str(a.contact_person)}`, bold: false });
  if (a.client_address)  rawLines.push({ text: `ADDRESS: ${str(a.client_address)}`, bold: false });
  if (a.client_phone)    rawLines.push({ text: `PHONE: ${str(a.client_phone)}`, bold: false });
  if (a.client_email)   rawLines.push({ text: `EMAIL: ${str(a.client_email)}`, bold: false });
  if (a.client_trn)     rawLines.push({ text: `TRN: ${str(a.client_trn)}`, bold: false });

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

  // LEFT: SECOND PARTY
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  tc(pdf, MAROON);
  pdf.text('SECOND PARTY', leftX, y + 4);
  dc(pdf, MAROON);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, y + 5, leftX + 25, y + 5);

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

  // RIGHT: Agreement details
  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  tc(pdf, BLACK);
  const labels = ['AGREEMENT #:', 'START DATE:', 'END DATE:', 'TYPE:'];
  const values = [
    str(a.agreement_number || '—'),
    fmtDate(a.start_date),
    fmtDate(a.end_date),
    str(a.agreement_type || 'service'),
  ];
  const widestLabelW = Math.max(...labels.map(l => pdf.getTextWidth(l)));
  const colonX = rightX - widestLabelW - 1;
  const valueX = colonX + 1.5;
  const yPos = [y + 5, y + 9, y + 13, y + 17];
  for (let i = 0; i < 4; i++) {
    pdf.text(labels[i], colonX, yPos[i], { align: 'right' });
    pdf.text(values[i], valueX, yPos[i], { align: 'left' });
  }

  return y + h + 2;
}

function drawTitleAndAmount(pdf, a, y) {
  // Title
  pdf.setFont('times', 'bold');
  pdf.setFontSize(12);
  tc(pdf, MAROON);
  const titleLines = pdf.splitTextToSize(str(a.title || 'Service Agreement'), CONTENT_W - 6);
  let ty = y + 5;
  for (const tl of titleLines) {
    pdf.text(tl, CONTENT_X + 3, ty);
    ty += 5;
  }
  y = ty + 3;

  // Amount box
  if (a.amount != null) {
    dc(pdf, LIGHT_GRAY);
    pdf.setLineWidth(0.3);
    pdf.rect(CONTENT_X, y, CONTENT_W, 10);
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    tc(pdf, BLACK);
    pdf.text('AGREED AMOUNT:', CONTENT_X + 3, y + 6);
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(11);
    pdf.text(`AED ${fmtMoney(a.amount)}`, CONTENT_RIGHT - 3, y + 6, { align: 'right' });
    y += 14;
  }

  return y;
}

function drawContentBody(pdf, a, s, y) {
  // First Party intro
  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  tc(pdf, MAROON);
  pdf.text('FIRST PARTY', CONTENT_X + 3, y + 4);
  dc(pdf, MAROON);
  pdf.setLineWidth(0.3);
  pdf.line(CONTENT_X + 3, y + 5, CONTENT_X + 23, y + 5);

  pdf.setFont('times', 'normal');
  pdf.setFontSize(10);
  tc(pdf, BLACK);
  const partyLines = pdf.splitTextToSize(
    `This Agreement is made between BRONZE WINGS GENERAL TRANSPORT L.L.C (the "First Party"), and the Second Party named above, collectively referred to as "the Parties".`,
    CONTENT_W - 6
  );
  let py = y + 9;
  for (const pl of partyLines) {
    if (py > FOOTER_TOP - 40) { pdf.addPage(); drawPageBorder(pdf); y = drawLetterhead(pdf, s, MARGIN); py = y + 5; }
    pdf.text(pl, CONTENT_X + 3, py);
    py += 4;
  }
  y = py + 3;

  // Content body
  if (a.content) {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    tc(pdf, MAROON);
    pdf.text('TERMS OF AGREEMENT', CONTENT_X + 3, y + 4);
    dc(pdf, MAROON);
    pdf.setLineWidth(0.3);
    pdf.line(CONTENT_X + 3, y + 5, CONTENT_X + 35, y + 5);

    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    tc(pdf, BLACK);
    const contentLines = pdf.splitTextToSize(str(a.content), CONTENT_W - 6);
    let cy = y + 9;
    for (const cl of contentLines) {
      if (cy > FOOTER_TOP - 35) { pdf.addPage(); drawPageBorder(pdf); y = drawLetterhead(pdf, s, MARGIN); cy = y + 5; }
      pdf.text(cl, CONTENT_X + 3, cy);
      cy += 4;
    }
    y = cy + 3;
  }

  // Terms & Conditions
  if (a.terms_conditions) {
    if (y + 12 > FOOTER_TOP - 30) { pdf.addPage(); drawPageBorder(pdf); y = drawLetterhead(pdf, s, MARGIN); }
    pdf.setFont('times', 'bold');
    pdf.setFontSize(10);
    tc(pdf, MAROON);
    pdf.text('TERMS & CONDITIONS', CONTENT_X + 3, y + 4);
    dc(pdf, MAROON);
    pdf.setLineWidth(0.3);
    pdf.line(CONTENT_X + 3, y + 5, CONTENT_X + 38, y + 5);

    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    tc(pdf, BLACK);
    const tcLines = pdf.splitTextToSize(str(a.terms_conditions), CONTENT_W - 6);
    let tcy = y + 9;
    for (const tl of tcLines) {
      if (tcy > FOOTER_TOP - 30) { pdf.addPage(); drawPageBorder(pdf); y = drawLetterhead(pdf, s, MARGIN); tcy = y + 5; }
      pdf.text(tl, CONTENT_X + 3, tcy);
      tcy += 4;
    }
    y = tcy + 3;
  }

  return y;
}

function drawSignatures(pdf, a, y) {
  const sigW = CONTENT_W / 2;
  const leftX = CONTENT_X;
  const rightX = CONTENT_X + sigW;
  const sigY = Math.max(y + 6, FOOTER_TOP - 28);
  const lineY = sigY + 16;

  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  tc(pdf, [51, 51, 51]);
  pdf.text('FIRST PARTY', leftX + sigW / 2, sigY + 4, { align: 'center' });
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
  pdf.text('SECOND PARTY', rightX + sigW / 2, sigY + 4, { align: 'center' });
  dc(pdf, [51, 51, 51]);
  pdf.setLineWidth(0.3);
  pdf.line(rightX + 10, lineY, rightX + sigW - 10, lineY);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, GRAY);
  pdf.text('Client Signature', rightX + sigW / 2, lineY + 4, { align: 'center' });
  pdf.setFont('times', 'bold');
  tc(pdf, BLACK);
  const clientText = str(a.client_name);
  const clientLines = pdf.splitTextToSize(clientText, sigW - 4);
  for (let i = 0; i < Math.min(clientLines.length, 2); i++) {
    pdf.text(clientLines[i], rightX + sigW / 2, lineY + 8 + i * 3.5, { align: 'center' });
  }
}

export async function downloadAgreementPDF(agreement, settings = {}) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const s = await prepareSettings(settings);

  drawPageBorder(pdf);
  let y = MARGIN;
  y = drawLetterhead(pdf, s, y);
  y = drawAgreementBanner(pdf, y);
  y = drawPartiesSection(pdf, agreement, y);
  y = drawTitleAndAmount(pdf, agreement, y);
  y = drawContentBody(pdf, agreement, s, y);
  drawSignatures(pdf, agreement, y);

  drawPageNumbers(pdf);
  pdf.save(`agreement-${agreement.agreement_number || agreement.id || 'draft'}.pdf`);
}