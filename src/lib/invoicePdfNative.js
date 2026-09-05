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
import { hasArabicText, renderCellToImage } from './pdfArabicRenderer';

// Build indicator line from line item's show_* flags + values
// Returns "D:waheed  V:1/89125  DN#:154215" or empty string
function buildIndicatorLine(item) {
  const parts = [];
  if (item.show_driver !== false && item.driver_name) parts.push(`D:${item.driver_name}`);
  if (item.show_vehicle !== false && item.vehicle_no) parts.push(`V:${item.vehicle_no}`);
  if (item.show_delivery_note !== false && item.delivery_note_no) parts.push(`DN#:${item.delivery_note_no}`);
  return parts.length > 0 ? parts.join('  ') : '';
}

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

// Reserved signature zone — table rows NEVER go below SIGNATURE_ZONE_TOP on any page.
// The bottom block (totals + terms + bank + signatures) is drawn in this zone on the
// last page only. On non-last pages the zone stays empty — rows never spill into it.
const SIGNATURE_ZONE_TOP = 198;   // rows stop here on every page
const FOOTER_RESERVED_TOP = 280;  // hard-blocked footer zone — nothing draws below this
const BOTTOM_BLOCK_HEIGHT = 82;  // totals + terms + bank + signatures (with 3-line name wrap)

// ═══════════════════════════════════════════════════════════
// COLORS (RGB)
// ═══════════════════════════════════════════════════════════
const MAROON = [139, 58, 46];
const DARK_BLUE = [107, 42, 32];
const LBH = [245, 230, 211];
const BRONZE = [196, 163, 90];
const GOLD = [158, 129, 58]; // #9e813a — per-trip invoice accent
const BLACK = [0, 0, 0];
const GRAY = [102, 102, 102];
const LIGHT_GRAY = [221, 221, 221];
const BG_GRAY = [248, 248, 248];
const BORDER_GRAY = [224, 224, 224];
const DARK_MAROON = [107, 42, 32];
const WHITE = [255, 255, 255];
const ROW_ALT = [250, 251, 252];
const CELL_BORDER = [187, 187, 187];

// ═══════════════════════════════════════════════════════════
// COLUMN DEFINITIONS
// ═══════════════════════════════════════════════════════════
const COLS_MONTHLY = [
  { label: 'SL.\nNo',        w: 8,  align: 'center' },
  { label: 'MONTH',          w: 18, align: 'center' },
  { label: 'DESCRIPTION',    w: 72, align: 'center' },
  { label: 'QTY',            w: 10, align: 'center' },
  { label: 'UNIT\nPRICE',    w: 18, align: 'center' },
  { label: 'AMOUNT',         w: 18, align: 'center' },
  { label: 'VAT\n5%',        w: 18, align: 'center' },
  { label: 'TOTAL',          w: 22, align: 'center' },
];

const COLS_TRIP = [
  { label: 'SL.\nNo',        w: 7,  align: 'center' },
  { label: 'TRIP\nDATE',     w: 16, align: 'center' },
  { label: 'DESCRIPTION',    w: 93, align: 'center' },
  { label: 'QTY',            w: 8,  align: 'center' },
  { label: 'UNIT\nPRICE',    w: 17, align: 'center' },
  { label: 'AMOUNT',         w: 17, align: 'center' },
  { label: 'VAT\n5%',        w: 17, align: 'center' },
  { label: 'TOTAL',          w: 9,  align: 'center' },
];

const COLS_STANDARD = [
  { label: 'SL.\nNo',        w: 8,  align: 'center' },
  { label: 'TRIP\nDATE',     w: 18, align: 'center' },
  { label: 'DESCRIPTION',    w: 80, align: 'center' },
  { label: 'QTY',            w: 8,  align: 'center' },
  { label: 'UNIT\nPRICE',    w: 18, align: 'center' },
  { label: 'AMOUNT',         w: 18, align: 'center' },
  { label: 'VAT\n5%',        w: 18, align: 'center' },
  { label: 'TOTAL',          w: 16, align: 'center' },
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
  return `${months[d.getMonth()]}`;
}

function getMonthYearFull(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function str(v) { return String(v ?? ''); }

function normalizeRoute(s) {
  let v = str(s);
  // Preserve Arabic text as-is — the Latin-only normalization regexes below would
  // strip Arabic characters (they fall outside [a-zA-Z0-9]) and mangle the route.
  if (hasArabicText(v)) {
    return v.replace(/\s+/g, ' ').trim();
  }
  // Extract and preserve parenthetical content (e.g., driver, vehicle info)
  const parenMatch = v.match(/\([^)]*\)/);
  const parenContent = parenMatch ? parenMatch[0].replace(/\s+/g, ' ').trim() : '';
  if (parenContent) {
    v = v.replace(/\s*\([^)]*\)\s*/, ' ').trim();
  }
  // Collapse spaced-out "To" (e.g., "T o") into "To"
  v = v.replace(/\b[Tt]\s+[Oo]\b/g, 'To');
  // Split on "To" (as a word) or any sequence of non-alphanumeric, non-space characters
  const parts = v.split(/\b[Tt]o\b|[^a-zA-Z0-9\s]+/);
  let result;
  if (parts.length <= 1) {
    result = v.replace(/\s+/g, ' ').trim();
  } else {
    const words = parts
      .map(p => p.replace(/\s+/g, ' ').trim())
      .filter(p => p.length > 0);
    result = words.join(' To ');
  }
  return parenContent ? `${result} ${parenContent}` : result;
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

