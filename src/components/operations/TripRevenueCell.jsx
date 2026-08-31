import { formatCurrency } from '@/lib/formatters';

/**
 * Trip revenue cell — total always visible; hover reveals a breakdown
 * of Base Fare, VAT (5%), and Add-on payments.
 */
export default function TripRevenueCell({ trip }) {
  const revenue = Number(trip.revenue) || 0;
  const baseFare = Number(trip.base_fare) || 0;
  const vat = Math.round(revenue * 0.05 * 100) / 100;

  const addOnList = Array.isArray(trip.add_ons) ? trip.add_ons : [];
  const addOnTotal = addOnList.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const addOnVat = addOnList.reduce(
    (s, a) => (a.vat_included ? s + Math.round((Number(a.amount) || 0) * 0.05 * 100) / 100 : s),
    0
  );
  const addOnPayment = addOnTotal + addOnVat;
  const total = Math.round((revenue + vat + addOnTotal + addOnVat) * 100) / 100;

  const hasBreakdown = baseFare > 0 || vat > 0 || addOnTotal > 0;

  return (
    <div className="relative group">
      <div
        className="text-xs font-semibold font-mono tabular-nums text-foreground whitespace-normal break-words cursor-default"
        title={hasBreakdown ? 'Hover to see breakdown' : ''}
      >
        {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {hasBreakdown && (
        <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-150 absolute z-50 right-0 top-full mt-1 w-44 p-2.5 rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl pointer-events-none">
          <div className="flex justify-between text-[10px] items-center mb-1.5">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgb(var(--panel-accent-rgb))' }} />
              Base Fare
            </span>
            <span className="font-medium tabular-nums text-foreground">{formatCurrency(baseFare)}</span>
          </div>
          <div className="flex justify-between text-[10px] items-center mb-1.5">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              VAT (5%)
            </span>
            <span className="font-medium tabular-nums text-amber-300">{formatCurrency(vat)}</span>
          </div>
          {addOnTotal > 0 && (
            <div className="flex justify-between text-[10px] items-center pt-1.5 border-t border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Add-on{addOnList.length > 1 ? `s (${addOnList.length})` : ''}
              </span>
              <span className="font-medium tabular-nums text-emerald-300">{formatCurrency(addOnPayment)}</span>
            </div>
          )}
          <div className="flex justify-between text-[10px] items-center pt-1.5 mt-1 border-t border-border/50">
            <span className="text-foreground font-semibold">Total</span>
            <span className="font-bold tabular-nums text-gradient">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}