import { formatCurrency } from '@/lib/formatters';
import { calculateContractBilling } from '@/lib/contractCalculator';
import { CalendarDays, Clock, CheckCircle2, TrendingDown, TrendingUp, Minus } from 'lucide-react';

/**
 * Live usage breakdown: two professional columns (Used Days / Used Hours)
 * showing the comparison vs allowance, the delta, and the financial impact.
 * Below: line-item adjustments and final total.
 */
export default function ContractCalcSummary({ contract }) {
  const calc = calculateContractBilling(contract);

  if (
    calc.base === 0 &&
    calc.overageDaysCharge === 0 &&
    calc.underuseDaysCredit === 0 &&
    calc.hourOverageCharge === 0
  ) {
    return null;
  }

  // Day status: 0 = matches, positive = over, negative = under
  const dayStatus = calc.dayDelta === 0 ? 'match' : calc.dayDelta > 0 ? 'over' : 'under';
  const hourStatus = calc.hourDelta === 0 ? 'match' : calc.hourDelta > 0 ? 'over' : 'under';

  const DayIcon = dayStatus === 'match' ? CheckCircle2 : dayStatus === 'over' ? TrendingUp : TrendingDown;
  const HourIcon = hourStatus === 'match' ? CheckCircle2 : hourStatus === 'over' ? TrendingUp : Minus;

  const dayIconColor = dayStatus === 'match' ? 'text-emerald-400' : dayStatus === 'over' ? 'text-amber-400' : 'text-emerald-400';
  const hourIconColor = hourStatus === 'match' ? 'text-emerald-400' : hourStatus === 'over' ? 'text-amber-400' : 'text-emerald-400';

  return (
    <div className="calc-total-glow space-y-3 p-3 mt-1">
      {/* ── Two-column usage breakdown ── */}
      <div className="grid grid-cols-2 gap-2">
        {/* USED DAYS column */}
        <div className="rounded-xl bg-white/[0.03] border border-white/8 p-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <CalendarDays className={`w-3.5 h-3.5 ${dayIconColor}`} />
            <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Used Days</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white tabular-nums">{calc.daysUsed || 0}</span>
            <span className="text-[10px] text-white/40">/ {calc.allowanceDays || 0}</span>
          </div>
          {calc.allowanceDays > 0 && (
            <>
              <div className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${dayIconColor}`}>
                <DayIcon className="w-3 h-3" />
                {dayStatus === 'match' && 'Matches allowance'}
                {dayStatus === 'over' && `+${calc.dayDelta} extra`}
                {dayStatus === 'under' && `${calc.dayDelta} under`}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-white/5">
                {calc.overageDaysCharge > 0 && (
                  <p className="text-[10px] text-amber-400 font-semibold tabular-nums">
                    +{formatCurrency(calc.overageDaysCharge)}
                  </p>
                )}
                {calc.underuseDaysCredit > 0 && (
                  <p className="text-[10px] text-emerald-400 font-semibold tabular-nums">
                    −{formatCurrency(calc.underuseDaysCredit)}
                  </p>
                )}
                {dayStatus === 'match' && (
                  <p className="text-[10px] text-white/40">No adjustment</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* USED HOURS column */}
        <div className="rounded-xl bg-white/[0.03] border border-white/8 p-2.5">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className={`w-3.5 h-3.5 ${hourIconColor}`} />
            <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">Used Hours</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-white tabular-nums">{Math.round(calc.totalHoursUsed) || 0}</span>
            <span className="text-[10px] text-white/40">/ {Math.round(calc.totalAllowanceHours) || 0}</span>
          </div>
          {calc.allowanceDays > 0 && calc.totalAllowanceHours > 0 && (
            <>
              <div className={`text-[10px] font-semibold mt-1 flex items-center gap-1 ${hourIconColor}`}>
                <HourIcon className="w-3 h-3" />
                {hourStatus === 'match' && 'Within allowance'}
                {hourStatus === 'over' && `+${Math.round(calc.hourDelta)}h over`}
                {hourStatus === 'under' && `${Math.round(calc.hourDelta)}h under`}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-white/5">
                {calc.hourOverageCharge > 0 && (
                  <p className="text-[10px] text-amber-400 font-semibold tabular-nums">
                    +{formatCurrency(calc.hourOverageCharge)}
                  </p>
                )}
                {calc.hourOverageCharge === 0 && hourStatus === 'over' && (
                  <p className="text-[10px] text-amber-400/60">Per-day overage applies</p>
                )}
                {hourStatus !== 'over' && (
                  <p className="text-[10px] text-white/40">No charge</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Line-item breakdown ── */}
      <div className="space-y-1.5 pt-1 border-t border-white/8">
        {/* Base price */}
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/60">Base Price</span>
          <span className="text-white font-semibold tabular-nums">{formatCurrency(calc.base)}</span>
        </div>

        {/* Day adjustment */}
        {calc.overageDaysCharge > 0 && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-amber-400/80">Extra Days ({calc.dayDelta > 0 ? `+${calc.dayDelta}` : calc.dayDelta})</span>
            <span className="text-amber-400 font-semibold tabular-nums">+{formatCurrency(calc.overageDaysCharge)}</span>
          </div>
        )}
        {calc.underuseDaysCredit > 0 && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-emerald-400/80">Under-use Credit</span>
            <span className="text-emerald-400 font-semibold tabular-nums">−{formatCurrency(calc.underuseDaysCredit)}</span>
          </div>
        )}

        {/* Hour adjustment */}
        {calc.hourOverageCharge > 0 && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-amber-400/80">
              Hour Overage
              {calc.isQuickMode && <span className="ml-1 text-amber-400/50 normal-case">(approx)</span>}
            </span>
            <span className="text-amber-400 font-semibold tabular-nums">+{formatCurrency(calc.hourOverageCharge)}</span>
          </div>
        )}
      </div>

      {/* ── Final total ── */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="live-pulse-dot" />
          <span className="text-sm font-bold text-white">Final Total</span>
        </div>
        <span className="text-sm font-bold text-white tabular-nums">{formatCurrency(calc.total)}</span>
      </div>
    </div>
  );
}