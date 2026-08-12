/**
 * Shared Letterhead Module — reused by Quotation & Agreement generators.
 * Mirrors the invoice letterhead: bordered cream box, logo, Arabic + English
 * company name, contact column on the right.
 */
import { jsPDF } from 'jspdf';

// ═══════════════════════════════════════════════════════════
// PAGE CONSTANTS (mm)
// ═══════════════════════════════════════════════════════════
export const PAGE_W = 210;
export const PAGE_H = 297;
export const MARGIN = 8;
export const CONTENT_X = MARGIN;
export const CONTENT_W = PAGE_W - 2 * MARGIN;
export const CONTENT_RIGHT = PAGE_W - MARGIN;
export const BORDER_POS = 4;
export const FOOTER_TOP = 279;
export const FOOTER_BOTTOM = PAGE_H - BORDER_POS;

// ═══════════════════════════════════════════════════════════
// COLORS (RGB)
// ═══════════════════════════════════════════════════════════
export const MAROON = [139, 58, 46];
export const DARK_BLUE = [107, 42, 32];
export const BROWN = [99, 60, 26];
export const CREAM = [253, 251, 240];
export const BRONZE = [196, 163, 90];
export const BLACK = [0, 0, 0];
export const GRAY = [102, 102, 102];
export const LIGHT_GRAY = [221, 221, 221];
export const WHITE = [255, 255, 255];
export const ROW_ALT = [250, 251, 252];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
export function str(v) { return String(v ?? ''); }

export function fmtMoney(n) {
  return Number(n ?? 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function tc(pdf, [r, g, b]) { pdf.setTextColor(r, g, b); }
export function fc(pdf, [r, g, b]) { pdf.setFillColor(r, g, b); }
export function dc(pdf, [r, g, b]) { pdf.setDrawColor(r, g, b); }

export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const m = hex.replace('#', '').match(/^([0-9a-fA-F]{6})$/);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export async function fetchLogoDataUrl(url) {
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

// ═══════════════════════════════════════════════════════════
// DRAW: PAGE BORDER
// ═══════════════════════════════════════════════════════════
export function drawPageBorder(pdf) {
  dc(pdf, MAROON);
  pdf.setLineWidth(0.5);
  pdf.rect(BORDER_POS, BORDER_POS, PAGE_W - 2 * BORDER_POS, PAGE_H - 2 * BORDER_POS);
  dc(pdf, LIGHT_GRAY);
  pdf.setLineWidth(0.2);
  pdf.rect(BORDER_POS + 1, BORDER_POS + 1, PAGE_W - 2 * BORDER_POS - 2, PAGE_H - 2 * BORDER_POS - 2);
}

// ═══════════════════════════════════════════════════════════
// DRAW: DEFAULT LOGO
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
// DRAW: ARABIC TEXT (canvas-rendered for Unicode)
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
  } catch (e) { /* skip */ }
}

// ═══════════════════════════════════════════════════════════
// DRAW: LETTERHEAD (same as invoice)
// ═══════════════════════════════════════════════════════════
export function drawLetterhead(pdf, s, y) {
  const boxH = 30;
  const logoSize = s.inv_logo_size || 16;
  const logoUrl = s.inv_logo_source === 'custom' ? (s.inv_logo_url || s.logo_url) : s.logo_url;

  fc(pdf, CREAM);
  pdf.rect(CONTENT_X, y, CONTENT_W, boxH, 'F');
  dc(pdf, BROWN);
  pdf.setLineWidth(0.6);
  pdf.rect(CONTENT_X, y, CONTENT_W, boxH);

  const logoX = CONTENT_X + 4;
  const logoY = y + (boxH - logoSize) / 2;
  if (logoUrl) {
    try {
      pdf.addImage(logoUrl, getImgFormat(logoUrl), logoX, logoY, logoSize, logoSize);
    } catch (e) {
      drawDefaultLogo(pdf, logoX, logoY, logoSize);
    }
  } else {
    drawDefaultLogo(pdf, logoX, logoY, logoSize);
  }

  const textX = logoX + logoSize + 4;
  const textTop = logoY;
  tc(pdf, BROWN);

  drawArabicText(pdf, 'الاجنحه البرونزية للنقليات العامة - ذ.م.م', textX, textTop, 5, BROWN);

  pdf.setFont('times', 'bold');
  pdf.setFontSize(21);
  pdf.text('BRONZE WINGS', textX, textTop + 10, { charSpace: 0.7 });

  pdf.setFont('times', 'bold');
  pdf.setFontSize(10);
  pdf.text('GENERAL TRANSPORT - L.L.C', textX, textTop + 14, { charSpace: 0.5 });

  const rightX = CONTENT_RIGHT - 4;
  let cy = y + 6;
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, BROWN);
  if (s.phone1) { pdf.text(`Mob: ${str(s.phone1)}`, rightX, cy, { align: 'right' }); cy += 3.5; }
  if (s.phone2) { pdf.text(`Mob: ${str(s.phone2)}`, rightX, cy, { align: 'right' }); cy += 3.5; }
  if (s.email) { pdf.text(str(s.email), rightX, cy, { align: 'right' }); cy += 3.5; }
  if (s.address) {
    const addrLines = pdf.splitTextToSize(str(s.address), 35);
    for (const line of addrLines) { pdf.text(line, rightX, cy, { align: 'right' }); cy += 3.5; }
  }
  if (s.website) { pdf.text(str(s.website), rightX, cy, { align: 'right' }); }

  return y + boxH + 2;
}

// ═══════════════════════════════════════════════════════════
// DRAW: FOOTER BANNER (same as invoice)
// ═══════════════════════════════════════════════════════════
export function drawFooterBanner(pdf) {
  const fbX = BORDER_POS + 2;
  const fbW = PAGE_W - 2 * (BORDER_POS + 2);
  const bh = 7;
  const by = FOOTER_BOTTOM - 2 - bh;
  fc(pdf, CREAM);
  pdf.rect(fbX, by, fbW, bh, 'F');
  dc(pdf, BROWN);
  pdf.setLineWidth(0.6);
  pdf.rect(fbX, by, fbW, bh);
  pdf.setFont('times', 'normal');
  pdf.setFontSize(9);
  tc(pdf, BLACK);
  pdf.text('We provide comprehensive general and refrigerated transportation services, along with heavy equipment rental solutions', PAGE_W / 2, by + 4.5, { align: 'center' });
}

// ═══════════════════════════════════════════════════════════
// DRAW: PAGE NUMBERS on every page
// ═══════════════════════════════════════════════════════════
export function drawPageNumbers(pdf) {
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    drawFooterBanner(pdf);
    pdf.setFont('times', 'normal');
    pdf.setFontSize(9);
    tc(pdf, GRAY);
    pdf.text(`Page No ${i} of ${pageCount}`, CONTENT_RIGHT, 282, { align: 'right' });
  }
}

// ═══════════════════════════════════════════════════════════
// PREPARE SETTINGS (fetch logo data URL)
// ═══════════════════════════════════════════════════════════
export async function prepareSettings(settings) {
  let logoDataUrl = null;
  if (settings.logo_url) {
    try { logoDataUrl = await fetchLogoDataUrl(settings.logo_url); } catch (e) { /* fallback */ }
  }
  return { ...settings, logo_url: logoDataUrl || settings.logo_url };
}