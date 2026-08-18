import { Layers } from 'lucide-react';
import { ExcelIcon, PdfIcon } from '@/components/common/BrandIcons';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { buildAllTransactions, ALL_TX_COLUMNS } from '@/lib/allTransactions';

export default function AllTransactionsExport({ trips, expenses, fuelRecords, dateRange }) {
  const data = buildAllTransactions(trips, expenses, fuelRecords);
  const opts = { dateRange };
  const btn = 'p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors';
  return null;











}