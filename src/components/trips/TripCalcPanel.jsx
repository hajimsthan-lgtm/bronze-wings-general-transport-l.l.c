import { formatCurrency } from '@/lib/formatters';

function CalcRow({ label, value, tone = 'text-foreground' }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export default function TripCalcPanel({ form, isOvertime, overtimeMetric, extraCharges, revenueOverridden }) {
  const revenue = Number(form.revenue) || 0;
  const vat = Math.round(revenue * 0.05 * 100) / 100;
  const total = Math.round((revenue + vat) * 100) / 100;

  return (
    <div className="space-y-3">
      <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="live-pulse-dot" />
            <p className="eyebrow">Live Calculation</p>
          </div>
          <CalcRow label="Base Fare" value={formatCurrency(Number(form.base_fare) || 0)} />
          <CalcRow label={`Duration (${form.duration_unit === 'days' ? 'days' : 'hrs'})`} value={form.calculated_duration ? `${form.calculated_duration}` : '—'} />
          <CalcRow label="Max Allowed" value={form.max_allowed_duration || '—'} />
          {isOvertime ? (
            <div className="border-t border-white/10 pt-3 space-y-2">
              <CalcRow label="Overtime" value={`${overtimeMetric} ${form.duration_unit === 'days' ? 'days' : 'hrs'}`} tone="text-amber-300" />
              <CalcRow label="Overtime Rate" value={formatCurrency(Number(form.overtime_rate) || 0)} />
              <CalcRow label="Overtime Charges" value={`+${formatCurrency(extraCharges)}`} tone="text-rose-300" />
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground italic">{form.load_datetime && form.offload_datetime ? 'Within allowed duration — no overtime' : 'Enter load & offload times'}</p>
          )}
          <div className="border-t border-white/10 pt-3 space-y-2">
            <CalcRow label="Revenue (excl. VAT)" value={formatCurrency(revenue)} tone={revenueOverridden ? 'text-red-400' : 'text-primary'} />
            <CalcRow label="VAT (5%)" value={formatCurrency(vat)} tone="text-muted-foreground" />
          </div>
          <div className="calc-total-glow flex items-baseline justify-between">
            <span className="text-sm font-semibold text-foreground">Total Revenue</span>
            <span className="text-2xl font-bold tabular-nums font-display text-gradient animate-glow-pulse">{formatCurrency(total)}</span>
          </div>
        </div>
      <div className="glass-card p-3">
        <p className="text-[10px] text-muted-foreground leading-relaxed">Trip date is set automatically from the load time. Revenue is auto-calculated and can be overwritten. VAT shown for reference.</p>
      </div>
    </div>
  );
}