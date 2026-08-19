/**
 * Shared document sharing helpers.
 * Generates a PDF File for an invoice/quotation/agreement and shares it
 * via the Web Share API (with the PDF as an attachment) when available,
 * falling back to downloading the PDF alongside a plain-text link.
 */
import { buildInvoicePdf } from './invoicePdfNative';
import { buildQuotationPdf } from './quotationPdf';
import { buildAgreementPdf } from './agreementPdf';

function docBaseName(doc, type) {
  if (type === 'invoice') return `invoice-${doc.invoice_number || doc.id || 'draft'}`;
  if (type === 'quotation') return `quotation-${doc.quotation_number || doc.id || 'draft'}`;
  return `agreement-${doc.agreement_number || doc.id || 'draft'}`;
}

/**
 * Builds the PDF for the given document and returns it as a File.
 */
export async function generateDocFile(doc, type, settings) {
  let pdf;
  if (type === 'invoice') {
    const isMonthly = /Rental|Contract/i.test(doc.line_items?.[0]?.description || '');
    pdf = await buildInvoicePdf(doc, doc.client_name, settings, isMonthly ? 'monthly' : 'standard');
  } else if (type === 'quotation') {
    pdf = await buildQuotationPdf(doc, settings);
  } else {
    pdf = await buildAgreementPdf(doc, settings);
  }
  const blob = pdf.output('blob');
  return new File([blob], `${docBaseName(doc, type)}.pdf`, { type: 'application/pdf' });
}

function triggerDownload(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Shares a document PDF + text via the Web Share API when the browser
 * supports sharing files (mobile/native share sheet → WhatsApp, Mail, etc.).
 * Returns true if the native share sheet was invoked, false if a fallback
 * (download + link) was used instead.
 */
export async function shareDocWithFile(doc, type, settings, { text, title }) {
  try {
    const file = await generateDocFile(doc, type, settings);
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: text || '', title: title || file.name });
      return true;
    }
    // Fallback: download the PDF so the user can attach it manually
    triggerDownload(file);
    return false;
  } catch (e) {
    // AbortError = user dismissed the share sheet — nothing to do
    if (e && e.name === 'AbortError') return true;
    // For any other error, try to at least download the file
    try {
      const file = await generateDocFile(doc, type, settings);
      triggerDownload(file);
    } catch (_) { /* ignore */ }
    return false;
  }
}

/**
 * Downloads the document PDF only (no share sheet). Used as a fallback
 * alongside opening a web compose link (e.g. Gmail) that cannot accept
 * a local file attachment programmatically.
 */
export async function downloadDocFile(doc, type, settings) {
  const file = await generateDocFile(doc, type, settings);
  triggerDownload(file);
}