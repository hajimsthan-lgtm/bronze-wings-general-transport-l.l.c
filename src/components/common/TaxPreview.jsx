import { Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

/**
 * Live tax breakdown preview card.
 * Shows subtotal, VAT rate, VAT amount, and total with VAT.
 * When `included` is true, the user entered the gross amount and VAT is backed out.
 */
export default function TaxPreview({ subtotal, vatRate, vatAmount, total, included = false }) {
  const sub = Number(subtotal) || 0;
  const vat = Number(vatAmount) || 0;
  const tot = Number(total) || 0;
  const rate = Number(vatRate) || 0;

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2.5">
      <div className="flex items-center gap-2 pb-1">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
          <Calculator className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Tax Breakdown — Live Preview
        </span>
        {included && (
          <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[9px] font-semibold uppercase">
            Incl. VAT
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Subtotal (excl. VAT)</span>
        <span className="text-foreground font-medium tabular-nums">{formatCurrency(sub)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground flex items-center gap-1.5">
          VAT
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-semibold">
            {rate}%
          </span>
        </span>
        <span className="text-amber-500 font-medium tabular-nums">
          {included ? '− ' : '+ '}{formatCurrency(vat)}
        </span>
      </div>
      <div className="border-t border-border pt-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Total (incl. VAT)</span>
        <span className="text-lg font-bold text-primary tabular-nums">{formatCurrency(tot)}</span>
      </div>
    </div>
  );
}