import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

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

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { invoiceNumber, issueDate, clientName, pdfBase64, fileName } = body;

    if (!pdfBase64) return Response.json({ error: 'No PDF data provided' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googledrive');
    if (!accessToken) return Response.json({ error: 'Google Drive not connected' }, { status: 503 });

    const authHeader = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Find or create root folder
    let rootFolderId = await findFolder(authHeader, ROOT_FOLDER_NAME, null);
    if (!rootFolderId) {
      rootFolderId = await createFolder(authHeader, ROOT_FOLDER_NAME, null);
    }

    // Per-month subfolder (e.g. "2026-09")
    const monthKey = issueDate ? String(issueDate).substring(0, 7) : new Date().toISOString().substring(0, 7);
    let monthFolderId = await findFolder(authHeader, monthKey, rootFolderId);
    if (!monthFolderId) {
      monthFolderId = await createFolder(authHeader, monthKey, rootFolderId);
    }

    // Decode base64 → bytes
    const base64Data = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    const pdfBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

    // Upload via multipart
    const fileMetadata = {
      name: fileName || `Invoice-${invoiceNumber || 'untitled'}.pdf`,
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