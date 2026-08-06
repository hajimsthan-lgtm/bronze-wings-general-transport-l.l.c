import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { numberToWords } from './numberToWords';

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function fmtMoney(n) {
  return Number(n ?? 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Fix: "Dubai !' Fujairah" → "Dubai-Fujairah"
function normalizeRoute(str) {
  return String(str ?? '')
    .replace(/\s*->\s*/g, ' → ')
    .replace(/(\w{2,})\s*[!'‘’]+\s*(\w{2,})/g, '$1-$2')
    .replace(/(\w{2,})\s*[–—]\s*(\w{2,})/g, '$1-$2')
    .replace(/-{2,}/g, '-');
}

export function buildInvoiceHTML(invoice, clientName, settings = {}, seqNo) {
  const s = settings;
  const items = invoice.line_items || [];

  const subtotal = Number(invoice.subtotal ?? items.reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const price = Number(i.unit_price) || 0;
    return sum + (Number(i.amount ?? (qty * price)));
  }, 0));

  const totalDiscount = items.reduce((sum, i) => sum + (Number(i.discount) || 0), 0);
  const totalTaxable = subtotal - totalDiscount;

  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const vatAmount = Number(invoice.vat_amount ?? (totalTaxable * vatRate / 100));
  const total = Number(invoice.total_amount ?? (totalTaxable + vatAmount));

  const rowsHtml = items.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const grossAmount = Number(item.amount ?? (qty * unitPrice));
    const discount = Number(item.discount) || 0;
    const taxableAmount = grossAmount - discount;
    const lineVat = taxableAmount * (vatRate / 100);
    const lineTotal = taxableAmount + lineVat;
    const desc = normalizeRoute(item.description ?? '')
      .split('\n')
      .map(esc)
      .join('<br>');
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f9fbfd';
    const nf = "font-family:Consolas,'Courier New',monospace;";

    return `<tr style="background:${rowBg};">
      <td style="padding:6px 4px;border:1px solid #bbb;text-align:center;font-size:9pt;color:#333;">${idx + 1}</td>
      <td style="padding:6px 8px;border:1px solid #bbb;font-size:9pt;color:#333;line-height:1.4;min-width:220px;word-wrap:break-word;overflow-wrap:break-word;">${desc}</td>
      <td style="padding:6px 4px;border:1px solid #bbb;text-align:center;font-size:9pt;color:#333;${nf}">${qty}</td>
      <td style="padding:6px 4px;border:1px solid #bbb;text-align:right;font-size:9pt;color:#333;${nf}">${fmtMoney(unitPrice)}</td>
      <td style="padding:6px 4px;border:1px solid #bbb;text-align:right;font-size:9pt;color:#333;${nf}">${fmtMoney(grossAmount)}</td>
      <td style="padding:6px 4px;border:1px solid #bbb;text-align:right;font-size:9pt;color:#333;${nf}">${fmtMoney(discount)}</td>
      <td style="padding:6px 4px;border:1px solid #bbb;text-align:right;font-size:9pt;color:#333;${nf}">${fmtMoney(taxableAmount)}</td>
      <td style="padding:6px 4px;border:1px solid #bbb;text-align:right;font-size:9pt;color:#333;${nf}">${fmtMoney(lineVat)}</td>
      <td style="padding:6px 4px;border:1px solid #bbb;text-align:right;font-size:9pt;color:#333;font-weight:600;${nf}">${fmtMoney(lineTotal)}</td>
    </tr>`;
  }).join('');

  const refNumber = invoice.invoice_number || (seqNo ? `#${String(seqNo).padStart(4, '0')}` : '#0001');
  const billName = clientName || invoice.client_name || '—';
  const invoiceDate = fmtDate(invoice.issue_date);
  const workingDate = fmtDate(invoice.working_date || invoice.issue_date);

  const MAROON = '#8B1538';
  const DARK_MAROON = '#6B0F2A';
  const LB = '#B8D4E3';
  const LBH = '#D6E4F0';
  const DK = '#333333';
  const DBLUE = '#1a3a5c';
  const nf2 = "font-family:Consolas,'Courier New',monospace;";

  // Build bank details lines — only show fields that have real data
  const bankLines = [];
  if (s.bank_name) bankLines.push(`<div><strong>Bank:</strong> ${esc(s.bank_name)}</div>`);
  if (s.bank_account_title || s.company_name) bankLines.push(`<div><strong>Account Title:</strong> ${esc(s.bank_account_title || s.company_name)}</div>`);
  if (s.bank_account_no) bankLines.push(`<div><strong>Account No:</strong> ${esc(s.bank_account_no)}</div>`);
  if (s.bank_iban) bankLines.push(`<div><strong>IBAN #</strong> ${esc(s.bank_iban)}</div>`);
  if (s.bank_branch) bankLines.push(`<div><strong>Branch:</strong> ${esc(s.bank_branch)}</div>`);
  const bankHtml = bankLines.length > 0
    ? `<div style="font-size:9pt;color:#000;line-height:1.8;">${bankLines.join('')}</div>`
    : `<div style="font-size:9pt;color:#999;font-style:italic;">Bank details available upon request</div>`;

  return `
<div id="invoice-container" style="width:794px;min-height:1123px;display:flex;flex-direction:column;font-family:'Segoe UI',Arial,Helvetica,sans-serif;font-size:10pt;color:${DK};line-height:1.4;background:#ffffff;box-sizing:border-box;border:1px solid #ddd;padding:8px;position:relative;overflow:hidden;">

  <!-- Watermark -->
  <div style="position:absolute;top:48%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:72pt;color:${MAROON};opacity:0.03;font-weight:bold;font-family:Georgia,serif;pointer-events:none;z-index:0;white-space:nowrap;letter-spacing:8px;">BRONZEWINGS</div>

  <!-- Company Letterhead -->
  <div id="invoice-header" style="position:relative;z-index:1;padding-bottom:8px;border-bottom:2px solid ${MAROON};">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div style="display:flex;align-items:center;gap:12px;">
        ${s.logo_url ? `<img src="${esc(s.logo_url)}" style="height:80px;width:80px;border-radius:50%;object-fit:cover;" />` : `<div style="height:80px;width:80px;border-radius:50%;border:2px solid ${MAROON};display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:18pt;font-weight:bold;color:${MAROON};">BW</div>`}
        ${s.tagline ? `<div style="font-size:8pt;font-style:italic;color:#666;font-weight:600;max-width:90px;line-height:1.3;letter-spacing:3px;text-transform:uppercase;">${esc(s.tagline)}</div>` : ''}
      </div>
      <div style="text-align:right;flex:1;padding-left:16px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:24pt;font-weight:bold;color:${MAROON};letter-spacing:4px;text-transform:uppercase;line-height:1.1;">${esc(s.company_name || 'BRONZEWINGS GENERAL TRANSPORT L.L.C')}</div>
        <div style="font-size:8pt;font-weight:600;color:#666;letter-spacing:3px;text-transform:uppercase;margin-top:5px;">General Transport &middot; Heavy Equipment Rental &middot; Logistics Services</div>
      </div>
    </div>
    <div style="margin-top:8px;font-size:9pt;color:#555;line-height:1.6;">
      <strong>Mobile:</strong> ${esc(s.phone1 || '')}${s.phone2 ? ` / ${esc(s.phone2)}` : ''} &nbsp;|&nbsp;
      ${s.email ? `<strong>Email:</strong> ${esc(s.email)} &nbsp;|&nbsp;` : ''}
      <strong>Address:</strong> ${esc(s.address || '')}
    </div>
    <div style="margin-top:2px;font-size:10pt;font-weight:bold;color:${MAROON};">TRN: ${esc(s.trn || '')}</div>
  </div>

  <!-- Tax Invoice Banner -->
  <div style="position:relative;z-index:1;background:linear-gradient(90deg,${LB} 0%,${LBH} 100%);padding:8px 14px;display:flex;justify-content:space-between;align-items:center;margin-top:8px;margin-bottom:10px;">
    <div style="font-size:14pt;font-weight:bold;color:${DBLUE};text-transform:uppercase;letter-spacing:1px;text-shadow:0 1px 0 rgba(255,255,255,0.5);">Tax Invoice</div>
    <div style="text-align:right;font-size:10pt;color:${DBLUE};font-weight:bold;line-height:1.5;">
      INVOICE #: ${esc(refNumber)}<br>DATE: ${invoiceDate}
    </div>
  </div>

  <!-- Billing & Work Details -->
  <div style="position:relative;z-index:1;display:flex;gap:0;margin-bottom:10px;border:1px solid #ccc;">
    <div style="flex:1;padding:12px;border-right:1px solid #ccc;">
      <div style="font-size:10pt;font-weight:bold;color:${MAROON};text-transform:uppercase;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid #ccc;">Bill To</div>
      <div style="font-size:9pt;color:#000;line-height:1.6;">
        <div style="margin-bottom:2px;"><strong style="font-size:10pt;">${esc(billName)}</strong></div>
        ${invoice.contact_person ? `<div style="margin-bottom:1px;"><span style="font-size:8pt;color:#555;font-weight:bold;">ATT:</span> <span style="font-size:9pt;color:#000;">${esc(invoice.contact_person)}</span></div>` : ''}
        ${invoice.client_address ? `<div style="margin-bottom:1px;"><span style="font-size:8pt;color:#555;font-weight:bold;">ADDRESS:</span> <span style="font-size:9pt;color:#000;">${esc(invoice.client_address)}</span></div>` : ''}
        ${invoice.client_trn ? `<div style="margin-bottom:1px;"><span style="font-size:8pt;color:#555;font-weight:bold;">TRN:</span> <span style="font-size:9pt;color:#000;">${esc(invoice.client_trn)}</span></div>` : ''}
        ${invoice.sub ? `<div style="margin-bottom:1px;"><span style="font-size:8pt;color:#555;font-weight:bold;">SUB:</span> <span style="font-size:9pt;color:#000;">${esc(invoice.sub)}</span></div>` : ''}
        ${invoice.reg_no ? `<div style="margin-bottom:1px;"><span style="font-size:8pt;color:#555;font-weight:bold;">REG NO:</span> <span style="font-size:9pt;color:#000;">${esc(invoice.reg_no)}</span></div>` : ''}
      </div>
    </div>
    <div style="width:200px;padding:12px;">
      <div style="font-size:10pt;font-weight:bold;color:${MAROON};text-transform:uppercase;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid #ccc;">Invoice</div>
      <div style="font-size:9pt;color:#000;line-height:1.9;">
        <div><strong>INVOICE:</strong> ${esc(refNumber)}</div>
        <div><strong>DATE:</strong> ${invoiceDate}</div>
        <div><strong>WORKING DATE:</strong> ${workingDate}</div>
      </div>
    </div>
  </div>

  <!-- Line Items Table -->
  <div style="position:relative;z-index:1;">
  <table style="width:100%;border-collapse:collapse;font-size:9pt;table-layout:fixed;">
    <thead>
      <tr>
        <th style="background:${LBH};border:1px solid #bbb;padding:8px 3px;text-align:center;font-weight:bold;font-size:8.5pt;color:${DBLUE};text-transform:uppercase;letter-spacing:0.5px;width:4%;">#</th>
        <th style="background:${LBH};border:1px solid #bbb;padding:8px 6px;text-align:left;font-weight:bold;font-size:8.5pt;color:${DBLUE};text-transform:uppercase;letter-spacing:0.5px;width:32%;">Description</th>
        <th style="background:${LBH};border:1px solid #bbb;padding:8px 3px;text-align:center;font-weight:bold;font-size:8.5pt;color:${DBLUE};text-transform:uppercase;letter-spacing:0.5px;width:7%;">Qty</th>
        <th style="background:${LBH};border:1px solid #bbb;padding:8px 3px;text-align:right;font-weight:bold;font-size:8.5pt;color:${DBLUE};text-transform:uppercase;letter-spacing:0.5px;width:11%;">Unit Price (AED)</th>
        <th style="background:${LBH};border:1px solid #bbb;padding:8px 3px;text-align:right;font-weight:bold;font-size:8.5pt;color:${DBLUE};text-transform:uppercase;letter-spacing:0.5px;width:11%;">Total Amount</th>
        <th style="background:${LBH};border:1px solid #bbb;padding:8px 3px;text-align:right;font-weight:bold;font-size:8.5pt;color:${DBLUE};text-transform:uppercase;letter-spacing:0.5px;width:9%;">Discount</th>
        <th style="background:${LBH};border:1px solid #bbb;padding:8px 3px;text-align:right;font-weight:bold;font-size:8.5pt;color:${DBLUE};text-transform:uppercase;letter-spacing:0.5px;width:11%;">Tax Amount</th>
        <th style="background:${LBH};border:1px solid #bbb;padding:8px 3px;text-align:right;font-weight:bold;font-size:8.5pt;color:${DBLUE};text-transform:uppercase;letter-spacing:0.5px;width:9%;">VAT 5%</th>
        <th style="background:${LBH};border:1px solid #bbb;padding:8px 3px;text-align:right;font-weight:bold;font-size:8.5pt;color:${DBLUE};text-transform:uppercase;letter-spacing:0.5px;width:11%;">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="9" style="padding:14px;border:1px solid #bbb;text-align:center;font-size:9pt;color:#999;">No items</td></tr>`}
    </tbody>
    <tfoot>
      <tr style="background:${LBH};">
        <td colspan="4" style="padding:8px 5px;border:1px solid #bbb;border-top:2px solid ${DBLUE};font-weight:bold;font-size:9pt;color:${DK};text-align:right;">AED</td>
        <td style="padding:8px 3px;border:1px solid #bbb;border-top:2px solid ${DBLUE};font-weight:bold;font-size:9pt;color:${DK};text-align:right;${nf2}">${fmtMoney(subtotal)}</td>
        <td style="padding:8px 3px;border:1px solid #bbb;border-top:2px solid ${DBLUE};font-weight:bold;font-size:9pt;color:${DK};text-align:right;${nf2}">${fmtMoney(totalDiscount)}</td>
        <td style="padding:8px 3px;border:1px solid #bbb;border-top:2px solid ${DBLUE};font-weight:bold;font-size:9pt;color:${DK};text-align:right;${nf2}">${fmtMoney(totalTaxable)}</td>
        <td style="padding:8px 3px;border:1px solid #bbb;border-top:2px solid ${DBLUE};font-weight:bold;font-size:9pt;color:${DK};text-align:right;${nf2}">${fmtMoney(vatAmount)}</td>
        <td style="padding:8px 3px;border:1px solid #bbb;border-top:2px solid ${DBLUE};font-weight:bold;font-size:10pt;color:${MAROON};text-align:right;${nf2}">${fmtMoney(total)}</td>
      </tr>
    </tfoot>
  </table>
  </div>

  <!-- Amount in Words -->
  <div style="position:relative;z-index:1;background:#F8F8F8;border-top:1px solid #E0E0E0;border-bottom:1px solid #E0E0E0;padding:10px 16px;margin-top:6px;">
    <span style="font-weight:bold;font-size:10pt;color:${MAROON};">AED </span>
    <span style="font-size:10pt;color:#000;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">${numberToWords(total).toUpperCase()}</span>
  </div>

  <!-- Footer Block -->
  <div id="footer-block" style="position:relative;z-index:1;margin-top:14px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
    <!-- Bank Details -->
    <div style="width:50%;">
      <div style="font-size:10pt;font-weight:bold;color:${MAROON};text-transform:uppercase;margin-bottom:6px;padding-bottom:3px;border-bottom:2px solid ${MAROON};">Bank Details</div>
      ${bankHtml}
    </div>
    <!-- Authorization -->
    <div style="width:42%;text-align:center;">
      <div style="width:90px;height:90px;border:2px solid ${MAROON};border-radius:50%;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;position:relative;">
        <div style="position:absolute;inset:5px;border:1px dashed ${MAROON};border-radius:50%;"></div>
        <div style="text-align:center;font-size:7pt;color:${MAROON};font-weight:bold;line-height:1.4;position:relative;">BRONZEWINGS<br>GENERAL<br>TRANSPORT<br>L.L.C<br>&mdash;&mdash;<br>ABU DHABI<br>- U.A.E</div>
      </div>
      <div style="font-size:9pt;font-weight:bold;color:${MAROON};margin-top:4px;">FOR ${esc(s.company_name || 'BRONZEWINGS GENERAL TRANSPORT L.L.C')}</div>
      <div style="border-top:1px solid #999;width:120px;margin:8px auto 4px;padding-top:3px;font-size:9pt;color:#666;">Authorized Signature</div>
      <div style="font-size:9pt;color:${DK};margin-top:1px;">Mobile: ${esc(s.phone1 || '050-8655601')}</div>
    </div>
  </div>
  </div><!-- /footer-block -->

  <!-- Spacer pushes footer banners to bottom -->
  <div style="flex:1 1 auto;"></div>

  <!-- Footer Banners -->
  <div style="position:relative;z-index:1;background:${MAROON};color:#fff;text-align:center;padding:10px 14px;font-size:11pt;font-weight:bold;text-transform:uppercase;margin-top:14px;">
    Thanks for Doing Business with Us!
  </div>
  <div style="position:relative;z-index:1;background:${DARK_MAROON};color:#fff;text-align:center;padding:6px 14px;font-size:8pt;text-transform:uppercase;letter-spacing:3px;">
    General Transport &middot; Heavy Equipment Rental &middot; Logistics &middot; Cold Chain Solutions
  </div>