// Hex (#rrggbb) → [r, g, b]
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const m = hex.replace('#', '').match(/^([0-9a-fA-F]{6})$/);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Extract invoice appearance settings with defaults
function getInvStyle(s) {
  const headerBg = hexToRgb(s.inv_header_bg) || [240, 240, 240];
  const headerText = hexToRgb(s.inv_header_text) || [0, 0, 0];
  const rowText = hexToRgb(s.inv_row_text) || [0, 0, 0];
  const rowAltBg = hexToRgb(s.inv_row_alt_bg) || [250, 251, 252];
  const logoUrl = s.inv_logo_source === 'custom' ? (s.inv_logo_url || s.logo_url) : s.logo_url;
  return {
    headerBg,
    headerText,
    rowText,
    rowAltBg,
    descAlign: s.inv_desc_align || 'left',
    numAlign: s.inv_num_align || 'center',
    logoUrl,
    logoSize: s.inv_logo_size || 16,
  };
}

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
// DRAW: ARABIC TEXT (rendered via canvas for Unicode support)
// ═══════════════════════════════════════════════════════════
function drawArabicText(pdf, text, x, y, fontSizeMm, color) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpi = 3;
    const fontPx = fontSizeMm * 3.78 * dpi;
    ctx.font = `bold ${fontPx}px 'Arial', 'Segoe UI', sans-serif`;
    const metrics = ctx.measureText(text);
    canvas.width = Math.ceil(metrics.width) + 4;
    canvas.height = Math.ceil(fontPx * 1.4);
    ctx.font = `bold ${fontPx}px 'Arial', 'Segoe UI', sans-serif`;
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.textBaseline = 'top';
    ctx.fillText(text, 2, 0);
    const dataUrl = canvas.toDataURL('image/png');
    const imgW = canvas.width / (3.78 * dpi);
    const imgH = canvas.height / (3.78 * dpi);
    pdf.addImage(dataUrl, 'PNG', x, y, imgW, imgH);
  } catch (e) { /* skip if canvas unavailable */ }
}

// Right-aligned variant for RTL Arabic text — places image so its right edge is at rightX
function drawArabicTextRight(pdf, text, rightX, y, fontSizeMm, color) {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpi = 3;
    const fontPx = fontSizeMm * 3.78 * dpi;
    ctx.font = `bold ${fontPx}px 'Arial', 'Segoe UI', sans-serif`;
    const metrics = ctx.measureText(text);
    canvas.width = Math.ceil(metrics.width) + 4;
    canvas.height = Math.ceil(fontPx * 1.4);
    ctx.font = `bold ${fontPx}px 'Arial', 'Segoe UI', sans-serif`;
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    ctx.fillText(text, canvas.width - 2, 0);
    const dataUrl = canvas.toDataURL('image/png');
    const imgW = canvas.width / (3.78 * dpi);
    const imgH = canvas.height / (3.78 * dpi);
    pdf.addImage(dataUrl, 'PNG', rightX - imgW, y, imgW, imgH);
  } catch (e) { /* skip if canvas unavailable */ }
}

// ═══════════════════════════════════════════════════════════
// DRAW: LETTERHEAD (all pages)
// ═══════════════════════════════════════════════════════════
function drawLetterhead(pdf, s, y) {
  const BROWN = [99, 60, 26];    // #633C1A
  const CREAM = [253, 251, 240]; // #FDFBF0
  const boxH = 28;

  // Match footer positioning — inset 2mm from border on all sides
  const hdrX = BORDER_POS + 2;
  const hdrW = PAGE_W - 2 * (BORDER_POS + 2);

  // Bordered box with cream background
  fc(pdf, CREAM);
  pdf.rect(hdrX, y, hdrW, boxH, 'F');
  dc(pdf, BROWN);
  pdf.setLineWidth(0.6);
  pdf.rect(hdrX, y, hdrW, boxH);

  // Logo — left, vertically centered (bigger: 22mm cap, stays within 28mm header box)
  const invStyle = getInvStyle(s);
  const logoSize = Math.min(invStyle.logoSize, 22);
  const logoX = hdrX + 4;
  const logoY = y + (boxH - logoSize) / 2;
  if (invStyle.logoUrl) {
    try {
      pdf.addImage(invStyle.logoUrl, getImgFormat(invStyle.logoUrl), logoX, logoY, logoSize, logoSize);
    } catch (e) {
      drawDefaultLogo(pdf, logoX, logoY, logoSize);
    }
  } else {
    drawDefaultLogo(pdf, logoX, logoY, logoSize);
  }

  // Company text — vertically centered, total height matches logo
  const textX = logoX + logoSize + 4;
  const textTop = logoY;  // top of text block = top of logo (both centered)
  tc(pdf, BROWN);

  // Arabic name — top of block (bigger: 6mm)
  drawArabicText(pdf, 'الاجنحه البرونزية للنقليات العامة - ذ.م.م', textX, textTop, 6, BROWN);

  // Company name — clear gap below Arabic, no overlap (bigger: 22pt)
  pdf.setFont('times', 'bold');
  pdf.setFontSize(22);
  pdf.text('BRONZE WINGS', textX, textTop + 13, { charSpace: 0.5 });

  // Subtitle — spaced below company name (bigger: 11pt)
  pdf.setFont('times', 'bold');
  pdf.setFontSize(11);
  pdf.text('GENERAL TRANSPORT - L.L.C', textX, textTop + 18, { charSpace: 0.3 });

  // Right contact column — right-aligned, vertically centered
  const rightX = hdrX + hdrW - 4;
  let cy = y + 5;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(8.5);
  tc(pdf, BROWN);
  if (s.phone1) { pdf.text(`Mob: ${str(s.phone1)}`, rightX, cy, { align: 'right' }); cy += 3; }
  if (s.phone2) { pdf.text(`Mob: ${str(s.phone2)}`, rightX, cy, { align: 'right' }); cy += 3; }
  if (s.email) { pdf.text(str(s.email), rightX, cy, { align: 'right' }); cy += 3; }
  if (s.address) {
    const addrLines = pdf.splitTextToSize(str(s.address), 44);
    for (const line of addrLines) { pdf.text(line, rightX, cy, { align: 'right' }); cy += 3; }
  }
  if (s.website) { pdf.text(str(s.website), rightX, cy, { align: 'right' }); }

  return y + boxH + 0.5;
}

// ═══════════════════════════════════════════════════════════
// DRAW: TAX INVOICE BANNER (first page only)
// ═══════════════════════════════════════════════════════════
function drawTaxBanner(pdf, y, refNumber, invoiceDate, trn) {
  const h = 5;

  pdf.setFont('times', 'bold');
  pdf.setFontSize(11);
  tc(pdf, DARK_BLUE);
  pdf.text('TAX INVOICE', PAGE_W / 2, y + 3.5, { align: 'center' });

  // TRN — right side of the tax invoice bar
  if (trn) {
    pdf.setFont('times', 'bold');
    pdf.setFontSize(7.5);
    tc(pdf, DARK_BLUE);
    pdf.text(`Bronze TRN: ${str(trn)}`, CONTENT_RIGHT - 2, y + 3.5, { align: 'right' });
  }

  return y + h + 0.5;
}

