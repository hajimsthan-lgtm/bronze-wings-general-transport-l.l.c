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
    return sum + (Number(i.amount) ?? (qty * price));
  }, 0));

  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const vatAmount = Number(invoice.vat_amount ?? (subtotal * vatRate / 100));
  const total = Number(invoice.total_amount ?? (subtotal + vatAmount));

  const rowsHtml = items.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const amt = Number(item.amount ?? (qty * unitPrice));
    const desc = normalizeRoute(item.description ?? '')
      .split('\n')
      .map(esc)
      .join('<br>');
    const itemDate = item.date ? fmtDate(item.date) : fmtDate(invoice.issue_date);
    const isLast = idx === items.length - 1;
    const rowBorder = isLast ? '2px solid #1F2937' : '1px solid #E5E7EB';
    const lineVat = amt * (vatRate / 100);

    return `<tr>
      <td style="padding:10px 8px;border-bottom:${rowBorder};text-align:center;font-size:9pt;color:#1F2937;vertical-align:top;">${idx + 1}</td>
      <td style="padding:10px 8px;border-bottom:${rowBorder};font-size:9pt;color:#1F2937;vertical-align:top;">${itemDate}</td>
      <td style="padding:10px 8px;border-bottom:${rowBorder};font-size:9pt;color:#1F2937;line-height:1.5;vertical-align:top;">${desc}</td>
      <td style="padding:10px 8px;border-bottom:${rowBorder};text-align:center;font-size:9pt;color:#1F2937;vertical-align:top;">${qty}</td>
      <td style="padding:10px 8px;border-bottom:${rowBorder};text-align:right;font-size:9pt;color:#1F2937;vertical-align:top;">${fmtMoney(unitPrice)}</td>
      <td style="padding:10px 8px;border-bottom:${rowBorder};text-align:right;font-size:9pt;color:#1F2937;font-weight:600;vertical-align:top;">${fmtMoney(amt)}</td>
      <td style="padding:10px 8px;border-bottom:${rowBorder};text-align:center;font-size:9pt;color:#1F2937;vertical-align:top;">${vatRate}%</td>
      <td style="padding:10px 8px;border-bottom:${rowBorder};text-align:right;font-size:9pt;color:#1F2937;vertical-align:top;">${fmtMoney(lineVat)}</td>
    </tr>`;
  }).join('');

  const refNumber = invoice.invoice_number || (seqNo ? `#${String(seqNo).padStart(4, '0')}` : '#0001');
  const billName = clientName || invoice.client_name || '—';

  // Split company name into brand (H1) + suffix (H2), e.g.
  // "Bronze Wings General Transport L.L.C" -> "Bronze Wings" / "General Transport L.L.C"
  const fullName = s.company_name || 'Bronze Wings General Transport L.L.C';
  const gIdx = fullName.toLowerCase().indexOf('general');
  const compH1 = gIdx >= 0 ? fullName.slice(0, gIdx).trim() : fullName;
  const compH2 = gIdx >= 0 ? fullName.slice(gIdx).trim() : '';

  return `
<div id="invoice-container" style="width:794px;min-height:1080px;font-family:'Inter','Segoe UI',Arial,Helvetica,sans-serif;font-size:10pt;color:#1F2937;line-height:1.4;background:#ffffff;box-sizing:border-box;">

  <!-- Header -->
  <div id="invoice-header" style="padding-bottom:14px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div style="display:flex;align-items:center;gap:14px;">
        ${s.logo_url ? `<img src="${esc(s.logo_url)}" style="height:60px;width:60px;border-radius:50%;object-fit:cover;" />` : ''}
        <div>
          <div style="font-size:21pt;font-weight:800;color:#2D3748;letter-spacing:0.5px;line-height:1.1;">${esc(compH1)}</div>
          ${compH2 ? `<div style="font-size:9pt;font-weight:600;color:#8C745E;letter-spacing:2px;text-transform:uppercase;margin-top:3px;">${esc(compH2)}</div>` : ''}
        </div>
      </div>
      <div style="text-align:right;font-size:9pt;color:#555;line-height:1.7;">
        ${s.phone1 ? `${esc(s.phone1)}` : ''}${s.phone2 ? `<br>${esc(s.phone2)}` : ''}
        ${s.email ? `<br>${esc(s.email)}` : ''}
        ${s.address ? `<br>${esc(s.address)}` : ''}
      </div>
    </div>
    <div style="border-bottom:2.5px solid #8C745E;margin-top:12px;"></div>
  </div>

  <!-- Tax Invoice Title + Invoice No -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin:18px 0 16px;">
    <div style="font-size:20pt;font-weight:700;color:#2D3748;letter-spacing:2px;">TAX INVOICE</div>
    <div style="text-align:right;">
      <div style="font-size:8pt;color:#888;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Invoice No.</div>
      <div style="font-size:14pt;font-weight:700;color:#8C745E;margin-top:2px;">${esc(refNumber)}</div>
    </div>
  </div>

  <!-- Meta: From | Bill To | Details -->
  <div style="display:flex;gap:14px;margin-bottom:20px;">
    <div style="flex:1;border:1px solid #E5E7EB;border-radius:6px;padding:12px 14px;">
      <div style="font-size:7.5pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #F0EAE3;">From</div>
      <div style="font-size:10pt;font-weight:700;color:#2D3748;margin-bottom:4px;">${esc(s.company_name || '')}</div>
      <div style="font-size:9pt;color:#555;line-height:1.6;">
        ${esc(s.address || '')}<br>
        ${s.trn ? `<span style="font-weight:600;color:#2D3748;">TRN:</span> ${esc(s.trn)}` : ''}
      </div>
    </div>
    <div style="flex:1;border:1px solid #E5E7EB;border-radius:6px;padding:12px 14px;">
      <div style="font-size:7.5pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #F0EAE3;">Bill To</div>
      <div style="font-size:10pt;font-weight:700;color:#2D3748;margin-bottom:4px;">${esc(billName)}</div>
      <div style="font-size:9pt;color:#555;line-height:1.6;">
        ${invoice.client_address ? `${esc(invoice.client_address)}<br>` : ''}
        ${invoice.client_trn ? `<span style="font-weight:600;color:#2D3748;">TRN:</span> ${esc(invoice.client_trn)}` : ''}
      </div>
    </div>
    <div style="width:180px;border:1px solid #E5E7EB;border-radius:6px;padding:12px 14px;">
      <div style="font-size:7.5pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1.5px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #F0EAE3;">Invoice Details</div>
      <div style="font-size:9pt;color:#555;line-height:1.9;">
        <div style="display:flex;justify-content:space-between;"><span>Date</span><span style="font-weight:600;color:#2D3748;">${fmtDate(invoice.issue_date)}</span></div>
        ${invoice.due_date ? `<div style="display:flex;justify-content:space-between;"><span>Due Date</span><span style="font-weight:600;color:#2D3748;">${fmtDate(invoice.due_date)}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;"><span>Status</span><span style="font-weight:600;color:#2D3748;text-transform:capitalize;">${esc(invoice.status || 'draft')}</span></div>
      </div>
    </div>
  </div>

  <!-- Items Table -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:9pt;">
    <thead>
      <tr>
        <th style="background:#8C745E;color:#fff;padding:10px 8px;text-align:center;width:4%;font-weight:600;font-size:8pt;text-transform:uppercase;letter-spacing:0.5px;">S.No</th>
        <th style="background:#8C745E;color:#fff;padding:10px 8px;text-align:left;width:9%;font-weight:600;font-size:8pt;text-transform:uppercase;letter-spacing:0.5px;">Date</th>
        <th style="background:#8C745E;color:#fff;padding:10px 8px;text-align:left;width:34%;font-weight:600;font-size:8pt;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
        <th style="background:#8C745E;color:#fff;padding:10px 8px;text-align:center;width:7%;font-weight:600;font-size:8pt;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
        <th style="background:#8C745E;color:#fff;padding:10px 8px;text-align:right;width:11%;font-weight:600;font-size:8pt;text-transform:uppercase;letter-spacing:0.5px;">Unit Price</th>
        <th style="background:#8C745E;color:#fff;padding:10px 8px;text-align:right;width:12%;font-weight:600;font-size:8pt;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
        <th style="background:#8C745E;color:#fff;padding:10px 8px;text-align:center;width:8%;font-weight:600;font-size:8pt;text-transform:uppercase;letter-spacing:0.5px;">VAT%</th>
        <th style="background:#8C745E;color:#fff;padding:10px 8px;text-align:right;width:15%;font-weight:600;font-size:8pt;text-transform:uppercase;letter-spacing:0.5px;">VAT Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="8" style="padding:20px 8px;text-align:center;font-size:9pt;color:#999;border:1px solid #E5E7EB;">No items</td></tr>`}
    </tbody>
  </table>

  <!-- Footer Block -->
  <div id="footer-block">

  <!-- Totals + Amount in Words -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
    <div style="width:55%;padding-right:20px;">
      <div style="font-size:7.5pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1.5px;margin-bottom:6px;">Amount in Words</div>
      <div style="font-size:9.5pt;color:#2D3748;font-weight:600;line-height:1.5;padding:10px 14px;border:1px solid #F0EAE3;border-radius:6px;background:#FDFAF6;">${numberToWords(total).toUpperCase()} ONLY</div>
      ${s.bank_name || s.bank_account || s.bank_iban ? `
      <div style="font-size:7.5pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1.5px;margin:14px 0 6px;">Bank Details</div>
      <div style="font-size:8.5pt;color:#555;line-height:1.7;">
        ${s.bank_name ? `<span style="font-weight:600;color:#2D3748;">Bank:</span> ${esc(s.bank_name)}` : ''}
        ${s.bank_account ? `<br><span style="font-weight:600;color:#2D3748;">A/C:</span> ${esc(s.bank_account)}` : ''}
        ${s.bank_iban ? `<br><span style="font-weight:600;color:#2D3748;">IBAN:</span> ${esc(s.bank_iban)}` : ''}
      </div>` : ''}
    </div>
    <div style="width:240px;">
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:9.5pt;color:#555;border-bottom:1px solid #E5E7EB;">
        <span>Sub Total</span><span style="font-weight:600;color:#2D3748;">${fmtMoney(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:9.5pt;color:#555;border-bottom:1px solid #E5E7EB;">
        <span>VAT ${vatRate}%</span><span style="font-weight:600;color:#2D3748;">${fmtMoney(vatAmount)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:12pt;color:#fff;background:#8C745E;border-radius:6px;padding:10px 14px;margin-top:4px;">
        <span>Grand Total</span><span>${fmtMoney(total)}</span>
      </div>
      <div style="text-align:right;font-size:8pt;color:#888;margin-top:4px;">All amounts in ${esc(invoice.currency || 'AED')}</div>
    </div>
  </div>

  <!-- Terms -->
  ${invoice.payment_terms || invoice.notes ? `
  <div style="margin-bottom:20px;padding:12px 14px;border:1px solid #F0EAE3;border-radius:6px;background:#FDFAF6;">
    <div style="font-size:7.5pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1.5px;margin-bottom:6px;">Terms &amp; Conditions</div>
    <div style="font-size:8.5pt;color:#555;line-height:1.6;">
      ${invoice.payment_terms ? `${esc(invoice.payment_terms)}` : ''}${invoice.notes && invoice.payment_terms ? '<br>' : ''}${invoice.notes ? `${esc(invoice.notes)}` : ''}
    </div>
  </div>` : ''}

  <!-- Signatures -->
  <div style="display:flex;justify-content:space-between;margin-top:30px;padding-top:10px;">
    <div style="width:42%;text-align:center;">
      <div style="font-size:8pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1px;margin-bottom:42px;">For ${esc(s.company_name || '')}</div>
      <div style="border-top:1.5px solid #555;width:85%;margin:0 auto;padding-top:6px;font-size:8.5pt;color:#666;">Authorized Signature &amp; Stamp</div>
    </div>
    <div style="width:42%;text-align:center;">
      <div style="font-size:8pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1px;margin-bottom:42px;">For ${esc(billName)}</div>
      <div style="border-top:1.5px solid #555;width:85%;margin:0 auto;padding-top:6px;font-size:8.5pt;color:#666;">Authorized Signature &amp; Stamp</div>
    </div>
  </div>

  </div><!-- /footer-block -->

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
    const margin = 10; // mm page margins
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