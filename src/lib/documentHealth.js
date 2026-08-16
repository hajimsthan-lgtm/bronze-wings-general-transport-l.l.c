const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Compute health status for a single document.
 * valid = has file + no expiry or expiry > 30 days
 * expiring_soon = expiry within 30 days
 * expired = expiry passed
 * missing = no file_url
 */
export function getDocStatus(doc) {
  if (!doc.file_url) return 'missing';
  if (!doc.expiry_date) return 'valid';
  const diff = new Date(doc.expiry_date).getTime() - Date.now();
  if (diff < 0) return 'expired';
  if (diff <= THIRTY_DAYS_MS) return 'expiring_soon';
  return 'valid';
}

/**
 * Relative expiry subtext for documents with dates.
 * Returns null if more than 30 days away (no subtext needed).
 */
export function getExpirySubtext(date) {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  const days = Math.round(diff / (24 * 60 * 60 * 1000));
  if (days < 0) return { text: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`, tone: 'expired' };
  if (days === 0) return { text: 'Expires today', tone: 'expiring_soon' };
  if (days <= 30) return { text: `Expires in ${days} day${days === 1 ? '' : 's'}`, tone: 'expiring_soon' };
  return null;
}

// CSS variable names for token-based coloring (light + dark mode safe)
export const DOC_STATUS_VAR = {
  valid: 'success',
  expiring_soon: 'warning',
  expired: 'danger',
  missing: 'muted-foreground',
};

export function summarizeHealth(docs) {
  const s = { total: docs.length, expired: 0, expiringSoon: 0, valid: 0, missing: 0 };
  docs.forEach((d) => {
    const st = getDocStatus(d);
    if (st === 'expired') s.expired++;
    else if (st === 'expiring_soon') s.expiringSoon++;
    else if (st === 'valid') s.valid++;
    else s.missing++;
  });
  return s;
}

/**
 * Overall health level for a document collection.
 * expired > expiring_soon > valid > empty
 */
export function getHealthLevel(docs) {
  const s = summarizeHealth(docs);
  if (s.expired > 0) return 'expired';
  if (s.expiringSoon > 0) return 'expiring_soon';
  if (s.total > 0) return 'valid';
  return 'empty';
}