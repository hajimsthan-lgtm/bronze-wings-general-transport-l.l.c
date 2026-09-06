import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';
import { stripVendorData, assertNoVendorData } from '@/lib/vendorPrivacy';
import { shortDriverName } from '@/lib/driverName';

import { generateNextInvoiceNumber as nextInvoiceNumber } from '@/lib/invoiceSequence';
export { nextInvoiceNumber };

/**
 * Build a trip description string: "FromLocation To ToLocation".
 * Driver and vehicle plate appear on a separate indicator line (D:/V:) via
 * the PDF renderer's buildIndicatorLine — not inline in the description.
 * NOTE: Vendor name is intentionally excluded — client-facing descriptions must
 * never reveal which service provider handled the trip.
 */
export function buildTripDesc(trip) {
  return `${trip.from_location} To ${trip.to_location}`;
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
/**
 * Build invoice line items from a trip, including add-ons as separate items.
 * Add-ons with vat_included=false are marked vat_excluded on the line item.
 */
function buildTripLineItems(safeTrip) {
  const revenue = Number(safeTrip.revenue) || 0;
  const items = [{
    description: buildTripDesc(safeTrip),
    quantity: 1,
    unit_price: revenue,
    amount: revenue,
    vat_excluded: false,
    driver_name: shortDriverName(safeTrip.driver_name),
    vehicle_no: safeTrip.vehicle_plate || '',
    show_driver: true,
    show_vehicle: true,
    show_delivery_note: !!safeTrip.delivery_note_number,
    delivery_note_no: safeTrip.delivery_note_number || '',
  }];
  const addOns = Array.isArray(safeTrip.add_ons) ? safeTrip.add_ons : [];
  addOns.forEach((addon) => {
    const amt = Number(addon.amount) || 0;
    if (amt > 0) {
      items.push({
        description: addon.description || 'Add-on charge',
        quantity: 1,
        unit_price: amt,
        amount: amt,
        vat_excluded: !addon.vat_included,
      });
    }
  });
  return items;
}

/**
 * Calculate subtotal, VAT, and total from line items, respecting per-item vat_excluded.
 */
function calcInvoiceTotals(items, vatRate) {
  const subtotal = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const vatAmount = items.reduce((s, i) => {
    if (i.vat_excluded) return s;
    return s + Math.round((Number(i.amount) || 0) * vatRate) / 100;
  }, 0);
  const total = Math.round((subtotal + vatAmount) * 100) / 100;
  return { subtotal, vatAmount, total };
}

export async function generateTripInvoice(trip) {
  const existing = await getTripInvoice(trip.id);
  if (existing) return existing;
  // Strip vendor-only fields before building client-facing invoice data
  const safeTrip = stripVendorData(trip);
  assertNoVendorData(safeTrip, 'generateTripInvoice');
  const invoiceNumber = await nextInvoiceNumber();
  const settings = await getCompanySettings();
  const vatRate = settings.default_vat_rate || 5;
  const lineItems = buildTripLineItems(safeTrip);
  const { subtotal, vatAmount, total } = calcInvoiceTotals(lineItems, vatRate);
  return base44.entities.Invoice.create({
    invoice_number: invoiceNumber,
    client_name: trip.client_name,
    contact_person: trip.contact_person || '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    line_items: lineItems,
    subtotal,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total_amount: total,
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
  // Strip vendor-only fields before building client-facing invoice data
  const safeTrip = stripVendorData(trip);
  assertNoVendorData(safeTrip, 'setTripInvoiceSent');
  const invoiceNumber = await nextInvoiceNumber();
  const settings = await getCompanySettings();
  const vatRate = settings.default_vat_rate || 5;
  const lineItems = buildTripLineItems(safeTrip);
  const { subtotal, vatAmount, total } = calcInvoiceTotals(lineItems, vatRate);
  return base44.entities.Invoice.create({
    invoice_number: invoiceNumber,
    client_name: trip.client_name,
    contact_person: trip.contact_person || '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    line_items: lineItems,
    subtotal,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total_amount: total,
    status: 'sent',
    trip_id: trip.id,
  });
}