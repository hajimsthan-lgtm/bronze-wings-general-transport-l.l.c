// Agreement signature workflow: status derivation, action availability, flag

export const SIG_LABELS = {
  draft: 'Draft',
  unsigned: 'Sent for Signature',
  sent: 'Sent',
  signed: 'Signed',
  active: 'Active',
  expired: 'Expired',
  terminated: 'Terminated',
};

export const SIG_PILLS = {
  draft: 'bg-muted text-muted-foreground border-border',
  unsigned: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  sent: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  signed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  expired: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  terminated: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export const SIG_DOTS = {
  draft: 'bg-muted-foreground',
  unsigned: 'bg-blue-400',
  sent: 'bg-blue-400',
  signed: 'bg-emerald-400',
  active: 'bg-emerald-400',
  expired: 'bg-orange-400',
  terminated: 'bg-red-400',
};

// Derive the effective signature status from agreement data
export function deriveStatus(a) {
  if (a.status === 'terminated') return 'terminated';
  if (a.status === 'expired') return 'expired';
  // Auto-expire: active/signed agreements whose end date has passed
  if ((a.status === 'active' || a.status === 'signed') && a.end_date) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end = new Date(a.end_date); end.setHours(0, 0, 0, 0);
    if (end < today) return 'expired';
  }
  if (a.status === 'active') return 'active';
  if (a.signed_agreement_url) return 'signed';
  if (a.signature_skipped) return 'sent';
  if (a.sent_for_signature_date) return 'unsigned';
  return 'draft';
}

// Expiry info based on end_date: days left, expired, or expiring within `soonDays`.
export function expiryInfo(a, soonDays = 10) {
  if (!a || !a.end_date) return { daysLeft: null, isExpired: false, isExpiringSoon: false };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const end = new Date(a.end_date); end.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((end - today) / 86400000);
  const activeish = a.status === 'active' || a.status === 'signed';
  const isExpired = daysLeft < 0 && activeish;
  const isExpiringSoon = !isExpired && daysLeft >= 0 && daysLeft <= soonDays && activeish;
  return { daysLeft, isExpired, isExpiringSoon };
}

// Which actions are available for this agreement right now
export function getAvailableActions(a) {
  const status = deriveStatus(a);
  return {
    sendForSignature: status === 'draft',
    attachSigned: status === 'unsigned' || status === 'signed' || status === 'sent',
    skipSignature: status === 'unsigned',
    markActive: status === 'signed',
    terminate: status === 'active' || status === 'signed' || status === 'sent',
  };
}

// Signature flag for display in detail header
export function signatureFlag(a) {
  const status = deriveStatus(a);
  return {
    status,
    label: SIG_LABELS[status],
    pill: SIG_PILLS[status],
    dot: SIG_DOTS[status],
  };
}