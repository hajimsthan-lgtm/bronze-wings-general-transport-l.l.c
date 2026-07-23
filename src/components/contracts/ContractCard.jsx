import { Building2, Calendar, Pencil, Trash2, AlertTriangle, Truck, User, Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import MetaChip from '@/components/operations/MetaChip';
import StatusPill, { statusVariant } from '@/components/operations/StatusPill';
import MiniStat from '@/components/operations/MiniStat';

export default function ContractCard({ contract, expenses = [], onEdit, onDelete }) {
  const { t } = useI18n();
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const monthlyRate = Number(contract.monthly_rate) || 0;
  const netProfit = monthlyRate - totalExpenses;
  const margin = monthlyRate > 0 ? Math.round((netProfit / monthlyRate) * 100) : 0;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = contract.end_date ? Math.ceil((new Date(contract.end_date) - today) / 86400000) : null;
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  const barColor = margin >= 60 ? 'linear-gradient(90deg, #22c55e, #3b82f6)' : margin >= 0 ? 'linear-gradient(90deg, #f59e0b, #22c55e)' : 'linear-gradient(90deg, #ef4444, #f59e0b)';

  return (
    <div
      className="group relative flex flex-col rounded-2xl p-5 bg-card/60 backdrop-blur-xl border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300"
    >
      {/* Header: company + avatar, status pill */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 border border-primary/20">
            <Building2 className="w-5 h-5 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground truncate">{contract.company_name || '—'}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t('monthly_contract')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {contract.auto_renewal && (
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary" title={t('auto_renewal_help')}>
              <Repeat className="w-3 h-3" />
            </span>
          )}
          <StatusPill variant={statusVariant(contract.status)} dot>
            {t(contract.status || 'active')}
          </StatusPill>
        </div>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
        <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="tabular-nums">{formatDate(contract.start_date)}</span>
        <span className="text-border">→</span>
        <span className="tabular-nums">{formatDate(contract.end_date)}</span>
        {daysLeft !== null && (
          <span className={`ml-auto px-2 h-5 inline-flex items-center rounded-full text-[10px] font-medium ${daysLeft < 0 ? 'bg-red-500/10 text-red-400' : expiringSoon ? 'bg-amber-500/10 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
            {daysLeft < 0 ? t('expired') : `${daysLeft}d`}
          </span>
        )}
      </div>

      {/* Expiry warning */}
      {expiringSoon && (
        <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-[11px] text-amber-400">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          {t('contract_expires_soon')}
        </div>
      )}

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <MiniStat label={t('monthly_rental')} value={formatCurrency(monthlyRate)} />
        <MiniStat label={t('total_expenses')} value={formatCurrency(totalExpenses)} />
        <MiniStat label={t('net_profit')} value={formatCurrency(netProfit)} tone={netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} icon={netProfit >= 0 ? TrendingUp : TrendingDown} />
      </div>

      {/* Margin bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
          <span className="uppercase tracking-wider">{t('profit_margin')}</span>
          <span className={`font-semibold tabular-nums ${margin >= 60 ? 'text-emerald-400' : margin >= 0 ? 'text-amber-400' : 'text-red-400'}`}>{margin}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, margin))}%`, background: barColor }} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-1.5 flex-wrap pt-3 mt-4 border-t border-border">
        {contract.vehicle_plate && <MetaChip icon={Truck} label={contract.vehicle_plate} />}
        {contract.driver_name && <MetaChip icon={User} label={contract.driver_name} />}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 border border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors" title={t('edit')}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 border border-border text-muted-foreground hover:border-red-500/30 hover:text-red-400 transition-colors" title={t('delete')}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}