import { Building2, Calendar, Pencil, Trash2, AlertTriangle, Truck, User, Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';

const STATUS_STYLE = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  expired: 'bg-red-500/15 text-red-300 border-red-500/30',
  terminated: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
};

export default function ContractCard({ contract, expenses = [], onEdit, onDelete }) {
  const { t } = useI18n();
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const monthlyRate = Number(contract.monthly_rate) || 0;
  const netProfit = monthlyRate - totalExpenses;
  const margin = monthlyRate > 0 ? Math.round((netProfit / monthlyRate) * 100) : 0;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = contract.end_date ? Math.ceil((new Date(contract.end_date) - today) / 86400000) : null;
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const ended = daysLeft !== null && daysLeft < 0;

  return (
    <div
      className="group relative flex flex-col rounded-[20px] p-5 overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'linear-gradient(170deg, rgba(30,41,59,0.50) 0%, rgba(15,23,42,0.75) 100%)',
        backdropFilter: 'blur(20px) saturate(1.3)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.35)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-16 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(59,130,246,0.10) 0%, transparent 60%)' }} />
      <div className="absolute inset-0 rounded-[20px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: 'inset 0 0 0 1px rgba(59,130,246,0.30), 0 12px 40px rgba(0,0,0,0.5)' }} />

      {/* Header */}
      <div className="relative flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-500/15 border border-blue-400/30">
            <Building2 className="w-4 h-4 text-blue-300" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{contract.company_name || '—'}</p>
            <p className="text-[10px] uppercase tracking-wider text-white/50">{t('monthly_contract')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_STYLE[contract.status] || STATUS_STYLE.active}`}>
            {t(contract.status || 'active')}
          </span>
          {contract.auto_renewal && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 border border-blue-500/20 text-blue-300" title={t('auto_renewal_help')}>
              <Repeat className="w-2.5 h-2.5" />
            </span>
          )}
        </div>
      </div>

      {/* Period */}
      <div className="relative flex items-center gap-2 mb-4 text-xs text-white/70">
        <Calendar className="w-3.5 h-3.5 text-blue-300 flex-shrink-0" />
        <span>{formatDate(contract.start_date)}</span>
        <span className="text-white/30">→</span>
        <span>{formatDate(contract.end_date)}</span>
        {daysLeft !== null && (
          <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ended ? 'bg-red-500/15 text-red-300 border-red-500/25' : expiringSoon ? 'bg-amber-500/15 text-amber-300 border-amber-500/25' : 'bg-white/5 text-white/50 border-white/10'}`}>
            {ended ? t('expired') : `${daysLeft}d`}
          </span>
        )}
      </div>

      {/* Expiry warning */}
      {expiringSoon && (
        <div className="relative flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          {t('contract_expires_soon')}
        </div>
      )}

      {/* Profit summary */}
      <div className="relative grid grid-cols-3 gap-2 mb-4">
        <div className="rounded-xl px-2.5 py-2 bg-white/[0.04] border border-white/[0.06]">
          <p className="text-[9px] uppercase tracking-wider text-white/50 mb-0.5">{t('monthly_rental')}</p>
          <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(monthlyRate)}</p>
        </div>
        <div className="rounded-xl px-2.5 py-2 bg-white/[0.04] border border-white/[0.06]">
          <p className="text-[9px] uppercase tracking-wider text-white/50 mb-0.5">{t('total_expenses')}</p>
          <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="rounded-xl px-2.5 py-2 bg-white/[0.04] border border-white/[0.06]">
          <p className="text-[9px] uppercase tracking-wider text-white/50 mb-0.5">{t('net_profit')}</p>
          <p className={`text-sm font-bold tabular-nums flex items-center gap-1 ${netProfit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
            {netProfit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatCurrency(netProfit)}
          </p>
        </div>
      </div>

      {/* Margin bar */}
      <div className="relative mb-4">
        <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
          <span className="uppercase tracking-wider">{t('profit_margin')}</span>
          <span className={`font-semibold ${margin >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{margin}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(0, Math.min(100, margin))}%`, background: margin >= 0 ? 'linear-gradient(90deg, #22c55e, #3b82f6)' : 'linear-gradient(90deg, #ef4444, #f59e0b)' }}
          />
        </div>
      </div>

      {/* Footer chips + actions */}
      <div className="relative flex items-center gap-2 flex-wrap pt-3 mt-auto border-t border-white/[0.06]">
        {contract.vehicle_plate && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/85">
            <Truck className="w-3 h-3 text-blue-300" /> {contract.vehicle_plate}
          </span>
        )}
        {contract.driver_name && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white/85">
            <User className="w-3 h-3 text-blue-300" /> {contract.driver_name}
          </span>
        )}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:bg-blue-500/15 hover:border-blue-500/30 hover:text-white transition-colors" title={t('edit')}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:bg-red-500/15 hover:border-red-500/30 hover:text-white transition-colors" title={t('delete')}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}