/**
 * Native jsPDF Invoice Renderer — FTA-compliant Tax Invoice
 * Draws vector text directly (no html2canvas rasterization) for crisp,
 * print-ready output equivalent to Puppeteer's vector PDF generation.
 *
 * Fonts: jsPDF built-in base-14 (metric-compatible with system fonts):
 *   times    ≈ Georgia      (serif — company name, subtitle)
 *   helvetica ≈ Segoe UI/Arial (sans-serif — body text, labels)
 *   courier  ≈ Courier New  (monospace — numeric columns)
 */

import { jsPDF } from 'jspdf';
import { numberToWords } from './numberToWords';
import { formatInvoiceNumber } from './invoiceSequence';

// ═══════════════════════════════════════════════════════════
// PAGE CONSTANTS (mm)
// ═══════════════════════════════════════════════════════════
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 8;
const CONTENT_X = MARGIN;
const CONTENT_W = PAGE_W - 2 * MARGIN;
const CONTENT_RIGHT = PAGE_W - MARGIN;
const BORDER_POS = 4;
const FOOTER_TOP = 279;
const FOOTER_BOTTOM = PAGE_H - BORDER_POS;

// ═══════════════════════════════════════════════════════════
// COLORS (RGB)
// ═══════════════════════════════════════════════════════════
const MAROON = [139, 21, 56];
const DARK_BLUE = [26, 58, 92];
const LBH = [214, 228, 240];
const BRONZE = [196, 163, 90];
const BLACK = [0, 0, 0];
const GRAY = [102, 102, 102];
const LIGHT_GRAY = [221, 221, 221];
const BG_GRAY = [248, 248, 248];
const BORDER_GRAY = [224, 224, 224];
const DARK_MAROON = [107, 15, 42];
const WHITE = [255, 255, 255];
const ROW_ALT = [250, 251, 252];
const CELL_BORDER = [187, 187, 187];

// ═══════════════════════════════════════════════════════════
// COLUMN DEFINITIONS
// ═══════════════════════════════════════════════════════════
const COLS_MONTHLY = [
  { label: '#',              w: 8,  align: 'center' },
  { label: 'MONTH',          w: 20, align: 'center' },
  { label: 'DESCRIPTION',    w: 52, align: 'left'   },
  { label: 'QTY',            w: 14, align: 'center' },
  { label: 'UNIT PRICE\n(AED)', w: 24, align: 'right'  },
  { label: 'AMOUNT\n(AED)',  w: 24, align: 'right'  },
  { label: 'VAT\n5%',        w: 20, align: 'right'  },
  { label: 'TOTAL\n(AED)',   w: 32, align: 'right'  },
];

const COLS_TRIP = [
  { label: '#',              w: 8,  align: 'center' },
  { label: 'TRIP\nDATE',     w: 19, align: 'center' },
  { label: 'DESCRIPTION',    w: 58, align: 'left'   },
  { label: 'QTY',            w: 14, align: 'center' },
  { label: 'UNIT PRICE\n(AED)', w: 24, align: 'right'  },
  { label: 'AMOUNT\n(AED)',  w: 24, align: 'right'  },
  { label: 'VAT\n5%',        w: 20, align: 'right'  },
  { label: 'TOTAL\n(AED)',   w: 27, align: 'right'  },
];

