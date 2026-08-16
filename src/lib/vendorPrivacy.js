/**
 * Vendor Data Privacy Utility
 *
 * Enforces that vendor/service-provider identity and vendor-specific amounts
 * NEVER appear in client-facing output (invoices, payment portals, exported PDFs).
 *
 * Vendor Payment data (Agreed Rate, Payment Status, Due Date, Notes) is visible
 * ONLY in internal-facing views: the trip form (admin-only), the Service Provider's
 * own ledger/transaction history, and internal reports/exports.
 */

/**
 * Fields on the Trip entity that are strictly internal-only (vendor-related).
 * These must never be rendered in any client-facing context.
 */
export const VENDOR_ONLY_FIELDS = [
  'vendor_name',
  'vendor_agreed_rate',
  'vendor_payment_status',
  'vendor_due_date',
  'vendor_payment_notes',
  'assignment_mode',
];

/**
 * Returns true if the given field name is a vendor-only (internal) field.
 * Use this to guard any render path that produces client-facing content.
 */
export function isVendorField(fieldName) {
  return VENDOR_ONLY_FIELDS.includes(fieldName);
}

/**
 * Returns a shallow copy of the trip object with all vendor-only fields stripped.
 * Use this before passing trip data to any client-facing renderer (invoice HTML,
 * PDF, preview, payment portal, shared document).
 */
export function stripVendorData(trip) {
  if (!trip || typeof trip !== 'object') return trip;
  const cleaned = { ...trip };
  for (const field of VENDOR_ONLY_FIELDS) {
    delete cleaned[field];
  }
  return cleaned;
}

/**
 * Development-time assertion: throws if a vendor-only field is present and non-empty
 * on the given object. Call this at the entry point of any client-facing render
 * function to catch leaks early.
 */
export function assertNoVendorData(obj, context = '') {
  if (!obj || typeof obj !== 'object') return;
  for (const field of VENDOR_ONLY_FIELDS) {
    const val = obj[field];
    if (val !== undefined && val !== null && val !== '' && val !== 0) {
      console.warn(
        `[vendorPrivacy] Vendor-only field "${field}" is present in client-facing data${context ? ` (${context})` : ''}. ` +
        `This data must not appear in client-facing output.`
      );
    }
  }
}