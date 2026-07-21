import { base44 } from '@/api/base44Client';
import { getCompanySettings } from '@/lib/companySettings';

export async function nextInvoiceNumber() {
  const allInvs = await base44.entities.Invoice.list('-created_date', 500).catch(() => []);
  const year = new Date().getFullYear();
  const yearPrefix = `BW-${year}-`;
  let maxSeq = 0;
  (allInvs || []).forEach((inv) => {
    if (inv.invoice_number?.startsWith(yearPrefix)) {
      const seq = parseInt(inv.invoice_number.slice(yearPrefix.length), 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  });
  return `${yearPrefix}${String(maxSeq + 1).padStart(4, '0')}`;
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
    line_items: [{ description: `${trip.from_location} → ${trip.to_location} (${trip.trip_number || ''})`, quantity: 1, unit_price: revenue, amount: revenue }],
    subtotal: revenue,
    vat_rate: vatRate,
    vat_amount: vatAmount,
    total_amount: revenue + vatAmount,
    status: 'sent',
    trip_id: trip.id,
  });
}