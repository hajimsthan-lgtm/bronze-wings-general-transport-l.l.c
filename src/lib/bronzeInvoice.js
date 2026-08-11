import jsPDF from 'jspdf';
import { numberToWords } from './numberToWords';

// ═══════════════════════════════════════════════════════════
// COLOR PALETTE — Bronze / Dark Gold
// ═══════════════════════════════════════════════════════════
const DARK_BRONZE = '#7A5C1C';
const MED_BRONZE = '#B8860B';
const LIGHT_GOLD = '#D4AF37';
const DARK_TEXT = '#1A1A1A';
const MED_GRAY = '#555555';
const LIGHT_BG = '#FAF7F2';
const WHITE = '#FFFFFF';
const LINE_GRAY = '#DDDDDD';

// RGB arrays for jsPDF
const DB_RGB = [122, 92, 28];
const MB_RGB = [184, 134, 11];
const LG_RGB = [212, 175, 55];
const DT_RGB = [26, 26, 26];
const MG_RGB = [85, 85, 85];
const LB_RGB = [250, 247, 242];
const WH_RGB = [255, 255, 255];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function fmtMoney(n) {
  return Number(n ?? 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalizeRoute(str) {
  return String(str ?? '')
    .replace(/\s*->\s*/g, ' → ')
    .replace(/(\w{2,})\s*[!'‘’]+\s*(\w{2,})/g, '$1-$2')
    .replace(/(\w{2,})\s*[–—]\s*(\w{2,})/g, '$1-$2')
    .replace(/-{2,}/g, '-');
}

function formatInvoiceNumber(year, seqNo) {
  return `${year}-${String(seqNo).padStart(4, '0')}`;
}

// ═══════════════════════════════════════════════════════════
// HTML BUILDER — for on-screen preview
// ═══════════════════════════════════════════════════════════
export function buildBronzeInvoiceHTML(invoice, clientName, settings = {}, seqNo) {
  const s = settings;
  const items = invoice.line_items || [];

  const subtotal = items.reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const price = Number(i.unit_price) || 0;
    return sum + (Number(i.amount ?? (qty * price)));
  }, 0);

  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const vatAmount = subtotal * vatRate / 100;
  const total = subtotal + vatAmount;

  const year = new Date().getFullYear();
  const refNumber = invoice.invoice_number || (seqNo ? formatInvoiceNumber(year, seqNo) : `${year}-0001`);
  const billName = clientName || invoice.client_name || '—';
  const invoiceDate = fmtDate(invoice.issue_date);

  const rowsHtml = items.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const grossAmount = Number(item.amount ?? (qty * unitPrice));
    const lineVat = grossAmount * (vatRate / 100);
    const lineTotal = grossAmount + lineVat;
    const desc = normalizeRoute(item.description ?? '')
      .split('\n').map(esc)
      .map(line => line.replace(/\(CANCELLED[^)]*\)/gi, '<span style="color:#dc2626;font-weight:600;">$&</span>'))
      .join('<br>');
    const tripDate = fmtDate(item.date);
    return `<tr>
      <td style="padding:5px 4px;border-bottom:1px solid #e8e8e8;text-align:center;font-size:9pt;color:#1A1A1A;">${idx + 1}</td>
      <td style="padding:5px 6px;border-bottom:1px solid #e8e8e8;text-align:left;font-size:9pt;color:#1A1A1A;white-space:nowrap;">${esc(tripDate)}</td>
      <td style="padding:5px 6px;border-bottom:1px solid #e8e8e8;text-align:left;font-size:9pt;color:#1A1A1A;line-height:1.4;">${desc}</td>
      <td style="padding:5px 4px;border-bottom:1px solid #e8e8e8;text-align:right;font-size:9pt;color:#1A1A1A;font-variant-numeric:tabular-nums;">${qty}</td>
      <td style="padding:5px 4px;border-bottom:1px solid #e8e8e8;text-align:right;font-size:9pt;color:#1A1A1A;font-variant-numeric:tabular-nums;">${fmtMoney(unitPrice)}</td>
      <td style="padding:5px 4px;border-bottom:1px solid #e8e8e8;text-align:right;font-size:9pt;color:#1A1A1A;font-variant-numeric:tabular-nums;">${fmtMoney(grossAmount)}</td>
      <td style="padding:5px 4px;border-bottom:1px solid #e8e8e8;text-align:right;font-size:9pt;color:#1A1A1A;font-variant-numeric:tabular-nums;">${fmtMoney(lineVat)}</td>
      <td style="padding:5px 4px;border-bottom:1px solid #e8e8e8;text-align:right;font-size:9pt;color:#1A1A1A;font-weight:600;font-variant-numeric:tabular-nums;">${fmtMoney(lineTotal)}</td>
    </tr>`;
  }).join('');

  const words = numberToWords(total).toUpperCase();

  return `
<div id="invoice-container" style="width:794px;min-height:1123px;font-family:Helvetica,Arial,sans-serif;color:${DARK_TEXT};background:#ffffff;position:relative;overflow:hidden;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;">

  <!-- ══ HEADER SECTION ══ -->
  <div style="padding:24px 30px 0;display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <div style="font-size:24pt;font-weight:bold;color:${DARK_BRONZE};line-height:1;letter-spacing:1px;">BRONZE WINGS</div>
      <div style="font-size:10pt;color:${MED_BRONZE};margin-top:5px;letter-spacing:0.5px;">BRONZE WINGS GENERAL TRANSPORT</div>
      <div style="font-size:10pt;color:${MED_BRONZE};letter-spacing:0.5px;">BRONZE WINGS GENERAL TRANSPORT -</div>
    </div>
    <div style="text-align:right;font-size:9pt;color:${MED_GRAY};line-height:1.7;">
      <div>Mob: ${esc(s.phone1 || '050-8655601')}</div>
      <div>Mob: ${esc(s.phone2 || '050-6816879')}</div>
      <div>${esc(s.email || 'bronzewings1@gmail.com')}</div>
      <div>${esc(s.address || 'M-6, Mussafah')}</div>
      <div>Abu Dhabi, UAE</div>
    </div>
  </div>

  <!-- 2pt dark bronze horizontal line -->
  <div style="margin:10px 30px 0;border-bottom:2pt solid ${DARK_BRONZE};"></div>

  <!-- ══ BILL TO & INVOICE DETAILS ══ -->
  <div style="padding:14px 30px 0;display:flex;justify-content:space-between;align-items:flex-start;">
    <!-- Left: BILL TO -->
    <div style="flex:1;">
      <div style="font-size:10pt;font-weight:bold;color:${DARK_BRONZE};margin-bottom:8px;letter-spacing:1px;">BILL TO</div>
      <div style="font-size:9pt;font-weight:bold;color:${DARK_TEXT};margin-bottom:3px;">${esc(billName)}</div>
      ${invoice.contact_person ? `<div style="font-size:9pt;color:${DARK_TEXT};">ATT: ${esc(invoice.contact_person)}</div>` : ''}
      ${invoice.client_address ? `<div style="font-size:9pt;color:${DARK_TEXT};">Address: ${esc(invoice.client_address)}</div>` : ''}
      ${invoice.client_trn ? `<div style="font-size:9pt;color:${DARK_TEXT};">TRN: ${esc(invoice.client_trn)}</div>` : ''}
    </div>
    <!-- Right: TAX INVOICE + metadata -->
    <div style="flex:1;text-align:right;">
      <div style="font-size:18pt;font-weight:bold;color:${DARK_BRONZE};text-align:center;margin-bottom:10px;letter-spacing:2px;">TAX INVOICE</div>
      <div style="font-size:9pt;font-weight:bold;color:${DARK_TEXT};line-height:1.8;">
        ${s.trn ? `<div>Bronze TRN: ${esc(s.trn)}</div>` : ''}
        <div>Invoice #: ${esc(refNumber)}</div>
        <div>Invoice Date: ${invoiceDate}</div>
      </div>
    </div>
  </div>

  <!-- ══ ITEMS TABLE ══ -->
  <div style="padding:14px 30px 0;">
    <table style="width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;table-layout:fixed;">
      <thead>
        <tr>
          <th style="background:${DARK_BRONZE};color:#fff;font-weight:bold;font-size:8pt;padding:7px 3px;text-align:center;border:1px solid ${DARK_BRONZE};width:4%;">#</th>
          <th style="background:${DARK_BRONZE};color:#fff;font-weight:bold;font-size:8pt;padding:7px 4px;text-align:left;border:1px solid ${DARK_BRONZE};width:12%;">TRIP DATE</th>
          <th style="background:${DARK_BRONZE};color:#fff;font-weight:bold;font-size:8pt;padding:7px 4px;text-align:left;border:1px solid ${DARK_BRONZE};width:30%;">DESCRIPTION</th>
          <th style="background:${DARK_BRONZE};color:#fff;font-weight:bold;font-size:8pt;padding:7px 3px;text-align:right;border:1px solid ${DARK_BRONZE};width:6%;">QTY</th>
          <th style="background:${DARK_BRONZE};color:#fff;font-weight:bold;font-size:8pt;padding:7px 3px;text-align:right;border:1px solid ${DARK_BRONZE};width:13%;">UNIT PRICE (AED)</th>
          <th style="background:${DARK_BRONZE};color:#fff;font-weight:bold;font-size:8pt;padding:7px 3px;text-align:right;border:1px solid ${DARK_BRONZE};width:13%;">AMOUNT (AED)</th>
          <th style="background:${DARK_BRONZE};color:#fff;font-weight:bold;font-size:8pt;padding:7px 3px;text-align:right;border:1px solid ${DARK_BRONZE};width:11%;">VAT 5%</th>
          <th style="background:${DARK_BRONZE};color:#fff;font-weight:bold;font-size:8pt;padding:7px 3px;text-align:right;border:1px solid ${DARK_BRONZE};width:11%;">TOTAL (AED)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || `<tr><td colspan="8" style="padding:14px;text-align:center;font-size:9pt;color:#999;border-bottom:1px solid #e8e8e8;">No items</td></tr>`}
      </tbody>
      <tfoot>
        <tr style="background:${LIGHT_BG};">
          <td colspan="5" style="padding:7px 4px;border-top:2pt solid ${DARK_BRONZE};border-bottom:2pt solid ${DARK_BRONZE};font-weight:bold;font-size:9pt;color:${DARK_BRONZE};text-align:right;letter-spacing:0.5px;">Total</td>
          <td style="padding:7px 4px;border-top:2pt solid ${DARK_BRONZE};border-bottom:2pt solid ${DARK_BRONZE};font-weight:bold;font-size:9pt;color:${DARK_BRONZE};text-align:right;font-variant-numeric:tabular-nums;">${fmtMoney(subtotal)}</td>
          <td style="padding:7px 4px;border-top:2pt solid ${DARK_BRONZE};border-bottom:2pt solid ${DARK_BRONZE};font-weight:bold;font-size:9pt;color:${DARK_BRONZE};text-align:right;font-variant-numeric:tabular-nums;">${fmtMoney(vatAmount)}</td>
          <td style="padding:7px 4px;border-top:2pt solid ${DARK_BRONZE};border-bottom:2pt solid ${DARK_BRONZE};font-weight:bold;font-size:9pt;color:${DARK_BRONZE};text-align:right;font-variant-numeric:tabular-nums;">${fmtMoney(total)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- ══ AMOUNT IN WORDS ══ -->
  <div style="padding:10px 30px 0;">
    <div style="font-size:11pt;font-weight:bold;color:${DARK_BRONZE};letter-spacing:0.5px;">AED ${words} ONLY</div>
  </div>

  <!-- ══ TERMS & CONDITIONS ══ -->
  <div style="padding:14px 30px 0;margin-top:10px;border-top:1px solid ${LINE_GRAY};">
    <div style="font-size:10pt;font-weight:bold;color:${DARK_BRONZE};margin-bottom:8px;letter-spacing:1px;">TERMS &amp; CONDITIONS</div>
    <div style="font-size:9pt;color:${DARK_TEXT};line-height:1.8;">Payment Terms: 60 days from receipt of the tax invoice.</div>
  </div>

  <!-- ══ SIGNATURE BLOCKS (Three Equal Columns) ══ -->
  <div style="padding:24px 30px 0;display:flex;gap:20px;">
    <!-- Left -->
    <div style="flex:1;text-align:left;">
      <div style="font-size:9pt;font-weight:bold;color:${DARK_BRONZE};margin-bottom:36px;line-height:1.4;letter-spacing:0.5px;">FOR BRONZE WINGS<br>GENERAL TRANSPORT</div>
      <div style="border-bottom:1px solid ${DARK_BRONZE};margin-bottom:5px;width:75%;"></div>
      <div style="font-size:8pt;color:${MED_GRAY};letter-spacing:0.5px;">AUTHORIZED SIGNATURE &amp; STAMP</div>
    </div>
    <!-- Middle -->
    <div style="flex:1;text-align:center;">
      <div style="font-size:9pt;font-weight:bold;color:${DARK_BRONZE};margin-bottom:36px;line-height:1.4;letter-spacing:0.5px;">FOR TRAVERSE</div>
      <div style="border-bottom:1px solid ${LINE_GRAY};margin-bottom:5px;width:75%;margin-left:auto;margin-right:auto;"></div>
      <div style="font-size:8pt;color:${MED_GRAY};">&nbsp;</div>
    </div>
    <!-- Right -->
    <div style="flex:1;text-align:right;">
      <div style="font-size:9pt;font-weight:bold;color:${DARK_BRONZE};margin-bottom:36px;line-height:1.4;letter-spacing:0.5px;">FOR PREZIOSO TRAVERSE</div>
      <div style="border-bottom:1px solid ${DARK_BRONZE};margin-bottom:5px;width:75%;margin-left:auto;"></div>
      <div style="font-size:8pt;color:${MED_GRAY};letter-spacing:0.5px;">RECEIVER SIGN &amp; STAMP</div>
      <div style="font-size:8pt;color:${MED_GRAY};margin-top:3px;">Mobile: ${esc(s.phone1 || '050-8655601')}</div>
    </div>
  </div>

  <!-- ══ FOOTER ══ -->
  <div style="position:absolute;bottom:0;left:0;right:0;">
    <div style="border-top:1px solid ${DARK_BRONZE};background:${LIGHT_BG};padding:10px 30px;text-align:center;">
      <div style="font-size:9pt;font-weight:bold;color:${MED_BRONZE};letter-spacing:1px;">WE PROVIDE ALL KINDS OF GENERAL AND REFRIGERATED TRANSPORTATION AND HEAVY EQUIPMENT RENTAL SERVICES</div>
      <div style="font-size:8pt;color:${MED_GRAY};margin-top:5px;letter-spacing:0.5px;">AUTHORIZED SIGNATURE &amp; STAMP</div>
    </div>
  </div>

</div>`;
}

