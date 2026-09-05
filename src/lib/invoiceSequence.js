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

/**
 * Smart reallocation: when an invoice number is manually changed from the middle
 * of the sequence, shift the surrounding invoices to maintain a gap-free sequence.
 *
 * Example: invoices are 0001..0005. User changes 0003 → 0010.
 *   → invoices 0004, 0005 shift DOWN to 0003, 0004 (filling the gap).
 *   → the changed invoice takes 0010.
 *
 * Example: invoices are 0001..0005. User changes 0004 → 0002.
 *   → invoices 0002, 0003 shift UP to 0003, 0004 (making room).
 *   → the changed invoice takes 0002.
 *
 * Returns { updates, reallocated } where updates is an array of {id, invoice_number}
 * for bulkUpdate, and reallocated is an array of {invoice_id, from_number, to_number}.
 */
export async function reallocateInvoiceNumbers(invoiceId, oldNumber, newNumber, year) {
  const oldParsed = parseInvoiceNumber(oldNumber);
  const newParsed = parseInvoiceNumber(newNumber);
  if (!oldParsed || !newParsed || oldParsed.year !== newParsed.year) {
    return { updates: [], reallocated: [] };
  }
  year = year || newParsed.year;
  const all = await base44.entities.Invoice.list('-created_date', 2000).catch(() => []);

  // Only non-voided, new-format invoices in the same year are eligible for shifting
  const eligible = (all || []).filter((inv) => {
    if (inv.id === invoiceId) return false;
    if (inv.voided) return false;
    const p = parseInvoiceNumber(inv.invoice_number);
    return p && p.year === year;
  });

  const oldSeq = oldParsed.seq;
  const newSeq = newParsed.seq;

  const updates = [];
  const reallocated = [];

  if (newSeq > oldSeq) {
    // Moving forward: shift invoices in (oldSeq, newSeq] down by 1 to fill the gap
    eligible.forEach((inv) => {
      const p = parseInvoiceNumber(inv.invoice_number);
      if (p.seq > oldSeq && p.seq <= newSeq) {
        const shifted = formatInvoiceNumber(year, p.seq - 1);
        updates.push({ id: inv.id, invoice_number: shifted });
        reallocated.push({ invoice_id: inv.id, from_number: inv.invoice_number, to_number: shifted });
      }
    });
  } else if (newSeq < oldSeq) {
    // Moving backward: shift invoices in [newSeq, oldSeq) up by 1 to make room
    eligible.forEach((inv) => {
      const p = parseInvoiceNumber(inv.invoice_number);
      if (p.seq >= newSeq && p.seq < oldSeq) {
        const shifted = formatInvoiceNumber(year, p.seq + 1);
        updates.push({ id: inv.id, invoice_number: shifted });
        reallocated.push({ invoice_id: inv.id, from_number: inv.invoice_number, to_number: shifted });
      }
    });
  }

  return { updates, reallocated };
}

/**
 * Build a full snapshot of all invoice numbers (id → invoice_number) for undo purposes.
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
 * Restore invoice numbers from a snapshot (undo).
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
 * chronological (created_date) order.  Returns an array of error entries:
 * { invoice_id, invoice_number, expected_position, actual_position, message }
 *
 * The display order is created_date DESCENDING (newest first), so the
 * invoice numbers should also be descending — the newest invoice should
 * have the highest number.  Any inversion is a sequence error.
 */
