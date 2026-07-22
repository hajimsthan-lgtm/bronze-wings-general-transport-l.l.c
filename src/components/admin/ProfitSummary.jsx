import { Download, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { exportToPDF } from '@/lib/exportUtils';

export default function ProfitSummary({ title, items, netProfit, filenameBase, dateRange }) {
  const handleDownload = () => {
    const data = [
      ...items.map((i) => ({ label: i.label, amount: Number(i.value) || 0 })),
      { label: 'Net Profit', amount: Number(netProfit) || 0 },
    ];
    exportToPDF(
      data,
      filenameBase,
      [
        { label: 'Category', key: 'label' },
        { label: 'Amount', key: 'amount', numeric: true },
      ],
      title,
      { dateRange, skipTotal: true }
    );
  };

  return (
    <div className="glass-card p-4 mb-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</p>
            <p className={`text-lg font-bold leading-tight ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netProfit)}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
          <Download className="w-3.5 h-3.5" /> Download
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-lg border border-border/40 bg-black/20 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{it.label}</p>
            <p className={`text-sm font-semibold ${it.tone || 'text-foreground'}`}>{formatCurrency(it.value)}</p>
          </div>
        ))}
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-3">
          <p className="text-[10px] uppercase tracking-wider text-primary/80 mb-1">Net Profit</p>
          <p className={`text-sm font-bold ${netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netProfit)}
          </p>
        </div>
      </div>
    </div>
  );
}