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

  const profitColor = netProfit >= 0 ? '#3b82f6' : '#ef4444';

  return (
    <div
      className="rounded-2xl p-6 mb-4 backdrop-blur-xl transition-all duration-200 hover:-translate-y-px"
      style={{ background:'#1a1a2e', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)' }}
    >
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)' }}>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.08em] text-white/40 font-medium">{title}</p>
            <p className="text-[32px] font-bold leading-none mt-1" style={{ color: profitColor }}>{formatCurrency(netProfit)}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2 text-white/60 hover:text-white border-white/10 hover:border-white/20 transition-colors duration-200">
          <Download className="w-3.5 h-3.5" /> Download
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background:'#0f0f23', border:'1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1.5">{it.label}</p>
            <p className={`text-base font-bold ${it.tone || 'text-white'}`}>{formatCurrency(it.value)}</p>
          </div>
        ))}
        <div
          className="rounded-xl p-3 relative overflow-hidden"
          style={{ background:'#1e3a5f', border:'1px solid rgba(59,130,246,0.3)' }}
        >
          <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background:'#3b82f6' }} />
          <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color:'rgba(59,130,246,0.85)' }}>Net Profit</p>
          <p className="text-base font-bold" style={{ color: profitColor }}>{formatCurrency(netProfit)}</p>
        </div>
      </div>
    </div>
  );
}