import { Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { exportToPDF } from '@/lib/exportUtils';

export default function ProfitSummary({ title, items, netProfit, filenameBase, dateRange }) {
  const handleDownload = () => {
    const data = [
    ...items.map((i) => ({ label: i.label, amount: Number(i.value) || 0 })),
    { label: 'Net Profit', amount: Number(netProfit) || 0 }];

    exportToPDF(
      data,
      filenameBase,
      [
      { label: 'Category', key: 'label' },
      { label: 'Amount', key: 'amount', numeric: true }],

      title,
      { dateRange, skipTotal: true }
    );
  };

  const profitColor = netProfit >= 0 ? '#3b82f6' : '#ef4444';

  return null;



































}