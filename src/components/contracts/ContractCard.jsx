import { Building2, Calendar, Pencil, Trash2, AlertTriangle, Truck, User, Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import MetaChip from '@/components/operations/MetaChip';
import StatusPill, { statusVariant } from '@/components/operations/StatusPill';

function Stat({ label, value, highlight, tone, icon: Icon }) {
  const color = tone === 'eco' ? '#34d399' : tone === 'heat' ? '#f87171' : '#e2e8f0';
  return (
    <div
      className="flex-1 min-w-0 rounded-lg px-1.5 py-1.5 text-center transition-all duration-200"
      style={highlight ? { background: tone === 'eco' ? 'rgba(52,211,153,0.10)' : 'rgba(248,113,113,0.10)', border: `1px solid ${color}33` } : { border: '1px solid transparent' }}
    >
      <p className="text-[8px] uppercase tracking-wider text-white/40 mb-0.5 truncate">{label}</p>
      <p className="flex items-center justify-center gap-0.5 text-[10px] font-bold tabular-nums truncate" style={{ color }}>
        {Icon && <Icon className="w-2.5 h-2.5 flex-shrink-0" />}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

export default function ContractCard({ contract, expenses = [], onEdit, onDelete, onDetails }) {
  const { t } = useI18n();
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const monthlyRate = Number(contract.monthly_rate) || 0;
  const netProfit = monthlyRate - totalExpenses;
  const margin = monthlyRate > 0 ? Math.round((netProfit / monthlyRate) * 100) : 0;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = contract.end_date ? Math.ceil((new Date(contract.end_date) - today) / 86400000) : null;
  const expiringSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  // Tone by margin — Eco (green) / Cool (blue) / Heat (red)
  const tone = margin >= 30 ? 'eco' : margin >= 15 ? 'cool' : 'heat';
  const arc = {
    eco: { from: '#10b981', to: '#34d399' },
    cool: { from: '#3b82f6', to: '#60a5fa' },
    heat: { from: '#f97316', to: '#f87171' },
  }[tone];
  const marginColor = tone === 'eco' ? '#34d399' : tone === 'cool' ? '#60a5fa' : '#f87171';

  return (
    <div className="entity-card group flex flex-col p-3.5 transition-all duration-300 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <Building2 className="w-4 h-4 text-blue-400" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.08em] text-white/40 font-medium">{t('monthly_contract') || 'Monthly Contract'}</p>
            <p className="text-sm font-bold text-white truncate leading-tight">{contract.company_name || '—'}</p>
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
      <div className="flex items-center gap-1.5 mt-2.5 text-[10px] text-white/40">
        <Calendar className="w-3 h-3 text-blue-400 flex-shrink-0" />
        <span className="tabular-nums">{formatDate(contract.start_date)}</span>
        <span className="text-white/20">→</span>
        <span className="tabular-nums">{formatDate(contract.end_date)}</span>
        {daysLeft !== null && (
          <span className={`ml-auto px-1.5 h-4 inline-flex items-center rounded-full text-[9px] font-medium ${daysLeft < 0 ? 'bg-red-500/10 text-red-400' : expiringSoon ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-white/50'}`}>
            {daysLeft < 0 ? t('expired') : `${daysLeft}d`}
          </span>
        )}
      </div>

      {expiringSoon && (
        <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-lg bg-amber-500/10 text-[10px] text-amber-400">
          <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" />
          {t('contract_expires_soon')}
        </div>
      )}

      {/* Margin bar */}
      <div className="mt-3 mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] uppercase tracking-wider text-white/40">{t('profit_margin')}</span>
          <span className="text-sm font-bold tabular-nums" style={{ color: marginColor }}>{margin}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, Math.min(100, margin))}%`, background: `linear-gradient(90deg, ${arc.from}, ${arc.to})`, boxShadow: `0 0 8px ${arc.to}80` }}
          />
        </div>
      </div>

      {/* Footer stat pill */}
      <div className="rounded-xl p-1 flex gap-1" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.04)' }}>
        <Stat label={t('monthly_rental')} value={formatCurrency(monthlyRate)} />
        <Stat label={t('total_expenses')} value={formatCurrency(totalExpenses)} />
        <Stat label={t('net_profit')} value={formatCurrency(netProfit)} highlight tone={netProfit >= 0 ? 'eco' : 'heat'} icon={netProfit >= 0 ? TrendingUp : TrendingDown} />
      </div>

      {/* Meta + actions */}
      <div className="flex items-center gap-1 flex-wrap pt-2.5 mt-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {contract.vehicle_plate && <MetaChip icon={Truck} label={contract.vehicle_plate} />}
        {contract.driver_name && <MetaChip icon={User} label={contract.driver_name} />}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onDetails} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:border-blue-500/30 hover:text-blue-400 transition-colors" title={t('details')}>
            <Building2 className="w-3 h-3" />
          </button>
          <button onClick={onEdit} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:border-blue-500/30 hover:text-blue-400 transition-colors" title={t('edit')}>
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={onDelete} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:border-red-500/30 hover:text-red-400 transition-colors" title={t('delete')}>
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}