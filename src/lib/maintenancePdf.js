/**
 * Maintenance Record PDF Generator — uses the shared invoice letterhead.
 */
import { jsPDF } from 'jspdf';
import {
  PAGE_W, MARGIN, CONTENT_X, CONTENT_W, CONTENT_RIGHT, FOOTER_TOP,
  MAROON, DARK_BLUE, BROWN, BLACK, GRAY, LIGHT_GRAY,
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