// ═══════════════════════════════════════════════════════════
// DRAW: BILLING SECTION (first page only)
// ═══════════════════════════════════════════════════════════
function drawBillingSection(pdf, invoice, clientName, y, invoiceType, refNumber, invoiceDate, fieldConfig, blockStyle) {
  const leftX = CONTENT_X + 3;
  const rightX = CONTENT_RIGHT - 3;
  const maxTextWidth = CONTENT_W * 0.62;
  const baseFont = blockStyle?.fontFamily || 'times';
  const baseSize = blockStyle?.fontSize || 8.5;
  const baseColor = (blockStyle?.color && hexToRgb(blockStyle.color)) || BLACK;

  // Per-field style helper
  const fld = (key, defWeight) => {
    const f = (fieldConfig || {})[key] || {};
    return {
      visible: f.visible !== false,
      weight: f.fontWeight || defWeight || 'normal',
      sizeMul: f.fontSize || 1,
      color: f.color ? (hexToRgb(f.color) || baseColor) : baseColor,
    };
  };

  // Build left-side lines with per-field config
  const rawLines = [];
  const cn = fld('clientName', 'bold');
  if (cn.visible && (clientName || invoice.client_name)) rawLines.push({ text: str(clientName || invoice.client_name || '—'), style: cn });
  const cp = fld('contactPerson', 'normal');
  if (cp.visible && invoice.contact_person) rawLines.push({ text: `ATT: ${str(invoice.contact_person)}`, style: cp });
  const ad = fld('address', 'normal');
  if (ad.visible && invoice.client_address) rawLines.push({ text: `ADDRESS: ${str(invoice.client_address)}`, style: ad });
  const tr = fld('trn', 'normal');
  if (tr.visible && invoice.client_trn) rawLines.push({ text: `TRN: ${str(invoice.client_trn)}`, style: tr });
  const su = fld('sub', 'normal');
  if (su.visible && invoice.sub) rawLines.push({ text: `SUB: ${str(invoice.sub)}`, style: su });
  const rg = fld('regNo', 'normal');
  if (rg.visible && invoice.reg_no) rawLines.push({ text: `REG NO: ${str(invoice.reg_no)}`, style: rg });

  const lineH = 3.2 * (blockStyle?.lineHeight || 1);
  const wrapped = [];
  let totalLines = 0;
  for (const line of rawLines) {
    const sz = baseSize * line.style.sizeMul;
    pdf.setFont(baseFont, line.style.weight);
    pdf.setFontSize(sz);
    tc(pdf, line.style.color);
    if (hasArabicText(line.text)) {
      const rendered = renderCellToImage(line.text, sz, maxTextWidth, lineH, line.style.color);
      wrapped.push({ imgData: rendered, style: line.style });
      totalLines += rendered.linesCount;
    } else {
      const parts = pdf.splitTextToSize(line.text, maxTextWidth);
      wrapped.push({ parts, style: line.style });
      totalLines += parts.length;
    }
  }

  // Dynamic height: label area + all wrapped lines + padding
  // labelArea must clear the "BILL TO" underline (y+4.5) + gap + first line height
  const labelArea = Math.max(9, 4.5 + lineH + 1.5);
  const h = Math.max(17, labelArea + totalLines * lineH + 2);

  // Draw box border
  dc(pdf, LIGHT_GRAY);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, CONTENT_W, h);

  // ── LEFT: BILL TO ──
  pdf.setFont(baseFont, 'bold');
  pdf.setFontSize(8.5);
  tc(pdf, MAROON);
  pdf.text('BILL TO', leftX, y + 3.5);
  dc(pdf, MAROON);
  pdf.setLineWidth(0.3);
  pdf.line(leftX, y + 4.5, leftX + 15, y + 4.5);

  // Render each wrapped line with per-field style
  let ly = y + labelArea;
  for (const line of wrapped) {
    const sz = baseSize * line.style.sizeMul;
    pdf.setFont(baseFont, line.style.weight);
    pdf.setFontSize(sz);
    tc(pdf, line.style.color);
    if (line.imgData) {
      const imgW = maxTextWidth;
      const imgH = line.imgData.linesCount * lineH;
      pdf.addImage(line.imgData.dataUrl, 'PNG', leftX, ly - lineH * 0.75, imgW, imgH);
      ly += line.imgData.linesCount * lineH;
    } else {
      for (const part of line.parts) {
        pdf.text(part, leftX, ly);
        ly += lineH;
      }
    }
  }

  // ── RIGHT: INVOICE #, DATE, LPO Ref (per-field config) ──
  const rightFields = [
    { key: 'invoiceNo',   label: 'INVOICE #:',    value: refNumber },
    { key: 'invoiceDate', label: 'INVOICE DATE:', value: invoiceDate },
    { key: 'lpoRef',      label: 'LPO Ref #:',    value: str(invoice.lpo_ref || '—') },
  ].filter(r => fld(r.key, 'normal').visible);

  if (rightFields.length > 0) {
    // Measure widest label at base size to align colons
    pdf.setFont(baseFont, 'normal');
    pdf.setFontSize(baseSize);
    const widestLabelW = Math.max(...rightFields.map(r => pdf.getTextWidth(r.label)));
    const colonX = rightX - widestLabelW - 1;
    const valueX = colonX + 1.5;
    let ry = y + 4;
    for (const r of rightFields) {
      const st = fld(r.key, 'normal');
      const sz = baseSize * st.sizeMul;
      pdf.setFont(baseFont, st.weight);
      pdf.setFontSize(sz);
      tc(pdf, st.color);
      pdf.text(r.label, colonX, ry, { align: 'right' });
      pdf.text(r.value, valueX, ry, { align: 'left' });
      ry += 3.5;
    }
  }

  return y + h + 1;
}

// ═══════════════════════════════════════════════════════════
// DRAW: TABLE HEADER ROW
// ═══════════════════════════════════════════════════════════
// Clip a single-line value to a column's inner width so it can never overlap
// the next column. Shrinks font size down to minSize; if still too wide,
// truncates with an ellipsis. Returns the font size actually used.
function clipCellText(pdf, value, innerW, minSize) {
  let text = String(value ?? '');
  let size = pdf.getFontSize();
  // Shrink font until it fits (down to minSize)
  while (size > minSize && pdf.getTextWidth(text) > innerW) {
    size -= 0.5;
    pdf.setFontSize(size);
  }
  // If still too wide at min size, truncate with ellipsis
  if (pdf.getTextWidth(text) > innerW) {
    const ell = '…';
    while (text.length > 1 && pdf.getTextWidth(text + ell) > innerW) {
      text = text.slice(0, -1);
    }
    text += ell;
  }
  return { text, size };
}

