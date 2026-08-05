import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function fmtMoney(n) {
  return Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function buildPaymentSlipHTML(payment, client = {}, settings = {}) {
  const s = settings;
  const amount = Number(payment.amount) || 0;
  const unapplied = Number(payment.unapplied_balance) || 0;
  const allocs = (payment.allocated_invoices || []).filter(a => a.allocated_amount > 0);
  const appliedTotal = allocs.reduce((sum, a) => sum + (Number(a.allocated_amount) || 0), 0);

  const fullName = s.company_name || 'Bronze Wings General Transport L.L.C';
  const gIdx = fullName.toLowerCase().indexOf('general');
  const compH1 = gIdx >= 0 ? fullName.slice(0, gIdx).trim() : fullName;
  const compH2 = gIdx >= 0 ? fullName.slice(gIdx).trim() : '';

  const refNumber = payment.reference_number || `PMT-${String(payment.id || '').slice(-6).toUpperCase()}`;

  const allocRows = allocs.length ? allocs.map((a, i, arr) => {
    const isLast = i === arr.length - 1;
    const border = isLast ? '2px solid #1F2937' : '1px solid #E5E7EB';
    return `<tr>
      <td style="padding:9px 12px;border-bottom:${border};font-size:9.5pt;color:#1F2937;font-weight:600;">${esc(a.invoice_number || '—')}</td>
      <td style="padding:9px 12px;border-bottom:${border};text-align:right;font-size:9.5pt;color:#1F2937;font-weight:600;">${fmtMoney(a.allocated_amount)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="2" style="padding:9px 12px;font-size:9.5pt;color:#9CA3AF;font-style:italic;text-align:center;">No invoice allocations</td></tr>`;

  return `
<div id="payment-slip-container" style="width:794px;min-height:1123px;display:flex;flex-direction:column;font-family:'Inter','Segoe UI',Arial,Helvetica,sans-serif;font-size:10pt;color:#1F2937;line-height:1.4;background:#ffffff;box-sizing:border-box;padding:40px 50px;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #8C745E;padding-bottom:18px;margin-bottom:28px;">
    <div style="display:flex;align-items:center;gap:14px;">
      ${s.logo_url ? `<img src="${esc(s.logo_url)}" style="height:58px;max-width:180px;object-fit:contain;" />` : ''}
      <div>
        <div style="font-size:15pt;font-weight:800;color:#1F2937;letter-spacing:-0.3px;">${esc(compH1)}</div>
        ${compH2 ? `<div style="font-size:10pt;font-weight:600;color:#8C745E;letter-spacing:0.5px;margin-top:2px;">${esc(compH2)}</div>` : ''}
        <div style="font-size:8pt;color:#6B7280;margin-top:4px;">${esc(s.address || '')}</div>
        <div style="font-size:8pt;color:#6B7280;">${esc(s.phone1 || '')} ${s.phone2 ? '· ' + esc(s.phone2) : ''} ${s.email ? '· ' + esc(s.email) : ''}</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:13pt;font-weight:800;color:#8C745E;text-transform:uppercase;letter-spacing:2px;">Payment Receipt</div>
      <div style="font-size:9pt;color:#1F2937;font-weight:600;margin-top:6px;">${esc(refNumber)}</div>
      <div style="font-size:8.5pt;color:#6B7280;margin-top:2px;">Date: ${fmtDate(payment.payment_date)}</div>
    </div>
  </div>

  <div style="display:flex;gap:20px;margin-bottom:24px;">
    <div style="flex:1;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:14px 16px;">
      <div style="font-size:7.5pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1px;margin-bottom:6px;">Received From</div>
      <div style="font-size:11pt;font-weight:700;color:#1F2937;">${esc(payment.client_name || client.name || '—')}</div>
      ${client.contact_person ? `<div style="font-size:8.5pt;color:#6B7280;margin-top:2px;">${esc(client.contact_person)}</div>` : ''}
      ${client.phone ? `<div style="font-size:8.5pt;color:#6B7280;">${esc(client.phone)}</div>` : ''}
    </div>
    <div style="flex:1;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:14px 16px;">
      <div style="font-size:7.5pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1px;margin-bottom:6px;">Payment Details</div>
      <div style="font-size:9pt;color:#1F2937;font-weight:600;">Mode: ${esc(payment.payment_mode || '—')}</div>
      <div style="font-size:9pt;color:#1F2937;font-weight:600;margin-top:3px;">Status: ${esc(payment.status || '—')}</div>
      ${payment.notes ? `<div style="font-size:8.5pt;color:#6B7280;margin-top:3px;">${esc(payment.notes)}</div>` : ''}
    </div>
  </div>

  <div style="margin-bottom:24px;">
    <div style="font-size:8pt;text-transform:uppercase;color:#8C745E;font-weight:700;letter-spacing:1px;margin-bottom:8px;">Invoice Allocations</div>
    <table style="width:100%;border-collapse:collapse;border:2px solid #1F2937;">
      <thead>
        <tr style="background:#1F2937;">
          <th style="padding:9px 12px;text-align:left;font-size:8.5pt;color:#fff;font-weight:700;letter-spacing:0.5px;">Invoice Number</th>
          <th style="padding:9px 12px;text-align:right;font-size:8.5pt;color:#fff;font-weight:700;letter-spacing:0.5px;">Allocated Amount</th>
        </tr>
      </thead>
      <tbody>${allocRows}</tbody>
    </table>
  </div>

  <div style="display:flex;justify-content:flex-end;margin-bottom:32px;">
    <div style="width:280px;">
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E5E7EB;font-size:9.5pt;color:#374151;">
        <span>Applied Total</span><span style="font-weight:600;">${fmtMoney(appliedTotal)}</span>
      </div>
      ${unapplied > 0.01 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E5E7EB;font-size:9.5pt;color:#374151;">
        <span>Unapplied Balance</span><span style="font-weight:600;">${fmtMoney(unapplied)}</span>
      </div>` : ''}
      <div style="display:flex;justify-content:space-between;padding:10px 14px;background:#8C745E;color:#fff;margin-top:6px;border-radius:6px;">
        <span style="font-size:10.5pt;font-weight:700;">Total Payment</span><span style="font-size:11pt;font-weight:800;">${fmtMoney(amount)}</span>
      </div>
    </div>
  </div>

  <div style="display:flex;justify-content:space-between;margin-top:auto;padding-top:40px;">
    <div style="width:42%;text-align:center;">
      <div style="font-size:8pt;text-transform:uppercase;color:#8C745E;font-weight:600;letter-spacing:1px;margin-bottom:40px;">Authorized By</div>
      <div style="border-top:1.5px solid #555;width:85%;margin:0 auto;padding-top:6px;font-size:8.5pt;color:#666;">Authorized Signature</div>
    </div>
    <div style="width:42%;text-align:center;">
      <div style="font-size:8pt;text-transform:uppercase;color:#8C745E;font-weight:600;letter-spacing:1px;margin-bottom:40px;">Received By</div>
      <div style="border-top:1.5px solid #555;width:85%;margin:0 auto;padding-top:6px;font-size:8.5pt;color:#666;">Client Signature</div>
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

export async function downloadPaymentSlipPDF(payment, client = {}, settings = {}) {
  let logoDataUrl = null;
  if (settings.logo_url) {
    try { logoDataUrl = await fetchLogoDataUrl(settings.logo_url); } catch (e) {}
  }
  const html = buildPaymentSlipHTML(payment, client, { ...settings, logo_url: logoDataUrl || settings.logo_url });
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  try {
    const element = wrapper.querySelector('#payment-slip-container');
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
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
    pdf.save(`payment-${payment.reference_number || payment.id}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}