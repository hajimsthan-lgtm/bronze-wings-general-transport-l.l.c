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
  if (a.status === 'active') return 'active';
  if (a.signed_agreement_url) return 'signed';
  if (a.signature_skipped) return 'sent';
  if (a.sent_for_signature_date) return 'unsigned';
  return 'draft';
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