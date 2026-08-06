import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

const VEHICLE_TYPE_LABEL = {
  truck: 'TRUCK',
  trailer: 'FLATBED TRAILER',
  tanker: 'TANKER',
  pickup: 'PICKUP',
  other: 'OTHER',
};

const STATUS_LABEL = {
  paid: 'RECEIVED',
  sent: 'SENT',
  draft: 'DRAFT',
  partially_paid: 'PARTIAL',
  overdue: 'OVERDUE',
  cancelled: 'CANCELLED',
};

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

export function buildSoaHTML(rows, settings = {}, meta = {}) {
  const s = settings;
  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Split company name into brand (H1) + suffix (H2)
  const fullName = s.company_name || 'Bronze Wings General Transport L.L.C';
  const gIdx = fullName.toLowerCase().indexOf('general');
  const compH1 = gIdx >= 0 ? fullName.slice(0, gIdx).trim() : fullName;
  const compH2 = gIdx >= 0 ? fullName.slice(gIdx).trim() : '';

  const dateStr = meta.date || format(new Date(), 'dd/MM/yyyy');
  const clientName = meta.clientName || '';
  const dateRange = meta.dateRange || '';

  const rowsHtml = rows.map((r) => {
    return `<tr>
      <td style="padding:8px 6px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:9pt;color:#1F2937;">${esc(String(r.sno))}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:9pt;color:#1F2937;font-weight:600;">${esc(r.invoice_number)}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:9pt;color:#1F2937;">${esc(r.month)}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:9pt;color:#1F2937;">${esc(r.vehicle_type)}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #E5E7EB;text-align:center;font-size:9pt;color:#1F2937;">${esc(r.status)}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #E5E7EB;text-align:right;font-size:9pt;color:#1F2937;font-weight:600;">${fmtMoney(r.amount)}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" style="padding:14px 6px;text-align:center;font-size:9pt;color:#999;">No invoices in this period</td></tr>`;

  return `
<div id="soa-container" style="width:794px;min-height:1080px;display:flex;flex-direction:column;font-family:'Inter','Segoe UI',Arial,Helvetica,sans-serif;font-size:10pt;color:#1F2937;line-height:1.4;background:#ffffff;box-sizing:border-box;padding:40px 50px;">

  <div id="soa-header">
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
  ${s.tagline ? `<div style="font-size:8.5pt;color:#8C745E;font-style:italic;text-align:center;margin-bottom:8px;letter-spacing:0.5px;">${esc(s.tagline)}</div>` : ''}
  <div style="border-bottom:1.5px solid #8C745E;margin-bottom:14px;"></div>
  </div>

  <div style="text-align:center;margin-bottom:14px;">
    <div style="font-size:18pt;font-weight:700;color:#333;letter-spacing:3px;text-transform:uppercase;line-height:1.1;">Statement of Account</div>
    <div style="font-size:10pt;color:#8C745E;font-weight:600;margin-top:4px;">${esc(dateRange ? `Period: ${dateRange}` : '')}</div>
  </div>

  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
    <div style="text-align:left;">
      <div style="font-size:8pt;text-transform:uppercase;color:#777;font-weight:700;letter-spacing:1.5px;margin-bottom:5px;">Account Statement For</div>
      <div style="font-size:10pt;font-weight:700;color:#333;">${esc(clientName || 'All Clients')}</div>
      ${s.trn ? `<div style="font-size:9pt;color:#555;margin-top:2px;">TRN: ${esc(s.trn)}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div style="font-size:9pt;color:#333;">Statement Date: ${esc(dateStr)}</div>
      <div style="font-size:8pt;color:#777;margin-top:4px;">ATTN: ACCOUNTS DEPARTMENT</div>
    </div>
  </div>

  <table id="soa-table" style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:9pt;">
    <thead>
      <tr>
        <th style="background:#9A8471;color:#fff;padding:9px 6px;text-align:center;width:8%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">S.NO</th>
        <th style="background:#9A8471;color:#fff;padding:9px 6px;text-align:center;width:20%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Invoice #</th>
        <th style="background:#9A8471;color:#fff;padding:9px 6px;text-align:center;width:15%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Month</th>
        <th style="background:#9A8471;color:#fff;padding:9px 6px;text-align:center;width:22%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Vehicle Type</th>
        <th style="background:#9A8471;color:#fff;padding:9px 6px;text-align:center;width:20%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Status</th>
        <th style="background:#9A8471;color:#fff;padding:9px 6px;text-align:right;width:15%;font-weight:600;font-size:8.5pt;text-transform:uppercase;letter-spacing:0.5px;">Amount (AED)</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="5" style="padding:10px 6px;text-align:right;font-size:10pt;font-weight:700;color:#333;border-top:2px solid #1F2937;">Total</td>
        <td style="padding:10px 6px;text-align:right;font-size:11pt;font-weight:800;color:#1F2937;border-top:2px solid #1F2937;">${fmtMoney(total)}</td>
      </tr>
    </tfoot>
  </table>

  <div style="margin-top:auto;padding-top:30px;">
    <div style="font-size:8.5pt;color:#8C745E;font-style:italic;margin-bottom:18px;">If you have any questions concerning this statement, please contact our accounts department.</div>
    <div style="display:flex;justify-content:space-between;margin-top:20px;">
      <div style="text-align:center;">
        <div style="border-top:1px solid #333;width:200px;padding-top:6px;font-size:8.5pt;color:#555;">Received By</div>
      </div>
      <div style="text-align:center;">
        <div style="border-top:1px solid #333;width:200px;padding-top:6px;font-size:8.5pt;color:#555;">For ${esc(compH1)}</div>
      </div>
    </div>
  </div>

</div>`;
}

export async function exportSoaPDF(rows, filename, meta = {}) {
  const settings = meta.settings || (await import('./companySettings').then(m => m.getCompanySettings()));
  const html = buildSoaHTML(rows, settings, meta);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const fullEl = container.querySelector('#soa-container');
    const headerEl = container.querySelector('#soa-header');

    const canvas = await html2canvas(fullEl, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const headerCanvas = await html2canvas(headerEl, { scale: 2, backgroundColor: '#ffffff', useCORS: true });

    const pxPerMm = canvas.width / 210;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.width;
    const pdfH = pdf.internal.pageSize.height;
    const marginMm = 8;
    const usableH = pdfH - marginMm * 2;
    const effectiveUsable = usableH * pxPerMm;
    const headerHeightPx = headerCanvas.height;

    const pageBreaks = [];
    let cursor = 0;
    while (cursor < canvas.height) {
      let breakAt = cursor + effectiveUsable;
      if (breakAt >= canvas.height) { pageBreaks.push(canvas.height); break; }
      if (breakAt <= cursor) breakAt = cursor + effectiveUsable;
      pageBreaks.push(breakAt);
      cursor = breakAt;
    }

    const totalPages = pageBreaks.length;
    for (let p = 0; p < totalPages; p++) {
      const y0 = p === 0 ? 0 : pageBreaks[p - 1];
      const isCont = p > 0;
      const headerOffset = isCont ? headerHeightPx + 4 * pxPerMm : 0;
      const contentHpx = pageBreaks[p] - y0;
      if (contentHpx <= 0) break;

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = contentHpx + headerOffset;
      const ctx = slice.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      if (isCont) {
        ctx.drawImage(headerCanvas, 0, 0, headerCanvas.width, headerCanvas.height, 0, 0, canvas.width, headerHeightPx);
      }
      ctx.drawImage(canvas, 0, y0, canvas.width, contentHpx, 0, headerOffset, canvas.width, contentHpx);

      const sliceData = slice.toDataURL('image/jpeg', 0.92);
      const sliceHmm = slice.height / pxPerMm;
      if (p > 0) pdf.addPage();
      pdf.addImage(sliceData, 'JPEG', 0, 0, pdfW, sliceHmm);
      pdf.setFontSize(8);
      pdf.setTextColor(130, 130, 130);
      pdf.text(`Page ${p + 1} of ${totalPages}`, pdfW / 2, pdfH - 4, { align: 'center' });
    }

    const dateStrFile = (meta.date || new Date().toISOString().split('T')[0]).replace(/[\/\s-]+/g, '-');
    pdf.save(`${filename}-${dateStrFile}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}