import { Plus, Send, FileSignature, CreditCard, Ban, FileX } from 'lucide-react';

export default function InvoiceActivityTimeline({ inv, signedDocs, payments }) {
  const events = [];

  // Created
  if (inv.created_date) {
    events.push({ date: inv.created_date.split('T')[0], icon: Plus, label: 'Invoice created', color: 'text-muted-foreground', bg: 'bg-muted/40' });
  }

  // Sent for signature
  if (inv.sent_for_signature_date) {
    events.push({ date: inv.sent_for_signature_date, icon: Send, label: 'Sent for signature', color: 'text-blue-400', bg: 'bg-blue-500/10' });
  }

  // Signature skipped
  if (inv.signature_skipped) {
    const skipDate = inv.updated_date ? inv.updated_date.split('T')[0] : null;
    events.push({ date: skipDate, icon: FileX, label: 'Signature skipped — sent for payment', color: 'text-orange-400', bg: 'bg-orange-500/10' });
  }

  // Signed copies (from version history)
  (signedDocs || []).forEach(doc => {
    events.push({
      date: doc.upload_date,
      icon: FileSignature,
      label: `Signed copy attached${doc.uploaded_by ? ' · ' + doc.uploaded_by : ''}`,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    });
  });

  // Payments
  (payments || []).forEach(p => {
    const alloc = (p.allocated_invoices || []).find(a => a.invoice_id === inv.id);
    const amt = alloc?.allocated_amount || p.amount || 0;
    events.push({
      date: p.payment_date,
      icon: CreditCard,
      label: `AED ${Number(amt).toFixed(2)} received via ${p.payment_mode || '—'}`,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    });
  });

  // Cancelled
  if (inv.voided) {
    const cancelDate = inv.updated_date ? inv.updated_date.split('T')[0] : null;
    events.push({
      date: cancelDate,
      icon: Ban,
      label: `Cancelled — reason: ${inv.void_reason || 'Not specified'}`,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    });
  }

  // Sort by date descending (most recent first)
  events.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div>
      <p className="eyebrow mb-3">Activity Timeline</p>
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No activity yet.</p>
      ) : (
        <div className="space-y-2.5">
          {events.map((event, i) => (
            <div key={i} className="flex items-center gap-2.5 text-xs">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${event.bg} ${event.color}`}>
                <event.icon className="w-3 h-3" />
              </div>
              <span className="text-muted-foreground flex-1 truncate">{event.label}</span>
              <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 tabular-nums">{event.date || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}