// ═══════════════════════════════════════════════════════════
// NATIVE PDF RENDERER — jsPDF vector output
// ═══════════════════════════════════════════════════════════
async function fetchLogoDataUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function downloadBronzeInvoicePDF(invoice, clientName, settings = {}, seqNo) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const pageW = 210;
  const pageH = 297;
  const M = 10; // margin
  const R = pageW - M; // right edge
  const CW = pageW - 2 * M; // content width

  const s = settings;
  const items = invoice.line_items || [];

  const subtotal = items.reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const price = Number(i.unit_price) || 0;
    return sum + (Number(i.amount ?? (qty * price)));
  }, 0);
  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const vatAmount = subtotal * vatRate / 100;
  const total = subtotal + vatAmount;

  const year = new Date().getFullYear();
  const refNumber = invoice.invoice_number || (seqNo ? formatInvoiceNumber(year, seqNo) : `${year}-0001`);
  const billName = clientName || invoice.client_name || '—';
  const invoiceDate = fmtDate(invoice.issue_date);
  const words = numberToWords(total).toUpperCase();

  // Helper shortcuts
  const setFill = (c) => pdf.setFillColor(...c);
  const setText = (c) => pdf.setTextColor(...c);
  const setDraw = (c) => pdf.setDrawColor(...c);

  let y = M;

  // ══ HEADER ══
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  setText(DB_RGB);
  pdf.text('BRONZE WINGS', M, y + 8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  setText(MB_RGB);
  pdf.text('BRONZE WINGS GENERAL TRANSPORT', M, y + 14);
  pdf.text('BRONZE WINGS GENERAL TRANSPORT -', M, y + 18);

  // Right: contact details
  pdf.setFontSize(9);
  setText(MG_RGB);
  const contacts = [
    `Mob: ${s.phone1 || '050-8655601'}`,
    `Mob: ${s.phone2 || '050-6816879'}`,
    s.email || 'bronzewings1@gmail.com',
    s.address || 'M-6, Mussafah',
    'Abu Dhabi, UAE'
  ];
  let cy = y + 3;
  for (const line of contacts) {
    pdf.text(line, R, cy, { align: 'right' });
    cy += 4.2;
  }

  // 2pt dark bronze line
  y += 22;
  setDraw(DB_RGB);
  pdf.setLineWidth(0.7); // ~2pt
  pdf.line(M, y, R, y);
  y += 7;

  // ══ BILL TO & INVOICE DETAILS ══
  const billTop = y;

  // Left: BILL TO
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setText(DB_RGB);
  pdf.text('BILL TO', M, billTop);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  setText(DT_RGB);
  pdf.text(billName, M, billTop + 6);

  pdf.setFont('helvetica', 'normal');
  let by = billTop + 11;
  if (invoice.contact_person) { pdf.text(`ATT: ${invoice.contact_person}`, M, by); by += 5; }
  if (invoice.client_address) { pdf.text(`Address: ${invoice.client_address}`, M, by); by += 5; }
  if (invoice.client_trn) { pdf.text(`TRN: ${invoice.client_trn}`, M, by); by += 5; }

  // Right: TAX INVOICE + metadata
  const rightX = pageW / 2;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  setText(DB_RGB);
  pdf.text('TAX INVOICE', rightX, billTop, { align: 'center' });

  pdf.setFontSize(9);
  setText(DT_RGB);
  let ry = billTop + 8;
  if (s.trn) { pdf.text(`Bronze TRN: ${s.trn}`, R, ry, { align: 'right' }); ry += 5; }
  pdf.text(`Invoice #: ${refNumber}`, R, ry, { align: 'right' }); ry += 5;
  pdf.text(`Invoice Date: ${invoiceDate}`, R, ry, { align: 'right' });

  y = Math.max(by, ry) + 4;

  // ══ ITEMS TABLE ══
  // Column widths (mm) — total = CW (190)
  const cols = [
    { w: 8, align: 'center' },   // #
    { w: 23, align: 'left' },   // TRIP DATE
    { w: 57, align: 'left' },   // DESCRIPTION
    { w: 12, align: 'right' },  // QTY
    { w: 25, align: 'right' },  // UNIT PRICE
    { w: 25, align: 'right' },  // AMOUNT
    { w: 20, align: 'right' },  // VAT 5%
    { w: 20, align: 'right' },  // TOTAL
  ];
  // Compute x positions
  let cx = M;
  for (const c of cols) { c.x = cx; cx += c.w; }

  const headers = ['#', 'TRIP DATE', 'DESCRIPTION', 'QTY', 'UNIT PRICE\n(AED)', 'AMOUNT\n(AED)', 'VAT 5%', 'TOTAL\n(AED)'];
  const rowH = 9;

  // Header row
  setFill(DB_RGB);
  pdf.rect(M, y, CW, rowH, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  setText(WH_RGB);
  for (let i = 0; i < cols.length; i++) {
    const lines = headers[i].split('\n');
    if (lines.length === 1) {
      pdf.text(lines[0], cols[i].x + (cols[i].align === 'right' ? cols[i].w - 2 : cols[i].align === 'center' ? cols[i].w / 2 : 2), y + rowH / 2 + 1, { align: cols[i].align });
    } else {
      pdf.text(lines[0], cols[i].x + (cols[i].align === 'right' ? cols[i].w - 2 : 2), y + rowH / 2 - 1, { align: cols[i].align });
      pdf.text(lines[1], cols[i].x + (cols[i].align === 'right' ? cols[i].w - 2 : 2), y + rowH / 2 + 3, { align: cols[i].align });
    }
  }
  y += rowH;

  // Body rows
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  setText(DT_RGB);
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const grossAmount = Number(item.amount ?? (qty * unitPrice));
    const lineVat = grossAmount * (vatRate / 100);
    const lineTotal = grossAmount + lineVat;
    const tripDate = fmtDate(item.date);
    const desc = normalizeRoute(item.description ?? '');

    const vals = [String(idx + 1), tripDate, desc, String(qty), fmtMoney(unitPrice), fmtMoney(grossAmount), fmtMoney(lineVat), fmtMoney(lineTotal)];

    for (let i = 0; i < cols.length; i++) {
      const align = cols[i].align;
      const tx = align === 'right' ? cols[i].x + cols[i].w - 2 : align === 'center' ? cols[i].x + cols[i].w / 2 : cols[i].x + 2;
      if (i === 2 && desc.length > 40) {
        const wrapped = pdf.splitTextToSize(desc, cols[i].w - 4);
        pdf.text(wrapped, tx, y + 3.5, { align });
      } else {
        pdf.text(vals[i], tx, y + 3.5, { align });
      }
    }

    // Light border below
    setDraw([232, 232, 232]);
    pdf.setLineWidth(0.2);
    pdf.line(M, y + rowH - 1, R, y + rowH - 1);
    y += rowH;

    // Page break check
    if (y > pageH - 80) {
      pdf.addPage();
      y = M;
    }
  }

  // Total row
  setFill(LB_RGB);
  pdf.rect(M, y, CW, rowH, 'F');
  setDraw(DB_RGB);
  pdf.setLineWidth(0.7);
  pdf.line(M, y, R, y);
  pdf.line(M, y + rowH, R, y + rowH);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  setText(DB_RGB);
  // "Total" label spans first 5 columns
  const labelRight = cols[4].x + cols[4].w;
  pdf.text('Total', labelRight - 2, y + rowH / 2 + 1, { align: 'right' });
  // Values in last 3 columns
  const totals = [fmtMoney(subtotal), fmtMoney(vatAmount), fmtMoney(total)];
  for (let i = 0; i < 3; i++) {
    const col = cols[5 + i];
    pdf.text(totals[i], col.x + col.w - 2, y + rowH / 2 + 1, { align: 'right' });
  }
  y += rowH + 4;

  // ══ AMOUNT IN WORDS ══
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  setText(DB_RGB);
  pdf.text(`AED ${words} ONLY`, M, y);
  y += 10;

  // ══ TERMS & CONDITIONS ══
  setDraw([221, 221, 221]);
  pdf.setLineWidth(0.3);
  pdf.line(M, y, R, y);
  y += 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  setText(DB_RGB);
  pdf.text('TERMS & CONDITIONS', M, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  setText(DT_RGB);
  pdf.text('Payment Terms: 60 days from receipt of the tax invoice.', M, y + 6);

  y += 16;

  // ══ SIGNATURE BLOCKS (Three Equal Columns) ══
  const sigW = CW / 3;
  const sigGap = 4;
  const sigY = y + 4;

  const sigBlocks = [
    { label: 'FOR BRONZE WINGS\nGENERAL TRANSPORT', caption: 'AUTHORIZED SIGNATURE & STAMP', mobile: null },
    { label: 'FOR TRAVERSE', caption: '', mobile: null },
    { label: 'FOR PREZIOSO TRAVERSE', caption: 'RECEIVER SIGN & STAMP', mobile: `Mobile: ${s.phone1 || '050-8655601'}` },
  ];

  for (let i = 0; i < 3; i++) {
    const blk = sigBlocks[i];
    const sx = M + i * sigW;
    const align = i === 0 ? 'left' : i === 2 ? 'right' : 'center';
    const textX = align === 'left' ? sx + 2 : align === 'right' ? sx + sigW - 2 : sx + sigW / 2;
    const lineStart = align === 'left' ? sx : align === 'right' ? sx + sigW * 0.25 : sx + sigW * 0.125;
    const lineEnd = align === 'left' ? sx + sigW * 0.75 : align === 'right' ? sx + sigW : sx + sigW * 0.875;

    // Company name (bold dark bronze)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    setText(DB_RGB);
    const labelLines = blk.label.split('\n');
    let sly = sigY + 4;
    for (const line of labelLines) {
      pdf.text(line, textX, sly, { align });
      sly += 5;
    }

    // Signature line
    const lineY = sigY + 30;
    setDraw(i === 1 ? [221, 221, 221] : DB_RGB);
    pdf.setLineWidth(0.3);
    pdf.line(lineStart, lineY, lineEnd, lineY);

    // Caption
    if (blk.caption) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      setText(MG_RGB);
      pdf.text(blk.caption, textX, lineY + 4, { align });
      if (blk.mobile) {
        pdf.text(blk.mobile, textX, lineY + 8, { align });
      }
    }
  }

  y = sigY + 44;

  // ══ FOOTER ══ (anchored to bottom of page)
  const footerH = 14;
  const footerY = pageH - footerH - 4;

  setFill(LB_RGB);
  pdf.rect(M, footerY, CW, footerH, 'F');
  setDraw(DB_RGB);
  pdf.setLineWidth(0.3);
  pdf.line(M, footerY, R, footerY);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  setText(MB_RGB);
  pdf.text('WE PROVIDE ALL KINDS OF GENERAL AND REFRIGERATED TRANSPORTATION AND HEAVY EQUIPMENT RENTAL SERVICES', pageW / 2, footerY + 5, { align: 'center' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  setText(MG_RGB);
  pdf.text('AUTHORIZED SIGNATURE & STAMP', pageW / 2, footerY + 10, { align: 'center' });

  // Save
  pdf.save(`invoice-${invoice.invoice_number || invoice.id || refNumber}.pdf`);
}