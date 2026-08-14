import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { CONTRACT_CATS } from './contractCats';

export default function ContractProfitPanel({ monthlyRate, totalExpenses, catTotals, expenses = [], endDate, t }) {
  const total = monthlyRate + totalExpenses;

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
            <span className="font-medium tabular-nums text-foreground">+{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="border-t border-white/10 pt-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{t('total')}</p>
            <p className="text-2xl font-bold tabular-nums font-display text-emerald-400">
              {formatCurrency(total)}
            </p>
          </div>

          {expenses.length > 0 && (
            <div className="border-t border-white/10 pt-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('total_expenses')}</p>
              {expenses.map((e) => {
                const meta = CONTRACT_CATS.find((c) => c.key === e.category) || CONTRACT_CATS[0];
                return (
                  <div key={e.id} className="flex items-center gap-2">
                    <meta.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: meta.color }} />
                    <span className="text-xs text-muted-foreground flex-1 truncate">{e.description || t(meta.labelKey)}</span>
                    <span className="text-xs font-medium tabular-nums text-foreground">{formatCurrency(Number(e.amount) || 0)}</span>
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