const COLS_STANDARD = [
  { label: '#',              w: 7,  align: 'center' },
  { label: 'DESCRIPTION',    w: 54, align: 'left'   },
  { label: 'QTY',            w: 12, align: 'center' },
  { label: 'UNIT PRICE\n(AED)', w: 20, align: 'right'  },
  { label: 'GROSS\n(AED)',   w: 21, align: 'right'  },
  { label: 'DISCOUNT\n(AED)', w: 18, align: 'right'  },
  { label: 'TAXABLE\n(AED)', w: 21, align: 'right'  },
  { label: 'VAT\n5%',        w: 20, align: 'right'  },
  { label: 'TOTAL\n(AED)',   w: 21, align: 'right'  },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function fmtMoney(n) {
  return Number(n ?? 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function getMonthYear(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function str(v) { return String(v ?? ''); }

function normalizeRoute(s) {
  return str(s)
    .replace(/\s*->\s*/g, ' → ')
    .replace(/(\w{2,})\s*[!'']+\s*(\w{2,})/g, '$1-$2')
    .replace(/(\w{2,})\s*[–—]\s*(\w{2,})/g, '$1-$2')
    .replace(/-{2,}/g, '-');
}

async function fetchLogoDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getImgFormat(dataUrl) {
  if (!dataUrl) return 'PNG';
  if (dataUrl.startsWith('data:image/png')) return 'PNG';
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG';
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP';
  return 'PNG';
}

// Color setters
function tc(pdf, [r, g, b]) { pdf.setTextColor(r, g, b); }
function fc(pdf, [r, g, b]) { pdf.setFillColor(r, g, b); }
function dc(pdf, [r, g, b]) { pdf.setDrawColor(r, g, b); }

// Compute column x-positions from a column definition array
function colPositions(cols) {
  let x = CONTENT_X;
  return cols.map(c => {
    const pos = { ...c, x, right: x + c.w, center: x + c.w / 2 };
    x += c.w;
    return pos;
  });
}

// ═══════════════════════════════════════════════════════════
// DRAW: PAGE BORDER
// ═══════════════════════════════════════════════════════════
function drawPageBorder(pdf) {
  dc(pdf, MAROON);
  pdf.setLineWidth(0.5);
  pdf.rect(BORDER_POS, BORDER_POS, PAGE_W - 2 * BORDER_POS, PAGE_H - 2 * BORDER_POS);
  dc(pdf, LIGHT_GRAY);
  pdf.setLineWidth(0.2);
  pdf.rect(BORDER_POS + 1, BORDER_POS + 1, PAGE_W - 2 * BORDER_POS - 2, PAGE_H - 2 * BORDER_POS - 2);
}

// ═══════════════════════════════════════════════════════════
// DRAW: DEFAULT LOGO (when no logo_url)
// ═══════════════════════════════════════════════════════════
function drawDefaultLogo(pdf, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  dc(pdf, MAROON);
  pdf.setLineWidth(0.6);
  pdf.circle(cx, cy, size / 2);
  dc(pdf, BRONZE);
  pdf.setLineWidth(0.4);
  pdf.circle(cx, cy, size / 2 - 3);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(11);
  tc(pdf, MAROON);
  pdf.text('BW', cx, cy + 2, { align: 'center' });
}

// ═══════════════════════════════════════════════════════════
// DRAW: LETTERHEAD (all pages)
// ═══════════════════════════════════════════════════════════
function drawLetterhead(pdf, s, y) {
  const logoSize = 17;
  const textX = CONTENT_X + logoSize + 3;

  // Logo
  if (s.logo_url) {
    try {
      pdf.addImage(s.logo_url, getImgFormat(s.logo_url), CONTENT_X, y, logoSize, logoSize);
    } catch (e) {
      drawDefaultLogo(pdf, CONTENT_X, y, logoSize);
    }
  } else {
    drawDefaultLogo(pdf, CONTENT_X, y, logoSize);
  }

  // Company name — Georgia 22pt bold maroon
  pdf.setFont('times', 'bold');
  pdf.setFontSize(22);
  tc(pdf, MAROON);
  pdf.text('BRONZE WINGS', textX, y + 8, { charSpace: 0.8 });

  // Subtitle — Georgia 14pt bold dark blue
  pdf.setFont('times', 'bold');
  pdf.setFontSize(14);
  tc(pdf, DARK_BLUE);
  pdf.text('GENERAL TRANSPORT L.L.C', textX, y + 14, { charSpace: 0.5 });

  // Tagline — 5.5pt gray uppercase
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  tc(pdf, GRAY);
  pdf.text('GENERAL TRANSPORT · HEAVY EQUIPMENT RENTAL · LOGISTICS SERVICES', textX, y + 18.5);

  // Contact — 5.5pt black
  tc(pdf, BLACK);
  const parts = [];
  if (s.phone1 || s.phone2) parts.push(`Mobile: ${str(s.phone1)}${s.phone2 ? ' / ' + str(s.phone2) : ''}`);
  if (s.email) parts.push(`Email: ${str(s.email)}`);
  if (s.address) parts.push(`Address: ${str(s.address)}`);
  pdf.text(parts.join('  |  '), textX, y + 22);

  // TRN — 7pt bold maroon
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  tc(pdf, MAROON);
  pdf.text(`TRN: ${str(s.trn)}`, textX, y + 26);

  // Separator line
  dc(pdf, MAROON);
  pdf.setLineWidth(0.5);
  pdf.line(CONTENT_X, y + 28, CONTENT_RIGHT, y + 28);

  return y + 30;
}

// ═══════════════════════════════════════════════════════════
// DRAW: TAX INVOICE BANNER (first page only)
// ═══════════════════════════════════════════════════════════
function drawTaxBanner(pdf, y, refNumber, invoiceDate) {
  const h = 8;
  fc(pdf, LBH);
  pdf.rect(CONTENT_X, y, CONTENT_W, h, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  tc(pdf, DARK_BLUE);
  pdf.text('TAX INVOICE', PAGE_W / 2, y + 5.5, { align: 'center' });

  pdf.setFontSize(7);
  pdf.text(`INVOICE #: ${refNumber}`, CONTENT_RIGHT - 2, y + 3, { align: 'right' });
  pdf.text(`INVOICE DATE: ${invoiceDate}`, CONTENT_RIGHT - 2, y + 6.5, { align: 'right' });

  return y + h + 2;
}

// ═══════════════════════════════════════════════════════════
// DRAW: BILLING SECTION (first page only)
// ═══════════════════════════════════════════════════════════
function drawBillingSection(pdf, invoice, clientName, y, invoiceType, refNumber, invoiceDate) {
  const h = 24;
  dc(pdf, LIGHT_GRAY);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, CONTENT_W, h);
  pdf.line(PAGE_W / 2, y, PAGE_W / 2, y + h);

  const leftX = CONTENT_X + 3;
  const rightX = PAGE_W / 2 + 3;

  // ── LEFT: BILL TO ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  tc(pdf, MAROON);
  pdf.text('BILL TO', leftX, y + 4);
  dc(pdf, MAROON);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, y + 5, leftX + 15, y + 5);

  let ly = y + 9;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  tc(pdf, BLACK);
  pdf.text(str(clientName || invoice.client_name || '—'), leftX, ly);
  ly += 3.2;

  pdf.setFont('helvetica', 'normal');
  if (invoice.contact_person) { pdf.text(`ATT: ${str(invoice.contact_person)}`, leftX, ly); ly += 3.2; }
  if (invoice.client_address) { pdf.text(`ADDRESS: ${str(invoice.client_address)}`, leftX, ly); ly += 3.2; }
  if (invoice.client_trn)     { pdf.text(`TRN: ${str(invoice.client_trn)}`, leftX, ly); ly += 3.2; }
  if (invoice.sub)            { pdf.text(`SUB: ${str(invoice.sub)}`, leftX, ly); ly += 3.2; }
  if (invoice.reg_no)          { pdf.text(`REG NO: ${str(invoice.reg_no)}`, leftX, ly); ly += 3.2; }

  // ── RIGHT: INVOICE ──
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  tc(pdf, MAROON);
  pdf.text('INVOICE', rightX, y + 4);
  dc(pdf, MAROON);
  pdf.setLineWidth(0.3);
  pdf.line(rightX, y + 5, rightX + 15, y + 5);

  let ry = y + 9;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  tc(pdf, BLACK);

  if (invoiceType === 'monthly') {
    pdf.text(`MONTH: ${getMonthYear(invoice.issue_date)}`, rightX, ry); ry += 3.2;
  }

  return y + h + 2;
}

// ═══════════════════════════════════════════════════════════
// DRAW: TABLE HEADER ROW
// ═══════════════════════════════════════════════════════════
function drawTableHeader(pdf, cols, y) {
  const h = 9;
  fc(pdf, LBH);
  pdf.rect(CONTENT_X, y, CONTENT_W, h, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  tc(pdf, DARK_BLUE);

  for (const col of cols) {
    const lines = col.label.split('\n');
    const lineH = 3;
    const startY = y + (h - lines.length * lineH) / 2 + lineH;
    const textX = col.align === 'right' ? col.right - 2
                : col.align === 'center' ? col.center : col.x + 2;
    const align = col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left';
    for (let i = 0; i < lines.length; i++) {
      pdf.text(lines[i], textX, startY + i * lineH, { align });
    }
  }

  // Grid
  dc(pdf, CELL_BORDER);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, CONTENT_W, h);
  for (let i = 1; i < cols.length; i++) {
    pdf.line(cols[i].x, y, cols[i].x, y + h);
  }
  return y + h;
}

// ═══════════════════════════════════════════════════════════
// DRAW: TABLE DATA ROW
// ═══════════════════════════════════════════════════════════
function drawTableRow(pdf, item, cols, y, idx, vatRate, invoiceType, invoice) {
  const descCol = cols.find(c => c.label.startsWith('DESCRIPTION'));
  const descText = normalizeRoute(item.description ?? '');
  const descLines = pdf.splitTextToSize(descText, descCol.w - 4);
  const lineH = 2.8;
  const minH = 7;
  const rowH = Math.max(minH, descLines.length * lineH + 3);

  // Background
  fc(pdf, idx % 2 === 0 ? WHITE : ROW_ALT);
  pdf.rect(CONTENT_X, y, CONTENT_W, rowH, 'F');

  const qty = Number(item.quantity) || 0;
  const unitPrice = Number(item.unit_price) || 0;
  const gross = Number(item.amount ?? (qty * unitPrice));
  const discount = Number(item.discount) || 0;
  const taxable = gross - discount;
  const lineVat = taxable * (vatRate / 100);
  const lineTotal = taxable + lineVat;

  const vCenter = y + rowH / 2 + 1;

  pdf.setFontSize(6);
  tc(pdf, BLACK);

  // # column
  pdf.setFont('helvetica', 'normal');
  pdf.text(String(idx + 1), cols[0].center, vCenter, { align: 'center' });

  let ci = 1;

  // TRIP DATE column (trip only)
  if (invoiceType === 'trip') {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.5);
    pdf.text(fmtDate(item.date), cols[ci].center, vCenter, { align: 'center' });
    ci++;
  }

  // MONTH column (monthly only)
  if (invoiceType === 'monthly') {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5);
    pdf.text(getMonthYear(item.date || invoice.issue_date), cols[ci].center, vCenter, { align: 'center' });
    ci++;
  }

  // DESCRIPTION column
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  const descStartY = y + (rowH - descLines.length * lineH) / 2 + lineH;
  for (let i = 0; i < descLines.length; i++) {
    pdf.text(descLines[i], descCol.x + 2, descStartY + i * lineH);
  }
  ci++;

  // Numeric columns — courier monospace
  pdf.setFont('courier', 'normal');
  pdf.setFontSize(6);
  const nums = invoiceType === 'standard'
    ? [qty, unitPrice, gross, discount, taxable, lineVat, lineTotal]
    : [qty, unitPrice, gross, lineVat, lineTotal];
  for (let i = 0; i < nums.length; i++) {
    const col = cols[ci + i];
    const val = i === 0 ? String(nums[i]) : fmtMoney(nums[i]);
    pdf.text(val, col.right - 2, vCenter, { align: 'right' });
  }

  // Grid
  dc(pdf, CELL_BORDER);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, CONTENT_W, rowH);
  for (let i = 1; i < cols.length; i++) {
    pdf.line(cols[i].x, y, cols[i].x, y + rowH);
  }
  return y + rowH;
}

