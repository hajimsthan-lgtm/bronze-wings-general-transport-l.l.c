/**
 * Opens a document URL in a new browser tab for full-screen viewing.
 * Shared across all document viewers in the app — vehicle docs, driver docs,
 * invoices, quotations, agreements, company documents.
 *
 * For PDFs, the browser's built-in PDF viewer handles multi-page navigation.
 * For images, the browser displays the full-resolution image with zoom support.
 *
 * @param {string} url  — the file URL to open
 * @param {string} [title] — optional title (used for window name)
 */
export function openDocument(url, title) {
  if (!url) return;
  window.open(url, title ? encodeURIComponent(title) : '_blank', 'noopener,noreferrer');
}