function drawTableHeader(pdf, cols, y, invoiceType, invStyle) {
  const h = 8;
  const isTrip = invoiceType === 'trip';
  const style = invStyle || getInvStyle({});

  pdf.setFont('times', 'bold');
  fc(pdf, style.headerBg);
  pdf.rect(CONTENT_X, y, CONTENT_W, h, 'F');
  tc(pdf, style.headerText);
  pdf.setFontSize(7.5);

  for (const col of cols) {
    const align = col.colAlign || col.align || 'center';
    const lines = col.label.split('\n');
    const lineH = 3;
    const startY = y + (h - lines.length * lineH) / 2 + lineH;
    const textX = align === 'right' ? col.right - 2
                : align === 'center' ? col.center : col.x + 2;
    const pdfAlign = align === 'right' ? 'right' : align === 'center' ? 'center' : 'left';
    // Clip each header line to column inner width (no overlap into neighbor)
    const innerW = col.w - 4;
    for (let i = 0; i < lines.length; i++) {
      const { text } = clipCellText(pdf, lines[i], innerW, 6);
      pdf.text(text, textX, startY + i * lineH, { align: pdfAlign });
    }
  }

  // Grid
  dc(pdf, BLACK);
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
function drawTableRow(pdf, item, cols, y, idx, vatRate, invoiceType, invoice, invStyle) {
  const style = invStyle || getInvStyle({});
  const descCol = cols.find(c => c.label.startsWith('DESCRIPTION'));
  const _indicatorLine = buildIndicatorLine(item);
  const descText = _indicatorLine ? `${normalizeRoute(item.description ?? '')}\n${_indicatorLine}` : normalizeRoute(item.description ?? '');
  const fSize = invoiceType === 'monthly' ? 8 : 7.5;
  const descColW = descCol.w - 4;
  const lineH = 2.8;
  const minH = 6.5;

  const descIsArabic = hasArabicText(descText);
  let descLineCount;
  let descImgData = null;
  let descLines = null;
  if (descIsArabic) {
    descImgData = renderCellToImage(descText, fSize, descColW, lineH, style.rowText);
    descLineCount = descImgData.linesCount;
  } else {
    descLines = pdf.splitTextToSize(descText, descColW);
    descLineCount = descLines.length;
  }
  const rowH = Math.max(minH, descLineCount * lineH + 3);

  // Background
  fc(pdf, idx % 2 === 0 ? WHITE : style.rowAltBg);
  pdf.rect(CONTENT_X, y, CONTENT_W, rowH, 'F');

  const qty = Number(item.quantity) || 0;
  const unitPrice = Number(item.unit_price) || 0;
  const gross = Number(item.amount ?? (qty * unitPrice));
  const discount = Number(item.discount) || 0;
  const taxable = gross - discount;
  const lineVat = item.vat_excluded ? 0 : taxable * (vatRate / 100);
  const lineTotal = taxable + lineVat;

  const vCenter = y + rowH / 2 + 1;

  pdf.setFontSize(fSize);
  tc(pdf, style.rowText);

  // Helper: draw a single-line cell with per-column align/weight, clipped to width
  const drawCell = (col, value, defaultAlign, defaultWeight, defaultFont) => {
    const align = col.colAlign || defaultAlign || 'center';
    const weight = col.colWeight || defaultWeight || 'normal';
    const font = defaultFont || 'times';
    const sizeMul = col.colSizeMul || 1;
    pdf.setFont(font, weight);
    pdf.setFontSize(fSize * sizeMul);
    const innerW = col.w - 4;
    const { text } = clipCellText(pdf, value, innerW, 6);
    const textX = align === 'right' ? col.right - 2
                : align === 'center' ? col.center : col.x + 2;
    const pdfAlign = align === 'right' ? 'right' : align === 'center' ? 'center' : 'left';
    pdf.text(text, textX, vCenter, { align: pdfAlign });
  };

  // # column
  drawCell(cols[0], String(idx + 1), 'center', 'normal', 'times');

  let ci = 1;

  // TRIP DATE column (trip only)
  if (invoiceType === 'trip') {
    drawCell(cols[ci], fmtDate(item.date), 'center', 'normal', 'times');
    ci++;
  }

  // DATE column (monthly + standard)
  if (invoiceType === 'monthly' || invoiceType === 'standard') {
    const dateStr = invoiceType === 'monthly'
      ? getMonthYear(item.date || invoice.issue_date)
      : fmtDate(item.date || invoice.issue_date);
    drawCell(cols[ci], dateStr, 'center', 'bold', 'times');
    ci++;
  }

  // DESCRIPTION column (configurable alignment, wraps within column)
  const descAlign = descCol.colAlign || style.descAlign;
  pdf.setFont('times', descCol.colWeight || 'bold');
  pdf.setFontSize(fSize * (descCol.colSizeMul || 1));
  if (descImgData) {
    const imgW = descColW;
    const imgH = descLineCount * lineH;
    const imgY = y + (rowH - imgH) / 2;
    const imgX = descAlign === 'right' ? descCol.right - 2 - imgW
                : descAlign === 'center' ? descCol.center - imgW / 2
                : descCol.x + 2;
    pdf.addImage(descImgData.dataUrl, 'PNG', imgX, imgY, imgW, imgH);
  } else {
    const descStartY = y + (rowH - descLines.length * lineH) / 2 + lineH;
    const descTextX = descAlign === 'right' ? descCol.right - 2
                    : descAlign === 'center' ? descCol.center
                    : descCol.x + 2;
    const descPdfAlign = descAlign === 'right' ? 'right' : descAlign === 'center' ? 'center' : 'left';
    for (let i = 0; i < descLines.length; i++) {
      pdf.text(descLines[i], descTextX, descStartY + i * lineH, { align: descPdfAlign });
    }
  }
  ci++;

  // QTY column (standard only)
  if (invoiceType === 'standard') {
    drawCell(cols[ci], String(qty), 'center', 'normal', 'times');
    ci++;
  }

  // Numeric columns — courier monospace, per-column align/weight, clipped
  if (invoiceType === 'standard') {
    const stdNums = [unitPrice, gross, lineVat, lineTotal];
    for (let i = 0; i < stdNums.length; i++) {
      drawCell(cols[ci + i], fmtMoney(stdNums[i]), style.numAlign, 'bold', 'courier');
    }
  } else {
    const nums = [qty, unitPrice, gross, lineVat, lineTotal];
    for (let i = 0; i < nums.length; i++) {
      const col = cols[ci + i];
      const val = i === 0 ? String(nums[i]) : fmtMoney(nums[i]);
      drawCell(col, val, style.numAlign, 'bold', 'courier');
    }
  }

  // Grid
  dc(pdf, BLACK);
  pdf.setLineWidth(0.3);
  pdf.rect(CONTENT_X, y, CONTENT_W, rowH);
  for (let i = 1; i < cols.length; i++) {
    pdf.line(cols[i].x, y, cols[i].x, y + rowH);
  }
  return y + rowH;
}

// ═══════════════════════════════════════════════════════════
// DRAW: TABLE TOTALS — Column-based (Subtotal/VAT/Total stacked right)
// ═══════════════════════════════════════════════════════════
function drawTableTotal(pdf, cols, y, totals, invoiceType, invStyle) {
  const wordsBoxW = CONTENT_W - 70;  // left box for amount in words
  const colX = CONTENT_X + wordsBoxW;
  const rowH = 5;
  const totalRowH = 7;
  const boxH = rowH * 2 + totalRowH;  // subtotal + vat + total

  // ── Left: Amount in Words box (dashed border) ──
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

  // ── Right: Subtotal / VAT / Total column ──
  let ry = y;

  // Subtotal row
  dc(pdf, [224, 224, 224]);
  pdf.setLineWidth(0.2);
  pdf.line(colX, ry, CONTENT_RIGHT, ry);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, [51, 51, 51]);
  pdf.text('Subtotal:', colX + 2, ry + 3.5);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  tc(pdf, BLACK);
  pdf.text(`AED ${fmtMoney(totals.subtotal)}`, CONTENT_RIGHT - 2, ry + 3.5, { align: 'right' });
  ry += rowH;

  // VAT row
  dc(pdf, [224, 224, 224]);
  pdf.setLineWidth(0.2);
  pdf.line(colX, ry, CONTENT_RIGHT, ry);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(8);
  tc(pdf, [51, 51, 51]);
  pdf.text('VAT (5%):', colX + 2, ry + 3.5);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(8);
  tc(pdf, BLACK);
  pdf.text(`AED ${fmtMoney(totals.vat)}`, CONTENT_RIGHT - 2, ry + 3.5, { align: 'right' });
  ry += rowH;

  // Total row (double border top & bottom)
  dc(pdf, BLACK);
  pdf.setLineWidth(0.5);
  pdf.line(colX, ry, CONTENT_RIGHT, ry);
  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  tc(pdf, BLACK);
  pdf.text('Total Amount:', colX + 2, ry + 4.5);
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(9);
  pdf.text(`AED ${fmtMoney(totals.total)}`, CONTENT_RIGHT - 2, ry + 4.5, { align: 'right' });
  dc(pdf, BLACK);
  pdf.setLineWidth(0.5);
  pdf.line(colX, ry + totalRowH, CONTENT_RIGHT, ry + totalRowH);

  return y + boxH;
}

