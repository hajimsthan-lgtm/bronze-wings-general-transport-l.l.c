import { formatCurrency, formatDate } from '@/lib/formatters';

export default function TransactionStep3({ form, profit, vendorTotal }) {
  const amount = Number(form.amount) || 0;
  const received = Number(form.amount_received) || 0;
  const due = amount - received;
  const profitColor = form.is_muted ? 'text-slate-400' : form.payment_status === 'advance' ? 'text-amber-400' : profit >= 0 ? 'text-emerald-400' : 'text-red-400';

  const rows = [
    { label: 'Customer', value: form.customer_name },
    { label: 'Emirates ID', value: form.emirates_id },
    { label: 'Service', value: [form.category, form.sub_category, form.service_type].filter(Boolean).join(' → ') },
    { label: 'Staff', value: form.staff_name },
    { label: 'Date', value: formatDate(form.service_date) },
    { label: 'Service Mode', value: (form.service_mode || 'one_time').replace(/_/g, ' ') },
    { label: 'Service Total', value: formatCurrency(amount) },
    { label: 'Amount Received', value: formatCurrency(received) },
    { label: 'Payment Status', value: form.payment_status },
    { label: 'Payment Mode', value: (form.payment_mode || '').replace(/_/g, ' ') },
    { label: 'Transaction Status', value: form.transaction_status },
    { label: 'Govt Fee', value: form.government_fee ? formatCurrency(form.government_fee) : null },
    { label: 'Govt Fee Status', value: form.govt_fee_status },
  ];

  if (vendorTotal > 0) rows.push({ label: 'Vendor Expenses', value: formatCurrency(vendorTotal) });
  if ((form.payment_status === 'pending' || form.payment_status === 'partial') && due > 0) rows.push({ label: 'Due Balance', value: formatCurrency(due) });
  if (form.advance_applied_ref) rows.push({ label: 'Advance Applied', value: form.advance_applied_ref });
  if (form.payment_status === 'advance' && form.advance_amount) rows.push({ label: 'Advance Amount', value: formatCurrency(form.advance_amount) });
  if (form.payment_status === 'reversal' && form.refund_reason) rows.push({ label: 'Refund Reason', value: form.refund_reason });
  if (form.notes) rows.push({ label: 'Notes', value: form.notes });

  return (
    <div className="space-y-4">
      <div className="bg-[#111111] border border-[#27272a] rounded-lg p-4 space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{r.label}</span>
            <span className="text-sm text-white font-medium tabular-nums text-right">{r.value || '—'}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#111111] border border-[#27272a] rounded-lg p-5 flex items-center justify-between">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Net Profit</span>
        <span className={`text-2xl font-bold tabular-nums ${profitColor}`}>{formatCurrency(profit)}</span>
      </div>

      {form.is_muted && (
        <p className="text-[11px] text-slate-400 text-center">Profit is muted for this transaction</p>
      )}
    </div>
  );
}