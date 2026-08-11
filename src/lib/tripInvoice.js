import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';

import { generateNextInvoiceNumber as nextInvoiceNumber } from '@/lib/invoiceSequence';
export { nextInvoiceNumber };

/**
 * Build a trip description string: "FromLocation To ToLocation (driver, vehicle)".
 * Omits the parenthetical if neither driver nor vehicle is present.
 */
export function buildTripDesc(trip) {
  const extra = [trip.driver_name, trip.vehicle_plate].filter(Boolean).join(', ');
  return extra
    ? `${trip.from_location} To ${trip.to_location} (${extra})`
    : `${trip.from_location} To ${trip.to_location}`;
}

export async function getTripInvoice(tripId) {
  const existing = await base44.entities.Invoice.filter({ trip_id: tripId }).catch(() => []);
  return existing?.[0] || null;
}

/**
 * Mark a trip's invoice as sent (creating it if needed) or revert it to draft.
 * The invoice stays linked to the trip (trip_id) and the client (client_name),
 * so it shows up in the client's invoices section.
 */
/**
 * Generate a draft invoice for a trip (sends it to the invoice generator
 * queue rather than marking it sent directly). If an invoice already
 * exists for the trip, no duplicate is created.
 */
export async function generateTripInvoice(trip) {
  const existing = await getTripInvoice(trip.id);
  if (existing) return existing;
  const invoiceNumber = await nextInvoiceNumber();
  const settings = await getCompanySettings();
  const vatRate = settings.default_vat_rate || 5;
  const revenue = Number(trip.revenue) || 0;
  const vatAmount = Math.round(revenue * vatRate) / 100;
  return base44.entities.Invoice.create({
    invoice_number: invoiceNumber,
    client_name: trip.client_name,
    contact_person: trip.contact_person || '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    line_items: [{ description: buildTripDesc(trip), quantity: 1, unit_price: revenue, amount: revenue }],
    subtotal: revenue,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total_amount: Math.round((revenue + vatAmount) * 100) / 100,
    paid_amount: 0,
    status: 'draft',
    trip_id: trip.id,
  });
}

export async function setTripInvoiceSent(trip, sent) {
  const inv = await getTripInvoice(trip.id);
  if (inv) {
    return base44.entities.Invoice.update(inv.id, { status: sent ? 'sent' : 'draft' });
  }
  if (!sent) return null;
  const invoiceNumber = await nextInvoiceNumber();
  const settings = await getCompanySettings();
  const vatRate = settings.default_vat_rate || 5;
  const revenue = Number(trip.revenue) || 0;
  const vatAmount = Math.round(revenue * vatRate) / 100;
  return base44.entities.Invoice.create({
    invoice_number: invoiceNumber,
    client_name: trip.client_name,
    contact_person: trip.contact_person || '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    line_items: [{ description: buildTripDesc(trip), quantity: 1, unit_price: revenue, amount: revenue }],
    subtotal: revenue,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total_amount: Math.round((revenue + vatAmount) * 100) / 100,
    status: 'sent',
    trip_id: trip.id,
  });
}