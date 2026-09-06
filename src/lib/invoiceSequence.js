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

/**
 * Async: query DB and return the next invoice number in YYYY-XXXX format.
 * This is an INSIDE-FORM suggestion only — the user can always override it.
 * No system-side auto-allocation is ever performed.
 */
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
  // creations),  Fall back to DB max only when no counter exists for this year.
  const nextSeq = counterSeq > 0 ? counterSeq + 1 : dbSeq;
  return formatInvoiceNumber(year, nextSeq);
}

/**
 * Persist a manually-set invoice number as the new "last used" sequence value,
 * so the next inside-form suggestion is manualNumber + 1.
 * Also appends an audit-trail entry (who, from, to, when) for genuine overrides.
 *
 * This does NOT change any invoice numbers — it only updates the suggestion counter.
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

/**
 * Build a full snapshot of all invoice numbers (id → invoice_number) for undo purposes.
 * Undo is user-initiated — the user explicitly clicks "Undo" from the History dialog.
 */
export async function buildInvoiceNumberSnapshot() {
  const all = await base44.entities.Invoice.list('-created_date', 2000).catch(() => []);
  const snapshot = {};
  (all || []).forEach((inv) => {
    if (inv.invoice_number) snapshot[inv.id] = inv.invoice_number;
  });
  return snapshot;
}

/**
 * Restore invoice numbers from a snapshot (user-initiated undo).
 * Returns the updates array that was applied.
 */
export async function restoreInvoiceNumberSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const all = await base44.entities.Invoice.list('-created_date', 2000).catch(() => []);
  const updates = [];
  (all || []).forEach((inv) => {
    const targetNum = snapshot[inv.id];
    if (targetNum && targetNum !== inv.invoice_number) {
      updates.push({ id: inv.id, invoice_number: targetNum });
    }
  });
  if (updates.length > 0) {
    await base44.entities.Invoice.bulkUpdate(updates);
  }
  return updates;
}

/**
 * Detect sequence errors: invoices whose number doesn't match their
 * chronological (created_date) order.  Read-only diagnostic — does NOT renumber.
 * Returns an array of error entries.
 */
export function detectSequenceErrors(invoices) {
  if (!Array.isArray(invoices) || invoices.length < 2) return [];

  const eligible = invoices
    .filter((inv) => !inv.voided && parseInvoiceNumber(inv.invoice_number))
    .map((inv) => {
      const parsed = parseInvoiceNumber(inv.invoice_number);
      return { id: inv.id, number: inv.invoice_number, seq: parsed.seq, year: parsed.year, created: inv.created_date };
    });

  if (eligible.length < 2) return [];

  const byYear = {};
  eligible.forEach((e) => {
    if (!byYear[e.year]) byYear[e.year] = [];
    byYear[e.year].push(e);
  });

  const errors = [];
  Object.keys(byYear).forEach((year) => {
    const group = byYear[year];
    group.sort((a, b) => new Date(b.created) - new Date(a.created));
    for (let i = 0; i < group.length - 1; i++) {
      const newer = group[i];
      const older = group[i + 1];
      if (newer.seq < older.seq) {
        errors.push({
          invoice_id: newer.id,
          invoice_number: newer.number,
          newer_seq: newer.seq,
          older_seq: older.seq,
          older_number: older.number,
          message: `${newer.number} (newer) is lower than ${older.number} (older)`,
        });
      }
    }
  });

  return errors;
}

/** Alias — also re-exported by companySettings.js as generateInvoiceNumber */
export { generateNextInvoiceNumber as generateInvoiceNumber };