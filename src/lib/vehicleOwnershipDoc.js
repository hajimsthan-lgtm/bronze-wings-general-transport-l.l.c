import { base44 } from '@/api/base44Client';

/**
 * Uploads the ownership (Mulkia) PDF and creates a Document record linked to the vehicle.
 * Called after a vehicle is created or updated.
 *
 * @param {string} vehicleId - The Vehicle entity record ID
 * @param {{ pdfFile?: File, pdfUrl?: string, expiryDate?: string }} opts
 * @returns {Promise<object|null>} The created Document record, or null if nothing to save.
 */
export async function saveOwnershipDocument(vehicleId, { pdfFile, pdfUrl, expiryDate }) {
  let fileUrl = pdfUrl;
  if (pdfFile) {
    const res = await base44.integrations.Core.UploadFile({ file: pdfFile });
    fileUrl = res?.file_url;
  }
  if (!fileUrl) return null;

  return await base44.entities.Document.create({
    title: 'Mulkia',
    type: 'registration',
    file_url: fileUrl,
    expiry_date: expiryDate || '',
    related_entity: 'Vehicle',
    related_id: vehicleId,
    status: 'valid',
  });
}