// ═══════════════════════════════════════════════════════════
// DRAW: TABLE TOTAL ROW
// ═══════════════════════════════════════════════════════════
function drawTableTotal(pdf, cols, y, totals, invoiceType) {
  const h = 7;
  fc(pdf, LBH);
  pdf.rect(CONTENT_X, y, CONTENT_W, h, 'F');

  // Top border (thicker dark blue)
  dc(pdf, DARK_BLUE);
  pdf.setLineWidth(0.5);
  pdf.line(CONTENT_X, y, CONTENT_RIGHT, y);

  // Determine value columns count based on invoice type
  const isStandard = invoiceType === 'standard';
  const valCount = isStandard ? 5 : 3;
  const vals = isStandard
    ? [totals.subtotal, totals.discount, totals.taxable, totals.vat, totals.total]
    : [totals.subtotal, totals.vat, totals.total];
  const valCols = cols.slice(-valCount);

  // Label "AED" spanning first columns
  const labelEndIdx = cols.length - valCount;
  const labelRight = cols[labelEndIdx - 1].right;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  tc(pdf, BLACK);
  pdf.text('AED', labelRight - 2, y + h / 2 + 1, { align: 'right' });

  // Values in last columns
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7);
  for (let i = 0; i < valCount; i++) {
    tc(pdf, i === valCount - 1 ? MAROON : BLACK);
    pdf.text(fmtMoney(vals[i]), valCols[i].right - 2, y + h / 2 + 1, { align: 'right' });
  }

  // Grid
  dc(pdf, CELL_BORDER);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, CONTENT_W, h);
  for (let i = 1; i < cols.length; i++) {
    pdf.line(cols[i].x, y, cols[i].x, y + h);
  }
  return y + h;
}