// ═══════════════════════════════════════════════════════════
// DRAW: FULL TABLE (with pagination)
// ═══════════════════════════════════════════════════════════
function drawTable(pdf, invoice, clientName, s, startY, invoiceType) {
  const cols = colPositions(
    invoiceType === 'trip' ? COLS_TRIP
    : invoiceType === 'standard' ? COLS_STANDARD
    : COLS_MONTHLY
  );
  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const items = invoice.line_items || [];
  // Compute header values for continuation pages
  const _year = new Date().getFullYear();
  const _refNumber = invoice.invoice_number || `${_year}-0001`;
  const _invoiceDate = fmtDate(invoice.issue_date);
  // Table rows stop at SIGNATURE_ZONE_TOP on every page — the reserved bottom zone
  // is never usable by rows. The bottom block is drawn in that zone on the last page only.
  const contentBottom = SIGNATURE_ZONE_TOP;

  let y = drawTableHeader(pdf, cols, startY, invoiceType);

  if (items.length === 0) {
    // Empty row
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
      // Estimate row height for fit check
      const descCol = cols.find(c => c.label.startsWith('DESCRIPTION'));
      const _indLine = buildIndicatorLine(items[idx]);
      const _descText = _indLine ? `${normalizeRoute(items[idx].description ?? '')}\n${_indLine}` : normalizeRoute(items[idx].description ?? '');
      const descLines = pdf.splitTextToSize(_descText, descCol.w - 4);
      const estH = Math.max(6.5, descLines.length * 2.8 + 3);

      const isLast = idx === items.length - 1;
      if (isLast) {
        // Safety check: last row + bottom block must fit above the footer reserved area.
        // If not, push this row to a new page so totals/signatures never get squeezed.
        if (y + estH + BOTTOM_BLOCK_HEIGHT > FOOTER_RESERVED_TOP) {
          pdf.addPage();
          drawPageBorder(pdf);
          y = drawLetterhead(pdf, s, BORDER_POS + 2);
          y = drawTaxBanner(pdf, y, _refNumber, _invoiceDate, s.trn);
          y = drawBillingSection(pdf, invoice, clientName, y, invoiceType, _refNumber, _invoiceDate);
          y = drawTableHeader(pdf, cols, y, invoiceType);
        }
      } else if (y + estH > contentBottom) {
        // Normal pagination: row doesn't fit above the reserved signature zone — new page.
        // Redraw Header + Bill To + table head on every continuation page.
        pdf.addPage();
        drawPageBorder(pdf);
        y = drawLetterhead(pdf, s, BORDER_POS + 2);
        y = drawTaxBanner(pdf, y, _refNumber, _invoiceDate, s.trn);
        y = drawBillingSection(pdf, invoice, clientName, y, invoiceType, _refNumber, _invoiceDate);
        y = drawTableHeader(pdf, cols, y, invoiceType);
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
  const taxableForVat = items.reduce((s, i) => {
    if (i.vat_excluded) return s;
    const q = Number(i.quantity) || 0;
    const p = Number(i.unit_price) || 0;
    const g = Number(i.amount ?? (q * p));
    return s + (g - (Number(i.discount) || 0));
  }, 0);
  const vat = taxableForVat * vatRate / 100;
  const total = subtotal - totalDiscount + vat;

  // Totals are NOT drawn here — they are drawn in the reserved bottom zone by the
  // caller (buildInvoicePdf) so they always sit at the bottom of the last page.
  return { y, totals: { subtotal, discount: totalDiscount, taxable, vat, total } };
}

// ═══════════════════════════════════════════════════════════
// DRAW: AMOUNT IN WORDS
// ═══════════════════════════════════════════════════════════
function drawAmountInWords(pdf, total, y, invoiceType) {
  const h = 11;
  const isTrip = invoiceType === 'trip';
  const accent = isTrip ? BLACK : BORDER_GRAY;
  dc(pdf, accent);
  pdf.setLineWidth(0.3);
  pdf.line(CONTENT_X, y, CONTENT_RIGHT, y);
  pdf.line(CONTENT_X, y + h, CONTENT_RIGHT, y + h);

  const words = numberToWords(total).toUpperCase();
  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  if (isTrip) {
    tc(pdf, BLACK);
    pdf.text('AED', CONTENT_X + 3, y + h / 2 + 1);
    tc(pdf, BLACK);
    pdf.text(words, CONTENT_X + 12, y + h / 2 + 1);
  } else {
    tc(pdf, MAROON);
    pdf.text('AED', CONTENT_X + 3, y + h / 2 + 1);
    tc(pdf, BLACK);
    pdf.text(words, CONTENT_X + 12, y + h / 2 + 1);
  }
  return y + h;
}

// ═══════════════════════════════════════════════════════════
// DRAW: SIGNATURE BLOCK
// ═══════════════════════════════════════════════════════════
function drawSignatureBlock(pdf, x, y, w, label, caption, mobile) {
  const labelLines = label.split('\n');
  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  tc(pdf, BLACK);
  let ly = y + 4;
  for (const line of labelLines) {
    const wrapped = pdf.splitTextToSize(line.toUpperCase(), w - 2);
    for (const wl of wrapped) {
      pdf.text(wl, x + w / 2, ly, { align: 'center' });
      ly += 3.5;
    }
  }

  // 12mm signature space then line
  const sigY = ly + 12;
  dc(pdf, GRAY);
  pdf.setLineWidth(0.3);
  pdf.line(x, sigY, x + w, sigY);

  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, GRAY);
  pdf.text(caption.toUpperCase(), x + w / 2, sigY + 3, { align: 'center' });
  if (mobile) {
    pdf.text(`Mobile: ${mobile}`, x + w / 2, sigY + 6, { align: 'center' });
  }
}

// ═══════════════════════════════════════════════════════════
// DRAW: BANK DETAILS + DUAL SIGNATURES
// ═══════════════════════════════════════════════════════════
function drawBankAndSignatures(pdf, invoice, clientName, s, y, invoiceType) {
  const hasBank = s.bank_name || s.bank_account_title || s.bank_account_no || s.bank_iban || s.bank_branch;
  const accent = MAROON;
  const isTrip = invoiceType === 'trip';

  // ── LEFT: Bank details ──
  if (hasBank) {
    const lx = CONTENT_X + 2;
    pdf.setFont('times', 'bold');
    pdf.setFontSize(9);
    tc(pdf, accent);
    pdf.text('BANK DETAILS', lx, y + 4);
    dc(pdf, accent);
    pdf.setLineWidth(0.3);
    pdf.line(lx, y + 5, lx + 22, y + 5);

    pdf.setFont('times', 'normal');
    pdf.setFontSize(10);
    tc(pdf, BLACK);
    let ly = y + 9;
    if (s.bank_name)           { pdf.text(`Bank: ${str(s.bank_name)}`, lx, ly); ly += 4; }
    if (s.bank_account_title || s.company_name) { pdf.text(`Account Title: ${str(s.bank_account_title || s.company_name)}`, lx, ly); ly += 4; }
    if (s.bank_account_no)     { pdf.text(`Account No: ${str(s.bank_account_no)}`, lx, ly); ly += 4; }
    if (s.bank_iban)           { pdf.text(`IBAN #: ${str(s.bank_iban)}`, lx, ly); ly += 4; }
    if (s.bank_branch)         { pdf.text(`Branch: ${str(s.bank_branch)}`, lx, ly); ly += 4; }
  }

  if (isTrip) {
    // ── TRIP: Full-width dual signatures (AUTHORIZED BY / RECEIVED BY) ──
    const sigW = CONTENT_W / 2;
    const leftX = CONTENT_X;
    const rightX = CONTENT_X + sigW;
    const sigTopGap = 18; // space above the line for signing
    const lineY = y + sigTopGap;

    // Left — AUTHORIZED BY
    pdf.setFont('times', 'bold');
    pdf.setFontSize(9);
    tc(pdf, [51, 51, 51]); // warm gold-grey
    pdf.text('AUTHORIZED BY', leftX + sigW / 2, y + 4, { align: 'center' });
    dc(pdf, [51, 51, 51]);
    pdf.setLineWidth(0.3);
    pdf.line(leftX + 10, lineY, leftX + sigW - 10, lineY);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    tc(pdf, GRAY);
    pdf.text('Authorized Signature', leftX + sigW / 2, lineY + 4, { align: 'center' });

    // Right — RECEIVED BY
    pdf.setFont('times', 'bold');
    pdf.setFontSize(9);
    tc(pdf, [51, 51, 51]);
    pdf.text('RECEIVED BY', rightX + sigW / 2, y + 4, { align: 'center' });
    dc(pdf, [51, 51, 51]);
    pdf.setLineWidth(0.3);
    pdf.line(rightX + 10, lineY, rightX + sigW - 10, lineY);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    tc(pdf, GRAY);
    pdf.text('Client Signature', rightX + sigW / 2, lineY + 4, { align: 'center' });

    return y + sigTopGap + 8;
  } else {
    // ── STANDARD / MONTHLY: Original right-side dual signatures ──
    const sigX = PAGE_W / 2;
    const sigW = CONTENT_RIGHT - sigX;
    const gap = 10;
    const eachW = (sigW - gap) / 2;

    drawSignatureBlock(pdf, sigX, y, eachW, 'FOR\nBRONZE WINGS\nGENERAL TRANSPORT L.L.C', 'Authorized Signature & Stamp', null);
    drawSignatureBlock(pdf, sigX + eachW + gap, y, eachW, `FOR\n${str(clientName || invoice.client_name || '')}`, 'Receiver Sign & Stamp', str(s.phone1) || '050-8655601');

    return y + 38;
  }
}

// ═══════════════════════════════════════════════════════════
// DRAW: TERMS & CONDITIONS
// ═══════════════════════════════════════════════════════════
function drawTermsConditions(pdf, invoiceType) {
  const bw = PAGE_W - 2 * BORDER_POS;
  const bannerH = 5;
  const bannerY = FOOTER_BOTTOM - bannerH;
  const y = bannerY - 12;

  // Header bar — grey (same as table head)
  fc(pdf, [240, 240, 240]);
  pdf.rect(BORDER_POS, y, bw, 5, 'F');
  pdf.setFont('times', 'bold');
  pdf.setFontSize(9);
  tc(pdf, BLACK);
  pdf.text('TERMS & CONDITIONS', BORDER_POS + 3, y + 3.5);

  // Content
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, [51, 51, 51]);
  pdf.text('Payment due within 60 days.', BORDER_POS + 3, y + 8);
}

