import { base44 } from '@/api/base44Client';

const SEQ_PAD = 4;

/** Format a strict quotation number: QT-YYYY-0001 */
export function formatQuotationNumber(year, seq) {
  return `QT-${year}-${String(seq).padStart(SEQ_PAD, '0')}`;
}

/** Parse "QT-YYYY-XXXX" → { year, seq } or null */
export function parseQuotationNumber(num) {
  const m = String(num || '').match(/^QT-(\d{4})-(\d{4})$/);
  if (!m) return null;
  return { year: parseInt(m[1], 10), seq: parseInt(m[2], 10) };
}

/** Extract the sequence for a given year from any quotation number */
function extractSeqForYear(num, year) {
  const m = String(num || '').match(new RegExp(`QT-${year}-(\\d{4})$`));
  return m ? parseInt(m[1], 10) : 0;
}

/** Synchronously compute the next sequence number from an already-loaded quotation list */
export function computeNextQuotationSeq(allQuotations, year) {
  let maxSeq = 0;
  (allQuotations || []).forEach((q) => {
    const seq = extractSeqForYear(q.quotation_number, year);
    if (seq > maxSeq) maxSeq = seq;
  });
  return maxSeq + 1;
}

/** Async: query DB and return the next quotation number in QT-YYYY-XXXX format */
export async function generateNextQuotationNumber() {
  const year = new Date().getFullYear();
  const all = await base44.entities.Quotation.list('-created_date', 1000).catch(() => []);
  return formatQuotationNumber(year, computeNextQuotationSeq(all, year));
}