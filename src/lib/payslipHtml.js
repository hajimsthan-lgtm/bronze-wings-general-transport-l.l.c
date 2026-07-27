import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

export function buildPayslipHTML(rec, driver = {}, settings = {}) {
  const s = settings;
  const basic = Number(rec.base_salary) || 0;
  const overtime = Number(rec.overtime) || 0;
  const bonus = Number(rec.bonus) || 0;
  const deductions = Number(rec.deductions) || 0;
  const gross = basic + overtime + bonus;
  const net = Number(rec.net_salary) || (gross - deductions);

  const fullName = s.company_name || 'Bronze Wings General Transport L.L.C';
  const gIdx = fullName.toLowerCase().indexOf('general');
  const compH1 = gIdx >= 0 ? fullName.slice(0, gIdx).trim() : fullName;
  const compH2 = gIdx >= 0 ? fullName.slice(gIdx).trim() : '';

  const refNumber = rec.id ? `PS-${String(rec.id).slice(-6).toUpperCase()}` : 'PAY SLIP';
  const period = `${rec.month || ''} ${rec.year || ''}`.trim() || '—';

  const earningRows = [
    { label: 'Basic Salary', amount: basic },
    { label: 'Overtime', amount: overtime },
    { label: 'Bonus', amount: bonus },
  ].map((e, i, arr) => {
    const isLast = i === arr.length - 1;
    const border = isLast ? '2px solid #1F2937' : '1px solid #E5E7EB';
    return `<tr>
      <td style="padding:10px 12px;border-bottom:${border};font-size:9.5pt;color:#1F2937;font-weight:600;">${esc(e.label)}</td>
      <td style="padding:10px 12px;border-bottom:${border};text-align:right;font-size:9.5pt;color:#1F2937;font-weight:600;">${fmtMoney(e.amount)}</td>
    </tr>`;
  }).join('');

  return `
<div id="payslip-container" style="width:794px;min-height:1123px;display:flex;flex-direction:column;font-family:'Inter','Segoe UI',Arial,Helvetica,sans-serif;font-size:10pt;color:#1F2937;line-height:1.4;background:#ffffff;box-sizing:border-box;padding:40px 50px;">

  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
    <div style="display:flex;align-items:center;gap:10px;">
      ${s.logo_url ? `<img src="${esc(s.logo_url)}" style="height:62px;width:62px;border-radius:50%;object-fit:cover;" />` : ''}
      <div>
        <div style="font-size:20pt;font-weight:800;color:#333;letter-spacing:1.5px;text-transform:uppercase;line-height:1.1;">${esc(compH1)}</div>
        ${compH2 ? `<div style="font-size:9pt;font-weight:500;color:#555;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">${esc(compH2)}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#333;line-height:1.6;">
      ${esc(s.phone1 || '')}${s.phone2 ? `<br>${esc(s.phone2)}` : ''}<br>
      ${s.email ? `${esc(s.email)}<br>` : ''}${esc(s.address || '')}
    </div>
  </div>
  <div style="border-bottom:1.5px solid #8C745E;margin-bottom:14px;"></div>

  <div style="text-align:center;margin-bottom:14px;">
    <div style="font-size:18pt;font-weight:700;color:#333;letter-spacing:3px;text-transform:uppercase;line-height:1.1;">PAY SLIP</div>
    <div style="font-size:11pt;color:#8C745E;font-weight:700;margin-top:4px;">${esc(refNumber)}</div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
    <div style="flex:1;text-align:left;">
      <div style="font-size:8pt;text-transform:uppercase;color:#777;font-weight:700;letter-spacing:1.5px;margin-bottom:5px;">Employee</div>
      <div style="font-size:10pt;font-weight:700;color:#333;margin-bottom:2px;">${esc(rec.driver_name || driver.name || '—')}</div>
      <div style="font-size:9pt;color:#333;line-height:1.6;">
        ${driver.phone ? `${esc(driver.phone)}<br>` : ''}
        ${driver.nationality ? `Nationality: ${esc(driver.nationality)}<br>` : ''}
        ${driver.license_number ? `License: ${esc(driver.license_number)}` : ''}
      </div>
    </div>
    <div style="flex:1;text-align:right;">
      <div style="font-size:9pt;color:#333;margin-bottom:5px;">Pay Period: ${esc(period)}</div>
      <div style="font-size:9pt;color:#333;margin-bottom:5px;">Pay Date: ${fmtDate(rec.payment_date)}</div>
      <div style="font-size:8pt;text-transform:uppercase;color:#777;font-weight:700;letter-spacing:1.5px;margin-bottom:5px;">Employer</div>
      <div style="font-size:9.5pt;font-weight:700;color:#333;margin-bottom:2px;">${esc(s.company_name || '')}</div>
      <div style="font-size:9pt;color:#333;line-height:1.6;">TRN: ${esc(s.trn || '')}</div>
    </div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:9pt;">
    <thead>
      <tr>
        <th style="background:#9A8471;color:#fff;padding:9px 12px;text-align:left;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Earnings</th>
        <th style="background:#9A8471;color:#fff;padding:9px 12px;text-align:right;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Amount (AED)</th>
      </tr>
    </thead>
    <tbody>${earningRows}</tbody>
  </table>

  <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:9pt;">
    <thead>
      <tr>
        <th style="background:#9A8471;color:#fff;padding:9px 12px;text-align:left;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Deductions</th>
        <th style="background:#9A8471;color:#fff;padding:9px 12px;text-align:right;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Amount (AED)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:10px 12px;border-bottom:2px solid #1F2937;font-size:9.5pt;color:#1F2937;font-weight:600;">Total Deductions</td>
        <td style="padding:10px 12px;border-bottom:2px solid #1F2937;text-align:right;font-size:9.5pt;color:#1F2937;font-weight:600;">${fmtMoney(deductions)}</td>
      </tr>
    </tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-bottom:40px;">
    <div style="width:260px;">
      <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:9.5pt;color:#444;border-bottom:1px solid #E5E7EB;">
        <span>Gross Earnings</span><span>${fmtMoney(gross)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:9.5pt;color:#444;border-bottom:1px solid #E5E7EB;">
        <span>Total Deductions</span><span>${fmtMoney(deductions)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:11pt;color:#222;border-top:2px solid #1F2937;padding-top:8px;margin-top:3px;">
        <span>Net Pay</span><span>${fmtMoney(net)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0 0;font-size:8.5pt;color:#777;">
        <span>Payment Method</span><span>${esc((rec.payment_method || '').replace(/_/g, ' ').toUpperCase())}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:8.5pt;color:#777;">
        <span>Status</span><span>${esc((rec.status || '').toUpperCase())}</span>
      </div>
    </div>
  </div>

  ${rec.notes ? `<div style="margin-bottom:30px;"><div style="font-size:8pt;text-transform:uppercase;color:#8C745E;font-weight:600;letter-spacing:1px;margin-bottom:4px;">Notes</div><div style="font-size:9pt;color:#1F2937;line-height:1.5;">${esc(rec.notes)}</div></div>` : ''}

  <div style="display:flex;justify-content:space-between;margin-top:30px;padding-top:15px;">
    <div style="width:42%;text-align:center;">
      <div style="font-size:8pt;text-transform:uppercase;color:#8C745E;font-weight:600;letter-spacing:1px;margin-bottom:40px;">Prepared By</div>
      <div style="border-top:1.5px solid #555;width:85%;margin:0 auto;padding-top:6px;font-size:8.5pt;color:#666;">Authorized Signature</div>
    </div>
    <div style="width:42%;text-align:center;">
      <div style="font-size:8pt;text-transform:uppercase;color:#8C745E;font-weight:600;letter-spacing:1px;margin-bottom:40px;">Received By</div>
      <div style="border-top:1.5px solid #555;width:85%;margin:0 auto;padding-top:6px;font-size:8.5pt;color:#666;">Employee Signature</div>
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

export async function downloadPayslipPDF(rec, driver = {}, settings = {}) {
  let logoDataUrl = null;
  if (settings.logo_url) {
    try { logoDataUrl = await fetchLogoDataUrl(settings.logo_url); } catch (e) {}
  }
  const html = buildPayslipHTML(rec, driver, { ...settings, logo_url: logoDataUrl || settings.logo_url });
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-9999px';
  wrapper.style.top = '0';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);

  try {
    const element = wrapper.querySelector('#payslip-container');
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
    pdf.save(`payslip-${(rec.driver_name || 'employee').replace(/\s+/g, '-')}-${rec.month || ''}-${rec.year || ''}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}