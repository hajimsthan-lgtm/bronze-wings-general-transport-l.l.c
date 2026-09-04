/**
 * Invoice Layout Renderer — data-driven PDF rendering engine.
 * Takes a layout definition (ordered block list) and renders the invoice
 * by calling the shared drawing functions from invoicePdfNative.js.
 *
 * Pagination rules (Section 3):
 * - Table is the only block that splits across pages (row by row)
 * - Blocks before the Table repeat at the top of every continuation page
 * - Blocks after the Table render once, on the final page, after the table
 * - Footer repeats on every page in its reserved zone
 */

import { jsPDF } from 'jspdf';
import {
  drawPageBorder, drawLetterhead, drawTaxBanner, drawBillingSection,
  drawTableHeader, drawTableRow, drawTableTotal,
  drawTermsInline, drawBankDetailsBlock, drawTripSignaturesWithCompany,
  drawFooterBanners, colPositions,
  COLS_TRIP, COLS_STANDARD, COLS_MONTHLY,
  fmtDate, normalizeRoute, buildIndicatorLine,
  PAGE_W, PAGE_H, CONTENT_X, CONTENT_W, CONTENT_RIGHT,
  BORDER_POS, FOOTER_RESERVED_TOP,
  tc, fc, dc, MAROON, BLACK, GRAY, WHITE,
  getInvStyle, fetchLogoDataUrl,
} from './invoicePdfNative';
import { formatInvoiceNumber } from './invoiceSequence';
import { estimateAfterTableHeight } from './invoiceLayoutModel';

