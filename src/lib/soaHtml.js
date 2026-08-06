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
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

export function buildSoaHTML(rows, settings = {}, meta = {}) {
  const s = settings;
  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Split company name into brand (H1) + suffix (H2) — same as invoice letterhead
  const fullName = s.company_name || 'Bronze Wings General Transport L.L.C';
  const gIdx = fullName.toLowerCase().indexOf('general');
  const compH1 = gIdx >= 0 ? fullName.slice(0, gIdx).trim() : fullName;
  const compH2 = gIdx >= 0 ? fullName.slice(gIdx).trim() : '';

  const dateStr = meta.date || format(new Date(), 'dd-MM-yyyy');
  const clientName = meta.clientName || '';
  const dateRange = meta.dateRange || '';

  // Status colour: DRAFT / OVERDUE / CANCELLED → red, RECEIVED → green, others → black
  const statusColor = (st) => {
    const u = String(st || '').toUpperCase();
    if (u === 'DRAFT' || u === 'OVERDUE' || u === 'CANCELLED') return '#FF0000';
    if (u === 'RECEIVED' || u === 'PAID') return '#1B7A3D';
    return '#000000';
  };

  const rowsHtml = rows.map((r) => {
    const stColor = statusColor(r.status);
    return `<tr>
      <td style="padding:7px 6px;border:1px solid #000;text-align:center;font-size:9.5pt;color:#000;font-weight:600;">${esc(String(r.sno))}</td>
      <td style="padding:7px 6px;border:1px solid #000;text-align:center;font-size:9.5pt;color:#000;font-weight:600;">${esc(r.invoice_number)}</td>
      <td style="padding:7px 6px;border:1px solid #000;text-align:center;font-size:9.5pt;color:#000;">${esc(r.month)}</td>
      <td style="padding:7px 6px;border:1px solid #000;text-align:center;font-size:9.5pt;color:#000;">${esc(r.vehicle_type)}</td>
      <td style="padding:7px 6px;border:1px solid #000;text-align:center;font-size:9.5pt;color:${stColor};font-weight:600;">${esc(r.status)}</td>
      <td style="padding:7px 6px;border:1px solid #000;text-align:right;font-size:9.5pt;color:#000;font-weight:600;">${fmtMoney(r.amount)}</td>
    </tr>`;
  }).join('') || `<tr><td colspan="6" style="padding:12px 6px;border:1px solid #000;text-align:center;font-size:9.5pt;color:#999;">No invoices in this period</td></tr>`;

  return `
<div id="soa-container" style="width:794px;min-height:1080px;display:flex;flex-direction:column;font-family:'Inter','Segoe UI',Arial,Helvetica,sans-serif;font-size:10pt;color:#000;line-height:1.4;background:#ffffff;box-sizing:border-box;padding:40px 50px;">

  <div id="soa-header">
  <!-- Letterhead: logo + brand (left) | contact info (right) -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
    <div style="display:flex;align-items:center;gap:10px;">
      ${s.logo_url ? `<img src="${esc(s.logo_url)}" style="height:62px;width:62px;border-radius:50%;object-fit:cover;" />` : ''}
      <div>
        <div style="font-size:20pt;font-weight:800;color:#000;letter-spacing:1.5px;text-transform:uppercase;line-height:1.1;">${esc(compH1)}</div>
        ${compH2 ? `<div style="font-size:9pt;font-weight:500;color:#555;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">${esc(compH2)}</div>` : ''}
      </div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#000;line-height:1.6;">
      ${esc(s.phone1 || '')}${s.phone2 ? `<br>${esc(s.phone2)}` : ''}<br>
      ${s.email ? `${esc(s.email)}<br>` : ''}${esc(s.address || '')}
    </div>
  </div>
  <div style="border-bottom:1.5px solid #8C745E;margin-bottom:10px;"></div>
  <!-- Address line + ATTN -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
    <div style="text-align:left;font-size:10pt;color:#000;line-height:1.5;">
      <div style="font-weight:700;">${esc(s.address || 'M-6, Mussafah, Abu Dhabi, UAE')}</div>
      <div style="text-decoration:underline;font-weight:600;margin-top:4px;">ATTN: ACCOUNTS DEPARTMENT</div>
      ${clientName ? `<div style="margin-top:4px;">Client: <span style="font-weight:700;">${esc(clientName)}</span></div>` : ''}
    </div>
    <div style="text-align:right;font-size:10pt;color:#000;line-height:1.5;">
      <div>Date: <span style="font-weight:700;">${esc(dateStr)}</span></div>
      ${dateRange ? `<div style="margin-top:4px;font-size:9pt;color:#555;">Period: ${esc(dateRange)}</div>` : ''}
      ${s.trn ? `<div style="margin-top:4px;font-size:9pt;color:#555;">TRN: ${esc(s.trn)}</div>` : ''}
    </div>
  </div>
  </div><!-- /soa-header -->

  <!-- Centered subject heading -->
  <div style="text-align:center;margin:10px 0 16px;">
    <div style="font-size:13pt;font-weight:700;color:#000;text-decoration:underline;letter-spacing:1px;">Sub: Account Statement</div>
  </div>

  <!-- Data table — black borders, clean grid -->
  <table id="soa-table" style="width:100%;border-collapse:collapse;margin-bottom:10px;font-size:9.5pt;">
    <thead>
      <tr>
        <th style="border:1px solid #000;background:#F3F3F3;padding:8px 6px;text-align:center;width:8%;font-weight:700;font-size:9pt;color:#000;text-transform:uppercase;">S.NO</th>
        <th style="border:1px solid #000;background:#F3F3F3;padding:8px 6px;text-align:center;width:20%;font-weight:700;font-size:9pt;color:#000;text-transform:uppercase;">Invoice #</th>
        <th style="border:1px solid #000;background:#F3F3F3;padding:8px 6px;text-align:center;width:14%;font-weight:700;font-size:9pt;color:#000;text-transform:uppercase;">Month</th>
        <th style="border:1px solid #000;background:#F3F3F3;padding:8px 6px;text-align:center;width:22%;font-weight:700;font-size:9pt;color:#000;text-transform:uppercase;">Vehicle type</th>
        <th style="border:1px solid #000;background:#F3F3F3;padding:8px 6px;text-align:center;width:18%;font-weight:700;font-size:9pt;color:#000;text-transform:uppercase;">Status</th>
        <th style="border:1px solid #000;background:#F3F3F3;padding:8px 6px;text-align:right;width:18%;font-weight:700;font-size:9pt;color:#000;text-transform:uppercase;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- Total row — right aligned, red -->
  <div style="text-align:right;margin-top:6px;margin-bottom:30px;">
    <span style="font-size:11pt;font-weight:700;color:#FF0000;">Total: ${fmtMoney(total)}</span>
  </div>

  <!-- Footer signatures -->
  <div style="margin-top:auto;padding-top:40px;">
    <div style="font-size:8.5pt;color:#555;font-style:italic;margin-bottom:24px;">If you have any questions concerning this statement, please contact our accounts department.</div>
    <div style="display:flex;justify-content:space-between;margin-top:20px;">
      <div style="text-align:center;">
        <div style="border-top:1px solid #000;width:200px;padding-top:6px;font-size:9pt;color:#000;font-weight:600;">Received By</div>
      </div>
      <div style="text-align:center;">
        <div style="border-top:1px solid #000;width:200px;padding-top:6px;font-size:9pt;color:#000;font-weight:600;">For ${esc(compH1)}</div>
      </div>
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

export async function exportSoaPDF(rows, filename, meta = {}) {
  const settings = meta.settings || (await import('./companySettings').then(m => m.getCompanySettings()));
  let logoDataUrl = null;
  if (settings.logo_url) {
    try { logoDataUrl = await fetchLogoDataUrl(settings.logo_url); } catch (e) {}
  }
  const html = buildSoaHTML(rows, { ...settings, logo_url: logoDataUrl || settings.logo_url }, meta);

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const fullEl = container.querySelector('#soa-container');
    const headerEl = container.querySelector('#soa-header');
    const thead = container.querySelector('#soa-table thead');

    const canvas = await html2canvas(fullEl, { scale: 2, backgroundColor: '#ffffff', useCORS: true });

    const pxPerMm = canvas.width / 210;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.width;
    const pdfH = pdf.internal.pageSize.height;
    const marginMm = 8;
    const usableH = pdfH - marginMm * 2;
    const usablePx = usableH * pxPerMm;

    // ── Single page: content fits → one image, no page numbers ──
    if (canvas.height <= usablePx) {
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const imgHmm = canvas.height / pxPerMm;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, imgHmm);
      pdf.save(`${filename}.pdf`);
      return;
    }

    // ── Multi-page: slice header + table-head from the MAIN canvas (correct width, no distortion) ──
    const sf = canvas.width / fullEl.getBoundingClientRect().width;
    const headerHeightPx = Math.round(headerEl.getBoundingClientRect().height * sf);
    let tableHeadStartPx = 0;
    let tableHeadHeightPx = 0;
    if (thead) {
      tableHeadStartPx = Math.round((thead.getBoundingClientRect().top - fullEl.getBoundingClientRect().top) * sf);
      tableHeadHeightPx = Math.round(thead.getBoundingClientRect().height * sf);
    }
    const contGap = 4 * pxPerMm;

    const pageBreaks = [];
    let cursor = 0;
    let pageIdx = 0;
    while (cursor < canvas.height) {
      const isCont = pageIdx > 0;
      const overhead = isCont ? (headerHeightPx + tableHeadHeightPx + contGap) : 0;
      let breakAt = cursor + (usablePx - overhead);
      if (breakAt >= canvas.height) { pageBreaks.push(canvas.height); break; }
      if (breakAt <= cursor) breakAt = cursor + usablePx;
      pageBreaks.push(breakAt);
      cursor = breakAt;
      pageIdx++;
    }

    const totalPages = pageBreaks.length;
    for (let p = 0; p < totalPages; p++) {
      const y0 = p === 0 ? 0 : pageBreaks[p - 1];
      const isCont = p > 0;
      const headerOffset = isCont ? (headerHeightPx + tableHeadHeightPx + contGap) : 0;
      const contentHpx = pageBreaks[p] - y0;
      if (contentHpx <= 0) break;

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = contentHpx + headerOffset;
      const ctx = slice.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      if (isCont) {
        // Header from top of main canvas — same width, no stretching/distortion
        ctx.drawImage(canvas, 0, 0, canvas.width, headerHeightPx, 0, 0, canvas.width, headerHeightPx);
        if (tableHeadHeightPx > 0) {
          ctx.drawImage(canvas, 0, tableHeadStartPx, canvas.width, tableHeadHeightPx, 0, headerHeightPx + contGap, canvas.width, tableHeadHeightPx);
        }
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

    pdf.save(`${filename}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}