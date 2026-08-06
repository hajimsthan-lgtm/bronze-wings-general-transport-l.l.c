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
  return Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

    return `<tr>
      <td style="padding:6px 4px;border:1px solid #999;text-align:center;font-size:9pt;color:#333;">${idx + 1}</td>
      <td style="padding:6px 6px;border:1px solid #999;font-size:9pt;color:#333;line-height:1.4;">${desc}</td>
      <td style="padding:6px 4px;border:1px solid #999;text-align:center;font-size:9pt;color:#333;">${qty}</td>
      <td style="padding:6px 4px;border:1px solid #999;text-align:right;font-size:9pt;color:#333;">${fmtMoney(unitPrice)}</td>
      <td style="padding:6px 4px;border:1px solid #999;text-align:right;font-size:9pt;color:#333;">${fmtMoney(grossAmount)}</td>
      <td style="padding:6px 4px;border:1px solid #999;text-align:right;font-size:9pt;color:#333;">${fmtMoney(discount)}</td>
      <td style="padding:6px 4px;border:1px solid #999;text-align:right;font-size:9pt;color:#333;">${fmtMoney(taxableAmount)}</td>
      <td style="padding:6px 4px;border:1px solid #999;text-align:right;font-size:9pt;color:#333;">${fmtMoney(lineVat)}</td>
      <td style="padding:6px 4px;border:1px solid #999;text-align:right;font-size:9pt;color:#333;font-weight:600;">${fmtMoney(lineTotal)}</td>
    </tr>`;
  }).join('');

  const refNumber = invoice.invoice_number || (seqNo ? `#${String(seqNo).padStart(4, '0')}` : '#0001');
  const billName = clientName || invoice.client_name || '—';
  const invoiceDate = fmtDate(invoice.issue_date);
  const workingDate = fmtDate(invoice.working_date || invoice.issue_date);

  const MAROON = '#8B1538';
  const LB = '#B8D4E3';
  const LBH = '#D6E4F0';
  const DK = '#333333';
  const BD = '#999999';

  return `
<div id="invoice-container" style="width:794px;font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:${DK};line-height:1.4;background:#ffffff;box-sizing:border-box;position:relative;overflow:hidden;">

  <div style="position:absolute;top:42%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-family:Georgia,'Times New Roman',serif;font-size:72pt;font-weight:bold;color:rgba(139,21,56,0.035);letter-spacing:6px;pointer-events:none;z-index:0;white-space:nowrap;">BRONZEWINGS</div>

  <div style="position:relative;z-index:1;">

  <!-- Company Letterhead -->
  <div id="invoice-header" style="padding-bottom:8px;border-bottom:1px solid ${BD};">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div style="display:flex;align-items:center;gap:10px;">
        ${s.logo_url ? `<img src="${esc(s.logo_url)}" style="height:68px;width:68px;border-radius:50%;object-fit:cover;" />` : `<div style="height:68px;width:68px;border-radius:50%;border:2px solid ${MAROON};display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:16pt;font-weight:bold;color:${MAROON};">BW</div>`}
        ${s.tagline ? `<div style="font-size:8pt;font-style:italic;color:${MAROON};font-weight:600;max-width:85px;line-height:1.3;">${esc(s.tagline)}</div>` : ''}
      </div>
      <div style="text-align:right;flex:1;padding-left:16px;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:bold;color:${MAROON};letter-spacing:1px;text-transform:uppercase;line-height:1.1;">${esc(s.company_name || 'BRONZEWINGS GENERAL TRANSPORT L.L.C')}</div>
        <div style="font-size:8pt;font-weight:600;color:${DK};letter-spacing:0.5px;text-transform:uppercase;margin-top:4px;">General Transport, Heavy Equipment Rental &amp; Logistics Services</div>
      </div>
    </div>
    <div style="margin-top:8px;font-size:9pt;color:${DK};line-height:1.6;">
      <strong>Mobile:</strong> ${esc(s.phone1 || '')}${s.phone2 ? ` / ${esc(s.phone2)}` : ''} &nbsp;|&nbsp;
      ${s.email ? `<strong>Email:</strong> ${esc(s.email)} &nbsp;|&nbsp;` : ''}
      <strong>Address:</strong> ${esc(s.address || '')}
    </div>
    <div style="margin-top:2px;font-size:10pt;font-weight:bold;color:${MAROON};">TRN: ${esc(s.trn || '')}</div>
  </div>

  <!-- Invoice Header Bar -->
  <div style="background:${LB};padding:8px 14px;display:flex;justify-content:space-between;align-items:center;margin-top:8px;margin-bottom:10px;">
    <div style="font-size:14pt;font-weight:bold;color:#1a4a6b;text-transform:uppercase;letter-spacing:1px;">Tax Invoice</div>
    <div style="text-align:right;font-size:10pt;color:#1a4a6b;font-weight:600;line-height:1.5;">
      INVOICE #: ${esc(refNumber)}<br>DATE: ${invoiceDate}
    </div>
  </div>

  <!-- Billing & Work Details -->
  <div style="display:flex;gap:10px;margin-bottom:10px;">
    <div style="flex:1;border:1px solid ${BD};padding:8px 12px;">
      <div style="font-size:10pt;font-weight:bold;color:${DK};text-transform:uppercase;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid ${BD};">Bill To</div>
      <div style="font-size:9.5pt;color:${DK};line-height:1.7;">
        <strong>${esc(billName)}</strong><br>
        ${invoice.contact_person ? `ATT: ${esc(invoice.contact_person)}<br>` : ''}
        ${invoice.client_address ? `ADDRESS: ${esc(invoice.client_address)}<br>` : ''}
        ${invoice.client_trn ? `TRN: ${esc(invoice.client_trn)}<br>` : ''}
        ${invoice.sub ? `SUB: ${esc(invoice.sub)}<br>` : ''}
        ${invoice.reg_no ? `REG NO: ${esc(invoice.reg_no)}<br>` : ''}
      </div>
    </div>
    <div style="width:190px;border:1px solid ${BD};padding:8px 12px;">
      <div style="font-size:10pt;font-weight:bold;color:${DK};text-transform:uppercase;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid ${BD};">Invoice</div>
      <div style="font-size:9.5pt;color:${DK};line-height:1.9;">
        <div><strong>INVOICE:</strong> ${esc(refNumber)}</div>
        <div><strong>DATE:</strong> ${invoiceDate}</div>
        <div><strong>WORKING DATE:</strong> ${workingDate}</div>
      </div>
    </div>
  </div>

  <!-- Line Items Table -->
  <table style="width:100%;border-collapse:collapse;font-size:9pt;">
    <thead>
      <tr>
        <th style="background:${LBH};border:1px solid ${BD};padding:6px 3px;text-align:center;font-weight:bold;font-size:8pt;color:${DK};width:3%;">#</th>
        <th style="background:${LBH};border:1px solid ${BD};padding:6px 5px;text-align:left;font-weight:bold;font-size:8pt;color:${DK};width:25%;">Description</th>
        <th style="background:${LBH};border:1px solid ${BD};padding:6px 3px;text-align:center;font-weight:bold;font-size:8pt;color:${DK};width:5%;">Qty</th>
        <th style="background:${LBH};border:1px solid ${BD};padding:6px 3px;text-align:right;font-weight:bold;font-size:8pt;color:${DK};width:10%;">Unit Price (AED)</th>
        <th style="background:${LBH};border:1px solid ${BD};padding:6px 3px;text-align:right;font-weight:bold;font-size:8pt;color:${DK};width:10%;">Total Amount</th>
        <th style="background:${LBH};border:1px solid ${BD};padding:6px 3px;text-align:right;font-weight:bold;font-size:8pt;color:${DK};width:8%;">Discount</th>
        <th style="background:${LBH};border:1px solid ${BD};padding:6px 3px;text-align:right;font-weight:bold;font-size:8pt;color:${DK};width:10%;">Tax Amount</th>
        <th style="background:${LBH};border:1px solid ${BD};padding:6px 3px;text-align:right;font-weight:bold;font-size:8pt;color:${DK};width:9%;">VAT 5%</th>
        <th style="background:${LBH};border:1px solid ${BD};padding:6px 3px;text-align:right;font-weight:bold;font-size:8pt;color:${DK};width:10%;">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="9" style="padding:14px;border:1px solid ${BD};text-align:center;font-size:9pt;color:#999;">No items</td></tr>`}
    </tbody>
    <tfoot>
      <tr style="background:${LBH};">
        <td colspan="4" style="padding:6px 5px;border:1px solid ${BD};font-weight:bold;font-size:9pt;color:${DK};text-align:right;">AED.</td>
        <td style="padding:6px 3px;border:1px solid ${BD};font-weight:bold;font-size:9pt;color:${DK};text-align:right;">${fmtMoney(subtotal)}</td>
        <td style="padding:6px 3px;border:1px solid ${BD};font-weight:bold;font-size:9pt;color:${DK};text-align:right;">${fmtMoney(totalDiscount)}</td>
        <td style="padding:6px 3px;border:1px solid ${BD};font-weight:bold;font-size:9pt;color:${DK};text-align:right;">${fmtMoney(totalTaxable)}</td>
        <td style="padding:6px 3px;border:1px solid ${BD};font-weight:bold;font-size:9pt;color:${DK};text-align:right;">${fmtMoney(vatAmount)}</td>
        <td style="padding:6px 3px;border:1px solid ${BD};font-weight:bold;font-size:10pt;color:${MAROON};text-align:right;">${fmtMoney(total)}</td>
      </tr>
    </tfoot>
  </table>

  <!-- Amount in Words -->
  <div style="background:#F0F0F0;border-top:1px solid ${BD};border-bottom:1px solid ${BD};padding:7px 12px;margin-top:6px;display:flex;align-items:center;gap:6px;">
    <span style="font-weight:bold;font-size:10pt;color:${DK};">AED.</span>
    <span style="font-size:10pt;color:${DK};font-weight:600;">${numberToWords(total).toUpperCase()} DHS ONLY</span>
  </div>

  <!-- Footer Block -->
  <div id="footer-block" style="margin-top:14px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
    <div style="width:50%;">
      <div style="font-size:10pt;font-weight:bold;color:${DK};text-transform:uppercase;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid ${BD};">Bank Details</div>
      <div style="font-size:9pt;color:${DK};line-height:1.7;">
        <strong>Bank:</strong> ${esc(s.bank_name || 'Abu Dhabi Commercial Bank (ADCB)')}<br>
        <strong>Account Title:</strong> ${esc(s.bank_account_title || s.company_name || '')}<br>
        <strong>Account No:</strong> ${esc(s.bank_account_no || '')}<br>
        <strong>IBAN #</strong> ${esc(s.bank_iban || '')}<br>
        <strong>Branch:</strong> ${esc(s.bank_branch || 'Main Branch')}
      </div>
    </div>
    <div style="width:42%;text-align:center;">
      <div style="font-size:10pt;font-weight:bold;color:${DK};text-transform:uppercase;margin-bottom:4px;">For ${esc(s.company_name || 'BRONZEWINGS GENERAL TRANSPORT L.L.C')}</div>
      <div style="width:80px;height:80px;border:2px solid ${MAROON};border-radius:50%;margin:6px auto 2px;display:flex;align-items:center;justify-content:center;font-size:7pt;color:${MAROON};font-weight:bold;text-align:center;line-height:1.3;opacity:0.35;">COMPANY<br>STAMP</div>
      <div style="border-top:1px solid #555;width:75%;margin:6px auto 2px;padding-top:3px;font-size:9pt;color:#666;">Authorized Signature</div>
      <div style="font-size:9pt;color:${DK};margin-top:1px;">Mobile: ${esc(s.phone1 || '050-8655601')}</div>
    </div>
  </div>
  <div style="text-align:center;margin-top:14px;font-size:11pt;font-weight:bold;color:${MAROON};text-transform:uppercase;letter-spacing:1px;">Thanks for Doing Business with Us!</div>
  </div><!-- /footer-block -->

  <!-- Bottom maroon banner -->
  <div style="background:${MAROON};color:#fff;text-align:center;padding:5px 14px;font-size:8.5pt;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-top:10px;">
    General Transport &middot; Heavy Equipment Rental &middot; Logistics &middot; Cold Chain Solutions
  </div>

  </div><!-- /content -->

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
    const margin = 15; // mm page margins
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

      // Page number footer
      pdf.setFontSize(8);
      pdf.setTextColor(130, 130, 130);
      pdf.text(`Page ${p + 1} of ${totalPages}`, pdfW / 2, pdfH - 4, { align: 'center' });
    }

    pdf.save(`invoice-${invoice.invoice_number || invoice.id}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}