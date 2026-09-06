/**
 * Generate a monthly-rental number in the format TC-MMYY-00
 * (e.g. TC-0926-01 for the first rental created in September 2026).
 *
 * @param {string} dateStr  — ISO date (YYYY-MM-DD) or datetime string
 * @param {Array}  existing — array of MonthlyContract records with `contract_number`
 * @returns {string}
 */
export function buildContractNumber(dateStr, existing) {
  const date = new Date(dateStr);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  const prefix = `TC-${mm}${yy}-`;
  let maxSeq = 0;
  (existing || []).forEach((c) => {
    if (c.contract_number && c.contract_number.startsWith(prefix)) {
      const seq = parseInt(c.contract_number.slice(prefix.length), 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  });
  return `${prefix}${String(maxSeq + 1).padStart(2, '0')}`;
}