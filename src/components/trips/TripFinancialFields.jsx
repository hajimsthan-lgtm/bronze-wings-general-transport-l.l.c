import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wallet, DollarSign, Gauge, Timer, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import Section from './Section';
import IconInput from './IconInput';

export default function TripFinancialFields({ p }) {
  const { form, update, setRevenueOverride, t, inputCls, autoFilled, isOvertime, overtimeMetric, extraCharges, revenueOverridden, autoRevenue } = p;
  return (
    <Section title="Financial" icon={Wallet} accent="249,115,22" delay={300}>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label className="text-xs text-white/60 mb-1.5">Base Fare (AED)</Label>
          <IconInput icon={DollarSign} type="number" value={form.base_fare} onChange={(e) => update('base_fare', e.target.value)} className={inputCls} />
          {autoFilled && <p className="text-[10px] text-blue-400 mt-1">Auto-filled from fixed charge</p>}
        </div>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">Max Allowed ({form.duration_unit === 'days' ? 'Days' : 'Hrs'})</Label>
          <IconInput icon={Gauge} type="number" value={form.max_allowed_duration} onChange={(e) => update('max_allowed_duration', e.target.value)} className={inputCls} />
        </div>
        <div>
          <Label className="text-xs text-white/60 mb-1.5">Overtime Rate (AED)</Label>
          <IconInput icon={Timer} type="number" value={form.overtime_rate} onChange={(e) => update('overtime_rate', e.target.value)} className={inputCls} />
        </div>
      </div>
      {isOvertime && (
        <div className="glass-card p-3 border-red-500/30 bg-red-500/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-red-400 font-medium">Overtime Active</p>
              <p className="text-xs text-muted-foreground mt-0.5">{overtimeMetric} {form.duration_unit === 'days' ? 'days' : 'hrs'} × {formatCurrency(Number(form.overtime_rate) || 0)}</p>
            </div>
            <p className="text-sm font-semibold text-red-400">+{formatCurrency(extraCharges)}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-white/60 mb-1.5">{t('amount')} (Revenue)</Label>
          <IconInput icon={Wallet} type="number" value={form.revenue} onChange={(e) => { update('revenue', e.target.value); setRevenueOverride(true); }} className={inputCls} />
          {revenueOverridden ? (
            <p className="text-[10px] text-red-400 font-semibold mt-1">⚠ Overwritten — calculated value was {formatCurrency(autoRevenue)}</p>
          ) : (
            <p className="text-[10px] text-primary mt-1">Auto-calculated: base fare + overtime (editable)</p>
          )}
        </div>
        {form.trip_type === 'hourly' && (
          <div>
            <Label className="text-xs text-white/60 mb-1.5">{t('hours')}</Label>
            <IconInput icon={Clock} type="number" value={form.hours} onChange={(e) => update('hours', e.target.value)} className={inputCls} />
          </div>
        )}
      </div>
      <div>
        <Label className="text-xs text-white/60 mb-1.5">{t('status')}</Label>
        <Select value={form.status} onValueChange={(v) => update('status', v)}>
          <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Section>
  );
}