export async function buildLayoutInvoicePdf(invoice, clientName, settings, layout, invoiceType = 'monthly', seqNo, draft = false) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // Fetch logo as data URL
  let logoDataUrl = null;
  if (settings.logo_url) {
    try { logoDataUrl = await fetchLogoDataUrl(settings.logo_url); } catch (e) { /* fallback */ }
  }
  const s = { ...settings, logo_url: logoDataUrl || settings.logo_url };
  const invStyle = getInvStyle(s);

  const cols = colPositions(
    invoiceType === 'trip' ? COLS_TRIP
    : invoiceType === 'standard' ? COLS_STANDARD
    : COLS_MONTHLY
  );
  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const items = invoice.line_items || [];

  const year = new Date().getFullYear();
  const refNumber = invoice.invoice_number || (seqNo ? formatInvoiceNumber(year, seqNo) : `${year}-0001`);
  const invoiceDate = fmtDate(invoice.issue_date);

  // Split blocks into before-table, after-table, footer
  const enabledBlocks = layout.blocks.filter(b => b.enabled);
  const tableIdx = enabledBlocks.findIndex(b => b.type === 'table');
  const beforeTableBlocks = enabledBlocks.slice(0, tableIdx);
  const afterTableBlocks = enabledBlocks.slice(tableIdx + 1).filter(b => b.type !== 'footer');
  const hasFooter = enabledBlocks.some(b => b.type === 'footer');

  const afterTableHeight = estimateAfterTableHeight(layout);
  // Rows stop above the after-table blocks + footer zone
  const contentBottom = FOOTER_RESERVED_TOP - afterTableHeight - 2;

  // Compute totals from line items
  const subtotal = items.reduce((sum, i) => {
    const q = Number(i.quantity) || 0;
    const p = Number(i.unit_price) || 0;
    return sum + Number(i.amount ?? (q * p));
  }, 0);
  const totalDiscount = items.reduce((sum, i) => sum + (Number(i.discount) || 0), 0);
  const taxableForVat = items.reduce((acc, i) => {
    if (i.vat_excluded) return acc;
    const q = Number(i.quantity) || 0;
    const p = Number(i.unit_price) || 0;
    const g = Number(i.amount ?? (q * p));
    return acc + (g - (Number(i.discount) || 0));
  }, 0);
  const vat = taxableForVat * vatRate / 100;
  const total = subtotal - totalDiscount + vat;
  const totals = { subtotal, discount: totalDiscount, taxable: subtotal - totalDiscount, vat, total };

  // ── Helper: draw a single block at y, return new y ──
  function drawBlock(block, y) {
    switch (block.type) {
      case 'header':
        y = drawLetterhead(pdf, s, y);
        y = drawTaxBanner(pdf, y, refNumber, invoiceDate, s.trn);
        return y;
      case 'billTo':
        return drawBillingSection(pdf, invoice, clientName, y, invoiceType, refNumber, invoiceDate);
      case 'totals':
        return drawTableTotal(pdf, cols, y, totals, invoiceType);
      case 'terms':
        return drawTermsInline(pdf, y, invoiceType);
      case 'signature': {
        const bankH = drawBankDetailsBlock(pdf, s, y, invoiceType);
        y += bankH + 2;
        drawTripSignaturesWithCompany(pdf, invoice, clientName, y);
        return y + 25;
      }
      default:
        return y;
    }
  }

  // ── Helper: draw all before-table blocks (page 1 + continuation pages) ──
  function drawBeforeTableBlocks(y) {
    for (const block of beforeTableBlocks) {
      y = drawBlock(block, y);
    }
    return y;
  }

  // ── Helper: start a new continuation page ──
  function startNewPage() {
    pdf.addPage();
    drawPageBorder(pdf);
    let y = BORDER_POS + 2;
    y = drawBeforeTableBlocks(y);
    y = drawTableHeader(pdf, cols, y, invoiceType, invStyle);
    return y;
  }

  // ══ PAGE 1 ══
  drawPageBorder(pdf);
  let y = BORDER_POS + 2;
  y = drawBeforeTableBlocks(y);
  y = drawTableHeader(pdf, cols, y, invoiceType, invStyle);

  // ══ TABLE ROWS (with pagination) ══
  if (items.length === 0) {
    fc(pdf, WHITE);
    pdf.rect(CONTENT_X, y, CONTENT_W, 7, 'F');
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    tc(pdf, GRAY);
    pdf.text('No items', CONTENT_X + 2, y + 4.5);
    dc(pdf, BLACK);
    pdf.setLineWidth(0.3);
    pdf.rect(CONTENT_X, y, CONTENT_W, 7);
    y += 7;
  } else {
    for (let idx = 0; idx < items.length; idx++) {
      const descCol = cols.find(c => c.label.startsWith('DESCRIPTION'));
      const _indLine = buildIndicatorLine(items[idx]);
      const _descText = _indLine ? `${normalizeRoute(items[idx].description ?? '')}\n${_indLine}` : normalizeRoute(items[idx].description ?? '');
      const descLines = pdf.splitTextToSize(_descText, descCol.w - 4);
      const estH = Math.max(6.5, descLines.length * 2.8 + 3);
      const isLast = idx === items.length - 1;

      if (isLast) {
        // Safety check: last row + after-table blocks must fit above footer zone
        if (y + estH + afterTableHeight + 2 > FOOTER_RESERVED_TOP) {
          y = startNewPage();
        }
      } else if (y + estH > contentBottom) {
        // Normal pagination: row doesn't fit — new page with repeated headers
        y = startNewPage();
      }
      y = drawTableRow(pdf, items[idx], cols, y, idx, vatRate, invoiceType, invoice, invStyle);
    }
  }

  // ══ AFTER-TABLE BLOCKS (last page only, right after table) ══
  for (const block of afterTableBlocks) {
    y = drawBlock(block, y);
    y += 2; // inter-block gap
  }

  // ══ FOOTER + PAGE NUMBERS (on every page) ══
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    if (draft) {
      pdf.setGState(new pdf.GState({ opacity: 0.14 }));
      pdf.setFont('times', 'bold');
      pdf.setFontSize(110);
      tc(pdf, MAROON);
      pdf.text('DRAFT', PAGE_W / 2, PAGE_H / 2, { align: 'center', angle: 32 });
      pdf.setGState(new pdf.GState({ opacity: 1 }));
    }
    if (hasFooter) drawFooterBanners(pdf);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    tc(pdf, GRAY);
    pdf.text(`Page No ${i} of ${pageCount}`, CONTENT_RIGHT, 282, { align: 'right' });
  }

  return pdf;
}

export async function renderLayoutPDF(invoice, clientName, settings, layout, invoiceType = 'monthly', seqNo, draft = false) {
  const pdf = await buildLayoutInvoicePdf(invoice, clientName, settings, layout, invoiceType, seqNo, draft);
  pdf.save(`invoice-${invoice.invoice_number || invoice.id}.pdf`);
}

// Generate a preview blob URL for the layout editor
export async function generateLayoutPreviewUrl(invoice, clientName, settings, layout, invoiceType = 'monthly') {
  const pdf = await buildLayoutInvoicePdf(invoice, clientName, settings, layout, invoiceType);
  return pdf.output('bloburl');
}