import { formatCurrency } from '@/lib/formatters';

function CalcRow({ label, value, tone = 'text-foreground' }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export default function TripCalcPanel({ form, isOvertime, overtimeMetric, extraCharges, revenueOverridden }) {
  const revenue = Number(form.revenue) || 0;
  const vat = Math.round(revenue * 0.05 * 100) / 100;
  const total = Math.round((revenue + vat) * 100) / 100;
  const vendorCost = form.assignment_mode === 'vendor' && form.vendor_name ? (Number(form.vendor_agreed_rate) || 0) : 0;
  const netMargin = Math.round((total - vendorCost) * 100) / 100;

  return (
    <div className="glass-card p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="live-pulse-dot" />
          <p className="eyebrow">Live Calculation</p>
        </div>
        <CalcRow label="Base Fare" value={formatCurrency(Number(form.base_fare) || 0)} />
        <CalcRow label={`Duration (${form.duration_unit === 'days' ? 'days' : 'hrs'})`} value={form.calculated_duration ? `${form.calculated_duration}` : '—'} />
        <CalcRow label="Max Allowed" value={form.max_allowed_duration || '—'} />
        {isOvertime ? (
          <div className="border-t border-white/10 pt-2 space-y-1.5">
            <CalcRow label="Overtime" value={`${overtimeMetric} ${form.duration_unit === 'days' ? 'days' : 'hrs'}`} tone="text-amber-300" />
            <CalcRow label="Overtime Rate" value={formatCurrency(Number(form.overtime_rate) || 0)} />
            <CalcRow label="Overtime Charges" value={`+${formatCurrency(extraCharges)}`} tone="text-rose-300" />
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground italic">{form.load_datetime && form.offload_datetime ? 'Within allowed duration — no overtime' : 'Enter load & offload times'}</p>
        )}
        <div className="border-t border-white/10 pt-2 space-y-1.5">
          <CalcRow label="Revenue (excl. VAT)" value={formatCurrency(revenue)} tone={revenueOverridden ? 'text-red-400' : 'text-primary'} />
          <CalcRow label="VAT (5%)" value={formatCurrency(vat)} tone="text-muted-foreground" />
        </div>
        <div className="calc-total-glow flex items-baseline justify-between px-2 py-1.5">
          <span className="text-xs font-semibold text-foreground">Total Revenue</span>
          <span className="text-xl font-bold tabular-nums font-display text-gradient animate-glow-pulse">{formatCurrency(total)}</span>
        </div>
        {form.assignment_mode === 'vendor' && form.vendor_name && (
          <div className="border-t border-white/10 pt-2 space-y-1.5">
            <CalcRow label="Vendor Cost" value={`−${formatCurrency(vendorCost)}`} tone="text-rose-400" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Net Margin</span>
              <span className="font-bold tabular-nums text-emerald-400">{formatCurrency(netMargin)}</span>
            </div>
          </div>
        )}
        <p className="text-[9px] text-muted-foreground/70 leading-relaxed pt-1">Trip date is set automatically from the load time. Revenue is auto-calculated and can be overwritten. VAT shown for reference.</p>
    </div>
  );
}