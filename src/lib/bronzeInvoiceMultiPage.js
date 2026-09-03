import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { numberToWords } from './numberToWords';

// ═══════════════════════════════════════════════════════════
// Multi-Page Bronze Wings Tax Invoice Template
// WeasyPrint-ready HTML/CSS + browser (html2canvas + jsPDF) exporter.
// Layout: A4 portrait, brown frame, 8-column table, 17 rows/page,
// repeating thead, integrated totals, dual signatures, page numbers.
// ═══════════════════════════════════════════════════════════

const BROWN = '#7A5C1C';
const BROWN_LIGHT = '#B8860B';
const FRAME_BORDER = '#7A5C1C';
const GRID = '#000000';
const HEADER_BG = '#7A5C1C';
const ZEBRA_BG = '#FAF7F2';
const TEXT = '#1A1A1A';
const MUTED = '#555555';

function fmtMoney(n) {
  return Number(n ?? 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
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

function buildIndicatorLine(item) {
  const parts = [];
  if (item.show_driver !== false && item.driver_name) parts.push(`D:${item.driver_name}`);
  if (item.show_vehicle !== false && item.vehicle_no) parts.push(`V:${item.vehicle_no}`);
  if (item.show_delivery_note !== false && item.delivery_note_no) parts.push(`DN#:${item.delivery_note_no}`);
  return parts.length > 0 ? parts.join('  ') : '';
}

const EAGLE_SVG = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
  <g fill="#7A5C1C">
    <path d="M32 6c-3 0-5 1-7 3-2-1-5-1-7 0-3 1-5 4-6 7 2-1 4-1 6 0-2 2-3 5-3 8 2-2 4-3 7-3-1 2-1 5 0 7 2-3 4-5 7-6 0 3 1 6 3 8 1-3 2-5 2-8 3 1 5 3 7 6 1-2 1-5 0-7 3 0 5 1 7 3 0-3-1-6-3-8 2-1 4-1 6 0-1-3-3-6-6-7-2-1-5-1-7 0-2-2-4-3-7-3z"/>
    <path d="M32 22c-4 2-7 6-8 11 2-2 5-3 8-3-1 3-1 6 0 9 2-3 4-5 8-5 4 0 6 2 8 5 1-3 1-6 0-9 3 0 6 1 8 3-1-5-4-9-8-11-2 2-5 3-8 3s-6-1-8-3z" opacity="0.85"/>
  </g>
</svg>`;

// ═══════════════════════════════════════════════════════════
// HTML BUILDER — WeasyPrint-ready (embedded @page CSS) + browser
// ═══════════════════════════════════════════════════════════
export function buildBronzeMultiPageHTML(invoice, clientName, settings = {}, seqNo) {
  const s = settings || {};
  const items = invoice.line_items || [];

  const subtotal = Number(invoice.subtotal ?? items.reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const price = Number(i.unit_price) || 0;
    return sum + (Number(i.amount ?? (qty * price)));
  }, 0));
  const vatRate = Number(invoice.vat_rate ?? s.default_vat_rate ?? 5);
  const vatAmount = Number(invoice.vat_amount ?? (subtotal * vatRate / 100));
  const total = Number(invoice.total_amount ?? (subtotal + vatAmount));

  const year = new Date().getFullYear();
  const refNumber = invoice.invoice_number || (seqNo ? `${year}-${String(seqNo).padStart(4, '0')}` : `${year}-0001`);
  const billName = clientName || invoice.client_name || '—';
  const invoiceDate = fmtDate(invoice.issue_date);
  const words = numberToWords(total).toUpperCase();

  const logoHtml = s.logo_url
    ? `<img src="${esc(s.logo_url)}" style="height:60px;width:60px;object-fit:contain;" alt="logo" />`
    : EAGLE_SVG;

  const rowsHtml = items.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const grossAmount = Number(item.amount ?? (qty * unitPrice));
    const lineVatRate = item.vat_excluded ? 0 : vatRate;
    const lineVat = item.vat_excluded ? 0 : grossAmount * vatRate / 100;
    const descLines = normalizeRoute(item.description ?? '').split('\n').map(esc);
    const indicator = buildIndicatorLine(item);
    const descHtml = [...descLines, indicator ? `<span style="color:${MUTED};font-size:7.5pt;">${esc(indicator)}</span>` : '']
      .filter(Boolean).join('<br>');
    return `<tr class="${idx % 2 === 1 ? 'zebra' : ''}">
      <td class="c">${idx + 1}</td>
      <td class="c">${esc(fmtDate(item.date))}</td>
      <td class="l">${descHtml}</td>
      <td class="c">${qty}</td>
      <td class="r">${fmtMoney(unitPrice)}</td>
      <td class="r">${fmtMoney(grossAmount)}</td>
      <td class="c">${item.vat_excluded ? '0%' : vatRate + '%'}</td>
      <td class="r">${fmtMoney(lineVat)}</td>
    </tr>`;
  }).join('');

  const companyAr = s.company_name_ar || 'برونز وينجز للنقل العام - ذ.م.م';
  const companyEn = s.company_name || 'BRONZE WINGS GENERAL TRANSPORT - L.L.C';
  const phone1 = s.phone1 || '050-8655601';
  const phone2 = s.phone2 || '050-6816879';
  const email = s.email || 'hire@bronzewings.ae';
  const address = s.address || 'M-6, Mussafah, Abu Dhabi, UAE';
  const website = s.website || 'www.bronzewings.ae';
  const supplierTrn = s.trn || '100567890123456';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Tax Invoice ${esc(refNumber)}</title>
<style>
  @page {
    size: A4 portrait;
    margin: 12mm 10mm 15mm 10mm;
    @bottom-center {
      content: "${esc(address)}  |  ${esc(email)}  |  Page No: " counter(page) " of " counter(pages);
      font-family: Arial, sans-serif;
      font-size: 7.5pt;
      color: #555;
    }
  }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    color: ${TEXT};
    font-size: 9pt;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .page-frame {
    border: 2px solid ${FRAME_BORDER};
    min-height: 269mm;
    padding: 0;
  }
  /* ── Header banner ── */
  .hdr-banner {
    display: flex; align-items: center; gap: 12px;
    padding: 8px 12px;
    border-bottom: 2px solid ${BROWN};
    background: #fff;
  }
  .hdr-logo { width: 56px; height: 56px; flex-shrink: 0; }
  .hdr-titles { flex: 1; }
  .hdr-ar { font-size: 13pt; font-weight: 700; color: ${BROWN}; direction: rtl; line-height: 1.2; }
  .hdr-en { font-size: 13pt; font-weight: 700; color: ${BROWN}; letter-spacing: 0.5px; line-height: 1.2; }
  .hdr-contact { text-align: right; font-size: 7.5pt; color: ${MUTED}; line-height: 1.5; }
  /* ── Meta band ── */
  .meta-band {
    display: flex; justify-content: space-between; align-items: flex-start;
    padding: 8px 12px;
    border-bottom: 1px solid ${BROWN};
  }
  .bill-to { font-size: 8.5pt; line-height: 1.5; }
  .bill-to .lbl { font-weight: 700; color: ${BROWN}; font-size: 8pt; letter-spacing: 0.5px; }
  .bill-to .nm { font-weight: 700; }
  .meta-right { text-align: right; font-size: 8.5pt; line-height: 1.5; }
  .doc-title { font-size: 15pt; font-weight: 700; color: ${BROWN}; letter-spacing: 2px; margin-bottom: 4px; }
  .meta-right .row { font-weight: 700; }
  /* ── Table ── */
  table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  thead { display: table-header-group; }
  th, td {
    border: 1px solid ${GRID};
    padding: 4px 5px;
    font-size: 8.5pt;
    vertical-align: top;
    overflow: hidden;
  }
  th {
    background: ${HEADER_BG};
    color: #fff;
    font-weight: 700;
    font-size: 8pt;
    text-align: center;
    border-color: ${HEADER_BG};
  }
  td.c, th.c { text-align: center; }
  td.l, th.l { text-align: left; }
  td.r, th.r { text-align: right; font-variant-numeric: tabular-nums; }
  tr.zebra td { background: ${ZEBRA_BG}; }
  tr.body-row { page-break-inside: avoid; }
  /* column widths */
  col.c1 { width: 6%; }
  col.c2 { width: 12%; }
  col.c3 { width: 48%; }
  col.c4 { width: 6%; }
  col.c5 { width: 7%; }
  col.c6 { width: 8%; }
  col.c7 { width: 6%; }
  col.c8 { width: 7%; }
  /* ── Totals rows ── */
  tr.totals td {
    background: ${ZEBRA_BG};
    font-weight: 700;
    color: ${BROWN};
    border-color: ${GRID};
  }
  tr.grand td { background: #F0E6D0; font-size: 9.5pt; }
  /* ── Words + signatures + footer ── */
  .words { padding: 8px 12px; font-size: 9pt; font-weight: 700; color: ${BROWN}; border-bottom: 1px solid ${BROWN}; }
  .sig-block { display: flex; gap: 20px; padding: 18px 12px 10px; }
  .sig-col { flex: 1; text-align: center; }
  .sig-line { border-bottom: 1px solid ${BROWN}; margin: 0 auto 5px; width: 80%; height: 26px; }
  .sig-cap { font-size: 7.5pt; color: ${MUTED}; letter-spacing: 0.5px; }
  .sig-nm { font-size: 8.5pt; font-weight: 700; color: ${TEXT}; margin-top: 3px; }
  .footer-note { padding: 6px 12px; text-align: center; font-size: 7.5pt; color: ${MUTED}; border-top: 1px solid ${BROWN}; }
</style>
</head>
<body>
<div id="invoice-container" class="page-frame">

  <!-- ══ HEADER BANNER ══ -->
  <div id="invoice-header" class="hdr-banner">
    <div class="hdr-logo">${logoHtml}</div>
    <div class="hdr-titles">
      <div class="hdr-ar">${esc(companyAr)}</div>
      <div class="hdr-en">${esc(companyEn)}</div>
    </div>
    <div class="hdr-contact">
      <div>Mob ${esc(phone1)} / ${esc(phone2)}</div>
      <div>${esc(email)}</div>
      <div>${esc(address)}</div>
      <div>${esc(website)}</div>
      <div>TRN: ${esc(supplierTrn)}</div>
    </div>
  </div>

  <!-- ══ BILL TO + INVOICE META ══ -->
  <div class="meta-band">
    <div class="bill-to">
      <div class="lbl">BILL TO</div>
      <div class="nm">${esc(billName)}</div>
      ${invoice.contact_person ? `<div>ATT: ${esc(invoice.contact_person)}</div>` : ''}
      ${invoice.client_address ? `<div>Address: ${esc(invoice.client_address)}</div>` : ''}
      ${invoice.client_trn ? `<div>TRN: ${esc(invoice.client_trn)}</div>` : ''}
    </div>
    <div class="meta-right">
      <div class="doc-title">TAX INVOICE</div>
      <div class="row">INVOICE#: ${esc(refNumber)}</div>
      <div class="row">INVOICE DATE: ${esc(invoiceDate)}</div>
      <div>SUPPLIER TRN: ${esc(supplierTrn)}</div>
    </div>
  </div>

  <!-- ══ LINE ITEMS TABLE ══ -->
  <table>
    <colgroup>
      <col class="c1" /><col class="c2" /><col class="c3" /><col class="c4" />
      <col class="c5" /><col class="c6" /><col class="c7" /><col class="c8" />
    </colgroup>
    <thead>
      <tr>
        <th class="c">SL.No</th>
        <th class="c">Date</th>
        <th class="l">Description</th>
        <th class="c">Qty</th>
        <th class="r">Unit Rate</th>
        <th class="r">Trip Amount</th>
        <th class="c">Vat Rate</th>
        <th class="r">Vat Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="8" class="c" style="padding:14px;color:#999;">No line items</td></tr>`}
    </tbody>
    <tfoot id="footer-block">
      <tr class="totals">
        <td colspan="5" class="r">SUB TOTAL</td>
        <td class="r">AED ${fmtMoney(subtotal)}</td>
        <td class="c">—</td>
        <td class="r">AED ${fmtMoney(0)}</td>
      </tr>
      <tr class="totals">
        <td colspan="5" class="r">VAT ${vatRate}%</td>
        <td class="r">AED ${fmtMoney(0)}</td>
        <td class="c">—</td>
        <td class="r">AED ${fmtMoney(vatAmount)}</td>
      </tr>
      <tr class="totals grand">
        <td colspan="5" class="r">GRAND TOTAL (DHS)</td>
        <td class="r">AED ${fmtMoney(total)}</td>
        <td class="c">—</td>
        <td class="r">AED ${fmtMoney(total)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- ══ AMOUNT IN WORDS ══ -->
  <div class="words">AED ${esc(words)} DIRHAMS ONLY</div>

  <!-- ══ SIGNATURE BLOCK ══ -->
  <div class="sig-block">
    <div class="sig-col">
      <div class="sig-line"></div>
      <div class="sig-cap">FOR / AUTHORIZED SIGNATURE &amp; STAMP</div>
      <div class="sig-nm">${esc(companyEn)}</div>
    </div>
    <div class="sig-col">
      <div class="sig-line"></div>
      <div class="sig-cap">RECEIVER SIGN &amp; STAMP</div>
      <div class="sig-nm">${esc(billName)}</div>
    </div>
  </div>

  <!-- ══ FOOTER NOTE ══ -->
  <div class="footer-note">
    WE PROVIDE ALL KINDS OF GENERAL AND REFRIGERATED TRANSPORTATION AND HEAVY EQUIPMENT RENTAL SERVICES
  </div>

</div>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════
// BROWSER PDF EXPORT — html2canvas + jsPDF, multi-page
// Repeats company header + table thead on every continuation page.
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

export async function downloadBronzeMultiPagePDF(invoice, clientName, settings = {}, seqNo) {
  const html = buildBronzeMultiPageHTML(invoice, clientName, settings, seqNo);
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.style.width = '794px'; // A4 width @ ~96dpi
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  try {
    const element = wrapper.querySelector('#invoice-container');
    const footerBlock = wrapper.querySelector('#footer-block');
    const thead = wrapper.querySelector('thead');
    const tableEl = wrapper.querySelector('table');
    const invoiceHeaderEl = wrapper.querySelector('#invoice-header');

    const canvas = await html2canvas(element, {
      scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false,
    });

    let headerCanvas = null, headerHeightPx = 0;
    if (thead) headerCanvas = await html2canvas(thead, { scale: 3, backgroundColor: '#ffffff', logging: false });

    let invoiceHeaderCanvas = null, invoiceHeaderHeightPx = 0;
    if (invoiceHeaderEl) invoiceHeaderCanvas = await html2canvas(invoiceHeaderEl, { scale: 3, backgroundColor: '#ffffff', logging: false });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const margin = 8;
    const footerH = 6;
    const usableH = pdfH - 2 * margin - footerH;
    const imgW = pdfW - 2 * margin;
    const pxPerMm = canvas.width / imgW;
    const usablePx = Math.floor(usableH * pxPerMm);

    const containerRect = element.getBoundingClientRect();
    const scaleFactor = canvas.width / containerRect.width;

    if (thead) {
      const thRect = thead.getBoundingClientRect();
      headerHeightPx = Math.round(thRect.height * scaleFactor);
    }
    if (invoiceHeaderEl) {
      const ihRect = invoiceHeaderEl.getBoundingClientRect();
      invoiceHeaderHeightPx = Math.round(ihRect.height * scaleFactor);
    }
    let tableStartPx = 0, tableEndPx = canvas.height;
    if (tableEl) {
      const tRect = tableEl.getBoundingClientRect();
      tableStartPx = Math.round((tRect.top - containerRect.top) * scaleFactor);
      tableEndPx = Math.round((tRect.bottom - containerRect.top) * scaleFactor);
    }
    let footerStartPx = 0, footerEndPx = canvas.height;
    if (footerBlock) {
      const fbRect = footerBlock.getBoundingClientRect();
      footerStartPx = Math.round((fbRect.top - containerRect.top) * scaleFactor);
      footerEndPx = Math.round((fbRect.bottom - containerRect.top) * scaleFactor);
    }

    const pageBreaks = [];
    let cursor = 0, pageIndex = 0;
    while (cursor < canvas.height) {
      const isCont = pageIndex > 0;
      const isTableCont = isCont && cursor > tableStartPx && cursor < tableEndPx;
      const overhead = isCont ? (invoiceHeaderHeightPx + (isTableCont ? headerHeightPx : 0)) : 0;
      const effectiveUsable = usablePx - overhead;
      let breakAt = cursor + effectiveUsable;
      if (breakAt >= canvas.height) { pageBreaks.push(canvas.height); break; }
      if (breakAt > footerStartPx && breakAt < footerEndPx && footerStartPx > cursor) breakAt = footerStartPx;
      if (breakAt <= cursor) breakAt = cursor + effectiveUsable;
      pageBreaks.push(breakAt);
      cursor = breakAt;
      pageIndex++;
    }

    const totalPages = pageBreaks.length;
    const s = settings || {};
    const footerText = `${s.address || 'M-6, Mussafah, Abu Dhabi, UAE'}  |  ${s.email || 'hire@bronzewings.ae'}`;

    for (let p = 0; p < totalPages; p++) {
      const y0 = p === 0 ? 0 : pageBreaks[p - 1];
      const isCont = p > 0;
      const isTableCont = isCont && y0 > tableStartPx && y0 < tableEndPx;
      const companyHeaderOffset = isCont ? invoiceHeaderHeightPx : 0;
      const tableHeaderOffset = (isTableCont && headerCanvas) ? headerHeightPx : 0;
      const totalHeaderOffset = companyHeaderOffset + tableHeaderOffset;
      const contentHpx = pageBreaks[p] - y0;
      if (contentHpx <= 0) break;

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = contentHpx + totalHeaderOffset;
      const ctx = sliceCanvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);

      if (companyHeaderOffset > 0 && invoiceHeaderCanvas) {
        ctx.drawImage(invoiceHeaderCanvas, 0, 0, invoiceHeaderCanvas.width, invoiceHeaderCanvas.height, 0, 0, canvas.width, invoiceHeaderHeightPx);
      }
      if (tableHeaderOffset > 0 && headerCanvas) {
        ctx.drawImage(headerCanvas, 0, 0, headerCanvas.width, headerCanvas.height, 0, companyHeaderOffset, canvas.width, headerHeightPx);
      }
      ctx.drawImage(canvas, 0, y0, canvas.width, contentHpx, 0, totalHeaderOffset, canvas.width, contentHpx);

      const totalHpx = contentHpx + totalHeaderOffset;
      const sliceData = sliceCanvas.toDataURL('image/png');
      const sliceHmm = totalHpx / pxPerMm;
      if (p > 0) pdf.addPage();
      pdf.addImage(sliceData, 'PNG', margin, margin, imgW, sliceHmm);

      // Brown frame border on every page
      pdf.setDrawColor(122, 92, 28);
      pdf.setLineWidth(0.6);
      pdf.rect(margin, margin, imgW, sliceHmm);

      // Page number footer
      pdf.setFontSize(7.5);
      pdf.setTextColor(85, 85, 85);
      pdf.text(`${footerText}  |  Page No: ${p + 1} of ${totalPages}`, pdfW / 2, pdfH - 4, { align: 'center' });
    }

    pdf.save(`invoice-${invoice.invoice_number || invoice.id || 'draft'}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}