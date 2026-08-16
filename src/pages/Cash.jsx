import { Wallet } from 'lucide-react';
import LedgerPage from '@/components/cash/LedgerPage';

const EXPORT_COLS = [
  { key: 'date', label: 'Date' },
  { key: 'recipient', label: 'Recipient' },
  { key: 'ref', label: 'Receipt #' },
  { key: 'description', label: 'Description' },
  { key: 'in', label: 'Inflow', numeric: true },
  { key: 'out', label: 'Outflow', numeric: true },
  { key: 'running_balance', label: 'Running Balance', numeric: true }
];

export default function Cash() {
  return (
    <LedgerPage
      entityName="CashTransaction"
      inflowKey="inflow"
      outflowKey="outflow"
      inflowLabel="Inflow"
      outflowLabel="Outflow"
      refKey="receipt_number"
      refLabel="Receipt #"
      hasRecipient
      summaryLabels={{ inflow: 'Total Inflows', outflow: 'Total Outflows', balance: 'Closing Balance' }}
      BalanceIcon={Wallet}
      modeOptions={[{ value: 'cash', label: 'Cash' }, { value: 'card', label: 'Card' }]}
      defaultMode="cash"
      modeFilter={(r, m) => (r.category || 'cash') === m}
      rowToAmounts={(r) => ({
        in: r.type === 'inflow' ? (Number(r.amount) || 0) : 0,
        out: r.type === 'outflow' ? (Number(r.amount) || 0) : 0,
        recipient: r.type === 'inflow' ? (r.received_from || '') : (r.paid_to || ''),
        ref: r.receipt_number || ''
      })}
      buildCreate={(form, mode) => {
        const inAmt = Number(form.inflow) || 0;
        const outAmt = Number(form.outflow) || 0;
        const isOut = outAmt > 0;
        return {
          date: form.date,
          type: isOut ? 'outflow' : 'inflow',
          amount: isOut ? outAmt : inAmt,
          description: form.description || '',
          receipt_number: form.receipt_number || '',
          category: mode,
          received_from: !isOut ? form.recipient : '',
          paid_to: isOut ? form.recipient : ''
        };
      }}
      dateHasTime
      exportFilename="petty-cash"
      exportTitle="Petty Cash Statement"
      exportColumns={EXPORT_COLS}
    />
  );
}