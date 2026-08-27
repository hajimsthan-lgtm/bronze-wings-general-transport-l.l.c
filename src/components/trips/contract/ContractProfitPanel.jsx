import { AlertTriangle, CalendarClock } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

function CalcRow({ label, value, tone = 'text-foreground' }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export default function ContractProfitPanel({ monthlyRate, addOns, endDate, t }) {
  const addOnList = Array.isArray(addOns) ? addOns : [];
  const addOnTotal = addOnList.reduce((s, a) => s + (Number(a.amount) || 0), 0);
  const addOnVat = addOnList.reduce((s, a) => a.vat_included ? s + Math.round((Number(a.amount) || 0) * 0.05 * 100) / 100 : s, 0);
  const rateVat = Math.round(monthlyRate * 0.05 * 100) / 100;
  const grandTotal = Math.round((monthlyRate + addOnTotal + rateVat + addOnVat) * 100) / 100;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = endDate ? Math.ceil((new Date(endDate) - today) / 86400000) : null;
  const expiresSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <div className="hidden lg:block">
      <div className="sticky top-4 space-y-3">
        <div className="glass-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="live-pulse-dot" />
            <p className="eyebrow">Live Balance</p>
          </div>
          <CalcRow label={t('monthly_rental')} value={formatCurrency(monthlyRate)} />
          <CalcRow label="VAT (5%)" value={formatCurrency(rateVat)} tone="text-muted-foreground" />
          {addOnList.length > 0 && (
            <div className="border-t border-white/10 pt-2 space-y-1.5">
              {addOnList.map((a, i) => (
                <CalcRow
                  key={i}
                  label={`${a.description || 'Add-on'}${a.vat_included ? '' : ' · no VAT'}`}
                  value={`+${formatCurrency(Number(a.amount) || 0)}`}
                  tone="text-amber-300"
                />
              ))}
              {addOnVat > 0 && <CalcRow label="Add-on VAT" value={`+${formatCurrency(addOnVat)}`} tone="text-muted-foreground" />}
            </div>
          )}
          <div className="calc-total-glow flex items-baseline justify-between px-2 py-1.5">
            <span className="text-xs font-semibold text-foreground">Total Billable</span>
            <span className="text-xl font-bold tabular-nums font-display text-gradient animate-glow-pulse">{formatCurrency(grandTotal)}</span>
          </div>
          {daysLeft !== null && daysLeft >= 0 && (
            <div className="flex items-center gap-2 border-t border-white/10 pt-2">
              <CalendarClock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">{daysLeft} days remaining</span>
            </div>
          )}
          {expiresSoon && (
            <div className="flex items-start gap-2 rounded-xl p-2.5 border border-amber-500/30 bg-amber-500/10">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300 leading-snug">{t('contract_expires_soon')}</p>
            </div>
          )}
        </div>
        <div className="glass-card p-3">
          <p className="text-[10px] text-muted-foreground leading-relaxed">{t('profitability_help')}</p>
        </div>
      </div>
    </div>
  );
}