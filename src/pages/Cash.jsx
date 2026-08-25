import { Wallet } from 'lucide-react';
import LedgerPage from '@/components/cash/LedgerPage';

const EXPORT_COLS = [
  { key: 'date', label: 'Date', w: 30 },
  { key: 'recipient', label: 'Recipient', w: 35 },
  { key: 'ref', label: 'Receipt #', w: 25, noWrap: true },
  { key: 'description', label: 'Description', w: 50 },
  { key: 'in', label: 'Inflow', numeric: true, w: 28 },
  { key: 'out', label: 'Outflow', numeric: true, w: 28 },
  { key: 'running_balance', label: 'Running Balance', numeric: true, w: 34 }
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
      enableDriverLink
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
        const isDriver = form.recipient_mode === 'driver' && !!form.driver_id;
        return {
          date: form.date,
          type: isOut ? 'outflow' : 'inflow',
          amount: isOut ? outAmt : inAmt,
          description: form.description || '',
          receipt_number: form.receipt_number || '',
          category: mode,
          received_from: !isOut ? form.recipient : '',
          paid_to: isOut ? form.recipient : '',
          recipient_type: isDriver ? 'driver' : 'manual',
          driver_id: isDriver ? form.driver_id : ''
        };
      }}
      dateHasTime
      exportFilename="petty-cash"
      exportTitle="Petty Cash Statement"
      exportColumns={EXPORT_COLS}
      enableImportUndo
      importConfig={{
        columns: [
          { key: 'date', label: 'Date', type: 'date', required: true, sample: '2026-01-15' },
          { key: 'recipient', label: 'Recipient', type: 'text', sample: 'John Doe' },
          { key: 'receipt_number', label: 'Receipt #', type: 'text', sample: 'RCP-001' },
          { key: 'description', label: 'Description', type: 'text', sample: 'Office supplies' },
          { key: 'inflow', label: 'Inflow', type: 'number', sample: '0.00' },
          { key: 'outflow', label: 'Outflow', type: 'number', sample: '150.00' },
        ],
        transform: (r) => {
          const inAmt = Number(r.inflow) || 0;
          const outAmt = Number(r.outflow) || 0;
          const isOut = outAmt > 0;
          return {
            date: r.date || '',
            type: isOut ? 'outflow' : 'inflow',
            amount: isOut ? outAmt : inAmt,
            description: r.description || '',
            receipt_number: r.receipt_number || '',
            category: 'cash',
            received_from: !isOut ? (r.recipient || '') : '',
            paid_to: isOut ? (r.recipient || '') : '',
            recipient_type: 'manual',
            driver_id: '',
          };
        },
      }}
    />
  );
}