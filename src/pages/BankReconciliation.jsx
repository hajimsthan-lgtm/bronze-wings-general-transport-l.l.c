import { Landmark } from 'lucide-react';
import LedgerPage from '@/components/cash/LedgerPage';

const EXPORT_COLS = [
  { key: 'date', label: 'Date' },
  { key: 'ref', label: 'Reference #' },
  { key: 'description', label: 'Description' },
  { key: 'in', label: 'Deposit', numeric: true },
  { key: 'out', label: 'Withdrawal', numeric: true },
  { key: 'running_balance', label: 'Running Balance', numeric: true }
];

export default function BankReconciliation() {
  return (
    <LedgerPage
      entityName="BankReconciliation"
      inflowKey="deposit"
      outflowKey="withdrawal"
      inflowLabel="Deposit"
      outflowLabel="Withdrawal"
      refKey="reference"
      refLabel="Reference #"
      hasRecipient={false}
      summaryLabels={{ inflow: 'Total Deposits', outflow: 'Total Withdrawals', balance: 'Closing Balance' }}
      BalanceIcon={Landmark}
      modeOptions={[{ value: 'all', label: 'All' }, { value: 'deposit', label: 'Deposits' }, { value: 'withdrawal', label: 'Withdrawals' }]}
      defaultMode="all"
      modeFilter={(r, m) => (m === 'all' ? true : m === 'deposit' ? (Number(r.deposit) || 0) > 0 : (Number(r.withdrawal) || 0) > 0)}
      rowToAmounts={(r) => ({
        in: Number(r.deposit) || 0,
        out: Number(r.withdrawal) || 0,
        recipient: '',
        ref: r.reference || ''
      })}
      buildCreate={(form) => ({
        date: form.date,
        deposit: Number(form.deposit) || 0,
        withdrawal: Number(form.withdrawal) || 0,
        description: form.description || '',
        reference: form.reference || ''
      })}
      dateHasTime={false}
      exportFilename="bank-reconciliation"
      exportTitle="Bank Reconciliation Statement"
      exportColumns={EXPORT_COLS}
      importConfig={{
        columns: [
          { key: 'date', label: 'Date', sample: '2026-01-15' },
          { key: 'reference', label: 'Reference #', sample: 'REF-001' },
          { key: 'description', label: 'Description', sample: 'Bank charges' },
          { key: 'deposit', label: 'Deposit', sample: '5000.00' },
          { key: 'withdrawal', label: 'Withdrawal', sample: '0.00' },
        ],
        transform: (r) => ({
          date: r.date || r.Date || '',
          reference: r.reference || r['Reference #'] || r.ref || '',
          description: r.description || r.Description || '',
          deposit: Number(r.deposit || r.Deposit) || 0,
          withdrawal: Number(r.withdrawal || r.Withdrawal) || 0,
        }),
      }}
    />
  );
}