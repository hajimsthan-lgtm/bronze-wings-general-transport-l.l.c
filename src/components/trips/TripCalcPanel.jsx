import { formatCurrency } from '@/lib/formatters';

function CalcRow({ label, value, tone = 'text-foreground', dot }) {
  return (
    <div className="flex justify-between text-xs items-center">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />}
        {label}
      </span>
      <span className={`font-medium tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export default function TripCalcPanel({ form, isOvertime, overtimeMetric, extraCharges, revenueOverridden, addOns }) {
  const revenue = Number(form.revenue) || 0;
  const addOnList = Array.isArray(addOns) ? addOns : [];
  const addOnTotal = addOnList.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const addOnVat = addOnList.reduce((s, a) => a.vat_included ? s + Math.round((Number(a.amount) || 0) * 0.05 * 100) / 100 : s, 0);
  const grandTotal = Math.round((revenue + addOnTotal + (Math.round(revenue * 0.05 * 100) / 100) + addOnVat) * 100) / 100;
  const vat = Math.round(revenue * 0.05 * 100) / 100;
  const total = grandTotal;
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
          <CalcRow label="Revenue (excl. VAT)" value={formatCurrency(revenue)} tone={revenueOverridden ? 'text-red-400' : 'text-primary'} dot="rgb(var(--panel-accent-rgb))" />
          <CalcRow label="VAT (5%)" value={formatCurrency(vat)} tone="text-amber-300" dot="#f59e0b" />
        </div>
        {addOnList.length > 0 && (
          <div className="border-t border-white/10 pt-2 space-y-1.5">
            {addOnList.map((a, i) => (
              <CalcRow
                key={i}
                label={`${a.description || 'Add-on'}${a.vat_included ? '' : ' · no VAT'}`}
                value={`+${formatCurrency(Number(a.amount) || 0)}`}
                tone="text-emerald-300"
                dot="#34d399"
              />
            ))}
            {addOnVat > 0 && <CalcRow label="Add-on VAT" value={`+${formatCurrency(addOnVat)}`} tone="text-amber-300" dot="#f59e0b" />}
          </div>
        )}
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