import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { PDFDocument, StandardFonts } from 'npm:pdf-lib@1.17.1';

const ROOT_FOLDER_NAME = 'Bronze Wings Invoices';

async function findFolder(authHeader, name, parentId) {
  let q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) q += ` and '${parentId}' in parents`;
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
    { headers: authHeader }
  );
  const data = await res.json();
  return (data.files && data.files.length > 0) ? data.files[0].id : null;
}

async function createFolder(authHeader, name, parentId) {
  const metadata = { name, mimeType: 'application/vnd.google-apps.folder' };
  if (parentId) metadata.parents = [parentId];
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify(metadata),
  });
  const data = await res.json();
  return data.id;
}

async function generateInvoicePdfBytes(invoice, settings) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_W = 595.28;
  const PAGE_H = 841.89;
  const MARGIN = 40;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 50;

  // Company header
  page.drawText(String(settings.company_name || 'Bronze Wings'), { x: MARGIN, y, size: 16, font: boldFont });
  y -= 20;
  if (settings.address) { page.drawText(String(settings.address).substring(0, 70), { x: MARGIN, y, size: 8, font }); y -= 12; }
  if (settings.phone1) { page.drawText(`Tel: ${settings.phone1}`, { x: MARGIN, y, size: 8, font }); y -= 12; }
  if (settings.email) { page.drawText(`Email: ${settings.email}`, { x: MARGIN, y, size: 8, font }); y -= 12; }
  if (settings.trn) { page.drawText(`TRN: ${settings.trn}`, { x: MARGIN, y, size: 8, font }); y -= 12; }

  y -= 15;
  page.drawText('TAX INVOICE', { x: PAGE_W / 2 - 40, y, size: 14, font: boldFont });
  y -= 25;

  // Invoice details
  page.drawText(`Invoice #: ${invoice.invoice_number || ''}`, { x: MARGIN, y, size: 9, font });
  page.drawText(`Date: ${invoice.issue_date || ''}`, { x: PAGE_W - MARGIN - 80, y, size: 9, font });
  y -= 15;
  page.drawText(`Due: ${invoice.due_date || ''}`, { x: MARGIN, y, size: 9, font });
  y -= 25;

  // Bill to
  page.drawText('Bill To:', { x: MARGIN, y, size: 9, font: boldFont });
  y -= 15;
  page.drawText(String(invoice.client_name || '').substring(0, 50), { x: MARGIN, y, size: 9, font });
  y -= 12;
  if (invoice.client_address) { page.drawText(String(invoice.client_address).substring(0, 60), { x: MARGIN, y, size: 8, font }); y -= 12; }
  if (invoice.client_trn) { page.drawText(`TRN: ${invoice.client_trn}`, { x: MARGIN, y, size: 8, font }); y -= 12; }
  y -= 15;

  // Table header
  page.drawText('Description', { x: MARGIN, y, size: 8, font: boldFont });
  page.drawText('Qty', { x: PAGE_W - MARGIN - 120, y, size: 8, font: boldFont });
  page.drawText('Price', { x: PAGE_W - MARGIN - 70, y, size: 8, font: boldFont });
  page.drawText('Amount', { x: PAGE_W - MARGIN - 40, y, size: 8, font: boldFont });
  y -= 15;

  // Line items
  for (const item of (invoice.line_items || [])) {
    if (y < 60) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - 50;
    }
    page.drawText(String(item.description || '').substring(0, 50), { x: MARGIN, y, size: 8, font });
    page.drawText(String(item.quantity || 0), { x: PAGE_W - MARGIN - 120, y, size: 8, font });
    page.drawText(Number(item.unit_price || 0).toFixed(2), { x: PAGE_W - MARGIN - 70, y, size: 8, font });
    page.drawText(Number(item.amount || 0).toFixed(2), { x: PAGE_W - MARGIN - 40, y, size: 8, font });
    y -= 12;
  }

  y -= 15;
  page.drawText(`Subtotal: ${Number(invoice.subtotal || 0).toFixed(2)}`, { x: PAGE_W - MARGIN - 100, y, size: 9, font });
  y -= 12;
  page.drawText(`VAT (${invoice.vat_rate || 0}%): ${Number(invoice.vat_amount || 0).toFixed(2)}`, { x: PAGE_W - MARGIN - 100, y, size: 9, font });
  y -= 12;
  page.drawText(`Total: ${Number(invoice.total_amount || 0).toFixed(2)} ${invoice.currency || 'AED'}`, { x: PAGE_W - MARGIN - 100, y, size: 10, font: boldFont });

  return await pdfDoc.save();
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { invoice_id } = body;

    if (!invoice_id) return Response.json({ error: 'No invoice_id provided' }, { status: 400 });

    // Fetch invoice
    const invoice = await base44.entities.Invoice.get(invoice_id);
    if (!invoice) return Response.json({ error: 'Invoice not found' }, { status: 404 });

    // Skip if still draft
    if (invoice.status === 'draft') {
      return Response.json({ success: true, skipped: true, reason: 'Invoice is still draft' });
    }

    // Fetch company settings
    const settingsList = await base44.entities.CompanySettings.list('-created_date', 1);
    const settings = settingsList[0] || {};

    // Generate PDF
    const pdfBytes = await generateInvoicePdfBytes(invoice, settings);

    // Get Google Drive connection
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    if (!accessToken) return Response.json({ error: 'Google Drive not connected' }, { status: 503 });

    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Find or create root folder
    let rootFolderId = await findFolder(authHeader, ROOT_FOLDER_NAME, null);
    if (!rootFolderId) {
      rootFolderId = await createFolder(authHeader, ROOT_FOLDER_NAME, null);
    }

    // Per-month subfolder
    const monthKey = invoice.issue_date ? String(invoice.issue_date).substring(0, 7) : new Date().toISOString().substring(0, 7);
    let monthFolderId = await findFolder(authHeader, monthKey, rootFolderId);
    if (!monthFolderId) {
      monthFolderId = await createFolder(authHeader, monthKey, rootFolderId);
    }

    // Upload
    const fileMetadata = {
      name: `Invoice-${invoice.invoice_number || 'untitled'}.pdf`,
      parents: [monthFolderId],
    };
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
    formData.append('file', new Blob([pdfBytes], { type: 'application/pdf' }));

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      }
    );

    const fileData = await uploadRes.json();
    if (!uploadRes.ok) {
      return Response.json({ error: fileData.error?.message || 'Upload failed' }, { status: 500 });
    }

    return Response.json({
      success: true,
      driveFileId: fileData.id,
      driveUrl: fileData.webViewLink,
      folder: monthKey,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}