// ═══════════════════════════════════════════════════════════
// DRAW: FOOTER BANNERS (anchored to bottom of last page)
// ═══════════════════════════════════════════════════════════
function drawFooterBanners(pdf) {
  // Separate bordered box — closer to the main margin border on both sides
  const fbX = BORDER_POS + 2;
  const fbW = PAGE_W - 2 * (BORDER_POS + 2);
  const bh = 7;
  const by = FOOTER_BOTTOM - 2 - bh;
  fc(pdf, [253, 251, 240]); // CREAM bg
  pdf.rect(fbX, by, fbW, bh, 'F');
  dc(pdf, [99, 60, 26]); // BROWN border
  pdf.setLineWidth(0.6);
  pdf.rect(fbX, by, fbW, bh);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, [0, 0, 0]); // black text
  pdf.text('We provide comprehensive general and refrigerated transportation services, along with heavy equipment rental solutions', PAGE_W / 2, by + 4.5, { align: 'center' });
}

// ═══════════════════════════════════════════════════════════
// DRAW: TERMS & CONDITIONS (INLINE — right below amount in words)
// ═══════════════════════════════════════════════════════════
function drawTermsInline(pdf, y, invoiceType) {
  const bw = CONTENT_W;
  const bannerH = 5;
  const accent = [240, 240, 240];

  fc(pdf, accent);
  pdf.rect(CONTENT_X, y, bw, bannerH, 'F');
  pdf.setFont('times', 'bold');
  pdf.setFontSize(8);
  tc(pdf, BLACK);
  pdf.text('TERMS & CONDITIONS', CONTENT_X + 3, y + 3.5);

  pdf.setFont('times', 'normal');
  pdf.setFontSize(8);
  tc(pdf, [51, 51, 51]);
  pdf.text('Payment due within 60 days.', CONTENT_X + 3, y + 7);

  return y + 9;
}

