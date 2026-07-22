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

    return `<tr style="background:#ffffff;">
      <td style="padding:7px 5px;border-bottom:1px solid #e5e5e5;text-align:center;font-size:9px;color:#333;">${idx + 1}</td>
      <td style="padding:7px 5px;border-bottom:1px solid #e5e5e5;text-align:center;font-size:9px;color:#333;">${itemDate}</td>
      <td style="padding:7px 9px;border-bottom:1px solid #e5e5e5;text-align:left;font-size:9px;color:#333;line-height:1.5;">${desc}</td>
      <td style="padding:7px 5px;border-bottom:1px solid #e5e5e5;text-align:center;font-size:9px;color:#333;">${qty}</td>
      <td style="padding:7px 7px;border-bottom:1px solid #e5e5e5;text-align:right;font-size:9px;color:#333;">${fmtMoney(unitPrice)}</td>
      <td style="padding:7px 7px;border-bottom:1px solid #e5e5e5;text-align:right;font-size:9px;color:#333;font-weight:600;">${fmtMoney(amt)}</td>
    </tr>`;
  }).join('');

  const clientAddr = (invoice.client_address ?? '').split('\n').map(esc).join('<br>');
  const companyAddr = (s.company_address ?? '').split('\n').map(esc).join('<br>');

  return `
<div id="invoice-container" style="width:794px;min-height:1123px;display:flex;flex-direction:column;font-family:Arial,Helvetica,sans-serif;background:#ffffff;box-sizing:border-box;padding:40px 50px;">

  <!-- Header: Customer (left) | Company (right) -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
    <div style="flex:1;">
      <div style="font-size:10px;color:#333;margin-bottom:2px;">Date: <strong>${fmtDate(invoice.issue_date)}</strong></div>
      <div style="font-size:10px;font-weight:700;color:#000;margin-top:8px;">CUSTOMER: ${esc(clientName || invoice.client_name || '—')}</div>
      ${invoice.client_trn ? `<div style="font-size:9px;color:#333;">TRN: ${esc(invoice.client_trn)}</div>` : ''}
      ${clientAddr ? `<div style="font-size:9px;color:#333;line-height:1.4;margin-top:3px;">${clientAddr}</div>` : ''}
    </div>
    <div style="flex:1;text-align:right;">
      <div style="font-size:10px;font-weight:700;color:#000;">${esc(s.company_name || '—')}</div>
      ${s.company_trn ? `<div style="font-size:9px;color:#333;">TRN: ${esc(s.company_trn)}</div>` : ''}
      ${companyAddr ? `<div style="font-size:9px;color:#333;line-height:1.4;margin-top:3px;">${companyAddr}</div>` : ''}
    </div>
  </div>

  <!-- Invoice Title -->
  <div style="text-align:center;margin:12px 0 4px;padding:6px 0;font-size:14px;font-weight:700;color:#000;border-top:1px solid #333;border-bottom:1px solid #333;">
    # TAX INVOICE = ${esc(seqNo ? `#${String(seqNo).padStart(4, '0')}` : (invoice.invoice_number || '—'))}
  </div>
  ${invoice.invoice_number ? `<div style="text-align:center;font-size:9px;color:#666;margin-bottom:8px;">Ref: ${esc(invoice.invoice_number)}</div>` : ''}

  <!-- Items Table -->
  <table style="width:100%;border-collapse:collapse;margin-top:8px;">
    <thead>
      <tr style="border-top:2px solid #000;border-bottom:2px solid #000;">
        <th style="padding:7px 5px;font-size:9px;text-transform:uppercase;text-align:center;width:36px;">S.NO</th>
        <th style="padding:7px 5px;font-size:9px;text-transform:uppercase;text-align:center;width:62px;">DATE</th>
        <th style="padding:7px 9px;font-size:9px;text-transform:uppercase;text-align:left;">DESCRIPTION</th>
        <th style="padding:7px 5px;font-size:9px;text-transform:uppercase;text-align:center;width:52px;">TRIP - QTY</th>
        <th style="padding:7px 7px;font-size:9px;text-transform:uppercase;text-align:right;width:62px;">PER TRIP</th>
        <th style="padding:7px 7px;font-size:9px;text-transform:uppercase;text-align:right;width:72px;">AMOUNT</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="6" style="padding:10px;text-align:center;font-size:9px;color:#999;">No items</td></tr>`}
    </tbody>
  </table>

  <!-- Amount in Words + Totals -->
  <div style="display:flex;justify-content:space-between;margin-top:16px;border-top:2px solid #000;padding-top:10px;">
    <div style="flex:1;">
      <div style="font-size:9px;font-weight:700;color:#000;text-transform:uppercase;margin-bottom:4px;">Amount in Words</div>
      <div style="font-size:10px;color:#333;font-weight:500;line-height:1.4;">${numberToWords(total).toUpperCase()}</div>
    </div>
    <div style="width:220px;">
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:9px;color:#333;">
        <span>Sub Total</span><span>${fmtMoney(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:9px;color:#333;">
        <span>Vat ${vatRate}%</span><span>${fmtMoney(vatAmount)}</span>
      </div>
      <div style="border-top:1px solid #999;margin:4px 0;"></div>
      <div style="display:flex;justify-content:space-between;padding:5px 0;font-weight:700;font-size:10px;color:#000;">
        <span>Total</span><span>${fmtMoney(total)}</span>
      </div>
    </div>
  </div>

  <!-- Footer / Signature -->
  <div style="margin-top:auto;padding-top:50px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;font-size:9px;color:#333;border-top:1px solid #ccc;padding-top:10px;">
      <div style="font-weight:700;">${esc(s.company_name || 'BRONZE WINGS GENERAL TRANSPORT LLC')}</div>
      <div>CUSTOMER: ${esc(clientName || invoice.client_name || '—')}</div>
      <div style="text-align:center;">
        <div style="border-top:1px solid #333;padding-top:2px;margin-top:20px;width:120px;">SIGNATURE</div>
      </div>
    </div>
  </div>

</div>`;
}

export async function downloadInvoicePDF(invoice, clientName, settings = {}, seqNo) {
  const html = buildInvoiceHTML(invoice, clientName, settings, seqNo);
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