</div>`;
}

async function fetchLogoDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadInvoicePDF(invoice, clientName, settings = {}, seqNo) {
  let logoDataUrl = null;
  if (settings.logo_url) {
    try { logoDataUrl = await fetchLogoDataUrl(settings.logo_url); } catch (e) {}
  }
  const html = buildInvoiceHTML(invoice, clientName, { ...settings, logo_url: logoDataUrl || settings.logo_url }, seqNo);
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  try {
    const element = wrapper.querySelector('#invoice-container');
    const footerBlock = wrapper.querySelector('#footer-block');
    const thead = wrapper.querySelector('thead');
    const tableEl = wrapper.querySelector('table');

    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Capture the table header separately so it can be repeated on every continuation page
    let headerCanvas = null;
    let headerHeightPx = 0;
    if (thead) {
      headerCanvas = await html2canvas(thead, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        logging: false,
      });
    }

    // Capture the company header (logo, brand, title, meta) so it repeats on every page
    const invoiceHeaderEl = wrapper.querySelector('#invoice-header');
    let invoiceHeaderCanvas = null;
    let invoiceHeaderHeightPx = 0;
    if (invoiceHeaderEl) {
      invoiceHeaderCanvas = await html2canvas(invoiceHeaderEl, {
        scale: 1.5,
        backgroundColor: '#ffffff',
        logging: false,
      });
    }

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const margin = 12; // mm page margins
    const footerH = 10; // mm reserved at the bottom for the page number
    const usableH = pdfH - 2 * margin - footerH;
    const imgW = pdfW - 2 * margin;
    const pxPerMm = canvas.width / imgW;
    const usablePx = Math.floor(usableH * pxPerMm);

    const containerRect = element.getBoundingClientRect();
    const scaleFactor = canvas.width / containerRect.width;

    // Measure the table header height in main-canvas coordinates
    if (thead) {
      const thRect = thead.getBoundingClientRect();
      headerHeightPx = Math.round(thRect.height * scaleFactor);
    }

    // Measure the company header height in main-canvas coordinates
    if (invoiceHeaderEl) {
      const ihRect = invoiceHeaderEl.getBoundingClientRect();
      invoiceHeaderHeightPx = Math.round(ihRect.height * scaleFactor);
    }

    // Measure the table body area (for detecting continuation pages)
    let tableStartPx = 0;
    let tableEndPx = canvas.height;
    if (tableEl) {
      const tRect = tableEl.getBoundingClientRect();
      tableStartPx = Math.round((tRect.top - containerRect.top) * scaleFactor);
      tableEndPx = Math.round((tRect.bottom - containerRect.top) * scaleFactor);
    }

    // Measure the footer block (totals + signatures) so we never split it across pages.
    let footerStartPx = 0;
    let footerEndPx = canvas.height;
    if (footerBlock) {
      const fbRect = footerBlock.getBoundingClientRect();
      footerStartPx = Math.round((fbRect.top - containerRect.top) * scaleFactor);
      footerEndPx = Math.round((fbRect.bottom - containerRect.top) * scaleFactor);
    }

    // Build page break boundaries.
    // - Footer block never splits: if a break lands inside it, push to footer start.
    // - Table continuation pages (page 2+ starting inside the table) have less usable
    //   height because the repeating header occupies the top.
    const pageBreaks = [];
    let cursor = 0;
    let pageIndex = 0;
    while (cursor < canvas.height) {
      const isCont = pageIndex > 0;
      const isTableCont = isCont && cursor > tableStartPx && cursor < tableEndPx;
      const overhead = isCont ? (invoiceHeaderHeightPx + (isTableCont ? headerHeightPx : 0)) : 0;
      const effectiveUsable = usablePx - overhead;

      let breakAt = cursor + effectiveUsable;
      if (breakAt >= canvas.height) {
        pageBreaks.push(canvas.height);
        break;
      }
      // If this break lands inside the footer block, move it to the footer start
      if (breakAt > footerStartPx && breakAt < footerEndPx && footerStartPx > cursor) {
        breakAt = footerStartPx;
      }
      if (breakAt <= cursor) breakAt = cursor + effectiveUsable; // safety: always progress
      pageBreaks.push(breakAt);
      cursor = breakAt;
      pageIndex++;
    }

    const totalPages = pageBreaks.length;

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

      // Draw repeating company header at the top of every continuation page
      if (companyHeaderOffset > 0 && invoiceHeaderCanvas) {
        ctx.drawImage(invoiceHeaderCanvas, 0, 0, invoiceHeaderCanvas.width, invoiceHeaderCanvas.height, 0, 0, canvas.width, invoiceHeaderHeightPx);
      }

      // Draw repeating table header at the top of table continuation pages
      if (tableHeaderOffset > 0 && headerCanvas) {
        ctx.drawImage(headerCanvas, 0, 0, headerCanvas.width, headerCanvas.height, 0, companyHeaderOffset, canvas.width, headerHeightPx);
      }

      // Draw the page content (shifted down by totalHeaderOffset)
      ctx.drawImage(canvas, 0, y0, canvas.width, contentHpx, 0, totalHeaderOffset, canvas.width, contentHpx);

      const totalHpx = contentHpx + totalHeaderOffset;
      const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);
      const sliceHmm = totalHpx / pxPerMm;
      if (p > 0) pdf.addPage();
      pdf.addImage(sliceData, 'JPEG', margin, margin, imgW, sliceHmm);

      // Page number footer (only for multi-page invoices)
      if (totalPages > 1) {
        pdf.setFontSize(8);
        pdf.setTextColor(130, 130, 130);
        pdf.text(`Page ${p + 1} of ${totalPages}`, pdfW / 2, pdfH - 4, { align: 'center' });
      }
    }

    pdf.save(`invoice-${invoice.invoice_number || invoice.id}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}