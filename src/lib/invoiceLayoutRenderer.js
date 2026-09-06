/**
 * Invoice Layout Renderer — data-driven PDF rendering engine.
 * Applies block order, spacing, borders, background shading, text styles,
 * and custom column widths from the layout definition.
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
import { estimateAfterTableHeight, estimateSignatureHeight, BLOCK_HEIGHTS } from './invoiceLayoutModel';

// ── Helpers ──
function hexToRgb(hex) {
  if (!hex || hex[0] !== '#' || hex.length < 7) return null;
  return { r: parseInt(hex.slice(1, 3), 16), g: parseInt(hex.slice(3, 5), 16), b: parseInt(hex.slice(5, 7), 16) };
}

function applyCustomColumns(cols, block) {
  if (!block?.columns) return cols;
  const custom = block.columns.filter(c => c.visible !== false);
  if (custom.length === 0 || custom.length !== cols.length) return cols;
  const totalPct = custom.reduce((s, c) => s + c.width, 0);
  if (totalPct <= 0) return cols;
  let x = CONTENT_X;
  return cols.map((col, i) => {
    const c = custom[i];
    const w = (c.width / totalPct) * CONTENT_W;
    const newCol = {
      ...col, x, w, right: x + w, center: x + w / 2,
      // Per-column style overrides (align + weight + relative size)
      colAlign: c.align || col.align,
      colWeight: c.fontWeight || 'normal',
      colSizeMul: c.fontSize || 1,
    };
    x += w;
    return newCol;
  });
}

// ── Measure a single row's height (must match drawTableRow's height calc) ──
function measureRowHeight(pdf, item, cols, invoiceType) {
  const descCol = cols.find(c => c.label.startsWith('DESCRIPTION'));
  const _indLine = buildIndicatorLine(item);
  const _descText = _indLine ? `${normalizeRoute(item.description ?? '')}\n${_indLine}` : normalizeRoute(item.description ?? '');
  const fSize = invoiceType === 'monthly' ? 8 : 7.5;
  pdf.setFont('times', descCol?.colWeight || 'bold');
  pdf.setFontSize(fSize * (descCol?.colSizeMul || 1));
  const descLines = pdf.splitTextToSize(_descText, (descCol?.w || 80) - 4);
  return Math.max(6.5, descLines.length * 2.8 + 3);
}

// ── Auto-balancing page break planner ──
// Pre-measures all row heights, then distributes rows across pages so each
// non-last page is filled maximally (no dead space), and the last page fits
// rows + after-table blocks. Supports per-page manual row count overrides.
function planPageBreaks(pdf, items, cols, startY, nonLastMaxY, lastMaxY, pagination) {
  const total = items.length;
  if (total === 0) return [{ startIdx: 0, count: 0, isLast: true, pageNum: 1, isManual: false }];

  // Pre-measure all row heights
  const rowHeights = items.map(item => measureRowHeight(pdf, item, cols, pagination?._invoiceType || 'monthly'));

  const pageOverrides = pagination?.pageOverrides || {};
  const mode = pagination?.mode || 'auto';

  // Manual mode (legacy): fixed rowsPerPage for all pages
  if (mode === 'manual' && !pagination?.pageOverrides?.[1]) {
    const rpp = pagination?.rowsPerPage || 20;
    const pages = [];
    for (let i = 0; i < total; i += rpp) {
      const count = Math.min(rpp, total - i);
      pages.push({ startIdx: i, count, isLast: i + count >= total, pageNum: pages.length + 1, isManual: true });
    }
    return pages;
  }

  // Auto mode (with optional per-page overrides)
  const pages = [];
  let idx = 0;
  let pageNum = 1;

  while (idx < total) {
    const override = pageOverrides[pageNum];
    let count;

    if (override && override > 0) {
      // Manual per-page override — use exact count
      count = Math.min(override, total - idx);
    } else {
      // Auto-calculate: fill page greedily up to nonLastMaxY
      let y = startY;
      count = 0;
      while (idx + count < total && y + rowHeights[idx + count] <= nonLastMaxY) {
        y += rowHeights[idx + count];
        count++;
      }
      if (count === 0) count = 1; // safety: at least 1 row
    }

    pages.push({ startIdx: idx, count, isLast: false, pageNum, isManual: !!override });
    idx += count;
    pageNum++;
  }

  // Mark the last page
  if (pages.length > 0) pages[pages.length - 1].isLast = true;

  // Fix-up: ensure last page rows + afterTable fit in lastMaxY
  // Move rows from last page to previous page if needed (skip manual pages)
  while (pages.length > 1) {
    const lastPage = pages[pages.length - 1];
    const prevPage = pages[pages.length - 2];
    if (lastPage.isManual || prevPage.isManual) break;

    let lastRowsY = startY;
    for (let i = 0; i < lastPage.count; i++) {
      lastRowsY += rowHeights[lastPage.startIdx + i];
    }
    if (lastRowsY <= lastMaxY) break; // fits!
    if (lastPage.count <= 1) break;   // can't move more

    lastPage.count--;
    lastPage.startIdx++;
    prevPage.count++;
  }

  // Edge case: single page with rows + afterTable not fitting → split
  if (pages.length === 1) {
    const page = pages[0];
    let rowsY = startY;
    for (let i = 0; i < page.count; i++) {
      rowsY += rowHeights[page.startIdx + i];
    }
    if (rowsY > lastMaxY) {
      let splitIdx = 0;
      let y = startY;
      for (let i = 0; i < page.count; i++) {
        if (y + rowHeights[page.startIdx + i] > nonLastMaxY) break;
        y += rowHeights[page.startIdx + i];
        splitIdx++;
      }
      if (splitIdx > 0 && splitIdx < page.count) {
        pages[0] = { startIdx: page.startIdx, count: splitIdx, isLast: false, pageNum: 1, isManual: page.isManual };
        pages.push({ startIdx: page.startIdx + splitIdx, count: page.count - splitIdx, isLast: true, pageNum: 2, isManual: false });
      }
    }
  }

  return pages;
}

export async function buildLayoutInvoicePdf(invoice, clientName, settings, layout, invoiceType = 'monthly', seqNo, draft = false) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  let logoDataUrl = null;
  if (settings.logo_url) {
    try { logoDataUrl = await fetchLogoDataUrl(settings.logo_url); } catch (e) { /* fallback */ }
  }
  const s = { ...settings, logo_url: logoDataUrl || settings.logo_url };
  const invStyle = getInvStyle(s);

  let cols = colPositions(
    invoiceType === 'trip' ? COLS_TRIP
    : invoiceType === 'standard' ? COLS_STANDARD
    : COLS_MONTHLY
  );
  const tableBlock = layout.blocks.find(b => b.type === 'table');
  if (tableBlock?.columns) cols = applyCustomColumns(cols, tableBlock);
  const tablePagination = { ...(tableBlock?.pagination || { mode: 'auto', rowsPerPage: 20, pageOverrides: {}, sigOnEveryPage: false }), _invoiceType: invoiceType };

  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const items = invoice.line_items || [];
  const year = new Date().getFullYear();
  const refNumber = invoice.invoice_number || (seqNo ? formatInvoiceNumber(year, seqNo) : `${year}-0001`);
  const invoiceDate = fmtDate(invoice.issue_date);

  const enabledBlocks = layout.blocks.filter(b => b.enabled);
  const tableIdx = enabledBlocks.findIndex(b => b.type === 'table');
  const beforeTableBlocks = enabledBlocks.slice(0, tableIdx);
  const afterTableBlocks = enabledBlocks.slice(tableIdx + 1).filter(b => b.type !== 'footer');
  const hasFooter = enabledBlocks.some(b => b.type === 'footer');

  const afterTableHeight = estimateAfterTableHeight(layout);
  const sigOnEveryPage = tablePagination.sigOnEveryPage || false;
  const sigBlock = afterTableBlocks.find(b => b.type === 'signature');
  const sigHeight = sigBlock ? (BLOCK_HEIGHTS.signature + 3 + (sigBlock.spacing?.paddingTop || 0) + (sigBlock.spacing?.paddingBottom || 0)) : 0;
  // Non-last pages: rows fill almost the entire page (no after-table reservation)
  // unless sigOnEveryPage is on — then reserve signature height on every page.
  const lastMaxY = FOOTER_RESERVED_TOP - afterTableHeight - 2;
  const nonLastMaxY = sigOnEveryPage ? FOOTER_RESERVED_TOP - sigHeight - 2 : FOOTER_RESERVED_TOP - 2;

  // Compute totals
  const subtotal = items.reduce((sum, i) => {
    const q = Number(i.quantity) || 0, p = Number(i.unit_price) || 0;
    return sum + Number(i.amount ?? (q * p));
  }, 0);
  const totalDiscount = items.reduce((sum, i) => sum + (Number(i.discount) || 0), 0);
  const taxableForVat = items.reduce((acc, i) => {
    if (i.vat_excluded) return acc;
    const q = Number(i.quantity) || 0, p = Number(i.unit_price) || 0;
    return acc + (Number(i.amount ?? (q * p)) - (Number(i.discount) || 0));
  }, 0);
  const vat = taxableForVat * vatRate / 100;
  const total = subtotal - totalDiscount + vat;
  const totals = { subtotal, discount: totalDiscount, taxable: subtotal - totalDiscount, vat, total };

  // ── Apply text style from block config to PDF state ──
  function applyTextStyle(block) {
    const style = block.style;
    if (!style) return;
    if (style.fontFamily) pdf.setFont(style.fontFamily, style.fontWeight || 'normal');
    if (style.fontSize) pdf.setFontSize(style.fontSize);
    if (style.color) {
      const rgb = hexToRgb(style.color);
      if (rgb) pdf.setTextColor(rgb.r, rgb.g, rgb.b);
    }
  }

  // ── Draw a single block at y, return new y ──
  function drawBlock(block, y, pageNum = 1) {
    // Merge per-page spacing override if present
    const pageSpacing = layout.pageOverrides?.[pageNum]?.[block.id]?.spacing;
    const effSpacing = { ...block.spacing, ...(pageSpacing || {}) };
    y += effSpacing.paddingTop || 0;

    // Background shading
    if (block.background?.enabled) {
      const h = BLOCK_HEIGHTS[block.type] || 10;
      const rgb = hexToRgb(block.background.color || '#f5f5f5');
      if (rgb) { pdf.setFillColor(rgb.r, rgb.g, rgb.b); pdf.rect(CONTENT_X, y, CONTENT_W, h, 'F'); }
    }

    // Border top
    if (block.border?.top) {
      dc(pdf, BLACK); pdf.setLineWidth(0.3);
      pdf.line(CONTENT_X, y, CONTENT_RIGHT, y);
    }

    applyTextStyle(block);

    let newY = y;
    switch (block.type) {
      case 'header':
        newY = drawLetterhead(pdf, s, y);
        newY = drawTaxBanner(pdf, newY, refNumber, invoiceDate, s.trn);
        break;
      case 'billTo':
        newY = drawBillingSection(pdf, invoice, clientName, y, invoiceType, refNumber, invoiceDate, block.fields, block.style);
        break;
      case 'totals':
        newY = drawTableTotal(pdf, cols, y, totals, invoiceType);
        break;
      case 'terms':
        newY = drawTermsInline(pdf, y, invoiceType);
        break;
      case 'signature': {
        // Merge sigElements checklist into field visibility
        const sigElements = block.sigElements || {};
        const mergedFields = { ...block.fields };
        if (sigElements.authorizedBy === false) {
          ['authLabel', 'authCaption', 'authCompany'].forEach(k => {
            mergedFields[k] = { ...(mergedFields[k] || {}), visible: false };
          });
        }
        if (sigElements.receivedBy === false) {
          ['recvLabel', 'recvCaption', 'recvClient'].forEach(k => {
            mergedFields[k] = { ...(mergedFields[k] || {}), visible: false };
          });
        }
        const bankH = drawBankDetailsBlock(pdf, s, y, invoiceType, mergedFields, block.style);
        y += bankH + (block.sigSpacing?.sigGap ?? 2);
        drawTripSignaturesWithCompany(pdf, invoice, clientName, y, mergedFields, block.style, block.sigSpacing);
        const sigTopGap = block.sigSpacing?.sigTopGap ?? 12;
        const captionNameGap = block.sigSpacing?.captionNameGap ?? 7;
        let extraY = y + sigTopGap + captionNameGap + 10;

        // Optional checklist elements — drawn below signatures, collapse entirely when unchecked
        if (sigElements.companyStamp) {
          pdf.setFont('times', 'italic'); pdf.setFontSize(8); tc(pdf, GRAY);
          pdf.setDrawColor(150, 150, 150); pdf.setLineWidth(0.3);
          pdf.rect(CONTENT_RIGHT - 35, extraY, 25, 12);
          pdf.text('Company Stamp', CONTENT_RIGHT - 22, extraY + 7, { align: 'center' });
          extraY += 14;
        }
        if (sigElements.dateField) {
          pdf.setFont('times', 'normal'); pdf.setFontSize(9); tc(pdf, BLACK);
          pdf.text('Date: __________________', CONTENT_X, extraY + 4);
          extraY += 7;
        }
        if (sigElements.termsAccepted) {
          pdf.setFont('times', 'normal'); pdf.setFontSize(8); tc(pdf, GRAY);
          pdf.text('I accept the terms and conditions stated above.', CONTENT_X, extraY + 4);
          extraY += 6;
        }
        newY = extraY;
        break;
      }
      default: break;
    }

    // Border bottom
    if (block.border?.bottom) {
      dc(pdf, BLACK); pdf.setLineWidth(0.3);
      pdf.line(CONTENT_X, newY, CONTENT_RIGHT, newY);
    }

    newY += effSpacing.paddingBottom || 0;
    return newY;
  }

  let currentPageNum = 1;

  function drawBeforeTableBlocks(y, pageNum) {
    for (const block of beforeTableBlocks) y = drawBlock(block, y, pageNum);
    return y;
  }

  function startNewPage() {
    pdf.addPage();
    drawPageBorder(pdf);
    currentPageNum++;
    let y = BORDER_POS + 2;
    y = drawBeforeTableBlocks(y, currentPageNum);
    y = drawTableHeader(pdf, cols, y, invoiceType, invStyle);
    return y;
  }

  // ── PAGE 1 ──
  drawPageBorder(pdf);
  let y = BORDER_POS + 2;
  y = drawBeforeTableBlocks(y, currentPageNum);
  y = drawTableHeader(pdf, cols, y, invoiceType, invStyle);

  // ── PLAN PAGE BREAKS (auto-balancing engine) ──
  // Pre-measure all rows and distribute across pages so each page is filled
  // maximally — no dead space. The last page reserves room for after-table blocks.
  const pagePlan = planPageBreaks(pdf, items, cols, y, nonLastMaxY, lastMaxY, tablePagination);

  // ── TABLE ROWS (rendered according to the plan) ──
  if (items.length === 0) {
    fc(pdf, WHITE); pdf.rect(CONTENT_X, y, CONTENT_W, 7, 'F');
    pdf.setFont('times', 'normal'); pdf.setFontSize(9); tc(pdf, GRAY);
    pdf.text('No items', CONTENT_X + 2, y + 4.5);
    dc(pdf, BLACK); pdf.setLineWidth(0.3); pdf.rect(CONTENT_X, y, CONTENT_W, 7);
    y += 7;
    // After-table blocks on the single page
    for (const block of afterTableBlocks) {
      y = drawBlock(block, y, currentPageNum);
      y += 2;
    }
  } else {
    for (let p = 0; p < pagePlan.length; p++) {
      const plan = pagePlan[p];
      if (p > 0) {
        // New page — redraw before-table blocks + table header
        pdf.addPage();
        drawPageBorder(pdf);
        currentPageNum++;
        y = BORDER_POS + 2;
        y = drawBeforeTableBlocks(y, currentPageNum);
        y = drawTableHeader(pdf, cols, y, invoiceType, invStyle);
      }
      // Draw this page's rows
      for (let i = 0; i < plan.count; i++) {
        const idx = plan.startIdx + i;
        y = drawTableRow(pdf, items[idx], cols, y, idx, vatRate, invoiceType, invoice, invStyle);
      }
      // After-table blocks: all on the last page, signature-only on non-last pages
      // when sigOnEveryPage is enabled
      if (plan.isLast) {
        for (const block of afterTableBlocks) {
          y = drawBlock(block, y, currentPageNum);
          y += 2;
        }
      } else if (sigOnEveryPage && sigBlock) {
        y = drawBlock(sigBlock, y, currentPageNum);
        y += 2;
      }
    }
  }

  // ── FOOTER + PAGE NUMBERS ──
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    if (draft) {
      pdf.setGState(new pdf.GState({ opacity: 0.14 }));
      pdf.setFont('times', 'bold'); pdf.setFontSize(110); tc(pdf, MAROON);
      pdf.text('DRAFT', PAGE_W / 2, PAGE_H / 2, { align: 'center', angle: 32 });
      pdf.setGState(new pdf.GState({ opacity: 1 }));
    }
    if (hasFooter) drawFooterBanners(pdf);
    pdf.setFont('times', 'normal'); pdf.setFontSize(9); tc(pdf, GRAY);
    pdf.text(`Page No ${i} of ${pageCount}`, CONTENT_RIGHT, 282, { align: 'right' });
  }

  return pdf;
}

export async function renderLayoutPDF(invoice, clientName, settings, layout, invoiceType = 'monthly', seqNo, draft = false) {
  const pdf = await buildLayoutInvoicePdf(invoice, clientName, settings, layout, invoiceType, seqNo, draft);
  pdf.save(`invoice-${invoice.invoice_number || invoice.id}.pdf`);
}

export async function generateLayoutPreviewUrl(invoice, clientName, settings, layout, invoiceType = 'monthly') {
  const pdf = await buildLayoutInvoicePdf(invoice, clientName, settings, layout, invoiceType);
  return { url: pdf.output('bloburl'), pageCount: pdf.getNumberOfPages() };
}