// ═══════════════════════════════════════════════════════════
// DRAW: BANK DETAILS BLOCK (standalone, full-width)
// ═══════════════════════════════════════════════════════════
function drawBankDetailsBlock(pdf, s, y, invoiceType, fieldConfig, blockStyle) {
  const hasBank = s.bank_name || s.bank_account_title || s.bank_account_no || s.bank_iban || s.bank_branch;
  const accent = MAROON;
  if (!hasBank) return 4;

  const baseFont = blockStyle?.fontFamily || 'times';
  const baseSize = blockStyle?.fontSize || 7.5;
  const baseColor = (blockStyle?.color && hexToRgb(blockStyle.color)) || BLACK;

  const fld = (key, defWeight) => {
    const f = (fieldConfig || {})[key] || {};
    return {
      visible: f.visible !== false,
      weight: f.fontWeight || defWeight || 'normal',
      sizeMul: f.fontSize || 1,
      color: f.color ? (hexToRgb(f.color) || baseColor) : baseColor,
    };
  };

  const lx = CONTENT_X + 2;
  const bl = fld('bankLabel', 'bold');
  if (bl.visible) {
    pdf.setFont(baseFont, bl.weight);
    pdf.setFontSize(baseSize * bl.sizeMul);
    tc(pdf, accent);
    pdf.text('BANK DETAILS', lx, y + 3);
    dc(pdf, accent);
    pdf.setLineWidth(0.3);
    pdf.line(lx, y + 4, lx + 22, y + 4);
  }

  let ly = y + 7;
  const bankLines = [
    { key: 'bankName',        text: s.bank_name ? `Bank: ${str(s.bank_name)}` : null },
    { key: 'bankAccountTitle',text: (s.bank_account_title || s.company_name) ? `Account Title: ${str(s.bank_account_title || s.company_name)}` : null },
    { key: 'bankAccountNo',   text: s.bank_account_no ? `Account No: ${str(s.bank_account_no)}` : null },
    { key: 'bankIban',        text: s.bank_iban ? `IBAN #: ${str(s.bank_iban)}` : null },
    { key: 'bankBranch',      text: s.bank_branch ? `Branch: ${str(s.bank_branch)}` : null },
  ];
  for (const bl of bankLines) {
    if (!bl.text) continue;
    const st = fld(bl.key, 'normal');
    if (!st.visible) continue;
    pdf.setFont(baseFont, st.weight);
    pdf.setFontSize(baseSize * st.sizeMul);
    tc(pdf, st.color);
    pdf.text(bl.text, lx, ly);
    ly += 3.2;
  }
  return ly - y + 1;
}

