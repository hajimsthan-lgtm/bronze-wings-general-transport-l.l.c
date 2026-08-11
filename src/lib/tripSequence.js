import { base44 } from '@/api/base44Client';

/**
 * Generate a trip number in the format TR-DDMM-XX
 * (e.g. TR-1508-01 for the first trip on August 15).
 *
 * @param {string} dateStr   — ISO date (YYYY-MM-DD) or datetime string
 * @param {Array}  existing  — array of trip records with `trip_number`
 * @returns {string}
 */
export function buildTripNumber(dateStr, existing) {
  const date = new Date(dateStr);
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `TR-${dd}${mm}-`;
  let maxSeq = 0;
  (existing || []).forEach((tr) => {
    if (tr.trip_number && tr.trip_number.startsWith(prefix)) {
      const seq = parseInt(tr.trip_number.slice(prefix.length), 10);
      if (seq > maxSeq) maxSeq = seq;
    }
  });
  return `${prefix}${String(maxSeq + 1).padStart(2, '0')}`;
}

/**
 * Enrich imported trip rows with correct sequential trip numbers.
 * Fetches existing trips once, then assigns numbers per date prefix,
 * tracking in-batch collisions.
 *
 * @param {Array} rows — mapped trip rows from CSV
 * @returns {Promise<Array>}
 */
export async function enrichTripsWithNumbers(rows) {
  const existing = await base44.entities.Trip.list('-created_date', 1000).catch(() => []);
  const used = new Set((existing || []).map((t) => t.trip_number).filter(Boolean));
  return rows.map((row) => {
    if (row.trip_number) return row;
    const dateStr = row.load_datetime || row.trip_date || new Date().toISOString();
    const date = new Date(dateStr);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const prefix = `TR-${dd}${mm}-`;
    let seq = 1;
    while (used.has(`${prefix}${String(seq).padStart(2, '0')}`)) seq++;
    const tripNumber = `${prefix}${String(seq).padStart(2, '0')}`;
    used.add(tripNumber);
    return { ...row, trip_number: tripNumber };
  });
}