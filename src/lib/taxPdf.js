import jsPDF from 'jspdf';
import { getCompanySettings } from './companySettings';
import { hasArabicText, renderCellToImage } from './pdfArabicRenderer';
import { formatCurrency } from './formatters';

async function fetchLogoData(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  const format = blob.type.includes('jpeg') ? 'JPEG' : blob.type.includes('webp') ? 'WEBP' : 'PNG';
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

function drawHeader(doc, settings, title, subtitle) {
  const pageW = doc.internal.pageSize.width;
  const margin = 15;
  let headerY = 15;
  let logoOffset = 0;

  if (settings.logo_url) {
    try {
      fetchLogoData(settings.logo_url).then((logo) => {
        const maxW = 25, maxH = 18;
        const aspect = logo.w / logo.h;
        let lw = maxW, lh = maxW / aspect;
        if (lh > maxH) { lh = maxH; lw = maxH * aspect; }
        doc.addImage(logo.dataUrl, logo.format, margin, headerY - 1, lw, lh);
      });
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
  doc.text(subtitle, pageW - margin, headerY + 8, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, pageW - margin, headerY + 12, { align: 'right' });

  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5);
  doc.line(margin, headerY + 16, pageW - margin, headerY + 16);

  return headerY + 22;
}

function drawFooter(doc, settings, pageNum) {
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;
  doc.setFontSize(7); doc.setFont(undefined, 'normal'); doc.setTextColor(150, 150, 150);
  doc.text(settings.company_name || '', margin, pageH - 8);
  doc.text(`Page ${pageNum}`, pageW / 2, pageH - 8, { align: 'center' });
  doc.text(new Date().toLocaleString('en-GB'), pageW - margin, pageH - 8, { align: 'right' });
}

function drawSectionTitle(doc, y, title, color = [30, 30, 30]) {
  doc.setFontSize(10); doc.setFont(undefined, 'bold'); doc.setTextColor(color[0], color[1], color[2]);
  doc.text(title, 15, y);
  doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.3);
  doc.line(15, y + 1.5, doc.internal.pageSize.width - 15, y + 1.5);
  return y + 6;
}

function drawKV(doc, y, label, value, x = 15, labelW = 80) {
  doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(100, 100, 100);
  doc.text(label, x, y);
  doc.setFont(undefined, 'bold'); doc.setTextColor(30, 30, 30);
  doc.text(value, x + labelW, y);
  return y + 5;
}

/**
 * Export VAT201 summary PDF.
 */
export async function exportVat201PDF(vatData, period) {
  const settings = await getCompanySettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;

  let y = drawHeader(doc, settings, 'VAT201 Return Summary', `${period.label} · ${period.start} to ${period.end}`);

  // Period info
  y = drawSectionTitle(doc, y, 'Filing Period');
  y = drawKV(doc, y, 'Period:', period.label);
  y = drawKV(doc, y, 'From:', period.start);
  y = drawKV(doc, y, 'To:', period.end);
  y = drawKV(doc, y, 'Due date:', period.due);
  y += 2;

  // VAT summary
  y = drawSectionTitle(doc, y, 'VAT Summary', [220, 38, 38]);
  y = drawKV(doc, y, 'Output VAT collected:', formatCurrency(vatData.outputVat));
  y = drawKV(doc, y, 'Input VAT (reclaimable):', formatCurrency(vatData.inputVat));
  y += 1;
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5);
  doc.line(margin, y - 2, pageW - margin, y - 2);
  y = drawKV(doc, y, 'Net VAT payable:', formatCurrency(vatData.netVatPayable));
  y += 3;

  // Sales breakdown
  y = drawSectionTitle(doc, y, 'Sales Breakdown by Rate Category');
  const breakdown = [
    { label: 'Standard-rated (5%)', value: vatData.standardRatedSales, color: [30, 30, 30] },
    { label: 'Zero-rated (0%)', value: vatData.zeroRatedSales, color: [30, 30, 30] },
    { label: 'Exempt', value: vatData.exemptSales, color: [30, 30, 30] },
  ];
  breakdown.forEach((b) => {
    y = drawKV(doc, y, b.label + ':', formatCurrency(b.value));
  });
  y += 1;
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5);
  doc.line(margin, y - 2, pageW - margin, y - 2);
  y = drawKV(doc, y, 'Total sales:', formatCurrency(vatData.totalSales));
  y += 3;

  // Counts
  y = drawSectionTitle(doc, y, 'Record Counts');
  y = drawKV(doc, y, 'Posted invoices:', String(vatData.invoiceCount));
  y = drawKV(doc, y, 'Posted expenses:', String(vatData.expenseCount));

  drawFooter(doc, settings, 1);
  doc.save(`VAT201-${period.label.replace(/\s/g, '-')}.pdf`);
}

