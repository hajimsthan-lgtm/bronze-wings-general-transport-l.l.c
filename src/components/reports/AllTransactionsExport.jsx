import { Layers } from 'lucide-react';
import { ExcelIcon, PdfIcon } from '@/components/common/BrandIcons';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { buildAllTransactions, ALL_TX_COLUMNS } from '@/lib/allTransactions';

export default function AllTransactionsExport({ trips, expenses, fuelRecords, dateRange }) {
  const data = buildAllTransactions(trips, expenses, fuelRecords);
  const opts = { dateRange };
  const btn = 'p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white/90 transition-colors';
  return (
    <div className="flex items-center gap-1 h-9 px-2.5 rounded-lg border border-white/10 bg-[#232636] shadow-[-4px_-4px_8px_rgba(255,255,255,0.05),4px_4px_12px_rgba(0,0,0,0.3)]">
      <Layers className="w-3.5 h-3.5 text-white/50 mr-1" />
      <span className="text-xs font-medium text-white/70 mr-1.5 hidden sm:inline">All Tx</span>
      <button title="Export All Transactions CSV" onClick={() => exportToCSV(data, 'all_transactions', ALL_TX_COLUMNS)} className={btn}>
        <ExcelIcon className="w-3.5 h-3.5" />
      </button>
      <button title="Export All Transactions PDF" onClick={() => exportToPDF(data, 'all_transactions', ALL_TX_COLUMNS, 'All Transactions', opts)} className={btn}>
        <PdfIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}