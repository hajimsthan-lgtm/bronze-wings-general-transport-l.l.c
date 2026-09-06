import { useNavigate } from 'react-router-dom';
import { useId } from 'react';
import { Building2, Calendar, Pencil, Trash2, Truck, User, Repeat, TrendingUp, TrendingDown, Wallet, Receipt } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { useI18n } from '@/lib/i18n';
import { getContractRate } from '@/lib/contractCalculator';

const TONE = {
  eco:  { color: '#34d399', glow: '52,211,153' },
  cool: { color: '#4ADE80', glow: '96,165,250' },
  heat: { color: '#f87171', glow: '248,113,113' },
};
const STATUS = {
  active:     { color: '#34d399', glow: '52,211,153' },
  expired:    { color: '#fb7185', glow: '251,113,133' },
  terminated: { color: '#94a3b8', glow: '148,163,184' },
};

const short = (v) => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(v);

function ContractGauge({ value, color, glow, gid }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
      <svg viewBox="0 0 160 160" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.95" />
            <stop offset="100%" stopColor={color} stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <path d="M 34.75 125.25 A 64 64 0 1 1 125.25 125.25" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" strokeLinecap="round" />
        <path d="M 34.75 125.25 A 64 64 0 1 1 125.25 125.25" fill="none" stroke={`url(#${gid})`} strokeWidth="7" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px rgba(${glow},0.65))` }} />
      </svg>
      <div className="relative flex flex-col items-center">
        <span className="text-xl font-bold text-white tabular-nums tracking-tight leading-none">{value}</span>
        <span className="text-[9px] uppercase tracking-[0.14em] text-white/45 font-semibold mt-1">Margin</span>
      </div>
    </div>
  );
}

export default function ContractCard({ contract, expenses = [], onEdit, onDelete, onDetails, driverMap, vehicleMap, clientMap }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const gid = useId().replace(/[:]/g, '');
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const monthlyRate = getContractRate(contract);
  const netProfit = monthlyRate - totalExpenses;
  const margin = monthlyRate > 0 ? Math.round((netProfit / monthlyRate) * 100) : 0;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysLeft = contract.end_date ? Math.ceil((new Date(contract.end_date) - today) / 86400000) : null;

  const tone = margin >= 30 ? 'eco' : margin >= 15 ? 'cool' : 'heat';
  const tn = TONE[tone];
  const st = STATUS[contract.status] || STATUS.active;

  const handleLink = (e, map, name, path) => {
    e.stopPropagation();
    const id = map?.[name];
    if (id) navigate(`${path}/${id}`);
  };

  const bubbles = [
    contract.company_name && { icon: Building2, label: contract.company_name, map: clientMap, path: '/admin/clients' },
    contract.vehicle_plate && { icon: Truck, label: contract.vehicle_plate, map: vehicleMap, path: '/admin/vehicles' },
    contract.driver_name && { icon: User, label: contract.driver_name, map: driverMap, path: '/admin/drivers' },
  ].filter(Boolean);

  return (
    <div
      onClick={onDetails}
      className="group cursor-pointer rounded-[22px] p-3 flex flex-col relative"
      style={{
        background: 'linear-gradient(165deg, rgba(var(--surf-1-rgb),0.94) 0%, rgba(var(--surf-2-rgb),0.97) 100%)',
        border: `1px solid rgba(${tn.glow},0.16)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 8px 28px rgba(0,0,0,0.08)',
        transition: 'transform .3s cubic-bezier(0.16,1,0.3,1), box-shadow .3s ease, border-color .3s ease',
      }}
    >
      {/* ── Top bar: icon + company + status ── */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(160deg, rgba(${tn.glow},0.22), rgba(${tn.glow},0.06))`, border: `1px solid rgba(${tn.glow},0.3)`, color: tn.color }}>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-[0.12em] text-white/40 font-semibold leading-none">{t('monthly_contract') || 'Contract'}</p>
            <p className="text-sm font-bold text-white truncate leading-tight mt-0.5">{contract.company_name || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {contract.auto_renewal && <Repeat className="w-3 h-3 text-primary" />}
          <span className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-[10px] font-semibold"
            style={{ background: `rgba(${st.glow},0.14)`, border: `1px solid rgba(${st.glow},0.32)`, color: st.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
            {t(contract.status || 'active')}
          </span>
        </div>
      </div>

      {/* ── Central glowing gauge ── */}
      <div className="flex justify-center my-1">
        <ContractGauge value={`${margin}%`} color={tn.color} glow={tn.glow} gid={gid} />
      </div>

      {/* ── Date range ── */}
      <div className="flex items-center gap-1.5 mb-2.5 px-1 text-[10px] text-white/45">
        <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: tn.color }} />
        <span className="tabular-nums">{formatDate(contract.start_date)}</span>
        <span className="text-white/20">→</span>
        <span className="tabular-nums">{formatDate(contract.end_date)}</span>
        {daysLeft !== null && (
          <span className={`ml-auto px-1.5 h-4 inline-flex items-center rounded-full text-[9px] font-medium ${daysLeft < 0 ? 'bg-red-500/10 text-red-400' : daysLeft <= 7 ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-white/50'}`}>
            {daysLeft < 0 ? t('expired') : `${daysLeft}d`}
          </span>
        )}
      </div>

      {/* ── Bottom pill: 3 financial stats ── */}
      <div className="flex items-center gap-1 p-1 rounded-full bg-muted border border-border">
        <div className="flex-1 flex items-center justify-center gap-1 h-8 rounded-full text-[10px] font-bold text-white/70 tabular-nums">
          <Wallet className="w-3 h-3 text-white/40 flex-shrink-0" />{short(monthlyRate)}
        </div>
        <div className="flex-1 flex items-center justify-center gap-1 h-8 rounded-full text-[10px] font-bold text-white/70 tabular-nums">
          <Receipt className="w-3 h-3 text-white/40 flex-shrink-0" />{short(totalExpenses)}
        </div>
        <div className="flex-1 flex items-center justify-center gap-1 h-8 rounded-full text-[10px] font-bold tabular-nums"
          style={{ background: `linear-gradient(135deg, rgba(${tn.glow},0.22), rgba(${tn.glow},0.08))`, color: tn.color, boxShadow: `inset 0 0 0 1px rgba(${tn.glow},0.35)` }}>
          {netProfit >= 0 ? <TrendingUp className="w-3 h-3 flex-shrink-0" /> : <TrendingDown className="w-3 h-3 flex-shrink-0" />}{short(netProfit)}
        </div>
      </div>

      {/* ── Footer: clickable entity bubbles + actions ── */}
      <div className="flex items-center gap-1.5 flex-wrap pt-2.5 mt-2.5 border-t border-white/5">
        {bubbles.map((b, i) => {
          const Icon = b.icon;
          const clickable = !!b.map?.[b.label];
          return (
            <button
              key={i}
              onClick={(e) => handleLink(e, b.map, b.label, b.path)}
              className="inline-flex items-center gap-1 px-2 h-6 rounded-full text-[10px] font-medium transition-all"
              style={clickable
                ? { background: 'rgba(var(--panel-accent-rgb),0.10)', border: '1px solid rgba(var(--panel-accent-rgb),0.30)', color: 'hsl(var(--primary))' }
                : { background: 'hsl(var(--muted))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))', cursor: 'default' }}
              onMouseEnter={(e) => { if (clickable) e.currentTarget.style.boxShadow = '0 0 12px -3px rgba(var(--panel-accent-rgb),0.5)'; }}
              onMouseLeave={(e) => { if (clickable) e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Icon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate max-w-[80px]">{b.label}</span>
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={(e) => { e.stopPropagation(); onDetails(); }} className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:border-blue-500/30 hover:text-blue-400 transition-colors" title={t('details')}><Building2 className="w-3 h-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:border-blue-500/30 hover:text-blue-400 transition-colors" title={t('edit')}><Pencil className="w-3 h-3" /></button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/50 hover:border-red-500/30 hover:text-red-400 transition-colors" title={t('delete')}><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    </div>
  );
}