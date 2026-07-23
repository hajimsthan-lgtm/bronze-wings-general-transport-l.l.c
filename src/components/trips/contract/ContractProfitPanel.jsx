import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function ContractProfitPanel({ monthlyRate, totalExpenses, catTotals, endDate, t }) {
  const netProfit = monthlyRate - totalExpenses;
  const margin = monthlyRate > 0 ? (netProfit / monthlyRate) * 100 : 0;
  const marginColor = margin >= 30 ? '#22c55e' : margin >= 15 ? '#f59e0b' : '#ef4444';

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = endDate ? Math.ceil((new Date(endDate) - today) / 86400000) : null;
  const expiresSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  return (
    <div className="hidden lg:block">
      <div className="sticky top-4 space-y-3">
        <div className="glass-card p-4 space-y-3">
          <p className="eyebrow">{t('profitability')}</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('monthly_rental')}</span>
            <span className="font-medium tabular-nums text-foreground">{formatCurrency(monthlyRate)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('total_expenses')}</span>
            <span className="font-medium tabular-nums text-foreground">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t('net_profit')}</p>
            <p className={`text-2xl font-bold tabular-nums font-display ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(netProfit)}
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] text-muted-foreground">{t('profit_margin')}</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: marginColor }}>{Math.round(margin)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, margin))}%`, background: marginColor }} />
            </div>
          </div>

          {catTotals.filter((c) => c.amount > 0).length > 0 && (
            <div className="border-t border-white/10 pt-3 space-y-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('total_expenses')}</p>
              {catTotals.filter((c) => c.amount > 0).map((c) => {
                const pct = totalExpenses > 0 ? (c.amount / totalExpenses) * 100 : 0;
                return (
                  <div key={c.key}>
                    <div className="flex items-center gap-2 mb-1">
                      <c.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: c.color }} />
                      <span className="text-xs text-muted-foreground flex-1 truncate">{c.label}</span>
                      <span className="text-xs font-medium tabular-nums text-foreground">{formatCurrency(c.amount)}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: c.color }} />
                    </div>
                  </div>
                );
              })}
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