import { base44 } from '@/api/base44Client';

const SEQ_PAD = 4;

/** Format a strict invoice number: YYYY-0001 */
export function formatInvoiceNumber(year, seq) {
  return `${year}-${String(seq).padStart(SEQ_PAD, '0')}`;
}

/** Parse a new-format invoice number "YYYY-XXXX" (variable-length seq) → { year, seq } or null */
export function parseInvoiceNumber(num) {
  const m = String(num || '').match(/^(\d{4})-(\d+)$/);
  if (!m) return null;
  return { year: parseInt(m[1], 10), seq: parseInt(m[2], 10) };
}

/** Extract the sequence for a given year from any invoice number (old BW- or new format) */
function extractSeqForYear(num, year) {
  const m = String(num || '').match(new RegExp(`${year}-(\\d+)$`));
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
  const [all, settingsList] = await Promise.all([
    base44.entities.Invoice.list('-created_date', 1000).catch(() => []),
    base44.entities.CompanySettings.list().catch(() => []),
  ]);
  const dbSeq = computeNextSeq(all, year);
  const s = settingsList?.[0];
  const counterSeq = s && s.invoice_last_year === year ? (s.invoice_last_seq || 0) : 0;
  // Continue from the last-used counter (set by manual edits or auto-accepted
  // creations).  Fall back to DB max only when no counter exists for this year.
  const nextSeq = counterSeq > 0 ? counterSeq + 1 : dbSeq;
  return formatInvoiceNumber(year, nextSeq);
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

/**
 * Persist a manually-set invoice number as the new "last used" sequence value,
 * so the next auto-suggested number is manualNumber + 1.
 * Also appends an audit-trail entry (who, from, to, when).
 */
export async function persistManualInvoiceNumber(manualNumber, originalSuggested, changedBy, invoiceId) {
  const parsed = parseInvoiceNumber(manualNumber);
  if (!parsed) return;
  const list = await base44.entities.CompanySettings.list().catch(() => []);
  const s = list?.[0];
  if (!s) return;
  const audit = Array.isArray(s.invoice_seq_audit) ? s.invoice_seq_audit : [];
  const isManualOverride = !!originalSuggested && manualNumber !== originalSuggested;
  const update = {};
  // ALWAYS update the counter to the saved invoice's seq — whether the user
  // manually typed a higher OR lower number — so the next auto-suggestion
  // continues from whatever was last used (manualNumber + 1).
  update.invoice_last_seq = parsed.seq;
  update.invoice_last_year = parsed.year;
  // Audit trail entry only for genuine manual overrides
  if (isManualOverride) {
    const entry = {
      from_number: originalSuggested || '',
      to_number: manualNumber,
      changed_by: changedBy || '',
      changed_date: new Date().toISOString(),
      invoice_id: invoiceId || '',
    };
    update.invoice_seq_audit = [entry, ...audit].slice(0, 50);
  }
  await base44.entities.CompanySettings.update(s.id, update);
}

/** Alias — also re-exported by companySettings.js as generateInvoiceNumber */
export { generateNextInvoiceNumber as generateInvoiceNumber };