// ═══════════════════════════════════════════════════════════
// DRAW: FULL TABLE (with pagination)
// ═══════════════════════════════════════════════════════════
function drawTable(pdf, invoice, s, startY, invoiceType) {
  const cols = colPositions(
    invoiceType === 'trip' ? COLS_TRIP
    : invoiceType === 'standard' ? COLS_STANDARD
    : COLS_MONTHLY
  );
  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const items = invoice.line_items || [];
  const contentBottom = PAGE_H - MARGIN;

  let y = drawTableHeader(pdf, cols, startY);

  if (items.length === 0) {
    // Empty row
    fc(pdf, WHITE);
    pdf.rect(CONTENT_X, y, CONTENT_W, 7, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    tc(pdf, GRAY);
    pdf.text('No items', CONTENT_X + 2, y + 4.5);
    dc(pdf, CELL_BORDER);
    pdf.setLineWidth(0.3);
    pdf.rect(CONTENT_X, y, CONTENT_W, 7);
    y += 7;
  } else {
    for (let idx = 0; idx < items.length; idx++) {
      // Estimate row height for fit check
      const descCol = cols.find(c => c.label.startsWith('DESCRIPTION'));
      const descLines = pdf.splitTextToSize(normalizeRoute(items[idx].description ?? ''), descCol.w - 4);
      const estH = Math.max(7, descLines.length * 2.8 + 3);

      if (y + estH > contentBottom) {
        pdf.addPage();
        drawPageBorder(pdf);
        y = drawLetterhead(pdf, s, MARGIN);
        y = drawTableHeader(pdf, cols, y);
      }
      y = drawTableRow(pdf, items[idx], cols, y, idx, vatRate, invoiceType, invoice);
    }
  }

  // Totals — ALWAYS compute from line items so footer, line rows, and words match
  const subtotal = items.reduce((sum, i) => {
    const q = Number(i.quantity) || 0;
    const p = Number(i.unit_price) || 0;
    return sum + Number(i.amount ?? (q * p));
  }, 0);
  const totalDiscount = items.reduce((sum, i) => sum + (Number(i.discount) || 0), 0);
  const taxable = subtotal - totalDiscount;
  const vat = taxable * vatRate / 100;
  const total = taxable + vat;

  if (y + 7 > contentBottom) {
    pdf.addPage();
    drawPageBorder(pdf);
    y = drawLetterhead(pdf, s, MARGIN);
    y = drawTableHeader(pdf, cols, y);
  }
  y = drawTableTotal(pdf, cols, y, { subtotal, discount: totalDiscount, taxable, vat, total }, invoiceType);

  return { y, total };
}

// ═══════════════════════════════════════════════════════════
// DRAW: AMOUNT IN WORDS
// ═══════════════════════════════════════════════════════════
function drawAmountInWords(pdf, total, y) {
  const h = 8;
  fc(pdf, BG_GRAY);
  pdf.rect(CONTENT_X, y, CONTENT_W, h, 'F');
  dc(pdf, BORDER_GRAY);
  pdf.setLineWidth(0.3);
  pdf.line(CONTENT_X, y, CONTENT_RIGHT, y);
  pdf.line(CONTENT_X, y + h, CONTENT_RIGHT, y + h);

  const words = numberToWords(total).toUpperCase();
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6.5);
  tc(pdf, MAROON);
  pdf.text('AED', CONTENT_X + 3, y + h / 2 + 1);
  tc(pdf, BLACK);
  pdf.text(words, CONTENT_X + 12, y + h / 2 + 1);
  return y + h;
}

