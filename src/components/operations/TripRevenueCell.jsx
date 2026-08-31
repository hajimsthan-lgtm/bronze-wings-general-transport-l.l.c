import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

/**
 * Trip revenue cell — total always visible; click the chevron to expand
 * a breakdown of Base Fare, VAT (5%), and Add-on payments.
 */
export default function TripRevenueCell({ trip }) {
  const [open, setOpen] = useState(false);
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
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); if (hasBreakdown) setOpen((v) => !v); }}
        className="inline-flex items-center gap-1.5 text-xs font-semibold font-mono tabular-nums text-foreground whitespace-normal break-words transition-colors hover:text-[rgb(var(--panel-accent2-rgb))]"
        title={hasBreakdown ? (open ? 'Hide breakdown' : 'Show breakdown') : ''}
      >
        {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        {hasBreakdown && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md border border-border/60 bg-muted/40 hover:border-[rgba(var(--panel-accent-rgb),0.4)] hover:bg-[rgba(var(--panel-accent-rgb),0.12)] transition-all">
            {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        )}
      </button>
      {hasBreakdown && open && (
        <div className="absolute z-50 right-0 top-full mt-1 w-48 p-2.5 rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl animate-fade-in">
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