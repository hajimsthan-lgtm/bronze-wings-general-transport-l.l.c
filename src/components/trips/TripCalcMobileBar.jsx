import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

function CalcRow({ label, value, tone = 'text-foreground' }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export default function TripCalcMobileBar({ form, isOvertime, overtimeMetric, extraCharges, revenueOverridden }) {
  const [expanded, setExpanded] = useState(false);
  const revenue = Number(form.revenue) || 0;
  const vat = Math.round(revenue * 0.05 * 100) / 100;
  const total = Math.round((revenue + vat) * 100) / 100;

  return (
    <div className="lg:hidden flex-shrink-0 border-b border-border/50 bg-card/90 backdrop-blur-2xl z-10">
      {/* Collapsed bar — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-2.5"
      >
        <div className="flex items-center gap-2">
          <span className="live-pulse-dot" />
          <span className="eyebrow">Live Calculation</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</span>
          <span className={`text-lg font-bold tabular-nums font-display ${revenueOverridden ? 'text-red-400' : 'text-primary'}`}>
            {formatCurrency(total)}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded breakdown */}
      {expanded && (
        <div className="px-5 pb-3 space-y-2 animate-fade-in">
          <CalcRow label="Base Fare" value={formatCurrency(Number(form.base_fare) || 0)} />
          <CalcRow label={`Duration (${form.duration_unit === 'days' ? 'days' : 'hrs'})`} value={form.calculated_duration ? `${form.calculated_duration}` : '—'} />
          <CalcRow label="Max Allowed" value={form.max_allowed_duration || '—'} />
          {isOvertime && (
            <div className="border-t border-white/10 pt-2 space-y-1.5">
              <CalcRow label="Overtime" value={`${overtimeMetric} ${form.duration_unit === 'days' ? 'days' : 'hrs'}`} tone="text-amber-300" />
              <CalcRow label="Overtime Charges" value={`+${formatCurrency(extraCharges)}`} tone="text-rose-300" />
            </div>
          )}
          <div className="border-t border-white/10 pt-2 space-y-1.5">
            <CalcRow label="Revenue (excl. VAT)" value={formatCurrency(revenue)} tone={revenueOverridden ? 'text-red-400' : 'text-primary'} />
            <CalcRow label="VAT (5%)" value={formatCurrency(vat)} tone="text-muted-foreground" />
          </div>
          <div className="calc-total-glow flex items-baseline justify-between !p-2">
            <span className="text-sm font-semibold text-foreground">Total Revenue</span>
            <span className="text-xl font-bold tabular-nums font-display text-gradient">{formatCurrency(total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}