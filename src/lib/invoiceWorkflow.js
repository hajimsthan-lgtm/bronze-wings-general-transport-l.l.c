// Invoice workflow: status derivation, action availability, labels, colors

export const STATUS_LABELS = {
  draft: 'Draft',
  unsigned: 'Unsigned',
  signed: 'Signed',
  sent: 'Sent',
  partially_paid: 'Partial',
  paid: 'Paid',
  cancelled: 'Cancelled',
};

export const STATUS_PILLS = {
  draft: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  unsigned: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  signed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  sent: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  partially_paid: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  paid: 'bg-green-500/15 text-green-400 border-green-500/25',
  cancelled: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
};

export const STATUS_DOTS = {
  draft: 'bg-slate-400',
  unsigned: 'bg-blue-400',
  signed: 'bg-emerald-400',
  sent: 'bg-cyan-400',
  partially_paid: 'bg-amber-400',
  paid: 'bg-green-400',
  cancelled: 'bg-rose-400',
};

// Derive the effective status from invoice data (not from a manually stored field)
export function deriveStatus(inv) {
  if (inv.voided) return 'cancelled';
  const total = Number(inv.total_amount || 0);
  const paid = Number(inv.paid_amount || 0);
  if (total > 0 && paid >= total && paid > 0) return 'paid';
  if (paid > 0) return 'partially_paid';
  if (inv.signed_invoice_url) return 'signed';
  if (inv.signature_skipped) return 'sent';
  if (inv.sent_for_signature_date) return 'unsigned';
  // Backward compat: old 'sent'/'overdue' statuses → 'unsigned'
  if (inv.status === 'sent' || inv.status === 'overdue') return 'unsigned';
  return 'draft';
}

// Overdue is a derived flag, not an exclusive status
export function isOverdue(inv) {
  if (inv.voided) return false;
  const status = deriveStatus(inv);
  if (status === 'paid' || status === 'cancelled') return false;
  const total = Number(inv.total_amount || 0);
  const paid = Number(inv.paid_amount || 0);
  if (paid >= total) return false;
  if (!inv.due_date) return false;
  const today = new Date().toISOString().split('T')[0];
  return inv.due_date < today;
}

// Which actions are available for this invoice right now
export function getAvailableActions(inv) {
  const status = deriveStatus(inv);
  return {
    sendForSignature: status === 'draft',
    attachSigned: status === 'unsigned' || status === 'signed',
    skipSignature: status === 'unsigned',
    recordPayment: status === 'signed' || status === 'sent' || status === 'partially_paid',
    cancel: status !== 'cancelled' && status !== 'paid',
  };
}

// Tab counts from derived logic (real-time, never drifts)
export function computeTabCounts(invoices) {
  return {
    all: invoices.length,
    draft: invoices.filter(i => deriveStatus(i) === 'draft').length,
    unpaid: invoices.filter(i => {
      const s = deriveStatus(i);
      return s !== 'paid' && s !== 'cancelled';
    }).length,
    signed: invoices.filter(i => deriveStatus(i) === 'signed').length,
    unsigned: invoices.filter(i => deriveStatus(i) === 'unsigned').length,
    paid: invoices.filter(i => deriveStatus(i) === 'paid').length,
  };
}

// Filter invoices by tab using derived status
export function filterByTab(invoices, tab) {
  if (tab === 'draft') return invoices.filter(i => deriveStatus(i) === 'draft');
  if (tab === 'unpaid') return invoices.filter(i => {
    const s = deriveStatus(i);
    return s !== 'paid' && s !== 'cancelled';
  });
  if (tab === 'signed') return invoices.filter(i => deriveStatus(i) === 'signed');
  if (tab === 'unsigned') return invoices.filter(i => deriveStatus(i) === 'unsigned');
  if (tab === 'paid') return invoices.filter(i => deriveStatus(i) === 'paid');
  return invoices;
}