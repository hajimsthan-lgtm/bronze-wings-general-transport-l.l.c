import { Building2, Calendar, Pencil, Trash2, AlertTriangle, Truck, User, Repeat, TrendingUp, TrendingDown, Gauge } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import MetaChip from '@/components/operations/MetaChip';
import StatusPill, { statusVariant } from '@/components/operations/StatusPill';

function Stat({ label, value, highlight, tone, icon: Icon }) {
  const glow = tone === 'eco' ? 'rgba(0,255,157,0.12)' : tone === 'heat' ? 'rgba(255,68,0,0.12)' : 'transparent';
  const color = tone === 'eco' ? '#00ff9d' : tone === 'heat' ? '#ff4500' : '#ffffff';
  return (
    <div
      className="flex-1 min-w-0 rounded-lg px-2 py-2 text-center transition-all duration-200"
      style={highlight ? { background: glow, border: `1px solid ${color}33` } : { border: '1px solid transparent' }}
    >
      <p className="text-[9px] uppercase tracking-wider text-white/40 mb-1 truncate">{label}</p>
      <p className="flex items-center justify-center gap-1 text-[11px] font-bold tabular-nums truncate" style={{ color }}>
        {Icon && <Icon className="w-3 h-3 flex-shrink-0" />}
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

  // Gauge tone by margin — Eco (green/teal) / Cool (blue) / Heat (orange)
  const tone = margin >= 30 ? 'eco' : margin >= 15 ? 'cool' : 'heat';
  const arc = {
    eco: { from: '#00ff9d', to: '#00e5ff' },
    cool: { from: '#00bfff', to: '#00e5ff' },
    heat: { from: '#ff8c00', to: '#ff4500' },
  }[tone];
  const gid = `g-${tone}-${(contract.id || 'x').slice(-6)}`;

  // Circular gauge geometry — 270° arc with gap at bottom
  const r = 54, cx = 60, cy = 60;
  const C = 2 * Math.PI * r;
  const arcLen = 0.75 * C;
  const progress = Math.max(0, Math.min(100, margin)) / 100;
  const dash = `${arcLen * progress} ${C}`;
  const k = Math.SQRT1_2;
  const sx = cx - r * k, sy = cy + r * k;     // bottom-left start
  const ex = cx + r * k, ey = cy + r * k;     // bottom-right end
  const ang = (135 + 270 * progress) * Math.PI / 180;
  const hx = cx + r * Math.cos(ang), hy = cy + r * Math.sin(ang);

  return (
    <div
      className="group relative flex flex-col rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{ background: '#1b1c22', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <Building2 className="w-5 h-5 text-blue-400" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.1em] text-white/40 font-medium">{t('monthly_contract') || 'Monthly Contract'}</p>
            <p className="text-[15px] font-bold text-white truncate leading-tight">{contract.company_name || '—'}</p>
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
      <div className="flex items-center gap-2 mt-3 text-xs text-white/40">
        <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
        <span className="tabular-nums">{formatDate(contract.start_date)}</span>
        <span className="text-white/20">→</span>
        <span className="tabular-nums">{formatDate(contract.end_date)}</span>
        {daysLeft !== null && (
          <span className={`ml-auto px-2 h-5 inline-flex items-center rounded-full text-[10px] font-medium ${daysLeft < 0 ? 'bg-red-500/10 text-red-400' : expiringSoon ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-white/50'}`}>
            {daysLeft < 0 ? t('expired') : `${daysLeft}d`}
          </span>
        )}
      </div>

      {expiringSoon && (
        <div className="flex items-center gap-1.5 mt-3 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-[11px] text-amber-400">
          <AlertTriangle className="w-3 h-3 flex-shrink-0" />
          {t('contract_expires_soon')}
        </div>
      )}

      {/* Circular margin gauge */}
      <div className="flex justify-center my-4">
        <div className="relative" style={{ width: 120, height: 120 }}>
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={arc.from} />
                <stop offset="100%" stopColor={arc.to} />
              </linearGradient>
            </defs>
            <path d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeDasharray="2 6" strokeLinecap="round" />
            <path d={`M ${sx} ${sy} A ${r} ${r} 0 1 1 ${ex} ${ey}`} fill="none" stroke={`url(#${gid})`} strokeWidth="7" strokeLinecap="round" strokeDasharray={dash} style={{ filter: `drop-shadow(0 0 6px ${arc.to}80)` }} />
            <circle cx={hx} cy={hy} r="6" fill="#ffffff" stroke={arc.to} strokeWidth="3" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[28px] font-bold text-white leading-none tabular-nums">{margin}<span className="text-base font-semibold text-white/40">%</span></span>
            <span className="flex items-center gap-1 mt-1.5 text-[9px] uppercase tracking-wider text-white/40">
              <Gauge className="w-3 h-3" />{t('profit_margin')}
            </span>
          </div>
        </div>
      </div>

      {/* Footer stat pill */}
      <div className="rounded-xl p-1.5 flex gap-1" style={{ background: '#0d0d11', border: '1px solid rgba(255,255,255,0.04)' }}>
        <Stat label={t('monthly_rental')} value={formatCurrency(monthlyRate)} />
        <Stat label={t('total_expenses')} value={formatCurrency(totalExpenses)} />
        <Stat label={t('net_profit')} value={formatCurrency(netProfit)} highlight tone={netProfit >= 0 ? 'eco' : 'heat'} icon={netProfit >= 0 ? TrendingUp : TrendingDown} />
      </div>

      {/* Meta + actions */}
      <div className="flex items-center gap-1.5 flex-wrap pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {contract.vehicle_plate && <MetaChip icon={Truck} label={contract.vehicle_plate} />}
        {contract.driver_name && <MetaChip icon={User} label={contract.driver_name} />}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onDetails} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:border-blue-500/30 hover:text-blue-400 transition-colors" title={t('details')}>
            <Building2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onEdit} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:border-blue-500/30 hover:text-blue-400 transition-colors" title={t('edit')}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:border-red-500/30 hover:text-red-400 transition-colors" title={t('delete')}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}