import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/formatters';

export default function InvoiceMetrics({ totals, onCreate }) {
  const navigate = useNavigate();
  const cards = [
    { label: 'Overdue', value: formatCurrency(totals.overdue) },
    { label: 'Due within next month', value: formatCurrency(totals.dueNextMonth) },
    { label: 'Average time to get paid', value: `${totals.avgDays} days` },
    { label: 'Available for Instant Payout', value: formatCurrency(totals.availablePayout) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Invoices</h1>
        </div>
        <Button
          onClick={onCreate}
          className="bg-[#A6FF00] hover:bg-[#A6FF00]/90 text-black font-semibold h-10"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Invoice
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="glass-card rounded-2xl p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{c.label}</p>
            <p className="text-xl font-display font-bold text-foreground mt-2 break-words">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}