import { formatCurrency } from '@/lib/formatters';
import { calculateContractBilling } from '@/lib/contractCalculator';
import { useI18n } from '@/lib/i18n';

/**
 * Live calculation summary: base, days used/allowed with delta,
 * only flagged hour-overage days, and final total.
 */
export default function ContractCalcSummary({ contract }) {
  const { t } = useI18n();
  const calc = calculateContractBilling(contract);

  if (
    calc.base === 0 &&
    calc.overageDaysCharge === 0 &&
    calc.underuseDaysCredit === 0 &&
    calc.hourOverageCharge === 0
  ) {
    return null;
  }

  return (
    <div className="calc-total-glow space-y-2 p-3 mt-1">
      {/* Base price */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-white/60">{t('base_price') || 'Base Price'}</span>
        <span className="text-white font-semibold tabular-nums">{formatCurrency(calc.base)}</span>
      </div>

      {/* Days used / allowed */}
      {calc.allowanceDays > 0 && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/60">
            {t('days') || 'Days'}: {calc.daysUsed} / {calc.allowanceDays}
            {calc.dayDelta !== 0 && (
              <span className={`ml-1 ${calc.dayDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ({calc.dayDelta > 0 ? `+${calc.dayDelta}` : calc.dayDelta})
              </span>
            )}
          </span>
          {calc.overageDaysCharge > 0 && (
            <span className="text-amber-400 font-semibold tabular-nums">+{formatCurrency(calc.overageDaysCharge)}</span>
          )}
          {calc.underuseDaysCredit > 0 && (
            <span className="text-emerald-400 font-semibold tabular-nums">−{formatCurrency(calc.underuseDaysCredit)}</span>
          )}
        </div>
      )}

      {/* Hour overage — only flagged days */}
      {calc.hourOverageBreakdown.length > 0 && (
        <div className="space-y-1 pt-1.5 border-t border-white/5">
          <p className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
            {t('hour_overage') || 'Hour Overage'}
            {calc.isQuickMode && <span className="ml-1 text-amber-400/60 normal-case font-normal">(approx)</span>}
          </p>
          {calc.hourOverageBreakdown.map((br, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] pl-2">
              <span className="text-white/50">
                {br.isQuickMode
                  ? `${br.days} days × ${br.hoursOver}h over`
                  : `${br.date || `Day ${i + 1}`}: ${br.hoursUsed}h → ${br.hoursOver}h over`}
              </span>
              <span className="text-amber-400 font-medium tabular-nums">+{formatCurrency(br.charge)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Final total */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-1.5">
          <span className="live-pulse-dot" />
          <span className="text-sm font-bold text-white">{t('final_total') || 'Final Total'}</span>
        </div>
        <span className="text-sm font-bold text-white tabular-nums">{formatCurrency(calc.total)}</span>
      </div>
    </div>
  );
}