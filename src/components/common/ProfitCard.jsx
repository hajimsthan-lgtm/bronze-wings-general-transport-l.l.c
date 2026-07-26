import { FileText, Eye, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { exportToPDF } from '@/lib/exportUtils';
import { hexToRgba } from '@/components/reports/ReportStatCard';

export default function ProfitCard({ title, items, netProfit, filenameBase, dateRange, onView, className = '' }) {
  const accent = netProfit >= 0 ? '#22c55e' : '#ef4444';

  const handleDownload = () => {
    const data = [
      ...items.map((i) => ({ label: i.label, amount: Number(i.value) || 0 })),
      { label: 'Net Profit', amount: Number(netProfit) || 0 },
    ];
    exportToPDF(
      data,
      filenameBase,
      [{ label: 'Category', key: 'label' }, { label: 'Amount', key: 'amount', numeric: true }],
      title,
      { dateRange, skipTotal: true }
    );
  };

  return (
    <div className={`glass-card p-4 relative overflow-hidden flex flex-col h-full ${className}`} style={{ borderTop: `3px solid ${accent}` }}>
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${hexToRgba(accent, 0.5)} 0%, transparent 70%)` }} />
      <div className="flex items-center gap-2 mb-3 relative">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(accent, 0.14), border: `1px solid ${hexToRgba(accent, 0.3)}` }}>
          <TrendingUp className="w-4 h-4" style={{ color: accent }} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="ml-auto flex gap-1.5">
          <button onClick={handleDownload} title="Download PDF" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-[11px] font-semibold text-white transition-transform active:scale-95" style={{ background: accent, boxShadow: `0 4px 14px -4px ${accent}` }}>
            <FileText className="w-3 h-3" /> PDF
          </button>
          <button onClick={onView} title="View breakdown" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-semibold text-foreground hover:bg-white/10 transition-colors">
            <Eye className="w-3 h-3" /> View
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: hexToRgba('#ffffff', 0.03) }}>
            <span className="text-xs text-muted-foreground">{it.label}</span>
            <span className={`text-sm font-semibold ${it.tone || 'text-foreground'}`}>{formatCurrency(it.value)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl px-3 py-3 mt-1" style={{ background: hexToRgba(accent, 0.08), border: `1px solid ${hexToRgba(accent, 0.25)}` }}>
          <span className="text-sm font-semibold text-foreground">Net Profit</span>
          <span className="text-base font-bold" style={{ color: accent }}>{formatCurrency(netProfit)}</span>
        </div>
      </div>
    </div>
  );
}