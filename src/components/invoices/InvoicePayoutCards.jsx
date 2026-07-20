import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';

export default function InvoicePayoutCards({ invoices }) {
  const navigate = useNavigate();
  const byClient = {};
  invoices.forEach(inv => {
    if (inv.status === 'paid' || inv.status === 'cancelled') return;
    const bal = (inv.total_amount || 0) - (inv.paid_amount || 0);
    if (bal <= 0) return;
    byClient[inv.client_name] = (byClient[inv.client_name] || 0) + bal;
  });
  const top = Object.entries(byClient).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (top.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-foreground">Top outstanding clients</p>
        <Button
          onClick={() => navigate('/payments')}
          className="bg-[#A6FF00] hover:bg-[#A6FF00]/90 text-black font-semibold h-8 text-xs"
        >
          Record payment
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 flex-1">
        {top.map(([name, amt], i) => (
          <div
            key={name}
            className={`rounded-xl p-3 ${i === 0 ? 'bg-[#A6FF00] text-black' : 'bg-white/[0.04] text-foreground border border-white/[0.06]'}`}
          >
            <p className="text-[11px] uppercase tracking-wider opacity-70">#{1000 + i * 7}</p>
            <p className="font-semibold text-sm truncate mt-1">{name || '—'}</p>
            <p className="text-lg font-bold mt-1">{formatCurrency(amt)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}