// ═══════════════════════════════════════════════════════════
// DRAW: SIGNATURE BLOCK
// ═══════════════════════════════════════════════════════════
function drawSignatureBlock(pdf, x, y, w, label, caption, mobile) {
  const labelLines = label.split('\n');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(6);
  tc(pdf, MAROON);
  let ly = y + 4;
  for (const line of labelLines) {
    pdf.text(line.toUpperCase(), x + w / 2, ly, { align: 'center' });
    ly += 2.8;
  }

  // 9mm signature space then line
  const sigY = ly + 9;
  dc(pdf, GRAY);
  pdf.setLineWidth(0.3);
  pdf.line(x, sigY, x + w, sigY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  tc(pdf, GRAY);
  pdf.text(caption.toUpperCase(), x + w / 2, sigY + 3, { align: 'center' });
  if (mobile) {
    pdf.text(`Mobile: ${mobile}`, x + w / 2, sigY + 6, { align: 'center' });
  }
}

// ═══════════════════════════════════════════════════════════
// DRAW: BANK DETAILS + DUAL SIGNATURES
// ═══════════════════════════════════════════════════════════
function drawBankAndSignatures(pdf, invoice, clientName, s, y) {
  const hasBank = s.bank_name || s.bank_account_title || s.bank_account_no || s.bank_iban || s.bank_branch;

  // ── LEFT: Bank details ──
  if (hasBank) {
    const lx = CONTENT_X + 2;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    tc(pdf, MAROON);
    pdf.text('BANK DETAILS', lx, y + 4);
    dc(pdf, MAROON);
    pdf.setLineWidth(0.3);
    pdf.line(lx, y + 5, lx + 22, y + 5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    tc(pdf, BLACK);
    let ly = y + 9;
    if (s.bank_name)           { pdf.text(`Bank: ${str(s.bank_name)}`, lx, ly); ly += 3.5; }
    if (s.bank_account_title || s.company_name) { pdf.text(`Account Title: ${str(s.bank_account_title || s.company_name)}`, lx, ly); ly += 3.5; }
    if (s.bank_account_no)     { pdf.text(`Account No: ${str(s.bank_account_no)}`, lx, ly); ly += 3.5; }
    if (s.bank_iban)           { pdf.text(`IBAN #: ${str(s.bank_iban)}`, lx, ly); ly += 3.5; }
    if (s.bank_branch)         { pdf.text(`Branch: ${str(s.bank_branch)}`, lx, ly); ly += 3.5; }
  }

  // ── RIGHT: Dual signatures ──
  const sigX = PAGE_W / 2;
  const sigW = CONTENT_RIGHT - sigX;
  const gap = 10;
  const eachW = (sigW - gap) / 2;

  drawSignatureBlock(pdf, sigX, y, eachW, 'FOR\nBRONZE WINGS\nGENERAL TRANSPORT L.L.C', 'Authorized Signature & Stamp', null);
  drawSignatureBlock(pdf, sigX + eachW + gap, y, eachW, `FOR\n${str(clientName || invoice.client_name || '')}`, 'Receiver Sign & Stamp', str(s.phone1) || '050-8655601');

  return y + 32;
}

// ═══════════════════════════════════════════════════════════
// DRAW: FOOTER BANNERS (anchored to bottom of last page)
// ═══════════════════════════════════════════════════════════
function drawFooterBanners(pdf) {
  const bw = PAGE_W - 2 * BORDER_POS;

  // Banner 3 (bottom) — DARK_MAROON, 5.5pt
  const b3h = 5;
  const b3y = FOOTER_BOTTOM - b3h;
  fc(pdf, DARK_MAROON);
  pdf.rect(BORDER_POS, b3y, bw, b3h, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(5.5);
  tc(pdf, WHITE);
  pdf.text('GENERAL TRANSPORT · HEAVY EQUIPMENT RENTAL · LOGISTICS · COLD CHAIN SOLUTIONS', PAGE_W / 2, b3y + 3.5, { align: 'center' });

  // Banner 2 — MAROON, 8pt bold
  const b2h = 5;
  const b2y = b3y - b2h;
  fc(pdf, MAROON);
  pdf.rect(BORDER_POS, b2y, bw, b2h, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  tc(pdf, WHITE);
  pdf.text('THANKS FOR DOING BUSINESS WITH US!', PAGE_W / 2, b2y + 3.5, { align: 'center' });

  // Banner 1 — MAROON, 6pt
  const b1h = 4;
  const b1y = b2y - b1h;
  fc(pdf, MAROON);
  pdf.rect(BORDER_POS, b1y, bw, b1h, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  tc(pdf, WHITE);
  pdf.text('WE PROVIDE ALL KINDS OF GENERAL AND REFRIGERATED TRANSPORTATION SERVICES', PAGE_W / 2, b1y + 3, { align: 'center' });
}

// ═══════════════════════════════════════════════════════════
// MAIN: RENDER INVOICE PDF
// ═══════════════════════════════════════════════════════════
export async function renderInvoicePDF(invoice, clientName, settings, invoiceType = 'monthly', seqNo) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // Fetch logo as data URL for embedding
  let logoDataUrl = null;
  if (settings.logo_url) {
    try { logoDataUrl = await fetchLogoDataUrl(settings.logo_url); } catch (e) { /* fallback to default logo */ }
  }
  const s = { ...settings, logo_url: logoDataUrl || settings.logo_url };

  // Invoice number — YYYY-0001 format
  const year = new Date().getFullYear();
  const refNumber = invoice.invoice_number
    || (seqNo ? formatInvoiceNumber(year, seqNo) : `${year}-0001`);
  const invoiceDate = fmtDate(invoice.issue_date);

  // ══ PAGE 1 ══
  drawPageBorder(pdf);
  let y = MARGIN;
  y = drawLetterhead(pdf, s, y);
  y = drawTaxBanner(pdf, y, refNumber, invoiceDate);
  y = drawBillingSection(pdf, invoice, clientName, y, invoiceType, refNumber, invoiceDate);

  // ══ TABLE (with pagination) ══
  const { y: tableY, total } = drawTable(pdf, invoice, s, y, invoiceType);
  y = tableY;

  // ══ AMOUNT WORDS + SIGNATURES (page-break-inside: avoid) ══
  const blockH = 8 + 3 + 32; // amount words + gap + bank/signatures
  if (y + blockH > FOOTER_TOP - 2) {
    pdf.addPage();
    drawPageBorder(pdf);
    y = drawLetterhead(pdf, s, MARGIN);
  }

  y = drawAmountInWords(pdf, total, y);
  y += 3; // gap before signatures
  drawBankAndSignatures(pdf, invoice, clientName, s, y);

  // ══ FOOTER BANNERS (bottom of last page, never floating) ══
  drawFooterBanners(pdf);

  // Save
  pdf.save(`invoice-${invoice.invoice_number || invoice.id}.pdf`);
}