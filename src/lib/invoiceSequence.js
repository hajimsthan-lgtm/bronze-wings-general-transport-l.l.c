import { base44 } from '@/api/base44Client';

const SEQ_PAD = 4;

/** Format a strict invoice number: YYYY-0001 */
export function formatInvoiceNumber(year, seq) {
  return `${year}-${String(seq).padStart(SEQ_PAD, '0')}`;
}

/** Parse a strict new-format invoice number "YYYY-XXXX" → { year, seq } or null */
export function parseInvoiceNumber(num) {
  const m = String(num || '').match(/^(\d{4})-(\d{4})$/);
  if (!m) return null;
  return { year: parseInt(m[1], 10), seq: parseInt(m[2], 10) };
}

/** Extract the sequence for a given year from any invoice number (old BW- or new format) */
function extractSeqForYear(num, year) {
  const m = String(num || '').match(new RegExp(`${year}-(\\d{4})$`));
  return m ? parseInt(m[1], 10) : 0;
}

/** Synchronously compute the next sequence number from an already-loaded invoice list */
export function computeNextSeq(allInvoices, year) {
  let maxSeq = 0;
  (allInvoices || []).forEach((inv) => {
    const seq = extractSeqForYear(inv.invoice_number, year);
    if (seq > maxSeq) maxSeq = seq;
  });
  return maxSeq + 1;
}

/** Async: query DB and return the next invoice number in YYYY-XXXX format */
export async function generateNextInvoiceNumber() {
  const year = new Date().getFullYear();
  const all = await base44.entities.Invoice.list('-created_date', 1000).catch(() => []);
  return formatInvoiceNumber(year, computeNextSeq(all, year));
}

/**
 * Renumber all non-voided invoices for a given year to be strictly sequential.
 * Voided (paid) invoices keep their original numbers; the renumbered
 * non-voided sequence skips any position held by a voided invoice.
 */
export async function restructureInvoiceYear(year) {
  const all = await base44.entities.Invoice.list('-created_date', 1000).catch(() => []);

  // Positions permanently occupied by old-format or voided invoices (can't be renumbered)
  const lockedSeqs = new Set();
  // New-format non-voided invoices eligible for renumbering
  const renumberable = [];

  (all || []).forEach((inv) => {
    const seq = extractSeqForYear(inv.invoice_number, year);
    if (seq <= 0) return;
    const isNewFormat = parseInvoiceNumber(inv.invoice_number) !== null;
    if (isNewFormat && !inv.voided) {
      renumberable.push({ id: inv.id, seq });
    } else {
      lockedSeqs.add(seq);
    }
  });

  if (renumberable.length === 0) return;

  // Sort by current sequence to preserve relative order
  renumberable.sort((a, b) => a.seq - b.seq);

  // Assign each to the lowest available position, skipping locked positions
  let nextSeq = 1;
  const updates = [];
  for (const inv of renumberable) {
    while (lockedSeqs.has(nextSeq)) nextSeq++;
    if (inv.seq !== nextSeq) {
      updates.push({ id: inv.id, invoice_number: formatInvoiceNumber(year, nextSeq) });
    }
    lockedSeqs.add(nextSeq);
    nextSeq++;
  }

  if (updates.length > 0) {
    await base44.entities.Invoice.bulkUpdate(updates);
  }
}

/** Convenience: restructure after deleting a single invoice */
export async function restructureInvoiceSequence(deletedInvoiceNumber) {
  const parsed = parseInvoiceNumber(deletedInvoiceNumber);
  if (!parsed) return;
  await restructureInvoiceYear(parsed.year);
}