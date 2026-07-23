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
  return (
    <div className="hidden lg:block">
      <div className="sticky top-4 space-y-3">
        <div className="glass-card p-4 space-y-3">
          <p className="eyebrow">Live Calculation</p>
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
          <div className="border-t border-white/10 pt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-semibold text-foreground">Revenue</span>
              <span className={`text-xl font-bold tabular-nums font-display ${revenueOverridden ? 'text-red-400' : 'text-primary'}`}>{formatCurrency(Number(form.revenue) || 0)}</span>
            </div>
          </div>
        </div>
        <div className="glass-card p-3">
          <p className="text-[10px] text-muted-foreground leading-relaxed">Trip date is set automatically from the load time. Revenue is auto-calculated and can be overwritten.</p>
        </div>
      </div>
    </div>
  );
}