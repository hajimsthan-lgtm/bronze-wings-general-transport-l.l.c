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
    const rowBorder = isLast ? '2px solid #333' : '1px solid #ddd';

    return `<tr>
      <td style="padding:10px 6px;border-bottom:${rowBorder};text-align:center;font-size:9pt;color:#333;vertical-align:top;">${idx + 1}</td>
      <td style="padding:10px 6px;border-bottom:${rowBorder};font-size:9pt;color:#333;vertical-align:top;">${itemDate}</td>
      <td style="padding:10px 6px;border-bottom:${rowBorder};font-size:9pt;color:#333;line-height:1.5;vertical-align:top;">${desc}</td>
      <td style="padding:10px 6px;border-bottom:${rowBorder};text-align:center;font-size:9pt;color:#333;vertical-align:top;">${qty}</td>
      <td style="padding:10px 6px;border-bottom:${rowBorder};text-align:right;font-size:9pt;color:#333;vertical-align:top;">${fmtMoney(unitPrice)}</td>
      <td style="padding:10px 6px;border-bottom:${rowBorder};text-align:right;font-size:9pt;color:#333;font-weight:600;vertical-align:top;">${fmtMoney(amt)}</td>
    </tr>`;
  }).join('');

  const refNumber = invoice.invoice_number || (seqNo ? `#${String(seqNo).padStart(4, '0')}` : '#0001');
  const billName = clientName || invoice.client_name || '—';

  return `
<div id="invoice-container" style="width:794px;min-height:1123px;display:flex;flex-direction:column;font-family:'Segoe UI',Arial,Helvetica,sans-serif;font-size:10pt;color:#333;line-height:1.4;background:#ffffff;box-sizing:border-box;padding:40px 50px;">

  <!-- Header Row: Company (left) | TAX INVOICE (center) | Bill To (right) -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;border-bottom:2px solid #8B7355;padding-bottom:10px;">
    <div style="flex:1;text-align:left;">
      ${s.logo_url ? `<img src="${esc(s.logo_url)}" style="width:55px;height:55px;margin-bottom:4px;border-radius:50%;object-fit:cover;" />` : ''}
      <div style="font-size:13pt;font-weight:700;color:#5C4A32;margin-bottom:2px;">${esc(s.company_name || '')}</div>
      <div style="font-size:8.5pt;color:#666;line-height:1.5;">
        ${esc(s.address || '')}<br>
        TRN: ${esc(s.trn || '')}<br>
        ${esc(s.phone1 || '')} | ${esc(s.email || '')}
      </div>
    </div>
    <div style="flex:1;text-align:center;display:flex;flex-direction:column;justify-content:center;align-items:center;padding-top:10px;">
      <div style="font-size:18pt;font-weight:700;color:#5C4A32;letter-spacing:3px;text-transform:uppercase;margin:0;">TAX INVOICE</div>
      <div style="font-size:10pt;color:#8B7355;margin-top:4px;font-weight:600;">${esc(refNumber)}</div>
      <div style="font-size:9pt;color:#888;margin-top:2px;">${fmtDate(invoice.issue_date)}</div>
    </div>
    <div style="flex:1;text-align:right;padding-top:5px;">
      <div style="font-size:8pt;text-transform:uppercase;color:#8B7355;font-weight:600;letter-spacing:1px;margin-bottom:3px;">Bill To</div>
      <div style="font-size:12pt;font-weight:700;color:#333;margin-bottom:2px;">${esc(billName)}</div>
      ${invoice.client_trn ? `<div style="font-size:9pt;color:#666;">TRN: ${esc(invoice.client_trn)}</div>` : ''}
      ${invoice.due_date ? `<div style="font-size:9pt;color:#666;margin-top:4px;">Due Date: ${fmtDate(invoice.due_date)}</div>` : ''}
    </div>
  </div>

  <!-- Items Table -->
  <table style="width:100%;border-collapse:collapse;margin-top:15px;margin-bottom:15px;font-size:9pt;">
    <thead>
      <tr>
        <th style="background:#8B7355;color:#fff;padding:8px 6px;text-align:center;width:5%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">S.No</th>
        <th style="background:#8B7355;color:#fff;padding:8px 6px;text-align:left;width:12%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Date</th>
        <th style="background:#8B7355;color:#fff;padding:8px 6px;text-align:left;width:46%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Description</th>
        <th style="background:#8B7355;color:#fff;padding:8px 6px;text-align:center;width:10%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Trip Qty</th>
        <th style="background:#8B7355;color:#fff;padding:8px 6px;text-align:right;width:13%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Per Trip</th>
        <th style="background:#8B7355;color:#fff;padding:8px 6px;text-align:right;width:14%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="6" style="padding:10px 6px;text-align:center;font-size:9pt;color:#999;">No items</td></tr>`}
    </tbody>
  </table>

  <!-- Totals Section: Amount in Words (left) | Totals (right) -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-top:15px;margin-bottom:20px;">
    <div style="flex:1;padding-right:20px;">
      <div style="font-size:8pt;text-transform:uppercase;color:#8B7355;font-weight:600;letter-spacing:1px;margin-bottom:4px;">Amount in Words</div>
      <div style="font-size:9pt;color:#333;font-weight:600;line-height:1.5;">${numberToWords(total).toUpperCase()}</div>
    </div>
    <div style="width:220px;">
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:9.5pt;border-bottom:1px solid #ddd;">
        <span>Sub Total</span><span>${fmtMoney(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:9.5pt;border-bottom:1px solid #ddd;">
        <span>Vat ${vatRate}%</span><span>${fmtMoney(vatAmount)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:11pt;border-top:2px solid #333;padding-top:6px;margin-top:2px;">
        <span>Total</span><span>${fmtMoney(total)}</span>
      </div>
    </div>
  </div>

  <!-- Signatures -->
  <div style="display:flex;justify-content:space-between;margin-top:50px;padding-top:20px;border-top:1px solid #ddd;">
    <div style="width:45%;text-align:center;">
      <div style="font-size:8pt;text-transform:uppercase;color:#8B7355;font-weight:600;letter-spacing:1px;margin-bottom:35px;">For ${esc(s.company_name || 'Bronze Wings General Transport L.L.C')}</div>
      <div style="border-top:1px solid #333;width:80%;margin:0 auto;padding-top:6px;font-size:9pt;color:#666;">Authorized Signature &amp; Stamp</div>
    </div>
    <div style="width:45%;text-align:center;">
      <div style="font-size:8pt;text-transform:uppercase;color:#8B7355;font-weight:600;letter-spacing:1px;margin-bottom:35px;">For ${esc(billName)}</div>
      <div style="border-top:1px solid #333;width:80%;margin:0 auto;padding-top:6px;font-size:9pt;color:#666;">Authorized Signature &amp; Stamp</div>
    </div>
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
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const imgW = pdfW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
    heightLeft -= pdfH;

    while (heightLeft > 0) {
      position -= pdfH;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
      heightLeft -= pdfH;
    }

    pdf.save(`invoice-${invoice.invoice_number || invoice.id}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}