// ═══════════════════════════════════════════════════════════
// DRAW: TRIP SIGNATURES (with company names, positioned near footer)
// ═══════════════════════════════════════════════════════════
function drawTripSignaturesWithCompany(pdf, invoice, clientName, y, fieldConfig, blockStyle, sigSpacing) {
  const sigW = CONTENT_W / 2;
  const leftX = CONTENT_X;
  const rightX = CONTENT_X + sigW;
  const sp = sigSpacing || { sigTopGap: 12, lineCaptionGap: 3.5, captionNameGap: 7 };
  const lineY = y + (sp.sigTopGap || 12);
  const warmGold = [51, 51, 51];
  const darkGray = [51, 51, 51];

  const baseFont = blockStyle?.fontFamily || 'times';
  const baseSize = blockStyle?.fontSize || 7.5;
  const baseColor = (blockStyle?.color && hexToRgb(blockStyle.color)) || BLACK;

  const fld = (key, defWeight) => {
    const f = (fieldConfig || {})[key] || {};
    return {
      visible: f.visible !== false,
      weight: f.fontWeight || defWeight || 'normal',
      sizeMul: f.fontSize || 1,
      color: f.color ? (hexToRgb(f.color) || baseColor) : baseColor,
    };
  };

  // Left — AUTHORIZED BY
  const al = fld('authLabel', 'bold');
  if (al.visible) {
    pdf.setFont(baseFont, al.weight);
    pdf.setFontSize(baseSize * al.sizeMul);
    tc(pdf, warmGold);
    pdf.text('AUTHORIZED BY', leftX + sigW / 2, y + 3, { align: 'center' });
  }
  dc(pdf, darkGray);
  pdf.setLineWidth(0.3);
  pdf.line(leftX + 10, lineY, leftX + sigW - 10, lineY);
  const ac = fld('authCaption', 'normal');
  if (ac.visible) {
    pdf.setFont(baseFont, ac.weight);
    pdf.setFontSize(baseSize * ac.sizeMul);
    tc(pdf, GRAY);
    pdf.text('Authorized Signature', leftX + sigW / 2, lineY + (sp.lineCaptionGap || 3.5), { align: 'center' });
  }
  const aco = fld('authCompany', 'bold');
  if (aco.visible) {
    pdf.setFont(baseFont, aco.weight);
    pdf.setFontSize(baseSize * aco.sizeMul);
    tc(pdf, aco.color);
    const bwText = 'BRONZE WINGS GENERAL TRANSPORT L.L.C';
    const bwLines = pdf.splitTextToSize(bwText, sigW - 4);
    const nameStart = lineY + (sp.captionNameGap || 7);
    for (let i = 0; i < Math.min(bwLines.length, 2); i++) {
      pdf.text(bwLines[i], leftX + sigW / 2, nameStart + i * 3, { align: 'center' });
    }
  }

  // Right — RECEIVED BY
  const rl = fld('recvLabel', 'bold');
  if (rl.visible) {
    pdf.setFont(baseFont, rl.weight);
    pdf.setFontSize(baseSize * rl.sizeMul);
    tc(pdf, warmGold);
    pdf.text('RECEIVED BY', rightX + sigW / 2, y + 3, { align: 'center' });
  }
  dc(pdf, darkGray);
  pdf.setLineWidth(0.3);
  pdf.line(rightX + 10, lineY, rightX + sigW - 10, lineY);
  const rc = fld('recvCaption', 'normal');
  if (rc.visible) {
    pdf.setFont(baseFont, rc.weight);
    pdf.setFontSize(baseSize * rc.sizeMul);
    tc(pdf, GRAY);
    pdf.text('Client Signature', rightX + sigW / 2, lineY + (sp.lineCaptionGap || 3.5), { align: 'center' });
  }
  const rcl = fld('recvClient', 'bold');
  if (rcl.visible) {
    pdf.setFont(baseFont, rcl.weight);
    pdf.setFontSize(baseSize * rcl.sizeMul);
    tc(pdf, rcl.color);
    const clientText = str(clientName || invoice.client_name || '');
    const clientLines = pdf.splitTextToSize(clientText, sigW - 4);
    const nameStart = lineY + (sp.captionNameGap || 7);
    for (let i = 0; i < Math.min(clientLines.length, 3); i++) {
      pdf.text(clientLines[i], rightX + sigW / 2, nameStart + i * 3, { align: 'center' });
    }
  }
}

// ═══════════════════════════════════════════════════════════
// MAIN: RENDER INVOICE PDF
// ═══════════════════════════════════════════════════════════
export async function buildInvoicePdf(invoice, clientName, settings, invoiceType = 'monthly', seqNo, draft = false) {
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
  let y = BORDER_POS + 2;
  y = drawLetterhead(pdf, s, y);
  y = drawTaxBanner(pdf, y, refNumber, invoiceDate, s.trn);
  y = drawBillingSection(pdf, invoice, clientName, y, invoiceType, refNumber, invoiceDate);

  // ══ TABLE (with pagination) ══
  const { y: tableY, totals } = drawTable(pdf, invoice, clientName, s, y, invoiceType);
  y = tableY;

  // ══ BOTTOM BLOCK: totals + terms + bank + signatures (last page only) ══
  // Drawn in the reserved signature zone. Start at max(currentY, SIGNATURE_ZONE_TOP)
  // so the block sits at the bottom of the page when rows fill the upper area,
  // or right after the rows when there are only a few.
  y = Math.max(y, SIGNATURE_ZONE_TOP);
  y = drawTableTotal(pdf, colPositions(
    invoiceType === 'trip' ? COLS_TRIP
    : invoiceType === 'standard' ? COLS_STANDARD
    : COLS_MONTHLY
  ), y, totals, invoiceType);

  // Terms & Conditions inline
  y += 2;
  y = drawTermsInline(pdf, y, invoiceType);

  // Bank details
  y += 1;
  const bankH = drawBankDetailsBlock(pdf, s, y, invoiceType);
  y += bankH + 2;

  // Signatures — must finish above the hard-blocked footer zone (FOOTER_RESERVED_TOP)
  drawTripSignaturesWithCompany(pdf, invoice, clientName, y);

  // ══ FOOTER BANNER + PAGE NUMBERS (on every page) ══
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    // DRAFT watermark — big diagonal, semi-transparent, on every page
    if (draft) {
      pdf.setGState(new pdf.GState({ opacity: 0.14 }));
      pdf.setFont('times', 'bold');
      pdf.setFontSize(110);
      tc(pdf, MAROON);
      pdf.text('DRAFT', PAGE_W / 2, PAGE_H / 2, { align: 'center', angle: 32 });
      pdf.setGState(new pdf.GState({ opacity: 1 }));
    }
    // Footer banner — "WE PROVIDE ALL KINDS..." on every page
    drawFooterBanners(pdf);
    // Page number
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    tc(pdf, GRAY);
    pdf.text(`Page No ${i} of ${pageCount}`, CONTENT_RIGHT, 282, { align: 'right' });
  }

  return pdf;
}

export async function renderInvoicePDF(invoice, clientName, settings, invoiceType = 'monthly', seqNo, draft = false) {
  const pdf = await buildInvoicePdf(invoice, clientName, settings, invoiceType, seqNo, draft);
  pdf.save(`invoice-${invoice.invoice_number || invoice.id}.pdf`);
}

// ═══════════════════════════════════════════════════════════
// EXPORTS — shared drawing functions for the layout renderer
// ═══════════════════════════════════════════════════════════
export {
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
};