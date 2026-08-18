import { Layers } from 'lucide-react';
import { ExcelIcon, PdfIcon } from '@/components/common/BrandIcons';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { buildAllTransactions, ALL_TX_COLUMNS } from '@/lib/allTransactions';

export default function AllTransactionsExport({ trips, expenses, fuelRecords, dateRange }) {
  const data = buildAllTransactions(trips, expenses, fuelRecords);
  const opts = { dateRange };
  const btn = 'p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors';
  return (
    <div className="flex items-center gap-1 h-9 px-2.5 rounded-lg border border-border bg-card shadow-sm hidden">
      <Layers className="w-3.5 h-3.5 text-muted-foreground mr-1" />
      <span className="text-xs font-medium text-foreground mr-1.5 hidden sm:inline">All Tx</span>
      <button title="Export All Transactions CSV" onClick={() => exportToCSV(data, 'all_transactions', ALL_TX_COLUMNS)} className={btn}>
        <ExcelIcon className="w-3.5 h-3.5" />
      </button>
      <button title="Export All Transactions PDF" onClick={() => exportToPDF(data, 'all_transactions', ALL_TX_COLUMNS, 'All Transactions', opts)} className={btn}>
        <PdfIcon className="w-3.5 h-3.5" />
      </button>
    </div>);

}