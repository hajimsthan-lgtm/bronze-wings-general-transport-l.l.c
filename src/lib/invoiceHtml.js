import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { numberToWords } from './numberToWords';
import { renderInvoicePDF } from './invoicePdfNative';

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function getMonthYear(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  return `${months[d.getMonth()]}`;
}

function fmtMoney(n) {
  return Number(n ?? 0).toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Fix: "Dubai !' Fujairah" → "Dubai-Fujairah"
function normalizeRoute(str) {
  let v = String(str ?? '');
  // Collapse spaced-out "To" (e.g., "T o") into "To"
  v = v.replace(/\b[Tt]\s+[Oo]\b/g, 'To');
  // Split on "To" (as a word) or any sequence of non-alphanumeric, non-space characters
  const parts = v.split(/\b[Tt]o\b|[^a-zA-Z0-9\s]+/);
  // If only one part (no separator found), return trimmed original
  if (parts.length <= 1) {
    return v.replace(/\s+/g, ' ').trim();
  }
  // For each part, remove internal spaces (collapse spaced-out letters into words)
  const words = parts
    .map(p => p.replace(/\s+/g, ''))
    .filter(p => p.length > 0);
  return words.join(' To ');
}

export function buildInvoiceHTML(invoice, clientName, settings = {}, seqNo) {
  const s = settings;
  const items = invoice.line_items || [];

  const subtotal = items.reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const price = Number(i.unit_price) || 0;
    return sum + (Number(i.amount ?? (qty * price)));
  }, 0);

  const totalDiscount = items.reduce((sum, i) => sum + (Number(i.discount) || 0), 0);
  const totalTaxable = subtotal - totalDiscount;

  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const vatAmount = totalTaxable * vatRate / 100;
  const total = totalTaxable + vatAmount;

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
      .map(line => line.replace(/\(CANCELLED[^)]*\)/gi, '<span style="color:#dc2626;font-weight:600;">$&</span>'))
      .join('<br>');
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#f9fbfd';
    const nf = "font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,Helvetica,sans-serif;font-variant-numeric:tabular-nums;";

    return `<tr style="background:${rowBg};">
      <td style="padding:6px 4px;border:1px solid #000;text-align:center;font-size:11pt;color:#333;">${idx + 1}</td>
      <td style="padding:6px 4px;border:1px solid #000;text-align:center;font-size:11pt;color:#333;">${esc(item.service || 'TRIP')}</td>
      <td style="padding:6px 8px;border:1px solid #000;font-size:11pt;color:#333;line-height:1.4;min-width:220px;word-wrap:break-word;overflow-wrap:break-word;">${desc}</td>
      <td style="padding:6px 4px;border:1px solid #000;text-align:center;font-size:11pt;color:#333;${nf}">${qty}</td>
      <td style="padding:6px 4px;border:1px solid #000;text-align:center;font-size:11pt;color:#333;">${esc(item.uom || 'TRIP')}</td>
      <td style="padding:6px 4px;border:1px solid #000;text-align:center;font-size:11pt;color:#333;${nf}">${fmtMoney(unitPrice)}</td>
      <td style="padding:6px 4px;border:1px solid #000;text-align:center;font-size:11pt;color:#333;${nf}">${fmtMoney(grossAmount)}</td>
      <td style="padding:6px 4px;border:1px solid #000;text-align:center;font-size:11pt;color:#333;${nf}">${fmtMoney(lineVat)}</td>
      <td style="padding:6px 4px;border:1px solid #000;text-align:center;font-size:11pt;color:#333;font-weight:600;${nf}">${fmtMoney(lineTotal)}</td>
    </tr>`;
  }).join('');

  const refNumber = invoice.invoice_number || (seqNo ? `#${String(seqNo).padStart(4, '0')}` : '#0001');
  const billName = clientName || invoice.client_name || '—';
  const invoiceDate = fmtDate(invoice.issue_date);
  const workingDate = fmtDate(invoice.working_date || invoice.issue_date);

  const MAROON = '#8B3A2E';
  const DARK_MAROON = '#6B2A20';
  const LB = '#F5E6D3';
  const LBH = '#FAF0E1';
  const DK = '#3D2820';
  const DBLUE = '#6B2A20';
  const nf2 = "font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,Helvetica,sans-serif;font-variant-numeric:tabular-nums;";

  // Build bank details lines — only show fields that have real data
  const bankLines = [];
  if (s.bank_name) bankLines.push(`<div><strong>Bank:</strong> ${esc(s.bank_name)}</div>`);
  if (s.bank_account_title || s.company_name) bankLines.push(`<div><strong>Account Title:</strong> ${esc(s.bank_account_title || s.company_name)}</div>`);
  if (s.bank_account_no) bankLines.push(`<div><strong>Account No:</strong> ${esc(s.bank_account_no)}</div>`);
  if (s.bank_iban) bankLines.push(`<div><strong>IBAN #</strong> ${esc(s.bank_iban)}</div>`);
  if (s.bank_branch) bankLines.push(`<div><strong>Branch:</strong> ${esc(s.bank_branch)}</div>`);
  const bankHtml = bankLines.length > 0
    ? `<div style="font-size:10.5pt;color:#000;line-height:1.8;">${bankLines.join('')}</div>`
    : `<div style="font-size:10.5pt;color:#999;font-style:italic;">Bank details available upon request</div>`;

  return `
<div id="invoice-container" style="width:794px;min-height:1123px;display:flex;flex-direction:column;font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,Helvetica,sans-serif;font-size:11.5pt;color:${DK};line-height:1.4;background:#ffffff;box-sizing:border-box;border:3px solid #8B3A2E;padding:8px;position:relative;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact;">

  <!-- Watermark -->
  <div style="position:absolute;top:48%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:72pt;color:${MAROON};opacity:0.03;font-weight:bold;font-family:Georgia,serif;pointer-events:none;z-index:0;white-space:nowrap;letter-spacing:8px;">BRONZEWINGS</div>

  <!-- Company Letterhead -->
  <div id="invoice-header" style="position:relative;z-index:1;border:2px solid #633C1A;background:#FDFBF0;padding:6px 14px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
    <div style="flex-shrink:0;">
      ${s.logo_url ? `<img src="${esc(s.logo_url)}" style="height:60px;width:60px;border-radius:50%;object-fit:cover;" />` : ''}
    </div>
    <div style="flex:1;text-align:left;padding:2px 8px 0;">
      <div style="font-size:12pt;color:#633C1A;font-weight:600;line-height:1.3;">الاجنحه البرونزية للنقليات العامة - ذ.م.م</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22pt;font-weight:bold;color:#633C1A;letter-spacing:2px;line-height:1.1;margin-top:1px;">BRONZE WINGS</div>
      <div style="font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,sans-serif;font-size:10pt;font-weight:600;color:#633C1A;letter-spacing:1px;margin-top:1px;">GENERAL TRANSPORT - L.L.C</div>
    </div>
    <div style="flex-shrink:0;text-align:right;font-size:9.5pt;color:#633C1A;line-height:1.5;">
      ${s.phone1 ? `<div>Mob: ${esc(s.phone1)}</div>` : ''}
      ${s.phone2 ? `<div>Mob: ${esc(s.phone2)}</div>` : ''}
      ${s.email ? `<div>${esc(s.email)}</div>` : ''}
      ${s.address ? `<div>${esc(s.address)}</div>` : ''}
      ${s.website ? `<div>${esc(s.website)}</div>` : ''}
    </div>
  </div>

  <!-- Tax Invoice Banner -->
  <div style="position:relative;z-index:1;padding:8px 14px;display:flex;justify-content:center;align-items:center;margin-top:8px;margin-bottom:10px;">
    <div style="font-size:16pt;font-weight:bold;color:${DBLUE};text-transform:uppercase;letter-spacing:1px;">Tax Invoice</div>
    ${s.trn ? `<div style="position:absolute;right:14px;font-size:11.5pt;color:${DBLUE};font-weight:bold;letter-spacing:1px;">Bronze TRN: ${esc(s.trn)}</div>` : ''}
  </div>

  <!-- Billing & Work Details -->
  <div style="position:relative;z-index:1;display:flex;gap:0;margin-bottom:10px;border:1px solid #ccc;">
    <div style="flex:1;padding:12px;border-right:1px solid #ccc;">
      <div style="font-size:11.5pt;font-weight:bold;color:${MAROON};text-transform:uppercase;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid #ccc;">Bill To</div>
      <div style="font-size:10.5pt;color:#000;line-height:1.6;overflow-wrap:break-word;word-break:break-word;">
        <div style="margin-bottom:2px;"><strong style="font-size:11.5pt;">${esc(billName)}</strong></div>
        ${invoice.contact_person ? `<div style="margin-bottom:1px;"><span style="font-size:9.5pt;color:#555;font-weight:bold;">ATT:</span> <span style="font-size:10.5pt;color:#000;">${esc(invoice.contact_person)}</span></div>` : ''}
        ${invoice.client_address ? `<div style="margin-bottom:1px;"><span style="font-size:9.5pt;color:#555;font-weight:bold;">ADDRESS:</span> <span style="font-size:10.5pt;color:#000;">${esc(invoice.client_address)}</span></div>` : ''}
        ${invoice.client_trn ? `<div style="margin-bottom:1px;"><span style="font-size:9.5pt;color:#555;font-weight:bold;">TRN:</span> <span style="font-size:10.5pt;color:#000;">${esc(invoice.client_trn)}</span></div>` : ''}
        ${invoice.sub ? `<div style="margin-bottom:1px;"><span style="font-size:9.5pt;color:#555;font-weight:bold;">SUB:</span> <span style="font-size:10.5pt;color:#000;">${esc(invoice.sub)}</span></div>` : ''}
        ${invoice.reg_no ? `<div style="margin-bottom:1px;"><span style="font-size:9.5pt;color:#555;font-weight:bold;">REG NO:</span> <span style="font-size:10.5pt;color:#000;">${esc(invoice.reg_no)}</span></div>` : ''}
      </div>
    </div>
    <div style="width:200px;padding:12px;">
      <div style="font-size:10.5pt;color:#000;line-height:1.9;">
        <div style="display:flex;justify-content:flex-end;gap:4px;"><strong style="min-width:95px;text-align:right;">INVOICE #:</strong><span>${esc(refNumber)}</span></div>
        <div style="display:flex;justify-content:flex-end;gap:4px;"><strong style="min-width:95px;text-align:right;">INVOICE DATE:</strong><span>${invoiceDate}</span></div>
        <div style="display:flex;justify-content:flex-end;gap:4px;"><strong style="min-width:95px;text-align:right;">LPO Ref #:</strong><span>${esc(invoice.lpo_ref || '—')}</span></div>
        <div style="display:flex;justify-content:flex-end;gap:4px;"><strong style="min-width:95px;text-align:right;">WORKING DATE:</strong><span>${workingDate}</span></div>
      </div>
    </div>
  </div>

  <!-- Line Items Table -->
  <div style="position:relative;z-index:1;">
  <table style="width:100%;border-collapse:collapse;font-size:10.5pt;table-layout:fixed;">
    <thead>
      <tr>
        <th style="border:1px solid #000;padding:8px 3px;text-align:center;background:#1D3F55;font-weight:bold;font-size:10.5pt;color:#fff;text-transform:uppercase;letter-spacing:0.5px;width:4%;">SL.No</th>
        <th style="border:1px solid #000;padding:8px 4px;text-align:center;background:#1D3F55;font-weight:bold;font-size:10.5pt;color:#fff;text-transform:uppercase;letter-spacing:0.5px;width:7%;">Service</th>
        <th style="border:1px solid #000;padding:8px 6px;text-align:left;background:#1D3F55;font-weight:bold;font-size:10.5pt;color:#fff;text-transform:uppercase;letter-spacing:0.5px;width:28%;">Description</th>
        <th style="border:1px solid #000;padding:8px 3px;text-align:center;background:#1D3F55;font-weight:bold;font-size:10.5pt;color:#fff;text-transform:uppercase;letter-spacing:0.5px;width:5%;">Qty</th>
        <th style="border:1px solid #000;padding:8px 3px;text-align:center;background:#1D3F55;font-weight:bold;font-size:10.5pt;color:#fff;text-transform:uppercase;letter-spacing:0.5px;width:5%;">UOM</th>
        <th style="border:1px solid #000;padding:8px 3px;text-align:center;background:#1D3F55;font-weight:bold;font-size:10.5pt;color:#fff;text-transform:uppercase;letter-spacing:0.5px;width:10%;">Unit Price</th>
        <th style="border:1px solid #000;padding:8px 3px;text-align:center;background:#1D3F55;font-weight:bold;font-size:10.5pt;color:#fff;text-transform:uppercase;letter-spacing:0.5px;width:10%;">Total</th>
        <th style="border:1px solid #000;padding:8px 3px;text-align:center;background:#1D3F55;font-weight:bold;font-size:10.5pt;color:#fff;text-transform:uppercase;letter-spacing:0.5px;width:9%;">VAT 5%</th>
        <th style="border:1px solid #000;padding:8px 3px;text-align:center;background:#1D3F55;font-weight:bold;font-size:10.5pt;color:#fff;text-transform:uppercase;letter-spacing:0.5px;width:12%;">Total Price</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="9" style="padding:14px;border:1px solid #000;text-align:center;font-size:10.5pt;color:#999;">No items</td></tr>`}
    </tbody>
    </tfoot>
  </table>
  </div>

  <!-- Totals Area: Amount in Words (left) + Subtotal/VAT/Total column (right) -->
  <div style="position:relative;z-index:1;margin:6px 0 0;display:flex;gap:0;align-items:stretch;">
    <!-- Amount in Words box (dashed border) -->
    <div style="flex:1;border:1.5px dashed #333;padding:10px 14px;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-size:10pt;font-weight:700;color:#333;margin-bottom:4px;">Amount in Words:</div>
      <div style="font-size:11pt;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.5px;line-height:1.4;">AED ${numberToWords(total).toUpperCase()} ONLY</div>
    </div>
    <!-- Subtotal / VAT / Total rows (right column) -->
    <div style="flex-shrink:0;width:300px;">
      <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid #E0E0E0;font-size:10.5pt;">
        <span style="color:#333;font-weight:600;">Subtotal:</span>
        <span style="color:#000;font-weight:700;${nf2}">AED ${fmtMoney(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid #E0E0E0;font-size:10.5pt;">
        <span style="color:#333;font-weight:600;">VAT (5%):</span>
        <span style="color:#000;font-weight:700;${nf2}">AED ${fmtMoney(vatAmount)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 14px;border-top:2px solid #000;border-bottom:2px solid #000;font-size:11.5pt;">
        <span style="color:#000;font-weight:800;">Total Amount:</span>
        <span style="color:#000;font-weight:800;${nf2}">AED ${fmtMoney(total)}</span>
      </div>
    </div>
  </div>

  <!-- Footer Block: 3 columns — Bank | Receiver | Authorized -->
  <div id="footer-block" style="position:relative;z-index:1;margin-top:22px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">

    <!-- Bank Details -->
    <div style="flex:1;">
      <div style="font-size:11.5pt;font-weight:bold;color:${MAROON};text-transform:uppercase;margin-bottom:6px;padding-bottom:3px;border-bottom:2px solid ${MAROON};">Bank Details</div>
      ${bankHtml}
    </div>

    <!-- Receiver Signature -->
    <div style="flex:1;text-align:center;">
      <div style="font-size:11.5pt;font-weight:bold;color:${MAROON};text-transform:uppercase;margin-bottom:6px;padding-bottom:3px;border-bottom:2px solid ${MAROON};">Received By</div>
      <div style="height:52px;"></div>
      <div style="border-top:1px solid #999;width:80%;margin:4px auto 4px;padding-top:3px;font-size:10.5pt;color:#666;">Receiver Signature</div>
      <div style="font-size:9.5pt;color:#999;margin-top:2px;">Name &amp; Date</div>
    </div>

    <!-- Authorization Stamp -->
    <div style="flex:1;text-align:center;">
      <div style="font-size:11.5pt;font-weight:bold;color:${MAROON};text-transform:uppercase;margin-bottom:6px;padding-bottom:3px;border-bottom:2px solid ${MAROON};">Authorized By</div>
      <div style="width:90px;height:90px;border:2px solid ${MAROON};border-radius:50%;margin:0 auto 4px;display:flex;align-items:center;justify-content:center;position:relative;">
        <div style="position:absolute;inset:5px;border:1px dashed ${MAROON};border-radius:50%;"></div>
        <div style="text-align:center;font-size:8.5pt;color:${MAROON};font-weight:bold;line-height:1.4;position:relative;">BRONZEWINGS<br>GENERAL<br>TRANSPORT<br>L.L.C<br>&mdash;&mdash;<br>ABU DHABI<br>- U.A.E</div>
      </div>
      <div style="font-size:10.5pt;font-weight:bold;color:${MAROON};margin-top:2px;">FOR ${esc(s.company_name || 'BRONZEWINGS GENERAL TRANSPORT L.L.C')}</div>
      <div style="border-top:1px solid #999;width:80%;margin:8px auto 4px;padding-top:3px;font-size:10.5pt;color:#666;">Authorized Signature</div>
      <div style="font-size:10.5pt;color:${DK};margin-top:1px;">Mobile: ${esc(s.phone1 || '050-8655601')}</div>
    </div>

  </div>
  </div><!-- /footer-block -->

  <!-- Spacer pushes footer banners to bottom -->
  <div style="flex:1 1 auto;"></div>

  <!-- Terms & Conditions -->
  <div style="position:relative;z-index:1;margin-top:14px;border:1px solid #1D3F55;">
    <div style="background:#f0f0f0;color:#000;font-weight:bold;font-size:10pt;text-transform:uppercase;letter-spacing:1px;padding:5px 14px;">Terms &amp; Conditions</div>
    <div style="padding:6px 14px;font-size:9.5pt;color:#333;line-height:1.6;">Payment due within 60 days.</div>
  </div>

  <!-- Footer Banner -->
  <div style="position:relative;z-index:1;background:#FDFBF0;border:2px solid #633C1A;color:#633C1A;text-align:center;padding:10px 14px;font-size:13pt;font-weight:bold;text-transform:uppercase;margin-top:28px;">
    We Provide All Kinds of General and Refrigerated Transportation and Heavy Equipment Rental Services
  </div>

</div>`;
}

export function buildMonthlyInvoiceHTML(invoice, clientName, settings = {}, seqNo) {
  const s = settings;
  const items = invoice.line_items || [];

  const subtotal = items.reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const price = Number(i.unit_price) || 0;
    return sum + (Number(i.amount ?? (qty * price)));
  }, 0);

  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const totalTaxable = subtotal;
  const vatAmount = totalTaxable * vatRate / 100;
  const total = totalTaxable + vatAmount;

  const rowsHtml = items.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const grossAmount = Number(item.amount ?? (qty * unitPrice));
    const taxableAmount = grossAmount;
    const lineVat = taxableAmount * (vatRate / 100);
    const lineTotal = taxableAmount + lineVat;
    const desc = normalizeRoute(item.description ?? '')
      .split('\n')
      .map(esc)
      .map(line => line.replace(/\(CANCELLED[^)]*\)/gi, '<span style="color:#dc2626;font-weight:600;">$&</span>'))
      .join('<br>');
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafbfc';
    const nf = "font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,Helvetica,sans-serif;font-variant-numeric:tabular-nums;";

    return `<tr style="background:${rowBg};">
      <td style="padding:8px 6px;border:1px solid #000;text-align:center;font-size:12px;color:#000;font-weight:700;${nf}">${idx + 1}</td>
      <td style="padding:8px 6px;border:1px solid #000;text-align:center;font-size:12px;color:#000;font-weight:700;${nf}">${getMonthYear(item.date || invoice.issue_date)}</td>
      <td style="padding:8px 10px;border:1px solid #000;text-align:left;font-size:12px;color:#000;font-weight:700;line-height:1.5;">${desc}</td>
      <td style="padding:8px 6px;border:1px solid #000;text-align:center;font-size:12px;color:#000;font-weight:700;${nf}">${qty}</td>
      <td style="padding:8px 6px;border:1px solid #000;text-align:center;font-size:12px;color:#000;font-weight:800;${nf}">${fmtMoney(unitPrice)}</td>
      <td style="padding:8px 6px;border:1px solid #000;text-align:center;font-size:12px;color:#000;font-weight:800;${nf}">${fmtMoney(grossAmount)}</td>
      <td style="padding:8px 6px;border:1px solid #000;text-align:center;font-size:12px;color:#000;font-weight:800;${nf}">${fmtMoney(lineVat)}</td>
      <td style="padding:8px 6px;border:1px solid #000;text-align:center;font-size:12px;color:#000;font-weight:800;${nf}">${fmtMoney(lineTotal)}</td>
    </tr>`;
  }).join('');

  const refNumber = invoice.invoice_number || (seqNo ? `#${String(seqNo).padStart(4, '0')}` : '#0001');
  const billName = clientName || invoice.client_name || '—';
  const invoiceDate = fmtDate(invoice.issue_date);
  const monthYear = getMonthYear(invoice.issue_date);

  const MAROON = '#8B3A2E';
  const DARK_MAROON = '#6B2A20';
  const LB = '#F5E6D3';
  const LBH = '#FAF0E1';
  const DBLUE = '#6B2A20';
  const nf2 = "font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,Helvetica,sans-serif;font-variant-numeric:tabular-nums;";

  const bankLines = [];
  if (s.bank_name) bankLines.push(`<div style="font-size:11px;line-height:1.8;color:#000;"><strong style="color:#444;font-weight:700;display:inline-block;min-width:100px;">Bank:</strong> ${esc(s.bank_name)}</div>`);
  if (s.bank_account_title || s.company_name) bankLines.push(`<div style="font-size:11px;line-height:1.8;color:#000;"><strong style="color:#444;font-weight:700;display:inline-block;min-width:100px;">Account Title:</strong> ${esc(s.bank_account_title || s.company_name)}</div>`);
  if (s.bank_account_no) bankLines.push(`<div style="font-size:11px;line-height:1.8;color:#000;"><strong style="color:#444;font-weight:700;display:inline-block;min-width:100px;">Account No:</strong> ${esc(s.bank_account_no)}</div>`);
  if (s.bank_iban) bankLines.push(`<div style="font-size:11px;line-height:1.8;color:#000;"><strong style="color:#444;font-weight:700;display:inline-block;min-width:100px;">IBAN #</strong> ${esc(s.bank_iban)}</div>`);
  if (s.bank_branch) bankLines.push(`<div style="font-size:11px;line-height:1.8;color:#000;"><strong style="color:#444;font-weight:700;display:inline-block;min-width:100px;">Branch:</strong> ${esc(s.bank_branch)}</div>`);
  const bankHtml = bankLines.length > 0
    ? bankLines.join('')
    : `<div style="font-size:11px;color:#999;font-style:italic;">Bank details available upon request</div>`;

  const logoSvg = `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><circle cx="50" cy="50" r="46" fill="none" stroke="${MAROON}" stroke-width="2"/><circle cx="50" cy="50" r="40" fill="none" stroke="${MAROON}" stroke-width="1" stroke-dasharray="3,2"/><circle cx="50" cy="50" r="28" fill="none" stroke="#C4A35A" stroke-width="2"/><path d="M50 22 Q35 35 25 50 Q35 45 50 40 Q65 45 75 50 Q65 35 50 22Z" fill="#C4A35A" opacity="0.9"/><path d="M50 78 Q35 65 25 50 Q35 55 50 60 Q65 55 75 50 Q65 65 50 78Z" fill="#C4A35A" opacity="0.9"/><text x="50" y="46" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="700" fill="${MAROON}">BW</text><text x="50" y="58" text-anchor="middle" font-family="Arial,sans-serif" font-size="6" font-weight="600" fill="${MAROON}">L.L.C</text></svg>`;

  return `
<div id="invoice-container" style="width:794px;min-height:1123px;display:flex;flex-direction:column;font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,Helvetica,sans-serif;font-size:11.5pt;color:#000;line-height:1.4;background:#ffffff;box-sizing:border-box;border:3px solid #8B3A2E;position:relative;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact;">

  <!-- Watermark -->
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:100px;font-weight:900;color:rgba(139,58,46,0.025);letter-spacing:8px;pointer-events:none;z-index:0;white-space:nowrap;font-family:Georgia,serif;">BRONZEWINGS</div>

  <!-- Letterhead -->
  <div id="invoice-header" style="position:relative;z-index:1;border:2px solid #633C1A;background:#FDFBF0;padding:6px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
    <div style="flex-shrink:0;width:58px;height:58px;">
      ${s.logo_url ? `<img src="${esc(s.logo_url)}" style="width:100%;height:100%;object-fit:contain;" />` : logoSvg}
    </div>
    <div style="flex:1;text-align:left;padding:2px 8px 0;">
      <div style="font-size:12px;color:#633C1A;font-weight:600;line-height:1.3;">الاجنحه البرونزية للنقليات العامة - ذ.م.م</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#633C1A;letter-spacing:2px;line-height:1.1;margin-top:1px;">BRONZE WINGS</div>
      <div style="font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,sans-serif;font-size:11px;font-weight:600;color:#633C1A;letter-spacing:1px;margin-top:1px;">GENERAL TRANSPORT - L.L.C</div>
    </div>
    <div style="flex-shrink:0;text-align:right;font-size:9.5px;color:#633C1A;line-height:1.5;">
      ${s.phone1 ? `<div>Mob: ${esc(s.phone1)}</div>` : ''}
      ${s.phone2 ? `<div>Mob: ${esc(s.phone2)}</div>` : ''}
      ${s.email ? `<div>${esc(s.email)}</div>` : ''}
      ${s.address ? `<div>${esc(s.address)}</div>` : ''}
      ${s.website ? `<div>${esc(s.website)}</div>` : ''}
    </div>
  </div>

  <!-- Tax Invoice Banner -->
  <div style="position:relative;z-index:1;padding:10px 28px;display:flex;justify-content:center;align-items:center;">
    <h2 style="font-size:17px;font-weight:800;color:${DBLUE};text-transform:uppercase;letter-spacing:2px;margin:0;">Tax Invoice</h2>
    ${s.trn ? `<div style="position:absolute;right:28px;font-size:11.5px;color:${DBLUE};font-weight:bold;letter-spacing:1px;">Bronze TRN: ${esc(s.trn)}</div>` : ''}
  </div>

  <!-- Billing Section -->
  <div style="position:relative;z-index:1;border:1px solid #ccc;border-bottom:1px solid #ccc;background:#fff;padding:14px 28px;overflow:hidden;display:flex;gap:20px;">
    <div style="flex:1;">
      <div style="font-size:11.5px;font-weight:800;color:${MAROON};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px;padding-bottom:4px;border-bottom:1px solid ${MAROON};display:inline-block;">Bill To</div>
      <div style="font-size:11px;line-height:1.7;color:#000;overflow-wrap:break-word;word-break:break-word;">
        <div><strong style="color:#444;font-weight:700;">BILL TO:</strong> ${esc(billName)}</div>
        ${invoice.contact_person ? `<div><strong style="color:#444;font-weight:700;">ATT:</strong> ${esc(invoice.contact_person)}</div>` : ''}
        ${invoice.client_address ? `<div><strong style="color:#444;font-weight:700;">ADDRESS:</strong> ${esc(invoice.client_address)}</div>` : ''}
        ${invoice.client_trn ? `<div><strong style="color:#444;font-weight:700;">TRN:</strong> ${esc(invoice.client_trn)}</div>` : ''}
        ${invoice.sub ? `<div><strong style="color:#444;font-weight:700;">SUB:</strong> ${esc(invoice.sub)}</div>` : ''}
        ${invoice.reg_no ? `<div><strong style="color:#444;font-weight:700;">REG NO:</strong> ${esc(invoice.reg_no)}</div>` : ''}
      </div>
    </div>
    <div style="flex-shrink:0;text-align:right;">
      <div style="font-size:11px;line-height:1.7;color:#000;">
        <div style="display:flex;justify-content:flex-end;gap:4px;"><strong style="color:#444;font-weight:700;min-width:100px;text-align:right;">INVOICE #:</strong><span>${esc(refNumber)}</span></div>
        <div style="display:flex;justify-content:flex-end;gap:4px;"><strong style="color:#444;font-weight:700;min-width:100px;text-align:right;">INVOICE DATE:</strong><span>${invoiceDate}</span></div>
        <div style="display:flex;justify-content:flex-end;gap:4px;"><strong style="color:#444;font-weight:700;min-width:100px;text-align:right;">LPO Ref #:</strong><span>${esc(invoice.lpo_ref || '—')}</span></div>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div style="position:relative;z-index:1;padding:0 28px;margin-top:12px;">
  <table style="width:100%;border-collapse:collapse;font-size:10.5px;table-layout:fixed;">
    <thead>
      <tr>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:8px 6px;border:1px solid #000;text-align:center;white-space:nowrap;width:4%;">SL.No</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:8px 6px;border:1px solid #000;text-align:center;white-space:nowrap;width:14%;">Month</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:8px 10px;border:1px solid #000;text-align:left;white-space:nowrap;width:22%;">Description</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:8px 6px;border:1px solid #000;text-align:center;white-space:nowrap;width:8%;">Qty</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:8px 6px;border:1px solid #000;text-align:center;white-space:nowrap;width:14%;">Unit Price</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:8px 6px;border:1px solid #000;text-align:center;white-space:nowrap;width:14%;">Amount</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:8px 6px;border:1px solid #000;text-align:center;white-space:nowrap;width:12%;">VAT<br>5%</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:8px 6px;border:1px solid #000;text-align:center;white-space:nowrap;width:16%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="7" style="padding:14px;border:1px solid #000;text-align:center;font-size:10.5pt;color:#999;">No items</td></tr>`}
    </tbody>
    </tfoot>
  </table>
  </div>

  <!-- Totals Area: Amount in Words (left) + Subtotal/VAT/Total column (right) -->
  <div style="position:relative;z-index:1;margin:10px 28px 0;display:flex;gap:0;align-items:stretch;">
    <!-- Amount in Words box (dashed border) -->
    <div style="flex:1;border:1.5px dashed #333;padding:10px 14px;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-size:10px;font-weight:700;color:#333;margin-bottom:4px;">Amount in Words:</div>
      <div style="font-size:11px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.5px;line-height:1.4;">AED ${numberToWords(total).toUpperCase()} ONLY</div>
    </div>
    <!-- Subtotal / VAT / Total rows (right column) -->
    <div style="flex-shrink:0;width:300px;">
      <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid #E0E0E0;font-size:10.5px;">
        <span style="color:#333;font-weight:600;">Subtotal:</span>
        <span style="color:#000;font-weight:700;${nf2}">AED ${fmtMoney(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid #E0E0E0;font-size:10.5px;">
        <span style="color:#333;font-weight:600;">VAT (5%):</span>
        <span style="color:#000;font-weight:700;${nf2}">AED ${fmtMoney(vatAmount)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 14px;border-top:2px solid #000;border-bottom:2px solid #000;font-size:11.5px;">
        <span style="color:#000;font-weight:800;">Total Amount:</span>
        <span style="color:#000;font-weight:800;${nf2}">AED ${fmtMoney(total)}</span>
      </div>
    </div>
  </div>

  <!-- Spacer -->
  <div style="flex:1 1 auto;min-height:20px;"></div>

  <!-- Footer Container (bordered) -->
  <div id="footer-block" style="position:relative;z-index:1;margin:0 28px;border-left:1px solid #1D3F55;border-right:1px solid #1D3F55;border-bottom:1px solid #1D3F55;">
    <!-- Terms Bar -->
    <div style="background:#f0f0f0;color:#000;padding:6px 14px;font-size:10pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Terms &amp; Conditions</div>
    <div style="padding:6px 14px;font-size:9pt;color:#555;">Payment due within 60 days.</div>

    <!-- Bank Details -->
    <div style="padding:8px 14px;border-top:1px solid #ddd;">
      <div style="font-size:10pt;font-weight:bold;color:#1D3F55;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Bank Details</div>
      <div style="font-size:9pt;color:#1A1A1A;line-height:1.8;">
        <div>Bank: ${esc(s.bank_name || '—')}</div>
        <div>Account Title: ${esc(s.bank_account_title || s.company_name || '—')}</div>
        <div>Account No: ${esc(s.bank_account_no || '—')}</div>
        <div>IBAN #: ${esc(s.bank_iban || '—')}</div>
        <div>Branch: ${esc(s.bank_branch || '—')}</div>
      </div>
    </div>

    <!-- Signature Blocks (Two Columns) -->
    <div style="display:flex;border-top:1px solid #ddd;padding:16px 14px;gap:20px;">
      <!-- Left: Receiver -->
      <div style="flex:1;text-align:center;">
        <div style="border-bottom:1px solid #1D3F55;margin-bottom:5px;width:80%;margin-left:auto;margin-right:auto;"></div>
        <div style="font-size:8pt;color:#555;letter-spacing:0.5px;">RECEIVER SIGN &amp; STAMP</div>
        <div style="font-size:9pt;font-weight:bold;color:#1A1A1A;margin-top:3px;overflow-wrap:break-word;word-break:break-word;">${esc(billName)}</div>
      </div>
      <!-- Right: Authorized -->
      <div style="flex:1;text-align:center;">
        <div style="border-bottom:1px solid #1D3F55;margin-bottom:5px;width:80%;margin-left:auto;margin-right:auto;"></div>
        <div style="font-size:8pt;color:#555;letter-spacing:0.5px;">AUTHORIZED SIGNATURE &amp; STAMP</div>
        <div style="font-size:9pt;font-weight:bold;color:#1A1A1A;margin-top:3px;">BRONZE WINGS GENERAL TRANSPORT L.L.C</div>
      </div>
    </div>
  </div>

  <!-- Bottom Footer Bar -->
  <div style="position:relative;z-index:1;margin:0 28px 8px;border:1px solid #1D3F55;background:#FAF7F2;padding:8px;text-align:center;">
    <div style="font-size:9pt;font-weight:bold;color:#1D3F55;letter-spacing:1px;">WE PROVIDE ALL KINDS OF GENERAL AND REFRIGERATED TRANSPORTATION AND HEAVY EQUIPMENT RENTAL SERVICES</div>
  </div>

</div>`;
}

export function buildPerTripInvoiceHTML(invoice, clientName, settings = {}, seqNo) {
  const s = settings;
  const items = invoice.line_items || [];

  const subtotal = items.reduce((sum, i) => {
    const qty = Number(i.quantity) || 0;
    const price = Number(i.unit_price) || 0;
    return sum + (Number(i.amount ?? (qty * price)));
  }, 0);

  const vatRate = invoice.vat_rate ?? s.default_vat_rate ?? 5;
  const totalTaxable = subtotal;
  const vatAmount = totalTaxable * vatRate / 100;
  const total = totalTaxable + vatAmount;

  const tripDates = items.map(i => i.date).filter(Boolean).sort();
  const workingDate = tripDates.length > 0
    ? (tripDates.length === 1 ? fmtDate(tripDates[0]) : `${fmtDate(tripDates[0])} - ${fmtDate(tripDates[tripDates.length - 1])}`)
    : fmtDate(invoice.issue_date);

  const rowsHtml = items.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const grossAmount = Number(item.amount ?? (qty * unitPrice));
    const taxableAmount = grossAmount;
    const lineVat = taxableAmount * (vatRate / 100);
    const lineTotal = taxableAmount + lineVat;
    const desc = normalizeRoute(item.description ?? '')
      .split('\n')
      .map(esc)
      .map(line => line.replace(/\(CANCELLED[^)]*\)/gi, '<span style="color:#dc2626;font-weight:600;">$&</span>'))
      .join('<br>');
    const tripDate = fmtDate(item.date);
    const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafbfc';
    const nf = "font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,Helvetica,sans-serif;font-variant-numeric:tabular-nums;";

    return `<tr style="background:${rowBg};">
      <td style="padding:7px 5px;border:1px solid #000;text-align:center;font-size:10.5px;color:#000;font-weight:600;${nf}">${idx + 1}</td>
      <td style="padding:7px 5px;border:1px solid #000;text-align:center;font-size:10px;color:#000;font-weight:600;${nf}">${tripDate}</td>
      <td style="padding:7px 10px;border:1px solid #000;text-align:left;font-size:10.5px;color:#000;font-weight:600;line-height:1.5;">${desc}</td>
      <td style="padding:7px 5px;border:1px solid #000;text-align:center;font-size:10.5px;color:#000;font-weight:600;${nf}">${qty}</td>
      <td style="padding:7px 5px;border:1px solid #000;text-align:center;font-size:10.5px;color:#000;font-weight:700;${nf}">${fmtMoney(unitPrice)}</td>
      <td style="padding:7px 5px;border:1px solid #000;text-align:center;font-size:10.5px;color:#000;font-weight:700;${nf}">${fmtMoney(grossAmount)}</td>
      <td style="padding:7px 5px;border:1px solid #000;text-align:center;font-size:10.5px;color:#000;font-weight:700;${nf}">${fmtMoney(lineVat)}</td>
      <td style="padding:7px 5px;border:1px solid #000;text-align:center;font-size:10.5px;color:#000;font-weight:700;${nf}">${fmtMoney(lineTotal)}</td>
    </tr>`;
  }).join('');

  const refNumber = invoice.invoice_number || (seqNo ? `#${String(seqNo).padStart(4, '0')}` : '#0001');
  const billName = clientName || invoice.client_name || '—';
  const invoiceDate = fmtDate(invoice.issue_date);

  const MAROON = '#8B3A2E';
  const DARK_MAROON = '#6B2A20';
  const LB = '#F5E6D3';
  const LBH = '#FAF0E1';
  const DBLUE = '#6B2A20';
  const nf2 = "font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,Helvetica,sans-serif;font-variant-numeric:tabular-nums;";

  const bankLines = [];
  if (s.bank_name) bankLines.push(`<div style="font-size:10.5px;line-height:1.7;color:#000;"><strong style="color:#444;font-weight:700;display:inline-block;min-width:95px;">Bank:</strong> ${esc(s.bank_name)}</div>`);
  if (s.bank_account_title || s.company_name) bankLines.push(`<div style="font-size:10.5px;line-height:1.7;color:#000;"><strong style="color:#444;font-weight:700;display:inline-block;min-width:95px;">Account Title:</strong> ${esc(s.bank_account_title || s.company_name)}</div>`);
  if (s.bank_account_no) bankLines.push(`<div style="font-size:10.5px;line-height:1.7;color:#000;"><strong style="color:#444;font-weight:700;display:inline-block;min-width:95px;">Account No:</strong> ${esc(s.bank_account_no)}</div>`);
  if (s.bank_iban) bankLines.push(`<div style="font-size:10.5px;line-height:1.7;color:#000;"><strong style="color:#444;font-weight:700;display:inline-block;min-width:95px;">IBAN #</strong> ${esc(s.bank_iban)}</div>`);
  if (s.bank_branch) bankLines.push(`<div style="font-size:10.5px;line-height:1.7;color:#000;"><strong style="color:#444;font-weight:700;display:inline-block;min-width:95px;">Branch:</strong> ${esc(s.bank_branch)}</div>`);
  const bankHtml = bankLines.length > 0
    ? bankLines.join('')
    : `<div style="font-size:10.5px;color:#999;font-style:italic;">Bank details available upon request</div>`;

  const logoSvg = `<svg viewBox="0 0 100 100" style="width:100%;height:100%;"><circle cx="50" cy="50" r="46" fill="none" stroke="${MAROON}" stroke-width="2"/><circle cx="50" cy="50" r="40" fill="none" stroke="${MAROON}" stroke-width="1" stroke-dasharray="3,2"/><circle cx="50" cy="50" r="28" fill="none" stroke="#C4A35A" stroke-width="2"/><path d="M50 22 Q35 35 25 50 Q35 45 50 40 Q65 45 75 50 Q65 35 50 22Z" fill="#C4A35A" opacity="0.9"/><path d="M50 78 Q35 65 25 50 Q35 55 50 60 Q65 55 75 50 Q65 65 50 78Z" fill="#C4A35A" opacity="0.9"/><text x="50" y="46" text-anchor="middle" font-family="Georgia,serif" font-size="16" font-weight="700" fill="${MAROON}">BW</text><text x="50" y="58" text-anchor="middle" font-family="Arial,sans-serif" font-size="6" font-weight="600" fill="${MAROON}">L.L.C</text></svg>`;

  return `
<div id="invoice-container" style="width:794px;min-height:1123px;display:flex;flex-direction:column;font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,Helvetica,sans-serif;font-size:11.5pt;color:#000;line-height:1.4;background:#ffffff;box-sizing:border-box;border:3px solid #8B3A2E;position:relative;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact;">

  <!-- Watermark -->
  <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:100px;font-weight:900;color:rgba(139,58,46,0.02);letter-spacing:8px;pointer-events:none;z-index:0;white-space:nowrap;font-family:Georgia,serif;">BRONZEWINGS</div>

  <!-- Letterhead -->
  <div id="invoice-header" style="position:relative;z-index:1;border:2px solid #633C1A;background:#FDFBF0;padding:6px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
    <div style="flex-shrink:0;width:54px;height:54px;">
      ${s.logo_url ? `<img src="${esc(s.logo_url)}" style="width:100%;height:100%;object-fit:contain;" />` : logoSvg}
    </div>
    <div style="flex:1;text-align:left;padding:2px 8px 0;">
      <div style="font-size:12px;color:#633C1A;font-weight:600;line-height:1.3;">الاجنحه البرونزية للنقليات العامة - ذ.م.م</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#633C1A;letter-spacing:2px;line-height:1.1;margin-top:1px;">BRONZE WINGS</div>
      <div style="font-family:'Century Gothic','Tw Cen MT','Segoe UI',Arial,sans-serif;font-size:11px;font-weight:600;color:#633C1A;letter-spacing:1px;margin-top:1px;">GENERAL TRANSPORT - L.L.C</div>
    </div>
    <div style="flex-shrink:0;text-align:right;font-size:9.5px;color:#633C1A;line-height:1.5;">
      ${s.phone1 ? `<div>Mob: ${esc(s.phone1)}</div>` : ''}
      ${s.phone2 ? `<div>Mob: ${esc(s.phone2)}</div>` : ''}
      ${s.email ? `<div>${esc(s.email)}</div>` : ''}
      ${s.address ? `<div>${esc(s.address)}</div>` : ''}
      ${s.website ? `<div>${esc(s.website)}</div>` : ''}
    </div>
  </div>

  <!-- Tax Invoice Banner -->
  <div style="position:relative;z-index:1;padding:10px 28px;display:flex;justify-content:center;align-items:center;">
    <h2 style="font-size:17px;font-weight:800;color:${DBLUE};text-transform:uppercase;letter-spacing:2px;margin:0;">Tax Invoice</h2>
    ${s.trn ? `<div style="position:absolute;right:28px;font-size:11.5px;color:${DBLUE};font-weight:bold;letter-spacing:1px;">Bronze TRN: ${esc(s.trn)}</div>` : ''}
  </div>

  <!-- Billing Section -->
  <div style="position:relative;z-index:1;border:1px solid #ccc;border-bottom:1px solid #ccc;background:#fff;padding:12px 28px;overflow:hidden;display:flex;gap:20px;">
    <div style="flex:1;">
      <div style="font-size:11px;font-weight:800;color:${MAROON};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;padding-bottom:3px;border-bottom:1px solid ${MAROON};display:inline-block;">Bill To</div>
      <div style="font-size:10.5px;line-height:1.65;color:#000;overflow-wrap:break-word;word-break:break-word;">
        <div><strong style="color:#444;font-weight:700;">BILL TO:</strong> ${esc(billName)}</div>
        ${invoice.contact_person ? `<div><strong style="color:#444;font-weight:700;">ATT:</strong> ${esc(invoice.contact_person)}</div>` : ''}
        ${invoice.client_address ? `<div><strong style="color:#444;font-weight:700;">ADDRESS:</strong> ${esc(invoice.client_address)}</div>` : ''}
        ${invoice.client_trn ? `<div><strong style="color:#444;font-weight:700;">TRN:</strong> ${esc(invoice.client_trn)}</div>` : ''}
        ${invoice.sub ? `<div><strong style="color:#444;font-weight:700;">SUB:</strong> ${esc(invoice.sub)}</div>` : ''}
        ${invoice.reg_no ? `<div><strong style="color:#444;font-weight:700;">REG NO:</strong> ${esc(invoice.reg_no)}</div>` : ''}
      </div>
    </div>
    <div style="flex-shrink:0;text-align:right;">
      <div style="font-size:10.5px;line-height:1.65;color:#000;">
        <div style="display:flex;justify-content:flex-end;gap:4px;"><strong style="color:#444;font-weight:700;min-width:100px;text-align:right;">INVOICE #:</strong><span>${esc(refNumber)}</span></div>
        <div style="display:flex;justify-content:flex-end;gap:4px;"><strong style="color:#444;font-weight:700;min-width:100px;text-align:right;">INVOICE DATE:</strong><span>${invoiceDate}</span></div>
        <div style="display:flex;justify-content:flex-end;gap:4px;"><strong style="color:#444;font-weight:700;min-width:100px;text-align:right;">LPO Ref #:</strong><span>${esc(invoice.lpo_ref || '—')}</span></div>
      </div>
    </div>
  </div>

  <!-- Table -->
  <div style="position:relative;z-index:1;padding:0 28px;margin-top:10px;">
  <table style="width:100%;border-collapse:collapse;font-size:10.5px;table-layout:fixed;">
    <thead>
      <tr>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;padding:7px 5px;border:1px solid #000;text-align:center;white-space:nowrap;width:4%;">SL.No</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;padding:7px 5px;border:1px solid #000;text-align:center;white-space:nowrap;width:10%;">Trip Date</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;padding:7px 10px;border:1px solid #000;text-align:left;white-space:nowrap;width:30%;">Description</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;padding:7px 5px;border:1px solid #000;text-align:center;white-space:nowrap;width:7%;">Qty</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;padding:7px 5px;border:1px solid #000;text-align:center;white-space:nowrap;width:13%;">Unit Price</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;padding:7px 5px;border:1px solid #000;text-align:center;white-space:nowrap;width:13%;">Amount</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;padding:7px 5px;border:1px solid #000;text-align:center;white-space:nowrap;width:11%;">VAT<br>5%</th>
        <th style="background:#f0f0f0;color:#000;font-weight:800;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;padding:7px 5px;border:1px solid #000;text-align:center;white-space:nowrap;width:13%;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="8" style="padding:14px;border:1px solid #000;text-align:center;font-size:10.5pt;color:#999;">No items</td></tr>`}
    </tbody>
  </table>
  </div>

  <!-- Totals Area: Amount in Words (left) + Subtotal/VAT/Total (right) -->
  <div style="position:relative;z-index:1;margin:10px 28px 0;display:flex;gap:0;align-items:stretch;">
    <!-- Amount in Words box (dashed gold border) -->
    <div style="flex:1;border:1.5px dashed #333;padding:10px 14px;display:flex;flex-direction:column;justify-content:center;">
      <div style="font-size:10px;font-weight:700;color:#333;margin-bottom:4px;">Amount in Words:</div>
      <div style="font-size:11px;font-weight:700;color:#000;text-transform:uppercase;letter-spacing:0.5px;line-height:1.4;">AED ${numberToWords(total).toUpperCase()} ONLY</div>
    </div>
    <!-- Subtotal / VAT / Total rows (right) -->
    <div style="flex-shrink:0;width:300px;">
      <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid #E0E0E0;font-size:10.5px;">
        <span style="color:#333;font-weight:600;">Subtotal:</span>
        <span style="color:#000;font-weight:700;${nf2}">AED ${fmtMoney(subtotal)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid #E0E0E0;font-size:10.5px;">
        <span style="color:#333;font-weight:600;">VAT (5%):</span>
        <span style="color:#000;font-weight:700;${nf2}">AED ${fmtMoney(vatAmount)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:8px 14px;border-top:2px solid #000;border-bottom:2px solid #000;font-size:11px;">
        <span style="color:#000;font-weight:800;">Total Amount:</span>
        <span style="color:#000;font-weight:800;${nf2}">AED ${fmtMoney(total)}</span>
      </div>
    </div>
  </div>

  <!-- Spacer -->
  <div style="flex:1 1 auto;min-height:20px;"></div>

  <!-- Footer Container (bordered) -->
  <div id="footer-block" style="position:relative;z-index:1;margin:0 28px;border-left:1px solid #1D3F55;border-right:1px solid #1D3F55;border-bottom:1px solid #1D3F55;">
    <!-- Terms Bar -->
    <div style="background:#f0f0f0;color:#000;padding:6px 14px;font-size:10pt;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Terms &amp; Conditions</div>
    <div style="padding:6px 14px;font-size:9pt;color:#555;">Payment due within 60 days.</div>

    <!-- Bank Details -->
    <div style="padding:8px 14px;border-top:1px solid #ddd;">
      <div style="font-size:10pt;font-weight:bold;color:#1D3F55;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px;">Bank Details</div>
      <div style="font-size:9pt;color:#1A1A1A;line-height:1.8;">
        <div>Bank: ${esc(s.bank_name || '—')}</div>
        <div>Account Title: ${esc(s.bank_account_title || s.company_name || '—')}</div>
        <div>Account No: ${esc(s.bank_account_no || '—')}</div>
        <div>IBAN #: ${esc(s.bank_iban || '—')}</div>
        <div>Branch: ${esc(s.bank_branch || '—')}</div>
      </div>
    </div>

    <!-- Signature Blocks (Two Columns) -->
    <div style="display:flex;border-top:1px solid #ddd;padding:24px 14px;gap:20px;">
      <!-- Left: Authorized By -->
      <div style="flex:1;text-align:center;">
        <div style="font-size:10pt;font-weight:bold;color:#9e8d7d;text-transform:uppercase;letter-spacing:1px;margin-bottom:30px;">AUTHORIZED BY</div>
        <div style="border-bottom:1px solid #333;margin-bottom:5px;width:80%;margin-left:auto;margin-right:auto;"></div>
        <div style="font-size:8.5pt;color:#7d7d7d;">Authorized Signature</div>
      </div>
      <!-- Right: Received By -->
      <div style="flex:1;text-align:center;">
        <div style="font-size:10pt;font-weight:bold;color:#9e8d7d;text-transform:uppercase;letter-spacing:1px;margin-bottom:30px;">RECEIVED BY</div>
        <div style="border-bottom:1px solid #333;margin-bottom:5px;width:80%;margin-left:auto;margin-right:auto;"></div>
        <div style="font-size:8.5pt;color:#7d7d7d;">Client Signature</div>
      </div>
    </div>
  </div>

  <!-- Bottom Footer Bar -->
  <div style="position:relative;z-index:1;margin:0 28px 8px;border:1px solid #1D3F55;background:#FAF7F2;padding:8px;text-align:center;">
    <div style="font-size:9pt;font-weight:bold;color:#1D3F55;letter-spacing:1px;">WE PROVIDE ALL KINDS OF GENERAL AND REFRIGERATED TRANSPORTATION AND HEAVY EQUIPMENT RENTAL SERVICES</div>
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

async function renderToPDF(html, invoice) {
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
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Capture the table header separately so it can be repeated on every continuation page
    let headerCanvas = null;
    let headerHeightPx = 0;
    if (thead) {
      headerCanvas = await html2canvas(thead, {
        scale: 3,
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
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
      });
    }

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const margin = 8; // mm page margins
    const footerH = 6; // mm reserved at the bottom for the page number
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
      const sliceData = sliceCanvas.toDataURL('image/png');
      const sliceHmm = totalHpx / pxPerMm;
      if (p > 0) pdf.addPage();
      pdf.addImage(sliceData, 'PNG', margin, margin, imgW, sliceHmm);

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

export async function downloadInvoicePDF(invoice, clientName, settings = {}, seqNo) {
  await renderInvoicePDF(invoice, clientName, settings, 'standard', seqNo);
}

export async function downloadMonthlyInvoicePDF(invoice, clientName, settings = {}, seqNo) {
  await renderInvoicePDF(invoice, clientName, settings, 'monthly', seqNo);
}

export async function downloadPerTripInvoicePDF(invoice, clientName, settings = {}, seqNo) {
  await renderInvoicePDF(invoice, clientName, settings, 'trip', seqNo);
}