/**
 * Export Corporate Tax report PDF.
 */
export async function exportTaxReportPDF(ctData, fy) {
  const settings = await getCompanySettings();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margin = 15;

  let y = drawHeader(doc, settings, 'Corporate Tax Report', `${fy.label} · ${fy.start} to ${fy.end}`);

  // Fiscal year info
  y = drawSectionTitle(doc, y, 'Fiscal Year');
  y = drawKV(doc, y, 'Period:', fy.label);
  y = drawKV(doc, y, 'From:', fy.start);
  y = drawKV(doc, y, 'To:', fy.end);
  y = drawKV(doc, y, 'Due date:', fy.due);
  y += 2;

  // Summary stats
  y = drawSectionTitle(doc, y, 'Financial Summary', [220, 38, 38]);
  y = drawKV(doc, y, 'Total revenue:', formatCurrency(ctData.totalRevenue));
  y = drawKV(doc, y, 'Total expenses:', formatCurrency(ctData.totalExpenses));
  y += 1;
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5);
  doc.line(margin, y - 2, pageW - margin, y - 2);
  y = drawKV(doc, y, 'Taxable profit:', formatCurrency(ctData.taxableProfit));
  y += 3;

  // Calculation ladder
  y = drawSectionTitle(doc, y, 'Corporate Tax Calculation');
  const ladder = [
    { label: 'Taxable profit', value: formatCurrency(ctData.taxableProfit), bold: true },
    { label: `Less: AED 375,000 (0% threshold)`, value: `- ${formatCurrency(ctData.ctThreshold)}` },
    {
      label: 'Remainder',
      value: formatCurrency(Math.max(0, ctData.taxableProfit - ctData.ctThreshold)),
    },
    { label: 'Tax rate', value: '9%' },
  ];
  ladder.forEach((step) => {
    doc.setFontSize(8);
    doc.setFont(undefined, step.bold ? 'bold' : 'normal');
    doc.setTextColor(step.bold ? 30 : 100, step.bold ? 30 : 100, step.bold ? 30 : 100);
    doc.text(step.label, margin, y);
    doc.setFont(undefined, 'bold'); doc.setTextColor(30, 30, 30);
    doc.text(step.value, pageW - margin, y, { align: 'right' });
    y += 5;
  });
  y += 1;
  doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5);
  doc.line(margin, y - 2, pageW - margin, y - 2);
  doc.setFontSize(9); doc.setFont(undefined, 'bold'); doc.setTextColor(220, 38, 38);
  doc.text('Corporate tax due:', margin, y + 3);
  doc.text(formatCurrency(ctData.corporateTaxDue), pageW - margin, y + 3, { align: 'right' });
  y += 7;

  // Footnote
  doc.setFontSize(7); doc.setFont(undefined, 'italic'); doc.setTextColor(120, 120, 120);
  doc.text('First AED 375,000 of profit is taxed at 0%.', margin, y);
  y += 5;

  // Small Business Relief
  y += 2;
  y = drawSectionTitle(doc, y, 'Small Business Relief');
  doc.setFontSize(8); doc.setFont(undefined, 'normal'); doc.setTextColor(30, 30, 30);
  if (ctData.sbrEligible) {
    doc.setTextColor(22, 128, 57);
    doc.text('ELIGIBLE — Annual revenue is under AED 3,000,000.', margin, y);
    doc.setTextColor(30, 30, 30);
    y += 5;
    doc.text('Corporate tax due is AED 0 regardless of profit.', margin, y);
  } else {
    doc.setTextColor(200, 0, 0);
    doc.text('NOT ELIGIBLE — Annual revenue exceeds AED 3,000,000.', margin, y);
  }

  drawFooter(doc, settings, 1);
  doc.save(`CorporateTax-${fy.label.replace(/\s/g, '-')}.pdf`);
}