export function detectSequenceErrors(invoices) {
  if (!Array.isArray(invoices) || invoices.length < 2) return [];

  // Only consider new-format, non-voided invoices with a parseable number
  const eligible = invoices
    .filter((inv) => !inv.voided && parseInvoiceNumber(inv.invoice_number))
    .map((inv) => {
      const parsed = parseInvoiceNumber(inv.invoice_number);
      return { id: inv.id, number: inv.invoice_number, seq: parsed.seq, year: parsed.year, created: inv.created_date };
    });

  if (eligible.length < 2) return [];

  // Group by year — errors are only meaningful within the same year
  const byYear = {};
  eligible.forEach((e) => {
    if (!byYear[e.year]) byYear[e.year] = [];
    byYear[e.year].push(e);
  });

  const errors = [];
  Object.keys(byYear).forEach((year) => {
    const group = byYear[year];
    // Sort by created_date DESCENDING (same as display order)
    group.sort((a, b) => new Date(b.created) - new Date(a.created));
    // In this order, seq should be strictly DESCENDING (newest = highest)
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

/**
 * Smart Allocator: renumber all non-voided, new-format invoices so their
 * numbers match their chronological (created_date) order.  The oldest
 * invoice gets the lowest available number; the newest gets the highest.
 *
 * Voided and old-format invoices keep their original numbers (locked).
 * Returns { updates, snapshot, reallocated } for undo support.
 */
export async function smartAllocateInvoiceNumbers(year) {
  const targetYear = year || new Date().getFullYear();
  const all = await base44.entities.Invoice.list('-created_date', 2000).catch(() => []);

  const lockedSeqs = new Set();
  const renumberable = [];

  (all || []).forEach((inv) => {
    const parsed = parseInvoiceNumber(inv.invoice_number);
    if (!parsed) return;
    if (parsed.year !== targetYear) return;
    if (inv.voided || parsed === null) {
      const seq = extractSeqForYear(inv.invoice_number, targetYear);
      if (seq > 0) lockedSeqs.add(seq);
    } else {
      renumberable.push({ id: inv.id, seq: parsed.seq, created: inv.created_date, oldNumber: inv.invoice_number });
    }
  });

  if (renumberable.length === 0) return { updates: [], snapshot: {}, reallocated: [] };

  // Sort by created_date ASCENDING (oldest first) → assign lowest numbers first
  renumberable.sort((a, b) => new Date(a.created) - new Date(b.created));

  // Build snapshot for undo
  const snapshot = {};
  renumberable.forEach((r) => { snapshot[r.id] = r.oldNumber; });

  // Assign sequential numbers, skipping locked positions
  let nextSeq = 1;
  const updates = [];
  const reallocated = [];
  for (const inv of renumberable) {
    while (lockedSeqs.has(nextSeq)) nextSeq++;
    const newNumber = formatInvoiceNumber(targetYear, nextSeq);
    if (inv.oldNumber !== newNumber) {
      updates.push({ id: inv.id, invoice_number: newNumber });
      reallocated.push({ invoice_id: inv.id, from_number: inv.oldNumber, to_number: newNumber });
    }
    lockedSeqs.add(nextSeq);
    nextSeq++;
  }

  if (updates.length > 0) {
    await base44.entities.Invoice.bulkUpdate(updates);
  }

  // Update the company settings counter to the highest assigned seq
  const settingsList = await base44.entities.CompanySettings.list().catch(() => []);
  const s = settingsList?.[0];
  if (s) {
    const maxSeq = nextSeq - 1;
    if (s.invoice_last_year !== targetYear || (s.invoice_last_seq || 0) < maxSeq) {
      await base44.entities.CompanySettings.update(s.id, {
        invoice_last_seq: maxSeq,
        invoice_last_year: targetYear,
      });
    }
  }

  return { updates, snapshot, reallocated };
}

/**
 * Smart Allocator (keep-changed mode): lock the manually-changed invoice(s) at
 * their current numbers and renumber every OTHER non-voided invoice chronologically
 * around them.  `lockedInvoiceIds` = invoice IDs whose numbers should NOT change.
 * Returns { updates, snapshot, reallocated } for undo support.
 */
export async function smartAllocateKeepChanged(year, lockedInvoiceIds) {
  const targetYear = year || new Date().getFullYear();
  const lockedSet = new Set(lockedInvoiceIds || []);
  const all = await base44.entities.Invoice.list('-created_date', 2000).catch(() => []);

  const lockedSeqs = new Set();
  const renumberable = [];

  (all || []).forEach((inv) => {
    const parsed = parseInvoiceNumber(inv.invoice_number);
    if (!parsed || parsed.year !== targetYear) return;
    if (inv.voided) {
      const seq = extractSeqForYear(inv.invoice_number, targetYear);
      if (seq > 0) lockedSeqs.add(seq);
    } else if (lockedSet.has(inv.id)) {
      // Keep this invoice's current number — lock its position
      lockedSeqs.add(parsed.seq);
    } else {
      renumberable.push({ id: inv.id, created: inv.created_date, oldNumber: inv.invoice_number });
    }
  });

  if (renumberable.length === 0) return { updates: [], snapshot: {}, reallocated: [] };

  // Sort by created_date ASCENDING (oldest first) → lowest numbers first
  renumberable.sort((a, b) => new Date(a.created) - new Date(b.created));

  const snapshot = {};
  renumberable.forEach((r) => { snapshot[r.id] = r.oldNumber; });

  let nextSeq = 1;
  const updates = [];
  const reallocated = [];
  for (const inv of renumberable) {
    while (lockedSeqs.has(nextSeq)) nextSeq++;
    const newNumber = formatInvoiceNumber(targetYear, nextSeq);
    if (inv.oldNumber !== newNumber) {
      updates.push({ id: inv.id, invoice_number: newNumber });
      reallocated.push({ invoice_id: inv.id, from_number: inv.oldNumber, to_number: newNumber });
    }
    lockedSeqs.add(nextSeq);
    nextSeq++;
  }

  if (updates.length > 0) {
    await base44.entities.Invoice.bulkUpdate(updates);
  }

  // Update company settings counter to the highest assigned seq
  const settingsList = await base44.entities.CompanySettings.list().catch(() => []);
  const s = settingsList?.[0];
  if (s) {
    const maxSeq = nextSeq - 1;
    if (s.invoice_last_year !== targetYear || (s.invoice_last_seq || 0) < maxSeq) {
      await base44.entities.CompanySettings.update(s.id, {
        invoice_last_seq: maxSeq,
        invoice_last_year: targetYear,
      });
    }
  }

  return { updates, snapshot, reallocated };
}

/** Alias — also re-exported by companySettings.js as generateInvoiceNumber */
export { generateNextInvoiceNumber as generateInvoiceNumber };